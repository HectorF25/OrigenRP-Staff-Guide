'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogEntry, { StatCard } from './LogEntry';
import { levelPillClass, FM_PROJECT_ID } from '@/lib/fivemonitor';

const PAGE_SIZE = 50;

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export default function LogViewer({ channel }) {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [levelFilter, setLevelFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const channelRef = useRef(channel._id);

  useEffect(() => {
    channelRef.current = channel._id;
    setLogs([]); setPage(1); setTotalPages(1); setTotalCount(0);
    setError(null); setLevelFilter('all'); setLocalSearch('');
    fetchLogs(channel._id, 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel._id]);

  const fetchLogs = useCallback(async (channelId, p, initial) => {
    if (initial) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`/api/fm/v1/channels/${channelId}/logs?page=${p}&limit=${PAGE_SIZE}`);
      if (channelRef.current !== channelId) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const raw = await res.json();
      const entries = Array.isArray(raw) ? raw : (raw.logs ?? []);
      const tCount  = Array.isArray(raw) ? raw.length : (raw.totalCount ?? entries.length);
      const tPages  = Array.isArray(raw) ? 1 : (raw.totalPages ?? 1);
      setLogs(prev => initial ? entries : [...prev, ...entries]);
      setTotalCount(tCount); setTotalPages(tPages); setPage(p);
    } catch (e) {
      if (channelRef.current === channelId) setError(e.message);
    } finally {
      if (initial) setLoading(false); else setLoadingMore(false);
    }
  }, []);

  const search  = localSearch.toLowerCase().trim();
  const visible = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (!search) return true;
    const embed = log.metadata?.embeds?.[0];
    const hay = [log.message, embed?.title ?? '', embed?.description ?? '',
      ...(embed?.fields ?? []).map(f => `${f.name} ${f.value}`), log.source, log._id].join(' ').toLowerCase();
    return hay.includes(search);
  });

  const errCount  = logs.filter(l => l.level === 'error').length;
  const infoCount = logs.filter(l => l.level === 'info').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <div>
      <div className="pg-header">
        <div className="pg-title">#{channel.name}</div>
        <div className="pg-sub">
          {loading ? 'Cargando logs…' : `${totalCount.toLocaleString('es')} logs totales · ${logs.length} cargados`}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="rob-grid" style={{ marginBottom: 14 }}>
          <StatCard label="Cargados"   value={logs.length}  color="var(--text)" />
          <StatCard label="Error"      value={errCount}     color="var(--red)" />
          <StatCard label="Info"       value={infoCount}    color="var(--blue)" />
          {warnCount > 0 && <StatCard label="Warn" value={warnCount} color="var(--yellow)" />}
          <StatCard label="Total en DB" value={totalCount}  color="var(--text3)" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          {['all', 'error', 'info', 'warn'].map(f => (
            <button key={f} className={`fbtn${levelFilter === f ? ' active' : ''}`} onClick={() => setLevelFilter(f)}>
              {f === 'all' ? 'Todos' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className={`pill ${levelPillClass(f)}`} style={{ fontSize: 8, padding: '1px 5px' }}>{f.toUpperCase()}</span>
                  {f === 'error' ? errCount : f === 'info' ? infoCount : warnCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
          </svg>
          <input className="fm-search-input" placeholder="Filtrar en estos resultados…" value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
        </div>
      </div>

      {search && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>{visible.length} resultado{visible.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
          <span className="spinner" style={{ width: 18, height: 18 }} /> Cargando #{channel.name}…
        </div>
      )}

      {error && !loading && (
        <div className="alert al-r" style={{ marginBottom: 14 }}>
          <div className="al-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
          <div><strong>Error:</strong> {error} <br />
            <button onClick={() => fetchLogs(channel._id, 1, true)} style={{ marginTop: 6, fontSize: 11, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Reintentar</button>
          </div>
        </div>
      )}

      {!loading && !error && logs.length === 0 && <div className="norm-empty">No hay logs en este canal.</div>}
      {!loading && logs.length > 0 && visible.length === 0 && <div className="norm-empty">Sin resultados para los filtros aplicados.</div>}
      {!loading && visible.map(log => <LogEntry key={log._id} log={log} />)}

      {!loading && !error && logs.length > 0 && totalPages > 1 && (
        <div style={{ marginTop: 20, paddingBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>Página:</span>
            <button className="btns" style={{ padding: '4px 10px', fontSize: 12, opacity: page <= 1 ? 0.4 : 1 }} disabled={page <= 1} onClick={() => fetchLogs(channel._id, page - 1, true)}>←</button>
            {buildPageNumbers(page, totalPages).map((p, i) =>
              p === '…'
                ? <span key={`e${i}`} style={{ padding: '4px 6px', color: 'var(--text3)', fontSize: 12 }}>…</span>
                : <button key={p} className={p === page ? 'btnp' : 'btns'} style={{ padding: '4px 10px', fontSize: 12, minWidth: 36 }} onClick={() => p !== page && fetchLogs(channel._id, p, true)}>{p}</button>
            )}
            <button className="btns" style={{ padding: '4px 10px', fontSize: 12, opacity: page >= totalPages ? 0.4 : 1 }} disabled={page >= totalPages} onClick={() => fetchLogs(channel._id, page + 1, true)}>→</button>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)' }}>de {totalPages} · {totalCount.toLocaleString('es')} logs</span>
          </div>
        </div>
      )}
    </div>
  );
}
