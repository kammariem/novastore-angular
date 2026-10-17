const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(__dirname, '..', '.env');
let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const existing = /^JWT_SECRET=(.*)$/m.exec(contents)?.[1]?.trim();

if (existing) {
  if (Buffer.byteLength(existing) < 32) {
    throw new Error('JWT_SECRET is already set but is shorter than 32 bytes; update it manually.');
  }
  console.log('JWT_SECRET is already configured; no change made.');
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString('base64url');
if (/^JWT_SECRET=.*$/m.test(contents)) {
  contents = contents.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
} else {
  contents += `${contents && !contents.endsWith('\n') ? '\n' : ''}JWT_SECRET=${secret}\n`;
}
fs.writeFileSync(envPath, contents, { mode: 0o600 });
console.log('A local JWT_SECRET was generated in the ignored .env file.');
