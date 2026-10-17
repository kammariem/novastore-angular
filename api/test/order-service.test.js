const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Prisma } = require('@prisma/client');
const { createOrderService } = require('../services/order.service');

function createPrismaMock() {
  const initialProducts = [
    {
      id: 'p-1',
      name: 'Demo coat',
      image: 'coat.jpg',
      price: new Prisma.Decimal('10.125'),
      stock: 3,
      available: true
    },
    {
      id: 'p-2',
      name: 'Demo bag',
      image: 'bag.jpg',
      price: new Prisma.Decimal('4.250'),
      stock: 1,
      available: true
    }
  ];
  const state = { products: initialProducts, orders: [] };

  const prisma = {
    $transaction: async callback => {
      const draft = {
        products: state.products.map(product => ({ ...product })),
        orders: [...state.orders]
      };
      const transaction = {
        product: {
          findMany: async () => draft.products.map(product => ({ ...product })),
          updateMany: async ({ where, data }) => {
            const ids = where.id.in || [where.id];
            const selected = draft.products.filter(product =>
              ids.includes(product.id) &&
              (where.stock?.gte === undefined || product.stock >= where.stock.gte) &&
              (where.available === undefined || product.available === where.available)
            );
            for (const product of selected) {
              if (typeof data.stock?.decrement === 'number') product.stock -= data.stock.decrement;
              if (data.available !== undefined) product.available = data.available;
            }
            return { count: selected.length };
          }
        },
        order: {
          create: async ({ data }) => {
            const order = {
              ...data,
              id: 'order-1',
              createdAt: new Date('2026-02-01T00:00:00.000Z'),
              items: data.items.create.map((item, index) => ({ ...item, id: `item-${index + 1}` }))
            };
            draft.orders.push(order);
            return order;
          }
        }
      };
      const result = await callback(transaction);
      state.products = draft.products;
      state.orders = draft.orders;
      return result;
    }
  };

  return { prisma, state };
}

test('order creation uses database prices and atomically decrements stock', async () => {
  const { prisma, state } = createPrismaMock();
  const service = createOrderService(prisma);
  const order = await service.createOrder(
    { id: 'client-1', name: 'Demo client', email: 'client@example.test', role: 'CLIENT' },
    {
      clientName: 'Delivery recipient',
      clientPhone: '55512345',
      clientAddress: 'Demo address',
      items: [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-2', quantity: 1 }
      ]
    }
  );

  assert.equal(order.total, 24.5);
  assert.equal(order.clientEmail, 'client@example.test');
  assert.equal(order.items.length, 2);
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.items[0].price, 10.125);
  assert.equal(state.products[0].stock, 1);
  assert.equal(state.products[1].stock, 0);
  assert.equal(state.products[1].available, false);
});

test('order creation rolls back stock when any line is unavailable', async () => {
  const { prisma, state } = createPrismaMock();
  const service = createOrderService(prisma);

  await assert.rejects(
    service.createOrder(
      { id: 'client-1', name: 'Demo client', email: 'client@example.test', role: 'CLIENT' },
      {
        clientName: 'Demo client',
        clientPhone: '55512345',
        clientAddress: 'Demo address',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 2 }
        ]
      }
    ),
    error => error.status === 409
  );

  assert.equal(state.products[0].stock, 3);
  assert.equal(state.products[1].stock, 1);
  assert.equal(state.orders.length, 0);
});

test('order history scopes clients to their own orders and administrators to all orders', async () => {
  const order = {
    id: 'order-1',
    userId: 'client-1',
    clientName: 'Demo client',
    clientEmail: 'client@example.test',
    clientPhone: '55512345',
    clientAddress: 'Demo address',
    status: 'En attente',
    total: new Prisma.Decimal('10.000'),
    currency: 'TND',
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    items: []
  };
  const calls = [];
  const prisma = {
    order: {
      findMany: async ({ where }) => {
        calls.push(where);
        return [order];
      },
      findFirst: async ({ where }) => where.userId === 'client-2' ? null : order
    }
  };
  const service = createOrderService(prisma);

  assert.equal((await service.listOrders({ id: 'client-1', role: 'CLIENT' }))[0].id, 'order-1');
  assert.deepEqual(calls[0], { userId: 'client-1' });
  assert.equal(await service.getOrder('order-1', { id: 'client-2', role: 'CLIENT' }), null);
  assert.equal((await service.listOrders({ id: 'admin-1', role: 'ADMIN' })).length, 1);
  assert.deepEqual(calls[1], {});
});

test('order cancellation restores linked stock once and never restores legacy snapshot stock', async () => {
  const state = {
    stock: 2,
    order: {
      id: 'order-1',
      userId: 'client-1',
      clientName: 'Demo client',
      clientEmail: 'client@example.test',
      clientPhone: '55512345',
      clientAddress: 'Demo address',
      status: 'En attente',
      total: new Prisma.Decimal('10.000'),
      currency: 'TND',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      items: [{
        id: 'item-1',
        productId: 'p-1',
        productName: 'Demo coat',
        image: 'coat.jpg',
        quantity: 1,
        price: new Prisma.Decimal('10.000')
      }]
    }
  };
  const prisma = {
    $transaction: async callback => {
      const draft = { stock: state.stock, order: { ...state.order } };
      const transaction = {
        order: {
          findUnique: async () => ({ ...draft.order, items: [...state.order.items] }),
          updateMany: async ({ where, data }) => {
            if (draft.order.status !== where.status) return { count: 0 };
            draft.order.status = data.status;
            return { count: 1 };
          }
        },
        product: {
          update: async ({ data }) => {
            draft.stock += data.stock.increment;
          }
        }
      };
      const result = await callback(transaction);
      state.stock = draft.stock;
      state.order = draft.order;
      return result;
    }
  };
  const service = createOrderService(prisma);

  const cancelled = await service.updateStatus('order-1', 'Annulée');
  assert.equal(cancelled.status, 'Annulée');
  assert.equal(state.stock, 3);
  await assert.rejects(service.updateStatus('order-1', 'Annulée'), error => error.status === 409);
  assert.equal(state.stock, 3);

  state.order = { ...state.order, status: 'En attente', userId: null };
  await service.updateStatus('order-1', 'Annulée');
  assert.equal(state.stock, 3);
});

test('order cancellation skips products that were deleted after checkout', async () => {
  const state = {
    order: {
      id: 'order-1',
      userId: 'client-1',
      clientName: 'Demo client',
      clientEmail: 'client@example.test',
      clientPhone: '55512345',
      clientAddress: 'Demo address',
      status: 'En attente',
      total: new Prisma.Decimal('10.000'),
      currency: 'TND',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      items: [{
        id: 'item-1',
        productId: null,
        sourceProductId: 'deleted-product',
        productName: 'Deleted product snapshot',
        image: 'deleted.jpg',
        quantity: 1,
        price: new Prisma.Decimal('10.000')
      }]
    }
  };
  const prisma = {
    $transaction: async callback => {
      const draft = { order: { ...state.order, items: [...state.order.items] } };
      const transaction = {
        order: {
          findUnique: async () => ({ ...draft.order, items: draft.order.items }),
          updateMany: async ({ data }) => {
            draft.order.status = data.status;
            return { count: 1 };
          }
        },
        product: {
          update: async () => {
            throw new Error('A deleted product must not be restored.');
          }
        }
      };
      const result = await callback(transaction);
      state.order = draft.order;
      return result;
    }
  };

  const cancelled = await createOrderService(prisma).updateStatus('order-1', 'Annulée');
  assert.equal(cancelled.status, 'Annulée');
});
