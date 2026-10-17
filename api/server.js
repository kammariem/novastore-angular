const config = require('./config');
const { errorHandler } = require('./middleware/error-handler');
const prisma = require('./lib/prisma');
const { createApp } = require('./app');

if (typeof config.jwtSecret !== 'string' || Buffer.byteLength(config.jwtSecret) < 32) {
  throw new Error('Set JWT_SECRET to a random value of at least 32 bytes before starting the API.');
}

const app = createApp({ prisma, config, errorHandler });

const server = app.listen(config.port, config.host, () => {
  console.warn('Upload API is bound to localhost by default; review production deployment controls before exposing it.');
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
