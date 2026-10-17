const express = require('express');
const { rateLimit } = require('express-rate-limit');
const asyncHandler = require('../lib/async-handler');
const { createAuthentication } = require('../middleware/authenticate');
const { createAuthController } = require('../controllers/auth.controller');
const { createAuthService } = require('../services/auth.service');

function createAuthRouter(prisma, config) {
  const router = express.Router();
  const controller = createAuthController(createAuthService(prisma, config));
  const { requireAuth } = createAuthentication(prisma, config);
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Try again later.' }
  });

  router.post('/auth/register', asyncHandler(controller.register));
  router.post('/auth/login', loginLimiter, asyncHandler(controller.login));
  router.get('/auth/me', requireAuth, controller.currentUser);

  return router;
}

module.exports = { createAuthRouter };
