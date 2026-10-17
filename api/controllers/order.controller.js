const validStatuses = new Set([
  'En attente',
  'Confirmée',
  'En préparation',
  'Livrée',
  'Annulée'
]);

class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.code = 'INVALID_REQUEST';
  }
}

function requiredText(value, field, maximum) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new RequestValidationError(`Field "${field}" is required and must not exceed ${maximum} characters.`);
  }
  return value.trim();
}

function validateItems(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    throw new RequestValidationError('Order must contain between 1 and 100 items.');
  }
  return value.map((item, index) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      Object.keys(item).some(key => !['productId', 'quantity'].includes(key))
    ) {
      throw new RequestValidationError(`Order item ${index + 1} is invalid.`);
    }
    return {
      productId: requiredText(item.productId, `items[${index}].productId`, 128),
      quantity: (() => {
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
          throw new RequestValidationError(`Order item ${index + 1} quantity must be an integer between 1 and 1000.`);
        }
        return item.quantity;
      })()
    };
  });
}

function validateCreateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RequestValidationError('A JSON object is required.');
  }
  const allowed = new Set(['clientName', 'clientPhone', 'clientAddress', 'items']);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) throw new RequestValidationError(`Field "${key}" is not supported.`);
  }
  return {
    clientName: body.clientName == null ? '' : requiredText(body.clientName, 'clientName', 100),
    clientPhone: requiredText(body.clientPhone, 'clientPhone', 40),
    clientAddress: requiredText(body.clientAddress, 'clientAddress', 500),
    items: validateItems(body.items)
  };
}

function validateId(value) {
  if (typeof value !== 'string' || !value || value.length > 128 || value.includes('/')) {
    throw new RequestValidationError('Order id is invalid.');
  }
  return value;
}

function createOrderController(service) {
  return {
    list: async (req, res) => res.json(await service.listOrders(req.authUser)),

    get: async (req, res) => {
      const order = await service.getOrder(validateId(req.params.id), req.authUser);
      if (!order) {
        const error = new Error('Order not found.');
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
      res.json(order);
    },

    create: async (req, res) => {
      res.status(201).json(await service.createOrder(req.authUser, validateCreateBody(req.body)));
    },

    updateStatus: async (req, res) => {
      const id = validateId(req.params.id);
      if (!req.body || Object.keys(req.body).some(key => key !== 'status') || !validStatuses.has(req.body.status)) {
        throw new RequestValidationError('A valid order status is required.');
      }
      res.json(await service.updateStatus(id, req.body.status));
    }
  };
}

module.exports = { createOrderController };
