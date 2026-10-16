const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/db-health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    const databaseError = new Error('DATABASE_UNAVAILABLE', { cause: error });
    databaseError.code = 'DATABASE_UNAVAILABLE';
    next(databaseError);
  }
});

module.exports = router;
