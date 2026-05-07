import { NextResponse } from 'next/server';
import { connect }      from 'node:tls';
import { randomBytes }  from 'node:crypto';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function wssConnect({ host, port = 443, path, extraHeaders, onBinary, onClose, onError }) {
  const wsKey = randomBytes(16).toString('base64');

  const socket = connect({ host, port, servername: host });

  let handshakeDone = false;
  let buf = Buffer.alloc(0);
  let fragBuf = Buffer.alloc(0);

  socket.once('secureConnect', () => {
    const lines = [
      `GET ${path} HTTP/1.1`,
      `Host: ${host}`,
      `Upgrade: websocket`,
      `Connection: Upgrade`,
      `Sec-WebSocket-Key: ${wsKey}`,
      `Sec-WebSocket-Version: 13`,
      ...Object.entries(extraHeaders).map(([k, v]) => `${k}: ${v}`),
      '',
      '',
    ];
    socket.write(lines.join('\r\n'));
  });

  function processFrames() {
    while (buf.length >= 2) {
      const byte0    = buf[0];
      const byte1    = buf[1];
      const fin      = (byte0 & 0x80) !== 0;
      const opcode   = byte0 & 0x0f;
      const masked   = (byte1 & 0x80) !== 0;
      let payloadLen = byte1 & 0x7f;
      let offset     = 2;

      if (payloadLen === 126) {
        if (buf.length < 4) return;
        payloadLen = buf.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buf.length < 10) return;
        payloadLen = buf.readUInt32BE(6);
        offset = 10;
      }

      const maskLen = masked ? 4 : 0;
      if (buf.length < offset + maskLen + payloadLen) return;

      let payload = Buffer.from(buf.slice(offset + maskLen, offset + maskLen + payloadLen));

      if (masked) {
        const maskKey = buf.slice(offset, offset + 4);
        for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
      }

      buf = buf.slice(offset + maskLen + payloadLen);

      switch (opcode) {
        case 0x0: // continuation
          fragBuf = Buffer.concat([fragBuf, payload]);
          if (fin) { onBinary(fragBuf); fragBuf = Buffer.alloc(0); }
          break;
        case 0x1: // text — ignore
          break;
        case 0x2: // binary
          if (fin) {
            onBinary(fragBuf.length ? Buffer.concat([fragBuf, payload]) : payload);
            fragBuf = Buffer.alloc(0);
          } else {
            fragBuf = Buffer.concat([fragBuf, payload]);
          }
          break;
        case 0x8: // close
          socket.destroy();
          onClose();
          return;
        case 0x9: // ping → pong
          socket.write(Buffer.from([0x8a, 0x00]));
          break;
        default:
          break;
      }
    }
  }

  socket.on('data', (chunk) => {
    if (!handshakeDone) {
      buf = Buffer.concat([buf, chunk]);
      const end = buf.indexOf('\r\n\r\n');
      if (end === -1) return;
      const header = buf.slice(0, end).toString();
      if (!header.includes(' 101 ')) {
        onError(new Error(`WS handshake failed: ${header.split('\r\n')[0]}`));
        socket.destroy();
        return;
      }
      handshakeDone = true;
      buf = buf.slice(end + 4);
      if (buf.length) processFrames();
      return;
    }
    buf = Buffer.concat([buf, chunk]);
    processFrames();
  });

  socket.on('close', () => { if (handshakeDone) onClose(); });
  socket.on('error', onError);

  return socket; 
}


export async function GET(req, ctx) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const token = process.env.FM_MONITOR_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: 'FM_MONITOR_TOKEN no configurado.' }, { status: 500 });

  const params = await ctx.params;
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Stream ID requerido.' }, { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let socket = null;
      let closed  = false;

      function close() {
        if (closed) return;
        closed = true;
        try { socket?.destroy(); } catch {}
        try { controller.close(); } catch {}
      }

      function send(event, data) {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`)); }
        catch { close(); }
      }

      req.signal.addEventListener('abort', close);

      socket = wssConnect({
        host: 'app.fivemonitor.com',
        port: 443,
        path: `/api/ws/watch/${id}`,
        extraHeaders: {
          cookie: `auth_token=${token}`,
          origin: 'https://app.fivemonitor.com',
          'user-agent': 'Mozilla/5.0',
        },
        onBinary(frame) {
          if (closed) return;
          send('frame', frame.toString('base64'));
        },
        onClose() {
          send('close', JSON.stringify({ streamId: id }));
          close();
        },
        onError(err) {
          send('error', JSON.stringify({ message: err.message }));
          close();
        },
      });

      socket.once('secureConnect', () => {
        send('connected', JSON.stringify({ streamId: id }));
      });
    },
    cancel() { /* abort via req.signal */ },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
