const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { publicUserFields } = require('../middleware/authenticate');

function createAuthService(prisma, config) {
  function issueToken(user) {
    if (typeof config.jwtSecret !== 'string' || Buffer.byteLength(config.jwtSecret) < 32) {
      throw new Error('JWT_SECRET must contain at least 32 bytes.');
    }

    return jwt.sign({}, config.jwtSecret, {
      subject: user.id,
      expiresIn: '15m',
      issuer: 'novastore-api',
      audience: 'novastore-angular'
    });
  }

  return {
    async register({ name, email, password, phone, address }) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        const error = new Error('An account with this email already exists.');
        error.status = 409;
        error.code = 'EMAIL_IN_USE';
        throw error;
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          phone: phone || null,
          address: address || null,
          role: 'CLIENT'
        },
        select: publicUserFields
      });

      return { user, token: issueToken(user) };
    },

    async login({ email, password }) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { ...publicUserFields, passwordHash: true }
      });

      if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
        const error = new Error('Email or password is incorrect.');
        error.status = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }

      const { passwordHash, ...safeUser } = user;
      return { user: safeUser, token: issueToken(safeUser) };
    }
  };
}

module.exports = { createAuthService };
