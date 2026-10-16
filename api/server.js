const cors = require('cors');
const express = require('express');
const config = require('./config');
const { errorHandler } = require('./middleware/error-handler');
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

app.use('/api', uploadRoutes);
app.use(errorHandler);

app.listen(config.port, config.host, () => {
  console.warn('WARNING: /api/upload has no authentication and must not be exposed publicly.');
  console.log(`Upload API running on http://${config.host}:${config.port}`);
});
