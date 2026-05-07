'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogEntry, { StatCard } from './LogEntry';
import { levelPillClass, FM_PROJECT_ID } from '@/lib/fivemonitor';

const PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 50;

function buildPageNumbers(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur, cur - 1, cur + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

function NewDivider({ count }) {
  return (
    <div className="fm-new-divider">
      <div className="fm-new-divider-line" />
      <span className="fm-new-divider-label">
        {count} log{count !== 1 ? 's' : ''} nuevos ↑
      </span>
      <div className="fm-new-divider-line" />
    </div>
  );
}

export default function LogViewer({ channel, category, lastVisited }) {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [levelFilter, setLevelFilter] = useState('all');

  const [searchInput, setSearchInput]     = useState('');
  const [searchQuery, setSearchQuery]     = useState(''); // debounced
  const [searchLogs, setSearchLogs]       = useState([]);
  const [searching, setSearching]         = useState(false);
  const [searchingMore, setSearchingMore] = useState(false);
  const [searchTotal, setSearchTotal]     = useState(0);
  const [searchPages, setSearchPages]     = useState(1);
  const [searchError, setSearchError]     = useState(null);

  const channelRef  = useRef(channel._id);
  const searchRef   = useRef('');
  const abortRef    = useRef(false);
  const dividerRef  = useRef(null);
  const newCountRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    channelRef.current = channel._id;
    abortRef.current = true;
    setLogs([]); setPage(1); setTotalPages(1); setTotalCount(0);
    setError(null); setLevelFilter('all');
    setSearchInput(''); setSearchQuery('');
    setSearchLogs([]); setSearchTotal(0); setSearchPages(1); setSearchError(null);
    fetchLogs(channel._id, 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel._id]);

  // ── Scroll new-logs divider into view on load ────────────────────────────
  useEffect(() => {
    if (dividerRef.current && newCountRef.current > 0) {
      setTimeout(() => dividerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    }
  }, [logs.length]);

  // ── Fetch paginated logs (normal mode) ───────────────────────────────────
  const fetchLogs = useCallback(async (chId, p, initial) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fm/v1/channels/${chId}/logs?page=${p}&limit=${PAGE_SIZE}`);
      if (channelRef.current !== chId) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const raw = await res.json();
      const entries = Array.isArray(raw) ? raw : (raw.logs ?? []);
      const tCount  = Array.isArray(raw) ? raw.length : (raw.totalCount ?? entries.length);
      const tPages  = Array.isArray(raw) ? 1 : (raw.totalPages ?? 1);
      setLogs(entries);
      setTotalCount(tCount); setTotalPages(tPages); setPage(p);
    } catch (e) {
      if (channelRef.current === chId) setError(e.message);
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  const runChannelSearch = useCallback(async (q, chId) => {
    if (!q || q.trim().length < 2) {
      setSearchLogs([]); setSearchTotal(0); setSearchPages(1); setSearchError(null);
      return;
    }

    abortRef.current = false;
    searchRef.current = q;
    setSearching(true);
    setSearchingMore(false);
    setSearchError(null);
    setSearchLogs([]);
    setSearchTotal(0);
    setSearchPages(1);

    let currentPage = 1;
    let accLogs = [];

    while (true) {
      if (abortRef.current || searchRef.current !== q || channelRef.current !== chId) break;

      try {
        const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${encodeURIComponent(q)}&limit=${SEARCH_PAGE_SIZE}&page=${currentPage}&cId=${chId}`;
        const res = await fetch(url);
        if (abortRef.current || searchRef.current !== q || channelRef.current !== chId) break;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data   = await res.json();
        const chunk  = data.logs ?? [];
        const tCount = data.totalCount ?? (accLogs.length + chunk.length);
        const tPages = data.totalPages ?? 1;

        accLogs = currentPage === 1 ? chunk : [...accLogs, ...chunk];

        setSearchLogs([...accLogs]);
        setSearchTotal(tCount);
        setSearchPages(tPages);

        if (currentPage === 1) setSearching(false);

        if (currentPage >= tPages || chunk.length === 0) break;

        currentPage++;
        setSearchingMore(true);
        await new Promise(r => setTimeout(r, 120));

      } catch (e) {
        if (!abortRef.current && searchRef.current === q) {
          setSearchError(e.message);
          if (currentPage === 1) setSearching(false);
          setSearchingMore(false);
        }
        break;
      }
    }

    setSearching(false);
    setSearchingMore(false);
  }, []);

  // ── Trigger search when debounced query changes ──────────────────────────
  useEffect(() => {
    const chId = channelRef.current;
    abortRef.current = true;
    searchRef.current = searchQuery;
    if (searchQuery.trim().length >= 2) {
      const t = setTimeout(() => runChannelSearch(searchQuery, chId), 60);
      return () => clearTimeout(t);
    } else {
      setSearchLogs([]); setSearchTotal(0); setSearchPages(1); setSearchError(null);
    }
  }, [searchQuery, runChannelSearch]);

  const isSearchMode = searchQuery.trim().length >= 2;

  const newCount = lastVisited
    ? logs.filter(l => new Date(l.timestamp ?? l.createdAt ?? 0).getTime() > lastVisited).length
    : 0;
  newCountRef.current = newCount;

  const visibleSearch = searchLogs.filter(l => levelFilter === 'all' || l.level === levelFilter);
  const visibleLogs   = logs.filter(l => levelFilter === 'all' || l.level === levelFilter);

  const errCount  = (isSearchMode ? searchLogs : logs).filter(l => l.level === 'error').length;
  const infoCount = (isSearchMode ? searchLogs : logs).filter(l => l.level === 'info').length;
  const warnCount = (isSearchMode ? searchLogs : logs).filter(l => l.level === 'warn').length;

  const searchLoaded  = searchLogs.length;
  const searchPct     = searchTotal > 0 ? Math.round((searchLoaded / searchTotal) * 100) : 0;
  const searchDone    = !searching && !searchingMore && searchLoaded >= searchTotal && searchTotal > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>

      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div className="pg-header">
          <div>
            <div className="pg-title">
              {category && <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 14 }}>{category.name} / </span>}
              #{channel.name}
            </div>
            <div className="pg-sub">
              {loading
                ? 'Cargando logs…'
                : isSearchMode
                  ? searching
                    ? 'Buscando…'
                    : `${searchTotal.toLocaleString('es')} resultados para "${searchQuery}"`
                  : `${totalCount.toLocaleString('es')} logs · pág. ${page}/${totalPages}`}
            </div>
          </div>
        </div>

        {newCount > 0 && !loading && !isSearchMode && (
          <div className="fm-new-banner">
            <span>↑ {newCount} log{newCount !== 1 ? 's' : ''} nuevos desde tu última visita</span>
            <button className="fm-new-banner-btn" onClick={() => dividerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              Ver límite
            </button>
          </div>
        )}

        {(isSearchMode ? searchLogs.length > 0 : logs.length > 0) && (
          <div className="rob-grid" style={{ marginBottom: 14 }}>
            <StatCard label={isSearchMode ? 'Encontrados' : 'Cargados'} value={isSearchMode ? searchLoaded : logs.length} color="var(--text)" />
            <StatCard label="Error"  value={errCount}  color="var(--red)" />
            <StatCard label="Info"   value={infoCount} color="var(--blue)" />
            {warnCount > 0 && <StatCard label="Warn" value={warnCount} color="var(--yellow)" />}
            {!isSearchMode && <StatCard label="Total en DB" value={totalCount} color="var(--text3)" />}
            {isSearchMode  && <StatCard label="Total"       value={searchTotal} color="var(--text3)" />}
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
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>
              <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
            </svg>
            <input
              className="fm-search-input"
              placeholder="Buscar en este canal…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '2px 4px' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {isSearchMode && searchingMore && searchTotal > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
              <span>Cargando resultados… {searchLoaded.toLocaleString('es')} / {searchTotal.toLocaleString('es')}</span>
              <span>{searchPct}%</span>
            </div>
            <div style={{ height: 2, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${searchPct}%`, background: 'var(--red)', borderRadius: 999, transition: 'width .3s' }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px 24px' }}>

        {isSearchMode && (
          <>
            {searching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
                <span className="spinner" style={{ width: 16, height: 16 }} /> Buscando en #{channel.name}…
              </div>
            )}

            {searchError && !searching && (
              <div className="alert al-r" style={{ marginBottom: 14 }}>
                <div className="al-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
                <div><strong>Error:</strong> {searchError}</div>
              </div>
            )}

            {!searching && !searchError && searchLogs.length === 0 && (
              <div className="norm-empty">Sin resultados para &ldquo;{searchQuery}&rdquo; en este canal.</div>
            )}

            {visibleSearch.map(log => (
              <LogEntry key={log._id} log={log} />
            ))}

            {searchingMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>
                <span className="spinner" style={{ width: 13, height: 13 }} />
                Cargando más resultados…
              </div>
            )}

            {searchDone && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
                ✓ Todos los {searchTotal.toLocaleString('es')} resultados cargados
              </div>
            )}
          </>
        )}

        {!isSearchMode && (
          <>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
                <span className="spinner" style={{ width: 16, height: 16 }} /> Cargando #{channel.name}…
              </div>
            )}

            {error && !loading && (
              <div className="alert al-r" style={{ marginBottom: 14 }}>
                <div className="al-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
                <div><strong>Error:</strong> {error}
                  <br /><button onClick={() => fetchLogs(channel._id, 1, true)} style={{ marginTop: 6, fontSize: 11, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Reintentar</button>
                </div>
              </div>
            )}

            {!loading && !error && logs.length === 0 && (
              <div className="norm-empty">No hay logs en este canal.</div>
            )}
            {!loading && logs.length > 0 && visibleLogs.length === 0 && (
              <div className="norm-empty">Sin resultados para el filtro seleccionado.</div>
            )}

            {!loading && visibleLogs.map((log, i) => {
              const isNew     = lastVisited && new Date(log.timestamp ?? log.createdAt ?? 0).getTime() > lastVisited;
              const nextIsOld = i === newCount - 1 && newCount > 0 && levelFilter === 'all';
              return (
                <div key={log._id}>
                  <LogEntry log={log} isNew={isNew} />
                  {nextIsOld && (
                    <div ref={dividerRef}>
                      <NewDivider count={newCount} />
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && !error && totalPages > 1 && (
              <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>Página:</span>
                  <button className="btns" style={{ padding: '4px 10px', fontSize: 12, opacity: page <= 1 ? .4 : 1 }} disabled={page <= 1} onClick={() => fetchLogs(channel._id, page - 1, true)}>←</button>
                  {buildPageNumbers(page, totalPages).map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} style={{ padding: '4px 6px', color: 'var(--text3)', fontSize: 12 }}>…</span>
                      : <button key={p} className={p === page ? 'btnp' : 'btns'} style={{ padding: '4px 10px', fontSize: 12, minWidth: 32 }} onClick={() => p !== page && fetchLogs(channel._id, p, true)}>{p}</button>
                  )}
                  <button className="btns" style={{ padding: '4px 10px', fontSize: 12, opacity: page >= totalPages ? .4 : 1 }} disabled={page >= totalPages} onClick={() => fetchLogs(channel._id, page + 1, true)}>→</button>
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)' }}>de {totalPages} · {totalCount.toLocaleString('es')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
