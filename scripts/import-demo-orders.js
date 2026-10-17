const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Prisma } = require('@prisma/client');
const prisma = require('../api/lib/prisma');
const database = require('../db.json');

const placeholderEmail = value =>
  typeof value === 'string' &&
  /@(example\.(com|test|org)|example\.invalid|test\.invalid|mail\.invalid)$/i.test(value);
const clearlySyntheticText = value =>
  typeof value === 'string' &&
  /(demo|test|example|fictif|fictive|exemple|client [0-9]|user [0-9])/i.test(value);
const validMoney = value => /^\d{1,9}(?:\.\d{1,3})?$/.test(String(value));

async function importOrders() {
  const databaseUrl = new URL(process.env.DATABASE_URL || '');
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ''));
  if (
    databaseUrl.protocol !== 'postgresql:' ||
    !new Set(['localhost', '127.0.0.1', '[::1]']).has(databaseUrl.hostname) ||
    databaseName !== 'novastore_db'
  ) {
    throw new Error('Demo order import is restricted to the local novastore_db database.');
  }

  const orders = database.orders || [];
  if (!orders.every(order =>
    placeholderEmail(order.clientEmail) &&
    clearlySyntheticText(order.clientName) &&
    clearlySyntheticText(order.clientAddress) &&
    typeof order.id !== 'undefined' &&
    validMoney(order.total) &&
    Number.isFinite(Date.parse(order.createdAt)) &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every(item =>
      typeof item.productId !== 'undefined' &&
      typeof item.productName === 'string' &&
      item.productName.trim().length > 0 &&
      Number.isInteger(Number(item.quantity)) &&
      Number(item.quantity) > 0 &&
      validMoney(item.price)
    )
  )) {
    throw new Error('Import stopped because every order could not be verified as synthetic demo data.');
  }

  const productIds = [...new Set(orders.flatMap(order =>
    (order.items || []).map(item => String(item.productId))
  ))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true }
  });
  const availableProductIds = new Set(products.map(product => product.id));

  let imported = 0;
  let skipped = 0;
  for (const order of orders) {
    const id = String(order.id);
    if (await prisma.order.findUnique({ where: { id }, select: { id: true } })) {
      skipped += 1;
      continue;
    }

    await prisma.order.create({
      data: {
        id,
        userId: null,
        clientName: order.clientName,
        clientEmail: order.clientEmail,
        clientPhone: String(order.clientPhone || ''),
        clientAddress: order.clientAddress,
        status: order.status,
        total: new Prisma.Decimal(String(order.total)),
        currency: order.currency || 'TND',
        createdAt: new Date(order.createdAt),
        items: {
          create: order.items.map(item => ({
            productId: availableProductIds.has(String(item.productId)) ? String(item.productId) : null,
            sourceProductId: availableProductIds.has(String(item.productId))
              ? null
              : String(item.productId),
            productName: item.productName,
            image: item.image || null,
            quantity: Number(item.quantity),
            price: new Prisma.Decimal(String(item.price))
          }))
        }
      }
    });
    imported += 1;
  }

  console.log(`Imported ${imported} synthetic legacy orders; skipped ${skipped} existing orders.`);
}

importOrders()
  .catch(error => {
    console.error('Demo order import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
