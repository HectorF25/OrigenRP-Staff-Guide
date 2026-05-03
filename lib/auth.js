// Helpers de cookies + sesión. Se usan tanto en route handlers como en components server-side.
import { verify } from './jwt.js';

export function parseCookieHeader(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
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

// En App Router: usamos request.cookies o request.headers.get('cookie').
export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies.session;
  if (!token) return null;
  return verify(token);
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sessionCookie(token) {
  return `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function stateCookie(state) {
  return `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}
