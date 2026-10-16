const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const port = Number(process.env.UPLOAD_API_PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('UPLOAD_API_PORT must be an integer between 1 and 65535.');
}

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

module.exports = {
  host: process.env.UPLOAD_API_HOST || '127.0.0.1',
  port,
  corsOrigins,
  uploadDir: path.resolve(__dirname, '..', 'src', 'assets', 'uploaded_imgs')
};
