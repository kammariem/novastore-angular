const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = require('../api/lib/prisma');

async function promote() {
  const email = process.argv[2]?.trim().toLowerCase();
  const confirmed = process.argv.includes('--confirm');
  const databaseUrl = new URL(process.env.DATABASE_URL || '');
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ''));
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

  if (!email || !confirmed) {
    throw new Error('Usage: npm run admin:promote -- <registered-email> --confirm');
  }
  if (
    databaseUrl.protocol !== 'postgresql:' ||
    !localHosts.has(databaseUrl.hostname) ||
    databaseName !== 'novastore_db'
  ) {
    throw new Error('Admin promotion is restricted to the local novastore_db database.');
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, active: true } });
  if (!user || !user.active) {
    throw new Error('An existing active account is required before promotion.');
  }
  if (user.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  }
  console.log('Administrator role granted to the existing account.');
}

promote()
  .catch(error => {
    console.error('Admin promotion failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
