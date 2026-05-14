'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STREAMS_POLL  = 60_000;
const THUMB_POLL    = 20_000;
const MAX_LIVE      = 3;

function fmtDuration(s) {
  if (!s && s !== 0) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(s % 60)}s`;
}

function fmtRes(stream) {
  if (stream.width && stream.height) return `${stream.width}×${stream.height}`;
  const r = stream.resolution;
  if (!r) return '';
  if (typeof r === 'object' && r.width) return `${r.width}×${r.height}`;
  return typeof r === 'string' ? r : '';
}

function streamName(s) {
  const n = s.identifier ?? s.name ?? s._id ?? '';
  return typeof n === 'string' ? n : String(n);
}

function safeStr(v) {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function detectCodec(buf) {
  const len = Math.min(4096, buf.byteLength ?? buf.length ?? 0);
  const u8  = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer ?? buf, 0, len);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += (u8[i] >= 32 && u8[i] < 127) ? String.fromCharCode(u8[i]) : ' ';
  if (s.includes('V_VP9')) return 'video/webm; codecs="vp9"';
  if (s.includes('V_VP8')) return 'video/webm; codecs="vp8"';
  return 'video/webm; codecs="vp9"';
}

const LIVE_AUTO_STOP_MS = 8 * 60 * 1000;

function LiveVideo({ streamId, onAutoStop }) {
  const videoRef      = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [fps, setFps]       = useState(0);
  const [remaining, setRemaining] = useState(LIVE_AUTO_STOP_MS);
  const fcRef = useRef(0), tsRef = useRef(Date.now());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let sb = null, msUrl = null, queue = [], closed = false, sbReady = false;
    let framesAppended = 0;
    let playTimer = null;

    function nudgePlay() {
      if (closed || !video.paused) return;
      video.play().catch(() => {});
      clearTimeout(playTimer);
      playTimer = setTimeout(() => {
        playTimer = null;
        if (!closed && video.paused) nudgePlay();
      }, 600);
    }

    function tryFlush() {
      if (closed || !sb || sb.updating || !queue.length) return;
      try {
        sb.appendBuffer(queue.shift());
        framesAppended++;
        if (framesAppended >= 2) nudgePlay();
      } catch (e) {
        if (e.name === 'QuotaExceededError' && sb.buffered.length)
          sb.remove(sb.buffered.start(0), sb.buffered.start(0) + 5);
      }
    }

    function maybeInit() {
      if (sbReady || ms.readyState !== 'open' || !queue.length) return;
      sbReady = true;
      const codec = detectCodec(queue[0]);
      if (!MediaSource.isTypeSupported(codec)) { setStatus('error'); return; }
      try {
        sb = ms.addSourceBuffer(codec);
        sb.mode = 'sequence';
        sb.addEventListener('updateend', tryFlush);
        tryFlush();
      } catch { setStatus('error'); }
    }

    const ms = new MediaSource();
    msUrl = URL.createObjectURL(ms);
    video.preload = 'auto';
    video.src = msUrl;
    ms.addEventListener('sourceopen', maybeInit);

    video.addEventListener('canplay',        () => { if (!closed) nudgePlay(); });
    video.addEventListener('canplaythrough', () => { if (!closed) nudgePlay(); });
    video.addEventListener('playing', () => {
      if (closed) return;
      clearTimeout(playTimer);
      playTimer = null;
      setStatus('live');
    });
    video.addEventListener('timeupdate', () => { if (!closed) setStatus('live'); });
    video.addEventListener('stalled', () => { if (!closed && framesAppended > 5) nudgePlay(); });
    video.addEventListener('waiting', () => { if (!closed && framesAppended > 5) nudgePlay(); });

    let firstFrame = false;
    const watchdog = setTimeout(() => {
      if (!firstFrame && !closed) setStatus('error');
    }, 12000);

    const es = new EventSource(`/api/monitor/live/${streamId}`);
    es.addEventListener('frame', evt => {
      if (!evt.data || closed) return;
      firstFrame = true;
      fcRef.current++;
      const now = Date.now();
      if (now - tsRef.current >= 1000) {
        setFps(fcRef.current); fcRef.current = 0; tsRef.current = now;
      }
      try {
        const bin = atob(evt.data);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        queue.push(buf.buffer);
        maybeInit(); tryFlush();
      } catch {}
    });
    es.addEventListener('error', (evt) => { if (evt.data) setStatus('error'); });
    es.addEventListener('close', () => setStatus('closed'));
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) setStatus('closed');
    };

    const autoStop = setTimeout(() => {
      if (!closed && onAutoStop) onAutoStop(streamId);
    }, LIVE_AUTO_STOP_MS);

    const countdown = setInterval(() => {
      setRemaining(r => Math.max(0, r - 10_000));
    }, 10_000);

    return () => {
      closed = true;
      clearTimeout(playTimer);
      clearTimeout(watchdog);
      clearTimeout(autoStop);
      clearInterval(countdown);
      es.close();
      try { if (ms.readyState === 'open') ms.endOfStream(); } catch {}
      URL.revokeObjectURL(msUrl);
      video.removeAttribute('src'); video.load();
    };
  }, [streamId, onAutoStop]);

  return (
    <div className="mnv-wrap">
      <video
        ref={videoRef}
        className="mnv-video"
        muted playsInline
      />
      {status !== 'live' && (
        <div className="mnv-status">
          {status === 'connecting' && <><span className="spinner" style={{ width: 13, height: 13 }} /><span>Conectando…</span></>}
          {status === 'error'      && <span style={{ color: 'var(--red)' }}>Error de conexión</span>}
          {status === 'closed'     && <span>Stream cerrado</span>}
        </div>
      )}
      {status === 'live' && (
        <span className="mnv-fps">
          {fps} fps · {Math.ceil(remaining / 60000)}m
        </span>
      )}
    </div>
  );
}

function CameraCard({ stream, isLive, onToggleLive, onExpand, onAutoStop }) {
  const [hovered, setHovered] = useState(false);
  const [thumbTs, setThumbTs] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (isLive) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setThumbTs(Date.now()), THUMB_POLL);
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  const name = streamName(stream);
  const dur  = fmtDuration(stream.duration ?? stream.timeOnline);
  const res  = fmtRes(stream);

  return (
    <div
      className={`mnc-card${isLive ? ' mnc-live' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mnc-media">
        {isLive
          ? <LiveVideo streamId={stream._id} onAutoStop={onAutoStop} />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={`/api/monitor/stream/${stream._id}/thumbnail?v=${Math.floor(thumbTs / THUMB_POLL)}`} alt={name} className="mnc-img" />}

        <div className="mnc-top">
          <span className={`mnc-badge${isLive ? ' mnc-badge-live' : ''}`}>
            {isLive
              ? <><span className="mnc-dot" />LIVE</>
              : <><ICam size={9} />FOTO</>}
          </span>
          <span className="mnc-name">{name}</span>
        </div>

        <div className="mnc-bottom">
          <span>{dur}</span>
          {res && <span>{res}</span>}
        </div>

        <div className={`mnc-overlay${hovered ? ' mnc-overlay-show' : ''}`}>
          <button
            className={`mnc-ov-btn${isLive ? ' mnc-ov-stop' : ' mnc-ov-play'}`}
            onClick={e => { e.stopPropagation(); onToggleLive(stream._id); }}
          >
            {isLive ? <IStop /> : <IPlay />}
            {isLive ? 'Detener' : 'Ver live'}
          </button>
          <button
            className="mnc-ov-btn mnc-ov-expand"
            onClick={e => { e.stopPropagation(); onExpand(stream); }}
          >
            <IExpand />
            Ampliar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ stream, isLive, onToggle }) {
  const name = streamName(stream);
  const dur  = fmtDuration(stream.duration ?? stream.timeOnline);
  const res  = fmtRes(stream);

  return (
    <div className={`mnp-row${isLive ? ' mnp-row-on' : ''}`}>
      <div className="mnp-info">
        <span className="mnp-name">{name}</span>
        <span className="mnp-meta">{dur}{res ? ` · ${res}` : ''}</span>
      </div>
      <label className="mnt-label">
        <input type="checkbox" checked={isLive} onChange={() => onToggle(stream._id)} style={{ display: 'none' }} />
        <span className={`mnt-track${isLive ? ' mnt-on' : ''}`}>
          <span className="mnt-thumb" />
        </span>
      </label>
    </div>
  );
}

function ExpandedModal({ stream, isLive, onClose }) {
  const [logs, setLogs]         = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [thumbTs]               = useState(Date.now());
  const name = streamName(stream);

  useEffect(() => {
    setLogsLoading(true);
    fetch(`/api/monitor/player-logs/${encodeURIComponent(name)}`)
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then(data => {
        const items = Array.isArray(data) ? data : (data.logs ?? data.items ?? data.data ?? []);
        setLogs(items.slice(0, 5));
      })
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [name]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="mnm-bg" onClick={onClose}>
      <div className="mnm-box" onClick={e => e.stopPropagation()}>

        <div className="mnm-head">
          <div className="mnm-title">
            {isLive && <span className="mnc-dot" style={{ marginRight: 6 }} />}
            {name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive && <span className="mnc-badge mnc-badge-live" style={{ fontSize: 10 }}><span className="mnc-dot" />LIVE</span>}
            <button className="mnm-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="mnm-body">
          <div className="mnm-video">
            {isLive
              ? <LiveVideo streamId={stream._id} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={`/api/monitor/stream/${stream._id}/thumbnail?v=${Math.floor(thumbTs / THUMB_POLL)}`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />}
          </div>

          <div className="mnm-logs">
            <div className="mnm-logs-title">
              <ILog /> Últimos 5 logs
            </div>
            {logsLoading ? (
              <div className="mnm-logs-state"><span className="spinner" style={{ width: 13, height: 13 }} />Cargando…</div>
            ) : logs.length === 0 ? (
              <div className="mnm-logs-state" style={{ color: 'var(--text3)' }}>Sin logs disponibles</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mnm-log-row">
                  <span className="mnm-log-time">{safeStr(log.time ?? log.timestamp ?? log.created_at ?? '')}</span>
                  <span className="mnm-log-msg">{safeStr(log.message ?? log.action ?? log.text ?? log.description ?? log)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ICam    = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 3, flexShrink: 0 }}>
    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
);
const IPlay   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>;
const IStop   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
const IExpand = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);
const ILog    = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const ISortDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const ISortUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);


export default function Monitor() {
  const [streams,     setStreams]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [sortDir,     setSortDir]     = useState('desc');
  const [liveSet,     setLiveSet]     = useState(new Set());
  const [expanded,    setExpanded]    = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const mountedRef = useRef(true);

  const fetchStreams = useCallback(async (first = false) => {
    if (first) setLoading(true);
    try {
      const res = await fetch('/api/monitor/streams');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!mountedRef.current) return;
      const raw  = Array.isArray(data) ? data : (data.streams ?? []);
      const list = raw.map(s => ({
        ...s,
        _id: s._id ?? s.id ?? s.streamId ?? s.identifier ?? String(Math.random()),
      }));
      setStreams(list);
      setLiveSet(prev => {
        const ids = new Set(list.map(s => s._id));
        const next = new Set([...prev].filter(id => ids.has(id)));
        return next.size === prev.size ? prev : next;
      });
      setError(null);
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (first && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStreams(true);
    const id = setInterval(() => fetchStreams(false), STREAMS_POLL);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [fetchStreams]);

  function toggleLive(id) {
    setLiveSet(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        if (n.size >= MAX_LIVE) {
          const [oldest] = n;
          n.delete(oldest);
        }
        n.add(id);
      }
      return n;
    });
  }

  const filtered = streams
    .filter(s => !search || streamName(s).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const da = a.duration ?? a.timeOnline ?? 0;
      const db = b.duration ?? b.timeOnline ?? 0;
      return sortDir === 'desc' ? db - da : da - db;
    });

  const liveCount = liveSet.size;

  return (
    <div className="mnl-root section active">

      <aside className={`mnl-sb${showSidebar ? '' : ' mnl-sb-hidden'}`}>
        <div className="mnl-sb-top">
          <div className="mnl-sb-title-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="mnl-sb-title">Jugadores</span>
            <span className="mnl-sb-count">{streams.length}</span>
            <button
              className="mnl-sort-btn"
              title={sortDir === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            >
              {sortDir === 'desc' ? <ISortDown /> : <ISortUp />}
            </button>
          </div>

          <div className="mnl-sb-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: .4 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="mnl-search-input"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="mnl-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="mnl-sb-btns">
            <button
              className="mnl-sel-btn"
              title={`Máx ${MAX_LIVE} simultáneos`}
              onClick={() => setLiveSet(new Set(filtered.slice(0, MAX_LIVE).map(s => s._id)))}
            >
              Top {MAX_LIVE}
            </button>
            <button className="mnl-sel-btn" onClick={() => setLiveSet(new Set())}>Ninguno</button>
          </div>
        </div>

        <div className="mnl-sb-list">
          {loading && (
            <div className="mnl-sb-center">
              <span className="spinner" style={{ width: 15, height: 15 }} />
            </div>
          )}
          {!loading && error && (
            <div className="mnl-sb-center" style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="mnl-sb-center" style={{ color: 'var(--text3)', fontSize: 12 }}>Sin resultados</div>
          )}
          {!loading && !error && filtered.map(s => (
            <PlayerRow
              key={s._id}
              stream={s}
              isLive={liveSet.has(s._id)}
              onToggle={toggleLive}
            />
          ))}
        </div>
      </aside>

      {showSidebar && (
        <div className="mnl-mob-backdrop" onClick={() => setShowSidebar(false)} />
      )}

      <div className="mnl-content">
        <div className="mnl-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="mnl-sb-toggle"
              onClick={() => setShowSidebar(v => !v)}
              title="Jugadores"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="mnl-sb-toggle-count">{streams.length}</span>
            </button>
            <div>
              <div className="mnl-head-title">Monitor del Servidor</div>
              <div className="mnl-head-sub">
                Vigilancia en vivo · {liveCount} visible · {streams.length} total
              </div>
            </div>
          </div>
          <div className="mnl-head-right">
            {liveCount > 0 && (
              <span className="mnl-live-pill"><span className="mnc-dot" />LIVE</span>
            )}
            <button className="btns mnl-refresh-btn" onClick={() => fetchStreams(false)}>
              <IRefresh /> Refrescar
            </button>
          </div>
        </div>

        <div className="mnl-grid">
          {loading && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="mnc-card mnc-skeleton" />
          ))}
          {!loading && error && (
            <div className="mnl-full-center">
              <div className="alert al-r" style={{ maxWidth: 380 }}>
                <div className="al-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div><strong>Error:</strong> {error}</div>
              </div>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="mnl-full-center" style={{ color: 'var(--text3)', fontSize: 13 }}>
              Sin streams activos
            </div>
          )}
          {!loading && !error && filtered.map(s => (
            <CameraCard
              key={s._id}
              stream={s}
              isLive={liveSet.has(s._id)}
              onToggleLive={toggleLive}
              onExpand={setExpanded}
              onAutoStop={toggleLive}
            />
          ))}
        </div>
      </div>

      {expanded && (
        <ExpandedModal
          stream={expanded}
          isLive={liveSet.has(expanded._id)}
          onClose={() => setExpanded(null)}
        />
      )}
    </div>
  );
}
