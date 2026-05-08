import { NextResponse } from 'next/server';
import { connect }      from 'node:tls';
import { randomBytes }  from 'node:crypto';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ebmlReadID(buf, pos) {
  if (pos >= buf.length) return null;
  const b = buf[pos];
  const w = (b & 0x80) ? 1 : (b & 0x40) ? 2 : (b & 0x20) ? 3 : (b & 0x10) ? 4 : 0;
  if (!w || pos + w > buf.length) return null;
  let id = 0;
  for (let i = 0; i < w; i++) id = id * 256 + buf[pos + i];
  return { id, w };
}

function ebmlReadVint(buf, pos) {
  if (pos >= buf.length) return null;
  const b = buf[pos];
  let w, mask;
  if      (b & 0x80) { w = 1; mask = 0x7F; }
  else if (b & 0x40) { w = 2; mask = 0x3F; }
  else if (b & 0x20) { w = 3; mask = 0x1F; }
  else if (b & 0x10) { w = 4; mask = 0x0F; }
  else if (b & 0x08) { w = 5; mask = 0x07; }
  else if (b & 0x04) { w = 6; mask = 0x03; }
  else if (b & 0x02) { w = 7; mask = 0x01; }
  else               { w = 8; mask = 0x00; }
  if (pos + w > buf.length) return null;
  let v = b & mask;
  for (let i = 1; i < w; i++) v = v * 256 + buf[pos + i];
  const SENTINEL = [127, 16383, 2097151, 268435455];
  return { v: (w <= 4 && v === SENTINEL[w - 1]) ? -1 : v, w };
}

function ebmlWriteVint(buf, pos, value, width) {
  const markers = [0, 0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02];
  let v = value;
  for (let i = width - 1; i >= 1; i--) { buf[pos + i] = v & 0xFF; v = Math.floor(v / 256); }
  buf[pos] = markers[width] | v;
}

const EBML_MASTERS = new Set([
  0x1A45DFA3,
  0x18538067,
  0x1549A966,
  0x1654AE6B,
  0xAE,
  0x1F43B675,
  0xA0,
]);

function ebmlWalk(buf, pos, end, cb, ancestors = []) {
  while (pos < end) {
    const ir = ebmlReadID(buf, pos);
    if (!ir) break;
    const sizePos = pos + ir.w;
    const sr = ebmlReadVint(buf, sizePos);
    if (!sr) break;
    const dataStart = sizePos + sr.w;
    const dataEnd   = (sr.v < 0) ? end : Math.min(dataStart + sr.v, end);
    cb(ir.id, dataStart, dataEnd, sizePos, sr.w, sr.v, ancestors);
    if (EBML_MASTERS.has(ir.id)) {
      ebmlWalk(buf, dataStart, dataEnd, cb,
        [...ancestors, { sizePos, sizeWidth: sr.w, size: sr.v }]);
    }
    pos = dataEnd;
  }
}

function buildTrackMap(buf) {
  const map = new Map();
  let next = 1;
  ebmlWalk(buf, 0, buf.length, (id, dataStart) => {
    if (id !== 0xD7) return; // TrackNumber
    const vr = ebmlReadVint(buf, dataStart);
    if (vr && !map.has(vr.v)) map.set(vr.v, next++);
  });
  return map;
}

function patchWebMFrame(buf, trackMap) {
  const patches = [];

  ebmlWalk(buf, 0, buf.length, (id, dataStart, _end, sizePos, sizeWidth, size, ancestors) => {
    if (id !== 0xD7 && id !== 0xA3 && id !== 0xA1) return;
    const vr = ebmlReadVint(buf, dataStart);
    if (!vr || vr.w <= 1) return;
    const mapped = trackMap.get(vr.v);
    if (mapped == null || mapped > 127) return;
    patches.push({ offset: dataStart, oldW: vr.w, newVal: mapped,
                   sizePos, sizeWidth, size, ancestors });
  });

  if (!patches.length) return buf;

  patches.sort((a, b) => b.offset - a.offset);

  let result = buf;
  for (const p of patches) {
    const delta = p.oldW - 1;
    result = Buffer.concat([
      result.slice(0, p.offset),
      Buffer.from([0x80 | p.newVal]),
      result.slice(p.offset + p.oldW),
    ]);
    const sr = ebmlReadVint(result, p.sizePos);
    if (sr && sr.v >= 0) ebmlWriteVint(result, p.sizePos, sr.v - delta, p.sizeWidth);
    for (const anc of p.ancestors) {
      const asr = ebmlReadVint(result, anc.sizePos);
      if (asr && asr.v >= 0) ebmlWriteVint(result, anc.sizePos, asr.v - delta, anc.sizeWidth);
    }
  }
  return result;
}

function processWebMFrame(frame, state) {
  const isInit = frame.length >= 4 &&
    frame[0] === 0x1A && frame[1] === 0x45 &&
    frame[2] === 0xDF && frame[3] === 0xA3;

  if (isInit || state.trackMap === null) {
    state.trackMap = buildTrackMap(frame);
  }

  if (!state.trackMap.size) return frame;
  const needsRemap = [...state.trackMap.keys()].some(k => k > 127);
  if (!needsRemap) return frame;

  return patchWebMFrame(frame, state.trackMap);
}

function wssConnect({ host, port = 443, path, extraHeaders, onBinary, onClose, onError }) {
  const wsKey = randomBytes(16).toString('base64');
  const socket = connect({ host, port, servername: host });

  let handshakeDone = false;
  let buf     = Buffer.alloc(0);
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
      '', '',
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
        case 0x0:
          fragBuf = Buffer.concat([fragBuf, payload]);
          if (fin) { onBinary(fragBuf); fragBuf = Buffer.alloc(0); }
          break;
        case 0x1: break;
        case 0x2: // binary
          if (fin) {
            onBinary(fragBuf.length ? Buffer.concat([fragBuf, payload]) : payload);
            fragBuf = Buffer.alloc(0);
          } else {
            fragBuf = Buffer.concat([fragBuf, payload]);
          }
          break;
        case 0x8: socket.destroy(); onClose(); return;
        case 0x9: socket.write(Buffer.from([0x8a, 0x00])); break; // ping → pong
        default: break;
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

  const encoder  = new TextEncoder();
  const wmState  = { trackMap: null };

  const stream = new ReadableStream({
    start(controller) {
      let socket = null;
      let closed = false;

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
        onBinary(rawFrame) {
          if (closed) return;
          const frame = processWebMFrame(rawFrame, wmState);
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
    cancel() { /* closed via req.signal abort */ },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
