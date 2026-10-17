const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Prisma } = require('@prisma/client');
const { createCatalogService } = require('../services/catalog.service');

function createPrismaMock() {
  const categories = [{
    id: 'category-1',
    name: 'Femmes',
    slug: 'femmes',
    description: '',
    image: null,
    active: true
  }];
  const products = [];
  let nextCategoryId = 2;
  let nextProductId = 1;

  function findCategory(where) {
    if (where.slug) return categories.find(category => category.slug === where.slug);
    if (where.id) return categories.find(category => category.id === where.id);
    return categories.find(category =>
      where.OR?.some(condition =>
        condition.id === category.id || condition.slug === category.slug
      )
    );
  }

  function findProduct(where) {
    return products.find(product => product.id === where.id);
  }

  function withCategory(product) {
    const category = categories.find(item => item.slug === product.categoryId);
    return { ...product, category: category ? { name: category.name } : null };
  }

  const prisma = {
    category: {
      findUnique: async ({ where }) => findCategory(where) || null,
      findFirst: async ({ where, select }) => {
        const category = findCategory(where);
        if (!category) return null;
        if (select?._count) {
          return {
            id: category.id,
            _count: { products: products.filter(product => product.categoryId === category.slug).length }
          };
        }
        return { ...category };
      },
      create: async ({ data }) => {
        const category = { id: `category-${nextCategoryId++}`, ...data };
        categories.push(category);
        return { ...category };
      },
      update: async ({ where, data }) => {
        const category = categories.find(item => item.id === where.id);
        const previousSlug = category.slug;
        Object.assign(category, data);
        if (category.slug !== previousSlug) {
          for (const product of products) {
            if (product.categoryId === previousSlug) product.categoryId = category.slug;
          }
        }
        return { ...category };
      },
      delete: async ({ where }) => {
        const index = categories.findIndex(category => category.id === where.id);
        return categories.splice(index, 1)[0];
      }
    },
    product: {
      create: async ({ data }) => {
        const product = {
          id: `product-${nextProductId++}`,
          ...data,
          price: new Prisma.Decimal(data.price),
          oldPrice: data.oldPrice == null ? null : new Prisma.Decimal(data.oldPrice),
          createdAt: new Date('2026-01-01T00:00:00.000Z')
        };
        products.push(product);
        return withCategory(product);
      },
      findUnique: async ({ where }) => {
        const product = findProduct(where);
        return product ? withCategory(product) : null;
      },
      update: async ({ where, data }) => {
        const product = findProduct(where);
        Object.assign(product, data);
        if (data.price !== undefined) product.price = new Prisma.Decimal(data.price);
        return withCategory(product);
      },
      updateMany: async ({ where, data }) => {
        const matches = products.filter(product => product.categoryId === where.categoryId);
        for (const product of matches) Object.assign(product, data);
        return { count: matches.length };
      },
      delete: async ({ where }) => {
        const index = products.findIndex(product => product.id === where.id);
        return products.splice(index, 1)[0];
      }
    },
    $transaction: async callback => callback(prisma)
  };

  return { prisma };
}

test('catalog service creates, updates, and deletes products and categories safely', async () => {
  const { prisma } = createPrismaMock();
  const service = createCatalogService(prisma);

  const category = await service.createCategory({
    name: 'Seasonal',
    slug: 'seasonal',
    description: 'Seasonal products',
    image: ''
  });
  assert.equal(category.slug, 'seasonal');
  assert.equal(category.image, null);

  const product = await service.createProduct({
    name: 'Light jacket',
    description: 'A seasonal jacket',
    price: '29.900',
    categoryId: 'seasonal',
    type: 'Veste',
    image: 'assets/images/jacket.jpg',
    stock: 5
  });
  assert.equal(product.categoryName, 'Seasonal');
  assert.equal(product.available, true);

  const updatedProduct = await service.updateProduct(product.id, { stock: 0 });
  assert.equal(updatedProduct.available, false);

  const renamedCategory = await service.updateCategory('seasonal', {
    name: 'Autumn',
    slug: 'autumn'
  });
  assert.equal(renamedCategory.slug, 'autumn');
  assert.equal((await service.getProduct(product.id)).categoryName, 'Autumn');
  assert.equal((await service.getProduct(product.id)).categoryId, 'autumn');

  await assert.rejects(
    service.deleteCategory('autumn'),
    error => error.status === 409 && error.code === 'CATEGORY_HAS_PRODUCTS'
  );
  await service.deleteProduct(product.id);
  await service.deleteCategory('autumn');
  assert.equal(await service.getCategory('autumn'), null);
  assert.equal(await service.getProduct(product.id), null);
});
