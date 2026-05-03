// Helpers compartidos para parsear cookies y validar sesión.
import { verify } from './jwt.js';

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach(c => {
    const idx = c.indexOf('=');
    if (idx === -1) return;
    const k = c.slice(0, idx).trim();
    const v = c.slice(idx + 1).trim();
    if (k) {
      try { cookies[k] = decodeURIComponent(v); }
      catch { cookies[k] = v; }
    }
  });
  return cookies;
}

export function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.session;
  if (!token) return null;
  return verify(token);
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
