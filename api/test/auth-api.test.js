const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');
const { createApp } = require('../app');
const { errorHandler } = require('../middleware/error-handler');

const jwtSecret = 'test-only-secret-that-is-at-least-32-bytes';
const users = new Map();
let nextId = 1;
function selectUser(user, select) {
  if (!user || !select) return user;
  return Object.fromEntries(Object.keys(select).map(key => [key, user[key]]));
}

const prisma = {
  user: {
    findUnique: async ({ where, select }) => selectUser([...users.values()].find(user =>
      (where.id && user.id === where.id) || (where.email && user.email === where.email)
    ) || null, select),
    create: async ({ data, select }) => {
      const user = {
        id: `test-user-${nextId++}`,
        ...data,
        active: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      };
      users.set(user.id, user);
      return selectUser(user, select);
    }
  },
  product: {
    create: async ({ data }) => ({
      id: 'created-product',
      ...data,
      price: new Prisma.Decimal(data.price),
      oldPrice: null,
      currency: data.currency || 'TND',
      imagesUri: data.imagesUri || data.image,
      promotion: data.promotion || false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      category: { name: 'Femmes' }
    })
  },
  category: {
    findUnique: async ({ where }) => where.slug === 'femmes'
      ? { id: 'category-1', slug: 'femmes', name: 'Femmes' }
      : null
  },
  order: {}
};

let server;
let baseUrl;

before(async () => {
  const app = createApp({
    prisma,
    config: { corsOrigins: ['http://localhost:4200'], jwtSecret, jwtExpiresIn: '15m' },
    errorHandler
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

async function post(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('registration hashes password and always creates a CLIENT role', async () => {
  const response = await post('/api/auth/register', {
    name: 'Test Client',
    email: 'client@example.test',
    password: 'a-long-test-password'
  });
  const body = await response.json();
  const saved = users.get(body.user.id);

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'CLIENT');
  assert.equal('passwordHash' in body.user, false);
  assert.notEqual(saved.passwordHash, 'a-long-test-password');
  assert.equal(await bcrypt.compare('a-long-test-password', saved.passwordHash), true);
});

test('registration rejects role injection and weak passwords', async () => {
  const roleResponse = await post('/api/auth/register', {
    name: 'Injected Role',
    email: 'injected@example.test',
    password: 'long-enough-password',
    role: 'ADMIN'
  });
  const passwordResponse = await post('/api/auth/register', {
    name: 'Weak Password',
    email: 'weak@example.test',
    password: 'short'
  });

  assert.equal(roleResponse.status, 400);
  assert.equal(passwordResponse.status, 400);
});

test('login provides an expiring bearer token and protects the current-user endpoint', async () => {
  const login = await post('/api/auth/login', {
    email: 'client@example.test',
    password: 'a-long-test-password'
  });
  const session = await login.json();
  const current = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${session.token}` }
  });

  assert.equal(login.status, 200);
  assert.equal(current.status, 200);
  assert.equal((await current.json()).email, 'client@example.test');
});

test('missing, invalid, and incorrect credentials are rejected', async () => {
  const anonymous = await fetch(`${baseUrl}/api/auth/me`);
  const invalid = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: 'Bearer invalid-token' }
  });
  const wrongPassword = await post('/api/auth/login', {
    email: 'client@example.test',
    password: 'incorrect-password'
  });

  assert.equal(anonymous.status, 401);
  assert.equal(invalid.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(await wrongPassword.json(), { message: 'Email or password is incorrect.' });
});

test('catalog mutations require an active server-side administrator role', async () => {
  const body = {
    name: 'Example product',
    description: 'Description',
    price: 1,
    categoryId: 'femmes',
    type: 'T-Shirt',
    image: 'assets/images/placeholder.svg',
    stock: 1
  };
  const anonymous = await post('/api/products', body);
  const login = await post('/api/auth/login', {
    email: 'client@example.test',
    password: 'a-long-test-password'
  });
  const session = await login.json();
  const client = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify(body)
  });

  assert.equal(anonymous.status, 401);
  assert.equal(client.status, 403);
  assert.deepEqual(await client.json(), { message: 'Administrator access required.' });
});

test('clients cannot update order status through the administrator API', async () => {
  const login = await post('/api/auth/login', {
    email: 'client@example.test',
    password: 'a-long-test-password'
  });
  const session = await login.json();
  const response = await fetch(`${baseUrl}/api/orders/order-1`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify({ status: 'Confirmée' })
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'Administrator access required.' });
});

test('an administrator can create products and upload remains authenticated', async () => {
  const storedUser = [...users.values()].find(user => user.email === 'client@example.test');
  storedUser.role = 'ADMIN';
  const login = await post('/api/auth/login', {
    email: storedUser.email,
    password: 'a-long-test-password'
  });
  const session = await login.json();
  const productResponse = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify({
      name: 'Example product',
      description: 'Description',
      price: 12.5,
      categoryId: 'femmes',
      type: 'T-Shirt',
      image: 'assets/images/placeholder.svg',
      stock: 4
    })
  });
  const emptyCategoryPatch = await fetch(`${baseUrl}/api/categories/femmes`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify({})
  });
  const emptyCategorySlug = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify({ name: 'Invalid category', slug: '' })
  });
  const uploadResponse = await fetch(`${baseUrl}/api/upload`, { method: 'POST' });
  const formData = new FormData();
  formData.append('image', new Blob(['not an image'], { type: 'image/png' }), 'invalid.png');
  const invalidImageResponse = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { authorization: `Bearer ${session.token}` },
    body: formData
  });

  assert.equal(productResponse.status, 201);
  assert.equal((await productResponse.json()).categoryName, 'Femmes');
  assert.equal(emptyCategoryPatch.status, 400);
  assert.equal(emptyCategorySlug.status, 400);
  assert.equal(uploadResponse.status, 401);
  assert.equal(invalidImageResponse.status, 400);
});
