'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogEntry from './LogEntry';
import { groupLogsByCategory, FM_PROJECT_ID } from '@/lib/fivemonitor';

const PAGE_SIZE = 50;

function ChannelGroup({ ch, catColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fm-sg-channel">
      <button className="fm-sg-ch-header" onClick={() => setOpen(v => !v)}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0, color: 'var(--text3)' }}>
          <polyline points="4,2 8,6 4,10" />
        </svg>
        <span className="fm-ch-hash" style={{ color: catColor }}>#</span>
        <span style={{ fontSize: 12, fontWeight: open ? 600 : 400, color: 'var(--text2)' }}>{ch.channelName}</span>
        <span className="fm-sg-count">{ch.logs.length}</span>
      </button>
      {open && (
        <div className="fm-sg-ch-logs">
          {ch.logs.map(log => <LogEntry key={log._id} log={log} showChannel={false} />)}
        </div>
      )}
    </div>
  );
}

function CategoryGroup({ group }) {
  const [open, setOpen] = useState(false);
  const CAT_COLORS = ['var(--red)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--orange)', 'var(--cyan)'];
  const idx = Math.abs([...group.categoryName].reduce((a, c) => a + c.charCodeAt(0), 0)) % CAT_COLORS.length;
  const color = CAT_COLORS[idx];
  const total = group.channels.reduce((s, c) => s + c.logs.length, 0);

  return (
    <div className="fm-sg-cat">
      <button className="fm-sg-cat-header" onClick={() => setOpen(v => !v)}>
        <div className="fm-sg-cat-bar" style={{ background: color }} />
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0, color: 'var(--text3)' }}>
          <polyline points="4,2 8,6 4,10" />
        </svg>
        <span className="fm-sg-cat-name">{group.categoryName}</span>
        <span className="fm-sg-count">{total}</span>
        <div className="fm-sg-cat-line" />
      </button>

      {open && (
        <div className="fm-sg-cat-body">
          {group.channels.map(ch => <ChannelGroup key={ch.channelId} ch={ch} catColor={color} />)}
        </div>
      )}
    </div>
  );
}

export default function SearchView({ query }) {
  const [groups, setGroups]         = useState([]);
  const [allLogs, setAllLogs]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryRef     = useRef(query);
  const abortRef     = useRef(false);

  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setGroups([]); setAllLogs([]); setTotalCount(0); setTotalPages(1); setPage(1);
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setAllLogs([]);
    setGroups([]);
    setPage(1);
    setTotalCount(0);
    setTotalPages(1);

    let currentPage = 1;
    let accLogs     = [];

    while (true) {
      if (abortRef.current || queryRef.current !== q) break;

      try {
        const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}&page=${currentPage}`;
        const res = await fetch(url);
        if (abortRef.current || queryRef.current !== q) break;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data       = await res.json();
        const chunk      = data.logs ?? [];
        const tCount     = data.totalCount ?? (accLogs.length + chunk.length);
        const tPages     = data.totalPages ?? 1;

        accLogs = currentPage === 1 ? chunk : [...accLogs, ...chunk];

        const grouped = groupLogsByCategory(accLogs);
        setPage(currentPage);
        setTotalCount(tCount);
        setTotalPages(tPages);
        setAllLogs(accLogs);
        setGroups(grouped);

        if (currentPage === 1) setLoading(false);

        if (currentPage >= tPages || chunk.length === 0) break;

        currentPage++;
        setLoadingMore(true);
        await new Promise(r => setTimeout(r, 120));

      } catch (e) {
        if (!abortRef.current && queryRef.current === q) {
          setError(e.message);
          if (currentPage === 1) setLoading(false);
          setLoadingMore(false);
        }
        break;
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    queryRef.current = query;
    abortRef.current = true;
    const t = setTimeout(() => runSearch(query), 80);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (!query || query.trim().length < 2) {
    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px 24px' }}>
        <div className="fm-empty-state"><span>Escribe al menos 2 caracteres para buscar</span></div>
      </div>
    );
  }

  const loaded    = allLogs.length;
  const pct       = totalCount > 0 ? Math.round((loaded / totalCount) * 100) : 0;
  const allLoaded = !loadingMore && !loading && loaded >= totalCount && totalCount > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div className="pg-header">
          <div>
            <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: 'var(--red)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Búsqueda global
            </div>
            <div className="pg-sub">
              {loading
                ? 'Buscando…'
                : totalCount > 0
                  ? `${totalCount.toLocaleString('es')} resultados para "${query}"`
                  : !error
                    ? `Sin resultados para "${query}"`
                    : ''}
            </div>
          </div>
        </div>

        {loadingMore && totalCount > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
              <span>Cargando resultados… {loaded.toLocaleString('es')} / {totalCount.toLocaleString('es')}</span>
              <span>{pct}%</span>
            </div>
            <div style={{ height: 2, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--red)', borderRadius: 999, transition: 'width .3s' }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px 24px' }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
            <span className="spinner" style={{ width: 16, height: 16 }} /> Buscando en todos los canales…
          </div>
        )}

        {error && !loading && (
          <div className="alert al-r" style={{ marginBottom: 14 }}>
            <div className="al-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}

        {!loading && !error && allLogs.length === 0 && (
          <div className="norm-empty">No se encontraron resultados para &ldquo;{query}&rdquo;</div>
        )}

        {groups.map(g => <CategoryGroup key={g.categoryId} group={g} />)}

        {loadingMore && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>
            <span className="spinner" style={{ width: 13, height: 13 }} />
            Cargando página {page + 1} de {totalPages}…
          </div>
        )}

        {allLoaded && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
            ✓ Todos los {totalCount.toLocaleString('es')} resultados cargados
          </div>
        )}
      </div>
    </div>
  );
}
