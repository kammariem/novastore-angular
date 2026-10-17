const { Prisma } = require('@prisma/client');

const orderInclude = {
  items: {
    select: {
      id: true,
      productId: true,
      sourceProductId: true,
      productName: true,
      image: true,
      quantity: true,
      price: true
    }
  }
};

function serializeOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    clientPhone: order.clientPhone,
    clientAddress: order.clientAddress,
    status: order.status,
    total: Number(order.total),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(({ sourceProductId, ...item }) => ({
      ...item,
      productId: item.productId || sourceProductId,
      price: Number(item.price)
    }))
  };
}

function createOrderService(prisma) {
  return {
    async listOrders(user) {
      const where = user.role === 'ADMIN' ? {} : { userId: user.id };
      const orders = await prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' }
      });
      return orders.map(serializeOrder);
    },

    async getOrder(id, user) {
      const where = user.role === 'ADMIN' ? { id } : { id, userId: user.id };
      const order = await prisma.order.findFirst({ where, include: orderInclude });
      return order ? serializeOrder(order) : null;
    },

    async createOrder(user, { clientName, clientPhone, clientAddress, items }) {
      const normalizedItems = new Map();
      for (const item of items) {
        normalizedItems.set(item.productId, (normalizedItems.get(item.productId) || 0) + item.quantity);
      }

      return prisma.$transaction(async transaction => {
        const products = await transaction.product.findMany({
          where: { id: { in: [...normalizedItems.keys()] } },
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            stock: true,
            available: true
          }
        });
        const productById = new Map(products.map(product => [product.id, product]));
        const lineItems = [];
        let total = new Prisma.Decimal(0);

        for (const [productId, quantity] of normalizedItems) {
          const product = productById.get(productId);
          if (!product || !product.available || product.stock < quantity) {
            const error = new Error(`Product ${productId} is unavailable or has insufficient stock.`);
            error.status = 409;
            error.code = 'INSUFFICIENT_STOCK';
            throw error;
          }
          const updated = await transaction.product.updateMany({
            where: { id: productId, available: true, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } }
          });
          if (updated.count !== 1) {
            const error = new Error(`Product ${productId} is unavailable or has insufficient stock.`);
            error.status = 409;
            error.code = 'INSUFFICIENT_STOCK';
            throw error;
          }
          total = total.plus(product.price.mul(quantity));
          lineItems.push({
            productId,
            productName: product.name,
            image: product.image,
            quantity,
            price: product.price
          });
        }

        await transaction.product.updateMany({
          where: { id: { in: [...normalizedItems.keys()] }, stock: 0 },
          data: { available: false }
        });

        const order = await transaction.order.create({
          data: {
            userId: user.id,
            clientName: clientName || user.name,
            clientEmail: user.email,
            clientPhone,
            clientAddress,
            status: 'En attente',
            total,
            currency: 'TND',
            items: { create: lineItems }
          },
          include: orderInclude
        });
        return serializeOrder(order);
      });
    },

    async updateStatus(id, status) {
      return prisma.$transaction(async transaction => {
        const current = await transaction.order.findUnique({
          where: { id },
          include: orderInclude
        });
        if (!current) {
          const error = new Error('Order not found.');
          error.status = 404;
          error.code = 'RESOURCE_NOT_FOUND';
          throw error;
        }

        const transitions = {
          'En attente': new Set(['Confirmée', 'Annulée']),
          'Confirmée': new Set(['En préparation', 'Annulée']),
          'En préparation': new Set(['Livrée', 'Annulée']),
          'Livrée': new Set(),
          'Annulée': new Set()
        };
        if (!transitions[current.status]?.has(status)) {
          const error = new Error(`Cannot change order status from "${current.status}" to "${status}".`);
          error.status = 409;
          error.code = 'INVALID_ORDER_TRANSITION';
          throw error;
        }

        const changed = await transaction.order.updateMany({
          where: { id, status: current.status },
          data: { status }
        });
        if (changed.count !== 1) {
          const error = new Error('Order status was changed concurrently.');
          error.status = 409;
          error.code = 'INVALID_ORDER_TRANSITION';
          throw error;
        }

        if (status === 'Annulée' && current.userId) {
          for (const item of current.items) {
            if (!item.productId) continue;
            await transaction.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                available: true
              }
            });
          }
        }

        const order = await transaction.order.findUnique({
          where: { id },
          include: orderInclude
        });
        return serializeOrder(order);
      });
    }
  };
}

module.exports = { createOrderService };
