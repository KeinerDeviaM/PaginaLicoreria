const crypto = require('crypto');

const SECRET = process.env.APP_SECRET || 'cambia-este-secreto-en-produccion';
const TOKEN_TTL_MS = Number(process.env.TOKEN_TTL_MS || 1000 * 60 * 60 * 8);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = String(stored || '').split(':');
  if (!salt || !originalHash) return false;

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function signToken(payload) {
  const fullPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS
  };

  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;

  const [encoded, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
