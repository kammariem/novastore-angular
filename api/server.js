const cors = require('cors');
const express = require('express');
const config = require('./config');
const { errorHandler } = require('./middleware/error-handler');
const healthRoutes = require('./routes/health.routes');
const prisma = require('./lib/prisma');
const uploadRoutes = require('./routes/upload.routes');

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

app.use('/api', healthRoutes);
app.use('/api', uploadRoutes);
app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  console.warn('WARNING: /api/upload has no authentication and must not be exposed publicly.');
  console.log(`Upload API running on http://${config.host}:${config.port}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received; closing server and database connection.`);

  server.close(async error => {
    if (error) {
      console.error('Failed to close the HTTP server:', error);
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect Prisma:', disconnectError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
