const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { Prisma } = require('@prisma/client');
const { createApp } = require('../app');
const { errorHandler } = require('../middleware/error-handler');

const category = {
  id: '1',
  name: 'Femmes',
  slug: 'femmes',
  description: '',
  image: 'assets/images/placeholder.svg',
  active: true
};

const product = {
  id: '1',
  name: 'Robe élégante beige',
  description: 'Robe de démonstration.',
  price: new Prisma.Decimal('89.000'),
  oldPrice: null,
  currency: 'TND',
  categoryId: 'femmes',
  categoryName: 'Femmes',
  type: 'Robe',
  image: 'assets/uploaded_imgs/demo.jpg',
  imagesUri: 'assets/uploaded_imgs/demo.jpg',
  stock: 12,
  available: true,
  promotion: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  category: { name: 'Femmes' }
};

let failProductList = false;
let failDatabaseHealth = false;
let lastProductQuery;
const prisma = {
  $queryRaw: async () => {
    if (failDatabaseHealth) throw new Error('sensitive database health detail');
    return [{ '?column?': 1 }];
  },
  product: {
    findMany: async query => {
      if (failProductList) throw new Error('sensitive database detail');
      lastProductQuery = query;
      return [product];
    },
    count: async () => 1,
    findUnique: async ({ where }) => where.id === product.id ? product : null
  },
  category: {
    findMany: async () => [category],
    count: async () => 1,
    findFirst: async ({ where }) =>
      where.OR.some(condition =>
        condition.id === category.id || condition.slug === category.slug
      ) ? category : null
  }
};

let server;
let baseUrl;

before(async () => {
  const app = createApp({
    prisma,
    config: { corsOrigins: ['http://localhost:4200'] },
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

test('GET /api/products returns a frontend-compatible product array', async () => {
  const response = await fetch(`${baseUrl}/api/products`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.deepEqual(body[0], {
    id: '1',
    name: 'Robe élégante beige',
    description: 'Robe de démonstration.',
    price: 89,
    currency: 'TND',
    categoryId: 'femmes',
    categoryName: 'Femmes',
    type: 'Robe',
    image: 'assets/uploaded_imgs/demo.jpg',
    imagesUri: 'assets/uploaded_imgs/demo.jpg',
    stock: 12,
    available: true,
    promotion: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  });
});

test('GET /api/products supports filters and opt-in pagination', async () => {
  const response = await fetch(`${baseUrl}/api/products?categoryId=femmes&available=true&page=1&limit=10`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { data: [body.data[0]], total: 1, page: 1, limit: 10, totalPages: 1 });
  assert.equal(lastProductQuery.where.categoryId, 'femmes');
  assert.equal(lastProductQuery.where.available, true);
  assert.equal(lastProductQuery.skip, 0);
  assert.equal(lastProductQuery.take, 10);
});

test('GET /api/products/:id returns an existing product', async () => {
  const response = await fetch(`${baseUrl}/api/products/1`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.id, '1');
  assert.equal(body.price, 89);
});

test('GET /api/products/:id returns 404 when product is missing', async () => {
  const response = await fetch(`${baseUrl}/api/products/missing`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Product not found' });
});

test('GET /api/categories returns frontend-compatible category objects', async () => {
  const response = await fetch(`${baseUrl}/api/categories`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, [category]);
});

test('GET /api/categories/:id accepts a stable id or slug', async () => {
  for (const identifier of ['1', 'femmes']) {
    const response = await fetch(`${baseUrl}/api/categories/${identifier}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), category);
  }
});

test('GET /api/categories/:id returns 404 when category is missing', async () => {
  const response = await fetch(`${baseUrl}/api/categories/missing`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Category not found' });
});

test('CORS rejects origins outside the configured allowlist', async () => {
  const response = await fetch(`${baseUrl}/api/products`, {
    headers: { origin: 'https://untrusted.example' }
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'Origine non autorisée.' });
});

test('invalid query values return 400', async () => {
  for (const url of [
    '/api/products?page=0',
    '/api/products?available=yes',
    '/api/products?minPrice=20&maxPrice=10',
    '/api/categories?active=maybe'
  ]) {
    const response = await fetch(`${baseUrl}${url}`);
    assert.equal(response.status, 400, url);
    assert.equal(typeof (await response.json()).message, 'string');
  }
});

test('invalid resource identifiers return 400', async () => {
  const response = await fetch(`${baseUrl}/api/products/${'x'.repeat(129)}`);

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Product id/);
});

test('database health failures return 503 without exposing database details', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  failDatabaseHealth = true;

  try {
    const response = await fetch(`${baseUrl}/api/db-health`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      status: 'error',
      message: 'Base de données indisponible.'
    });
  } finally {
    failDatabaseHealth = false;
    console.error = originalConsoleError;
  }
});

test('unexpected database errors return a generic 500 response', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  failProductList = true;

  try {
    const response = await fetch(`${baseUrl}/api/products`);
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.deepEqual(body, { message: 'Erreur interne du serveur.' });
    assert.equal(JSON.stringify(body).includes('sensitive database detail'), false);
  } finally {
    failProductList = false;
    console.error = originalConsoleError;
  }
});
