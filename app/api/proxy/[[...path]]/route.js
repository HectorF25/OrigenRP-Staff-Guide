import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = 'https://logs.fivemonitor.com/origen';
const TARGET_HOST = new URL(TARGET).host;
const PROXY_PREFIX = '/mis-logs';

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
  'content-length',
  'etag',
  'last-modified',
  'cache-control',
  'pragma',
  'expires'
]);

const STRIP_REQUEST_HEADERS = new Set([
  'host',
  'origin',
  'referer',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length',
  'if-none-match',
  'if-modified-since'
]);


function rewriteHtml(html) {
  html = html.replace(
    /(\s(?:src|href|action|formaction|poster|data)\s*=\s*["'])\/(?!mis-logs[\/"']|api[\/"']|\/)/gi,
    `$1${PROXY_PREFIX}/`
  );
  html = html.replace(/(\ssrcset\s*=\s*["'])([^"']+)(["'])/gi, (m, pre, val, post) => {
    const out = val.split(',').map(part => {
      const trimmed = part.trim();
      const segs = trimmed.split(/\s+/, 2);
      let url = segs[0];
      const sizing = segs[1] || '';
      if (url.startsWith('/') && !url.startsWith('//') &&
          !url.startsWith(`${PROXY_PREFIX}/`) && !url.startsWith('/api/')) {
        url = PROXY_PREFIX + url;
      }
      return sizing ? `${url} ${sizing}` : url;
    }).join(', ');
    return pre + out + post;
  });
  html = html.replace(/https?:\/\/logs\.fivemonitor\.com\/origen/gi, PROXY_PREFIX);
  return html;
}

function rewriteCss(css) {
  css = css.replace(
    /url\(\s*(["']?)\/(?!mis-logs[\/"']|api[\/"']|\/)/gi,
    `url($1${PROXY_PREFIX}/`
  );
  css = css.replace(/https?:\/\/logs\.fivemonitor\.com\/origen/gi, PROXY_PREFIX);
  return css;
}


function rewriteJs(js) {
  js = js.replace(
    /(["'`])\/(api|assets|static|img|images|fonts|css|js|public|v1|v2|locales|i18n)\b/g,
    `$1${PROXY_PREFIX}/$2`
  );
  js = js.replace(/https?:\/\/logs\.fivemonitor\.com\/origen/gi, PROXY_PREFIX);
  return js;
}

async function handle(req, ctx) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return new NextResponse('No autenticado. Inicia sesión con Discord.', { status: 401 });
  }

  const params = (await ctx?.params) || {};
  const pathArr = Array.isArray(params.path) ? params.path : [];
  const url = new URL(req.url);
  const targetUrl = `${TARGET}/${pathArr.join('/')}${url.search}`;

  const headers = new Headers();
  for (const [k, v] of req.headers) {
    const lk = k.toLowerCase();
    if (STRIP_REQUEST_HEADERS.has(lk)) continue;
    if (lk.startsWith('x-vercel') || lk.startsWith('x-forwarded') || lk.startsWith('x-real-')) continue;
    headers.set(k, v);
  }
  headers.set('host', TARGET_HOST);

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

  const respHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (STRIP_RESPONSE_HEADERS.has(lk)) return;
    if (lk === 'set-cookie' || lk === 'location') return;
    respHeaders.append(k, v);
  });


  respHeaders.set('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  respHeaders.set('pragma', 'no-cache');
  respHeaders.set('expires', '0');

  const loc = upstream.headers.get('location');
  if (loc) {
    try {
      const u = new URL(loc, TARGET);
      if (u.host === TARGET_HOST) {
        respHeaders.set('location', `${PROXY_PREFIX}${u.pathname}${u.search}`);
      } else {
        respHeaders.set('location', loc);
      }
    } catch {
      respHeaders.set('location', loc);
    }
  }

  const setCookies = typeof upstream.headers.getSetCookie === 'function'
    ? upstream.headers.getSetCookie()
    : [];
  for (const sc of setCookies) {
    let cleaned = sc.replace(/;\s*Domain=[^;]*/gi, '');
    cleaned = cleaned.replace(/;\s*SameSite=[^;]*/gi, '');
    if (/;\s*Path=/i.test(cleaned)) {
      cleaned = cleaned.replace(/;\s*Path=[^;]*/gi, `; Path=${PROXY_PREFIX}`);
    } else {
      cleaned = cleaned + `; Path=${PROXY_PREFIX}`;
    }
    if (!/;\s*Secure/i.test(cleaned)) cleaned += '; Secure';
    cleaned += '; SameSite=None';
    respHeaders.append('set-cookie', cleaned);
  }

  const ct = (upstream.headers.get('content-type') || '').toLowerCase();
  const isHtml = ct.includes('text/html');
  const isCss  = ct.includes('text/css');
  const isJs   = ct.includes('javascript') || ct.includes('application/x-javascript');

  if (isHtml || isCss || isJs) {
    let body = await upstream.text();
    if (isHtml)      body = rewriteHtml(body);
    else if (isCss)  body = rewriteCss(body);
    else if (isJs)   body = rewriteJs(body);
    return new NextResponse(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders
    });
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