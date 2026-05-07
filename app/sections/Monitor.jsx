'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STREAMS_POLL = 12_000;  // 12 s
const THUMB_POLL   =  3_000;  //  3 s

function fmtDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtResolution(stream) {
  if (stream.width && stream.height) return `${stream.width}×${stream.height}`;
  const r = stream.resolution;
  if (!r) return '—';
  if (typeof r === 'object') {
    if (r.width && r.height) return `${r.width}×${r.height}`;
    return '—';
  }
  return String(r);
}

function safeStr(val) {
  if (val == null) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}


function LiveViewer({ stream, onClose }) {
  const imgRef        = useRef(null);
  const esRef         = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | live | error | closed
  const [errMsg, setErrMsg] = useState('');
  const [fps, setFps]       = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsTs     = useRef(Date.now());

  useEffect(() => {
    const es = new EventSource(`/api/monitor/live/${stream._id}`);
    esRef.current = es;

    es.addEventListener('connected', () => setStatus('live'));

    es.addEventListener('frame', (evt) => {
      frameCountRef.current += 1;
      const now = Date.now();
      if (now - lastFpsTs.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTs.current = now;
      }
      if (imgRef.current && evt.data) {
        imgRef.current.src = `data:image/jpeg;base64,${evt.data}`;
      }
      if (status !== 'live') setStatus('live');
    });

    es.addEventListener('error', (evt) => {
      if (evt.data) {
        try {
          const d = JSON.parse(evt.data);
          setErrMsg(d.message ?? 'Error del servidor');
        } catch {
          setErrMsg(String(evt.data));
        }
      } else {
        setErrMsg('No se pudo conectar al stream');
      }
      setStatus('error');
    });

    es.addEventListener('close', () => setStatus('closed'));

    es.onerror = (evt) => {
      if (es.readyState === EventSource.CLOSED) {
        setStatus('closed');
      }
    };

    return () => { es.close(); };
  }, [stream._id]);

  return (
    <div className="mn-live-card">
      <div className="mn-live-header">
        <span className="mn-live-dot" />
        <span className="mn-live-name">
          {safeStr(stream.identifier ?? stream.name ?? stream._id)}
        </span>
        {status === 'live' && (
          <span className="mn-live-fps">{fps} fps</span>
        )}
        <button className="mn-live-close" onClick={onClose} title="Cerrar">✕</button>
      </div>

      <div className="mn-live-body">
        {(status === 'connecting') && (
          <div className="mn-live-overlay">
            <span className="spinner" style={{ width: 20, height: 20 }} />
            <span>Conectando…</span>
          </div>
        )}
        {(status === 'error' || status === 'closed') && (
          <div className="mn-live-overlay mn-live-overlay-err">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{status === 'closed' ? 'Stream cerrado' : (errMsg || 'Error')}</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} alt="live" className="mn-live-img"
          style={{ display: status === 'live' ? 'block' : 'none' }} />
      </div>

      <div className="mn-live-footer">
        <span>{fmtResolution(stream)}</span>
        <span>{Number(stream.watchers ?? 0)} viendo</span>
        <span>{fmtDuration(stream.duration ?? stream.timeOnline)}</span>
      </div>
    </div>
  );
}

function StreamCard({ stream, isWatching, onWatch, onStop }) {
  const [thumbTs, setThumbTs] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (isWatching) return;
    timerRef.current = setInterval(() => setThumbTs(Date.now()), THUMB_POLL);
    return () => clearInterval(timerRef.current);
  }, [isWatching]);

  const thumbUrl = `/api/monitor/stream/${stream._id}/thumbnail?t=${thumbTs}`;

  return (
    <div className={`mn-card${isWatching ? ' mn-card-live' : ''}`}>
      <div className="mn-card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={stream.identifier ?? stream._id}
          className="mn-thumb-img"
          loading="lazy"
        />
        {isWatching && (
          <div className="mn-card-live-badge">
            <span className="mn-live-dot-sm" />
            EN VIVO
          </div>
        )}
      </div>

      <div className="mn-card-info">
        <div className="mn-card-name" title={safeStr(stream.identifier ?? stream._id)}>
          {safeStr(stream.identifier ?? stream.name ?? stream._id)}
        </div>
        <div className="mn-card-meta">
          <span>{fmtResolution(stream)}</span>
          <span className="mn-card-sep">·</span>
          <span>{fmtDuration(stream.duration ?? stream.timeOnline)}</span>
          {Number(stream.watchers ?? 0) > 0 && (
            <>
              <span className="mn-card-sep">·</span>
              <span>{Number(stream.watchers)} 👁</span>
            </>
          )}
        </div>
      </div>

      <div className="mn-card-actions">
        {isWatching ? (
          <button className="mn-btn mn-btn-stop" onClick={() => onStop(stream._id)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            Detener
          </button>
        ) : (
          <button className="mn-btn mn-btn-watch" onClick={() => onWatch(stream)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Ver en vivo
          </button>
        )}
      </div>
    </div>
  );
}

export default function Monitor() {
  const [streams, setStreams]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [watching, setWatching]     = useState({}); // id → stream object
  const [view, setView]             = useState('grid'); // 'grid' | 'live'

  const mountedRef = useRef(true);

  const fetchStreams = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
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

      setStreams(prev => {
        const activeIds = new Set(list.map(s => s._id));
        const filtered = prev.filter(s => activeIds.has(s._id));
        const existingIds = new Set(filtered.map(s => s._id));
        const added = list.filter(s => !existingIds.has(s._id));
        return [...filtered, ...added].map(s => {
          const updated = list.find(u => u._id === s._id);
          return updated ? { ...s, ...updated } : s;
        });
      });

      setWatching(prev => {
        const activeIds = new Set(list.map(s => s._id));
        const next = { ...prev };
        Object.keys(next).forEach(id => { if (!activeIds.has(id)) delete next[id]; });
        return next;
      });

      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (isFirstLoad && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStreams(true);
    const id = setInterval(() => fetchStreams(false), STREAMS_POLL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchStreams]);

  function startWatch(stream) {
    setWatching(prev => ({ ...prev, [stream._id]: stream }));
    setView('live');
  }

  function stopWatch(id) {
    setWatching(prev => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  const watchingList  = Object.values(watching);
  const watchingCount = watchingList.length;

  return (
    <div className="section active mn-section">

      <div className="mn-toolbar">
        <div className="mn-toolbar-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: 'var(--red)', flexShrink: 0 }}>
            <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8,21 12,17 16,21"/>
          </svg>
          <span className="mn-toolbar-title">Monitor de Cámaras</span>
          {!loading && !error && (
            <span className="mn-stream-count">{streams.length} streams</span>
          )}
        </div>

        <div className="mn-toolbar-right">
          {lastRefresh && (
            <span className="mn-last-refresh">
              ↻ {lastRefresh.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {watchingCount > 0 && (
            <>
              <button
                className={`mn-view-btn${view === 'grid' ? ' active' : ''}`}
                onClick={() => setView('grid')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Streams
              </button>
              <button
                className={`mn-view-btn${view === 'live' ? ' active' : ''}`}
                onClick={() => setView('live')}
              >
                <span className="mn-live-dot-sm" style={{ marginRight: 4 }} />
                En Vivo ({watchingCount})
              </button>
            </>
          )}
          <button className="btns mn-refresh-btn" onClick={() => fetchStreams(false)} title="Actualizar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,4 23,10 17,10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="mn-body">

        {loading && (
          <div className="mn-center">
            <span className="spinner" style={{ width: 18, height: 18 }} />
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando streams…</span>
          </div>
        )}

        {!loading && error && (
          <div className="mn-center">
            <div className="alert al-r" style={{ maxWidth: 420 }}>
              <div className="al-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div><strong>Error:</strong> {error}</div>
            </div>
          </div>
        )}

        {!loading && !error && streams.length === 0 && (
          <div className="mn-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" style={{ color: 'var(--text3)' }}>
              <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8,21 12,17 16,21"/>
              <line x1="8" y1="10" x2="16" y2="10"/>
            </svg>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: '8px 0 4px' }}>Sin streams activos</p>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>Se actualizará automáticamente cada 12 segundos</span>
          </div>
        )}

        {!loading && !error && streams.length > 0 && view === 'grid' && (
          <div className="mn-grid">
            {streams.map(s => (
              <StreamCard
                key={s._id}
                stream={s}
                isWatching={!!watching[s._id]}
                onWatch={startWatch}
                onStop={stopWatch}
              />
            ))}
          </div>
        )}

        {view === 'live' && watchingCount > 0 && (
          <div className="mn-live-grid">
            {watchingList.map(s => (
              <LiveViewer key={s._id} stream={s} onClose={() => stopWatch(s._id)} />
            ))}
          </div>
        )}

        {view === 'live' && watchingCount === 0 && (
          <div className="mn-center">
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              No hay cámaras en vivo. Haz clic en "Ver en vivo" en algún stream.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
