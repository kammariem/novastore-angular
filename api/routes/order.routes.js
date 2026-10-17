const express = require('express');
const asyncHandler = require('../lib/async-handler');
const { createAuthentication } = require('../middleware/authenticate');
const { createOrderController } = require('../controllers/order.controller');
const { createOrderService } = require('../services/order.service');

function createOrderRouter(prisma, config) {
  const router = express.Router();
  const controller = createOrderController(createOrderService(prisma));
  const { requireAuth, requireAdmin } = createAuthentication(prisma, config);

  router.get('/orders', requireAuth, asyncHandler(controller.list));
  router.get('/orders/:id', requireAuth, asyncHandler(controller.get));
  router.post('/orders', requireAuth, asyncHandler(controller.create));
  router.patch('/orders/:id', requireAuth, requireAdmin, asyncHandler(controller.updateStatus));

  return router;
}

module.exports = { createOrderRouter };
