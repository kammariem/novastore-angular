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

function mapDatabaseError(error) {
  if (error?.code === 'P2025') {
    const notFound = new Error('Resource not found.');
    notFound.status = 404;
    notFound.code = 'RESOURCE_NOT_FOUND';
    throw notFound;
  }
  throw error;
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

    async createProduct(data) {
      const category = await prisma.category.findUnique({ where: { slug: data.categoryId } });
      if (!category) {
        const error = new Error('Category not found.');
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
      const { categoryName, ...fields } = data;
      const product = await prisma.product.create({
        data: {
          ...fields,
          categoryId: category.slug,
          categoryName: category.name,
          imagesUri: fields.imagesUri || fields.image,
          available: fields.stock > 0 && fields.available !== false
        },
        select: productFields
      });
      return serializeProduct(product);
    },

    async updateProduct(id, data) {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        const error = new Error('Product not found.');
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
      let categoryName = existing.categoryName;
      if (data.categoryId) {
        const category = await prisma.category.findUnique({ where: { slug: data.categoryId } });
        if (!category) {
          const error = new Error('Category not found.');
          error.status = 404;
          error.code = 'RESOURCE_NOT_FOUND';
          throw error;
        }
        categoryName = category.name;
      }
      const productData = {
        ...data,
        ...(data.categoryId ? { categoryName } : {}),
        ...(data.imagesUri === '' ? { imagesUri: null } : {}),
        ...(data.image ? { imagesUri: data.imagesUri || data.image } : {}),
        ...(data.stock !== undefined || data.available !== undefined
          ? { available: (data.stock ?? existing.stock) > 0 && data.available !== false }
          : {})
      };
      delete productData.categoryName;
      try {
        const product = await prisma.product.update({
          where: { id },
          data: { ...productData, ...(data.categoryId ? { categoryId: data.categoryId, categoryName } : {}) },
          select: productFields
        });
        return serializeProduct(product);
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async deleteProduct(id) {
      try {
        await prisma.product.delete({ where: { id } });
      } catch (error) {
        mapDatabaseError(error);
      }
    },

    async createCategory(data) {
      const category = await prisma.category.create({
        data: {
          ...data,
          description: data.description || '',
          image: data.image || null
        },
        select: categoryFields
      });
      return serializeCategory(category);
    },

    async updateCategory(identifier, data) {
      const existing = await prisma.category.findFirst({
        where: { OR: [{ id: identifier }, { slug: identifier }] },
        select: { id: true, slug: true }
      });
      if (!existing) {
        const error = new Error('Category not found.');
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }

      return prisma.$transaction(async transaction => {
        if (data.name) {
          await transaction.product.updateMany({
            where: { categoryId: existing.slug },
            data: { categoryName: data.name }
          });
        }
        const category = await transaction.category.update({
          where: { id: existing.id },
          data: {
            ...data,
            ...(data.description === '' ? { description: '' } : {}),
            ...(data.image === '' ? { image: null } : {})
          },
          select: categoryFields
        });
        return serializeCategory(category);
      });
    },

    async deleteCategory(identifier) {
      const category = await prisma.category.findFirst({
        where: { OR: [{ id: identifier }, { slug: identifier }] },
        select: { id: true, _count: { select: { products: true } } }
      });
      if (!category) {
        const error = new Error('Category not found.');
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
      if (category._count.products > 0) {
        const error = new Error('Category cannot be deleted while it has products.');
        error.status = 409;
        error.code = 'CATEGORY_HAS_PRODUCTS';
        throw error;
      }
      await prisma.category.delete({ where: { id: category.id } });
    },

    decimal(value) {
      return new Prisma.Decimal(value);
    }
  };
}

module.exports = { createCatalogService };
