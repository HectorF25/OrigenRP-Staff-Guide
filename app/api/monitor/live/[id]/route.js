import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req, ctx) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const token = process.env.FM_MONITOR_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: 'FM_MONITOR_TOKEN no configurado.' }, { status: 500 });
  }

  const params = await ctx.params;
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'Stream ID requerido.' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let ws = null;
      let closed = false;

      function close() {
        if (closed) return;
        closed = true;
        try { ws?.close(); } catch {}
        try { controller.close(); } catch {}
      }

      function send(event, data) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {}
      }

      req.signal.addEventListener('abort', close);

      import('undici').then(({ WebSocket: UndiciWS }) => {
        if (closed) return;

        try {
          ws = new UndiciWS(`wss://app.fivemonitor.com/api/ws/watch/${id}`, {
            headers: {
              cookie: `auth_token=${token}`,
              origin: 'https://app.fivemonitor.com',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
            },
          });

          ws.binaryType = 'arraybuffer';

          ws.onopen = () => {
            send('connected', JSON.stringify({ streamId: id }));
          };

          ws.onmessage = (evt) => {
            if (closed) return;
            try {
              let b64;
              if (evt.data instanceof ArrayBuffer) {
                b64 = Buffer.from(evt.data).toString('base64');
              } else if (Buffer.isBuffer(evt.data)) {
                b64 = evt.data.toString('base64');
              } else if (typeof evt.data === 'string') {
                // Text frame — skip or forward as info
                return;
              } else {
                b64 = Buffer.from(evt.data).toString('base64');
              }
              send('frame', b64);
            } catch (e) {
              console.error('[monitor-live] frame error', e);
            }
          };

          ws.onerror = (evt) => {
            if (!closed) {
              send('error', JSON.stringify({ message: 'WebSocket error' }));
            }
            close();
          };

          ws.onclose = () => {
            if (!closed) send('close', JSON.stringify({ streamId: id }));
            close();
          };
        } catch (err) {
          send('error', JSON.stringify({ message: err.message }));
          close();
        }
      }).catch(err => {
        send('error', JSON.stringify({ message: `undici unavailable: ${err.message}` }));
        close();
      });
    },

    cancel() {
      // Cleanup handled by req.signal abort
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
