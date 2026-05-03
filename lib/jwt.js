import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || '';

function b64uEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64uDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function sign(payload, expiresInSec = 7 * 24 * 60 * 60) {
  if (!SECRET) throw new Error('JWT_SECRET no configurado');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = b64uEncode(JSON.stringify(header));
  const payloadB64 = b64uEncode(JSON.stringify(full));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest();
  return `${data}.${b64uEncode(sig)}`;
}

export function verify(token) {
  if (!SECRET || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest();
  const expectedB64 = b64uEncode(expected);
  if (s.length !== expectedB64.length) return null;
  let diff = 0;
  for (let i = 0; i < s.length; i++) {
    diff |= s.charCodeAt(i) ^ expectedB64.charCodeAt(i);
  }
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(b64uDecode(p).toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
