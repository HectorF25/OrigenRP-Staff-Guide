import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = 'https://logs.fivemonitor.com';
const TARGET_HOST = new URL(TARGET).host;

const STRIP_RESPONSE_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-security-policy',
  'frame-options',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'content-encoding',
  'content-length'
]);

const STRIP_REQUEST_HEADERS = new Set([
  'host',
  'origin',
  'referer',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length'
]);

async function handle(req, ctx) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return new NextResponse('No autenticado. Inicia sesión con Discord.', { status: 401 });
  }

  const params = (await ctx?.params) || {};
  const pathArr = Array.isArray(params.path) ? params.path : [];
  const url = new URL(req.url);
  const targetUrl = `${TARGET}/${pathArr.join('/')}${url.search}`;

  // Headers para upstream
  const headers = new Headers();
  for (const [k, v] of req.headers) {
    const lk = k.toLowerCase();
    if (STRIP_REQUEST_HEADERS.has(lk)) continue;
    if (lk.startsWith('x-vercel') || lk.startsWith('x-forwarded') || lk.startsWith('x-real-')) continue;
    headers.set(k, v);
  }
  headers.set('host', TARGET_HOST);

  // Limpiar cookies de nuestro propio panel (session, oauth_state) antes de reenviar
  const cookieHdr = req.headers.get('cookie') || '';
  if (cookieHdr) {
    const cleanCookies = cookieHdr
      .split(';')
      .map(c => c.trim())
      .filter(c => {
        const name = c.split('=')[0];
        return name !== 'session' && name !== 'oauth_state';
      })
      .join('; ');
    if (cleanCookies) headers.set('cookie', cleanCookies);
    else headers.delete('cookie');
  }

  let upstream;
  try {
    const init = {
      method: req.method,
      headers,
      redirect: 'manual'
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      init.body = req.body;
      init.duplex = 'half';
    }
    upstream = await fetch(targetUrl, init);
  } catch (e) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 502 });
  }

  // Headers de respuesta — strippear seguridad e ignorar Set-Cookie/Location (procesados aparte)
  const respHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (STRIP_RESPONSE_HEADERS.has(lk)) return;
    if (lk === 'set-cookie' || lk === 'location') return;
    respHeaders.append(k, v);
  });

  // Reescribir Location: si apunta a logs.fivemonitor.com, redirigirlo a /api/proxy
  const loc = upstream.headers.get('location');
  if (loc) {
    try {
      const u = new URL(loc, TARGET);
      if (u.host === TARGET_HOST) {
        respHeaders.set('location', `/api/proxy${u.pathname}${u.search}`);
      } else {
        respHeaders.set('location', loc);
      }
    } catch {
      respHeaders.set('location', loc);
    }
  }

  // Reescribir Set-Cookie: quitar Domain=, forzar Path=/api/proxy y SameSite=None; Secure
  const setCookies = typeof upstream.headers.getSetCookie === 'function'
    ? upstream.headers.getSetCookie()
    : [];
  for (const sc of setCookies) {
    let cleaned = sc.replace(/;\s*Domain=[^;]*/gi, '');
    cleaned = cleaned.replace(/;\s*SameSite=[^;]*/gi, '');
    if (/;\s*Path=/i.test(cleaned)) {
      cleaned = cleaned.replace(/;\s*Path=[^;]*/gi, '; Path=/api/proxy');
    } else {
      cleaned = cleaned + '; Path=/api/proxy';
    }
    if (!/;\s*Secure/i.test(cleaned)) cleaned += '; Secure';
    cleaned += '; SameSite=None';
    respHeaders.append('set-cookie', cleaned);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders
  });
}

export const GET     = handle;
export const POST    = handle;
export const PUT     = handle;
export const DELETE  = handle;
export const PATCH   = handle;
export const HEAD    = handle;
export const OPTIONS = handle;
