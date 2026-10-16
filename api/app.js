const cors = require('cors');
const express = require('express');
const { createHealthRouter } = require('./routes/health.routes');
const { createCatalogRouter } = require('./routes/catalog.routes');
const uploadRoutes = require('./routes/upload.routes');

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
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', createHealthRouter(prisma));
  app.use('/api', createCatalogRouter(prisma));
  app.use('/api', uploadRoutes);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
