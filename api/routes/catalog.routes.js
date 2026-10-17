const express = require('express');
const { createCatalogController } = require('../controllers/catalog.controller');
const { createCatalogService } = require('../services/catalog.service');
const asyncHandler = require('../lib/async-handler');
const { createAuthentication } = require('../middleware/authenticate');

function createCatalogRouter(prisma, config) {
  const router = express.Router();
  const controller = createCatalogController(createCatalogService(prisma));
  const { requireAuth, requireAdmin } = createAuthentication(prisma, config);
  const admin = [requireAuth, requireAdmin];

  router.get('/products', asyncHandler(controller.listProducts));
  router.get('/products/:id', asyncHandler(controller.getProduct));
  router.get('/categories', asyncHandler(controller.listCategories));
  router.get('/categories/:id', asyncHandler(controller.getCategory));
  router.post('/products', ...admin, asyncHandler(controller.createProduct));
  router.put('/products/:id', ...admin, asyncHandler(controller.updateProduct));
  router.patch('/products/:id', ...admin, asyncHandler(controller.updateProduct));
  router.delete('/products/:id', ...admin, asyncHandler(controller.deleteProduct));
  router.post('/categories', ...admin, asyncHandler(controller.createCategory));
  router.put('/categories/:id', ...admin, asyncHandler(controller.updateCategory));
  router.patch('/categories/:id', ...admin, asyncHandler(controller.updateCategory));
  router.delete('/categories/:id', ...admin, asyncHandler(controller.deleteCategory));

  return router;
}

module.exports = { createCatalogRouter };
