const jwt = require('jsonwebtoken');
const asyncHandler = require('../lib/async-handler');

const publicUserFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  address: true,
  active: true,
  createdAt: true
};

function createAuthentication(prisma, config) {
  const requireAuth = asyncHandler(async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) {
      const error = new Error('Authentication required.');
      error.status = 401;
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    let payload;
    try {
      payload = jwt.verify(match[1], config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'novastore-api',
        audience: 'novastore-angular'
      });
    } catch {
      const error = new Error('Invalid or expired access token.');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
      const error = new Error('Invalid or expired access token.');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserFields
    });
    if (!user || !user.active) {
      const error = new Error('Invalid or expired access token.');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    req.authUser = user;
    next();
  });

  const requireAdmin = (req, res, next) => {
    if (req.authUser?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Administrator access required.' });
      return;
    }

    next();
  };

  return { requireAuth, requireAdmin };
}

module.exports = { createAuthentication, publicUserFields };
