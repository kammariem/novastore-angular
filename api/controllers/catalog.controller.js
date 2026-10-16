const allowedProductQuery = new Set([
  'categoryId', 'categoryName', 'search', 'minPrice', 'maxPrice',
  'available', 'promotion', 'page', 'limit'
]);
const allowedCategoryQuery = new Set(['search', 'active', 'page', 'limit']);
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
    }
  };
}

module.exports = { createCatalogController };
