const express = require('express');
const { createCatalogController } = require('../controllers/catalog.controller');
const { createCatalogService } = require('../services/catalog.service');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function createCatalogRouter(prisma) {
  const router = express.Router();
  const controller = createCatalogController(createCatalogService(prisma));

  router.get('/products', asyncHandler(controller.listProducts));
  router.get('/products/:id', asyncHandler(controller.getProduct));
  router.get('/categories', asyncHandler(controller.listCategories));
  router.get('/categories/:id', asyncHandler(controller.getCategory));

  return router;
}

module.exports = { createCatalogRouter };
