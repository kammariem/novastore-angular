const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Prisma } = require('@prisma/client');
const prisma = require('../api/lib/prisma');
const data = require('../db.json');

async function seed() {
  const databaseUrl = new URL(process.env.DATABASE_URL || '');
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ''));
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

  if (databaseUrl.protocol !== 'postgresql:' || !localHosts.has(databaseUrl.hostname) || databaseName !== 'novastore_db') {
    throw new Error('Seed is restricted to the local novastore_db database.');
  }

  for (const category of data.categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description || '',
        image: category.image || null,
        active: category.active !== false
      },
      create: {
        id: String(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || null,
        active: category.active !== false
      }
    });
  }

  for (const product of data.products) {
    await prisma.product.upsert({
      where: { id: String(product.id) },
      update: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(String(product.price)),
        oldPrice: product.oldPrice == null ? null : new Prisma.Decimal(String(product.oldPrice)),
        currency: product.currency || 'TND',
        categoryId: String(product.categoryId),
        categoryName: product.categoryName,
        type: product.type,
        image: product.image,
        imagesUri: product.imagesUri || null,
        stock: Number(product.stock),
        available: Boolean(product.available),
        promotion: Boolean(product.promotion)
      },
      create: {
        id: String(product.id),
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(String(product.price)),
        oldPrice: product.oldPrice == null ? null : new Prisma.Decimal(String(product.oldPrice)),
        currency: product.currency || 'TND',
        categoryId: String(product.categoryId),
        categoryName: product.categoryName,
        type: product.type,
        image: product.image,
        imagesUri: product.imagesUri || null,
        stock: Number(product.stock),
        available: Boolean(product.available),
        promotion: Boolean(product.promotion)
      }
    });
  }
}

seed()
  .then(() => console.log(`Seeded ${data.categories.length} categories and ${data.products.length} products.`))
  .catch(error => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
