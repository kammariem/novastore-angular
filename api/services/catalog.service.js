const { Prisma } = require('@prisma/client');

const productFields = {
  id: true,
  name: true,
  description: true,
  price: true,
  oldPrice: true,
  currency: true,
  categoryId: true,
  categoryName: true,
  type: true,
  image: true,
  imagesUri: true,
  stock: true,
  available: true,
  promotion: true,
  createdAt: true,
  category: {
    select: {
      name: true
    }
  }
};

const categoryFields = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  active: true
};

function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    ...(product.oldPrice == null ? {} : { oldPrice: Number(product.oldPrice) }),
    currency: product.currency,
    categoryId: product.categoryId,
    categoryName: product.category?.name || product.categoryName,
    type: product.type,
    image: product.image,
    imagesUri: product.imagesUri || product.image,
    stock: product.stock,
    available: product.available,
    promotion: product.promotion,
    createdAt: product.createdAt.toISOString()
  };
}

function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    active: category.active
  };
}

function createCatalogService(prisma) {
  return {
    async listProducts({ where, page, limit }) {
      const pagination = page == null ? {} : { skip: (page - 1) * limit, take: limit };
      const [rows, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: productFields,
          orderBy: { name: 'asc' },
          ...pagination
        }),
        page == null ? Promise.resolve(null) : prisma.product.count({ where })
      ]);
      const products = rows.map(serializeProduct);

      if (page == null) {
        return products;
      }

      return {
        data: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    },

    async getProduct(id) {
      const product = await prisma.product.findUnique({
        where: { id },
        select: productFields
      });

      return product ? serializeProduct(product) : null;
    },

    async listCategories({ where, page, limit }) {
      const pagination = page == null ? {} : { skip: (page - 1) * limit, take: limit };
      const [rows, total] = await Promise.all([
        prisma.category.findMany({
          where,
          select: categoryFields,
          orderBy: { name: 'asc' },
          ...pagination
        }),
        page == null ? Promise.resolve(null) : prisma.category.count({ where })
      ]);
      const categories = rows.map(serializeCategory);

      if (page == null) {
        return categories;
      }

      return {
        data: categories,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    },

    async getCategory(identifier) {
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { id: identifier },
            { slug: identifier }
          ]
        },
        select: categoryFields
      });

      return category ? serializeCategory(category) : null;
    },

    decimal(value) {
      return new Prisma.Decimal(value);
    }
  };
}

module.exports = { createCatalogService };
