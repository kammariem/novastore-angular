const express = require('express');
const asyncHandler = require('../lib/async-handler');
const { createAuthentication } = require('../middleware/authenticate');
const { createUserController } = require('../controllers/user.controller');

function createUserRouter(prisma, config) {
  const router = express.Router();
  const controller = createUserController(prisma);
  const { requireAuth, requireAdmin } = createAuthentication(prisma, config);

  router.get('/users', requireAuth, requireAdmin, asyncHandler(controller.list));
  router.patch('/users/:id', requireAuth, requireAdmin, asyncHandler(controller.update));
  router.delete('/users/:id', requireAuth, requireAdmin, asyncHandler(controller.deactivate));

  return router;
}

module.exports = { createUserRouter };
