const allowedProductQuery = new Set([
  'categoryId', 'categoryName', 'search', 'minPrice', 'maxPrice',
  'available', 'promotion', 'page', 'limit'
]);
const allowedCategoryQuery = new Set(['search', 'active', 'page', 'limit']);
const productFields = new Set([
  'name', 'description', 'price', 'oldPrice', 'currency', 'categoryId',
  'categoryName', 'type', 'image', 'imagesUri', 'stock', 'available', 'promotion'
]);
const categoryFields = new Set(['name', 'slug', 'description', 'image', 'active']);
const maximumLimit = 100;

class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.code = 'INVALID_REQUEST';
  }
}

class ResourceNotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.status = 404;
    this.code = 'RESOURCE_NOT_FOUND';
  }
}

function validateQuery(query, allowedKeys) {
  for (const [key, value] of Object.entries(query)) {
    if (!allowedKeys.has(key)) {
      throw new RequestValidationError(`Query parameter "${key}" is not supported.`);
    }
    if (typeof value !== 'string') {
      throw new RequestValidationError(`Query parameter "${key}" must be specified once.`);
    }
  }
}

function parseBoolean(value, key) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new RequestValidationError(`Query parameter "${key}" must be true or false.`);
}

function parseDecimal(value, key, service) {
  if (value === undefined) return undefined;
  if (!/^\d{1,9}(?:\.\d{1,3})?$/.test(value)) {
    throw new RequestValidationError(`Query parameter "${key}" must be a non-negative decimal with at most 3 decimal places.`);
  }
  return service.decimal(value);
}

function parsePagination(query) {
  if (query.page === undefined && query.limit === undefined) {
    return { page: null, limit: null };
  }

  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new RequestValidationError('Query parameter "page" must be a positive integer.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > maximumLimit) {
    throw new RequestValidationError(`Query parameter "limit" must be an integer between 1 and ${maximumLimit}.`);
  }

  return { page, limit };
}

function validateIdentifier(value, label) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128 || value.includes('/')) {
    throw new RequestValidationError(`${label} is invalid.`);
  }
  return value;
}

function validateWriteBody(body, allowedFields, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RequestValidationError('A JSON object is required.');
  }
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      throw new RequestValidationError(`Field "${field}" is not supported.`);
    }
  }
  if (Object.keys(body).length === 0) {
    throw new RequestValidationError('At least one field is required.');
  }
}

function textField(value, field, { required = true, max = 500 } = {}) {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string' || (required && !value.trim()) || value.trim().length > max) {
    throw new RequestValidationError(`Field "${field}" is invalid.`);
  }
  return value.trim();
}

function decimalField(value, field, optional = false) {
  if (value == null && optional) return value === null ? null : undefined;
  const text = String(value);
  if (!/^\d{1,9}(?:\.\d{1,3})?$/.test(text)) {
    throw new RequestValidationError(`Field "${field}" must be a non-negative amount with at most 3 decimal places.`);
  }
  return text;
}

function booleanField(value, field) {
  if (typeof value !== 'boolean') {
    throw new RequestValidationError(`Field "${field}" must be a boolean.`);
  }
  return value;
}

function integerField(value, field, maximum) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new RequestValidationError(`Field "${field}" must be an integer between 0 and ${maximum}.`);
  }
  return value;
}

function validateProduct(body, partial = false) {
  validateWriteBody(body, productFields, partial);
  const output = {};
  const checks = {
    name: () => textField(body.name, 'name', { max: 150 }),
    description: () => textField(body.description, 'description', { max: 5000 }),
    price: () => decimalField(body.price, 'price'),
    oldPrice: () => decimalField(body.oldPrice, 'oldPrice', true),
    currency: () => body.currency === 'TND'
      ? body.currency
      : (() => { throw new RequestValidationError('Field "currency" must be TND.'); })(),
    categoryId: () => textField(body.categoryId, 'categoryId', { max: 100 }),
    categoryName: () => textField(body.categoryName, 'categoryName', { required: false, max: 100 }),
    type: () => textField(body.type, 'type', { max: 60 }),
    image: () => textField(body.image, 'image', { max: 1000 }),
    imagesUri: () => textField(body.imagesUri, 'imagesUri', { required: false, max: 2000 }),
    stock: () => integerField(body.stock, 'stock', 1000000),
    available: () => booleanField(body.available, 'available'),
    promotion: () => booleanField(body.promotion, 'promotion')
  };
  const requiredFields = ['name', 'description', 'price', 'categoryId', 'type', 'image', 'stock'];
  for (const key of Object.keys(checks)) {
    if (Object.hasOwn(body, key)) output[key] = checks[key]();
    else if (!partial && requiredFields.includes(key)) {
      throw new RequestValidationError(`Field "${key}" is required.`);
    }
  }
  return output;
}

function validateCategory(body, partial = false) {
  validateWriteBody(body, categoryFields, partial);
  const output = {};
  const checks = {
    name: () => textField(body.name, 'name', { max: 100 }),
    slug: () => textField(body.slug, 'slug', { max: 100 }),
    description: () => textField(body.description, 'description', { required: false, max: 1000 }),
    image: () => textField(body.image, 'image', { required: false, max: 1000 }),
    active: () => booleanField(body.active, 'active')
  };
  for (const key of Object.keys(checks)) {
    if (Object.hasOwn(body, key)) output[key] = checks[key]();
    else if (!partial && (key === 'name' || key === 'slug')) {
      throw new RequestValidationError(`Field "${key}" is required.`);
    }
  }
  if (output.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(output.slug)) {
    throw new RequestValidationError('Field "slug" must contain lowercase letters, numbers, and hyphens.');
  }
  return output;
}

function createCatalogController(service) {
  return {
    listProducts: async (req, res) => {
      validateQuery(req.query, allowedProductQuery);
      const minPrice = parseDecimal(req.query.minPrice, 'minPrice', service);
      const maxPrice = parseDecimal(req.query.maxPrice, 'maxPrice', service);

      if (minPrice && maxPrice && minPrice.greaterThan(maxPrice)) {
        throw new RequestValidationError('"minPrice" must not exceed "maxPrice".');
      }

      const where = {};
      const search = req.query.search?.trim();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (req.query.categoryId) where.categoryId = req.query.categoryId;
      if (req.query.categoryName) where.category = { name: { equals: req.query.categoryName, mode: 'insensitive' } };
      if (minPrice || maxPrice) {
        where.price = {
          ...(minPrice ? { gte: minPrice } : {}),
          ...(maxPrice ? { lte: maxPrice } : {})
        };
      }
      const available = parseBoolean(req.query.available, 'available');
      const promotion = parseBoolean(req.query.promotion, 'promotion');
      if (available !== undefined) where.available = available;
      if (promotion !== undefined) where.promotion = promotion;

      const pagination = parsePagination(req.query);
      res.json(await service.listProducts({ where, ...pagination }));
    },

    getProduct: async (req, res) => {
      const id = validateIdentifier(req.params.id, 'Product id');
      const product = await service.getProduct(id);
      if (!product) throw new ResourceNotFoundError('Product');
      res.json(product);
    },

    listCategories: async (req, res) => {
      validateQuery(req.query, allowedCategoryQuery);
      const where = {};
      const search = req.query.search?.trim();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ];
      }
      const active = parseBoolean(req.query.active, 'active');
      if (active !== undefined) where.active = active;

      const pagination = parsePagination(req.query);
      res.json(await service.listCategories({ where, ...pagination }));
    },

    getCategory: async (req, res) => {
      const identifier = validateIdentifier(req.params.id, 'Category id or slug');
      const category = await service.getCategory(identifier);
      if (!category) throw new ResourceNotFoundError('Category');
      res.json(category);
    },

    createProduct: async (req, res) => {
      res.status(201).json(await service.createProduct(validateProduct(req.body)));
    },

    updateProduct: async (req, res) => {
      const id = validateIdentifier(req.params.id, 'Product id');
      res.json(await service.updateProduct(id, validateProduct(req.body, req.method === 'PATCH')));
    },

    deleteProduct: async (req, res) => {
      const id = validateIdentifier(req.params.id, 'Product id');
      await service.deleteProduct(id);
      res.status(204).end();
    },

    createCategory: async (req, res) => {
      res.status(201).json(await service.createCategory(validateCategory(req.body)));
    },

    updateCategory: async (req, res) => {
      const id = validateIdentifier(req.params.id, 'Category id or slug');
      res.json(await service.updateCategory(id, validateCategory(req.body, req.method === 'PATCH')));
    },

    deleteCategory: async (req, res) => {
      const id = validateIdentifier(req.params.id, 'Category id or slug');
      await service.deleteCategory(id);
      res.status(204).end();
    }
  };
}

module.exports = { createCatalogController };
