import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONITOR_API_BASE = 'https://app.fivemonitor.com/api';

async function handler(req, ctx) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const token = process.env.FM_MONITOR_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: 'FM_MONITOR_TOKEN no configurado en el servidor.' }, { status: 500 });
  }

  const params = (await ctx?.params) || {};
  const pathArr = Array.isArray(params.path) ? params.path : [];
  const targetPath = pathArr.join('/');
  const search = new URL(req.url).search ?? '';
  const targetUrl = `${MONITOR_API_BASE}/${targetPath}${search}`;

  const headers = {
    cookie: `auth_token=${token}`,
    accept: req.headers.get('accept') ?? '*/*',
    'accept-language': 'es-US,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    referer: 'https://app.fivemonitor.com/',
    origin: 'https://app.fivemonitor.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await req.arrayBuffer();
    const ct = req.headers.get('content-type');
    if (ct) headers['content-type'] = ct;
  }

  const isThumbnail = targetPath.includes('thumbnail');
  const cacheHeader = isThumbnail
    ? 'public, max-age=15, s-maxage=15, stale-while-revalidate=10'
    : 'no-store';

  try {
    const res = await fetch(targetUrl, { method: req.method, headers, body });
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'content-type': contentType,
        'cache-control': cacheHeader,
      },
    });
  } catch (err) {
    console.error('[monitor-proxy]', err);
    return NextResponse.json({ error: 'Error al conectar con FiveMonitor Monitor' }, { status: 502 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;
