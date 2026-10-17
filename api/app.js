const cors = require('cors');
const express = require('express');
const { createHealthRouter } = require('./routes/health.routes');
const { createCatalogRouter } = require('./routes/catalog.routes');
const { createAuthRouter } = require('./routes/auth.routes');
const { createOrderRouter } = require('./routes/order.routes');
const { createUserRouter } = require('./routes/user.routes');
const { createUploadRouter } = require('./routes/upload.routes');

function createApp({ prisma, config, errorHandler }) {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error('CORS_ORIGIN_DENIED');
      error.code = 'CORS_ORIGIN_DENIED';
      callback(error);
    }
  }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', createHealthRouter(prisma));
  app.use('/api', createAuthRouter(prisma, config));
  app.use('/api', createOrderRouter(prisma, config));
  app.use('/api', createUserRouter(prisma, config));
  app.use('/api', createCatalogRouter(prisma, config));
  app.use('/api', createUploadRouter(prisma, config));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
