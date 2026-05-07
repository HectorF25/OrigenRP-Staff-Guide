'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogEntry from './LogEntry';
import { groupLogsByCategory, FM_PROJECT_ID } from '@/lib/fivemonitor';

const PAGE_SIZE = 20;

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
  const [groups, setGroups]           = useState([]);
  const [allLogs, setAllLogs]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const queryRef = useRef(query);
  const scrollContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const doSearch = useCallback(async (q, p, initial) => {
    if (!q.trim()) { setGroups([]); setAllLogs([]); setTotalCount(0); return; }
    if (initial) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}&page=${p}`;
      const res = await fetch(url);
      if (queryRef.current !== q) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const logs = data.logs ?? [];
      setTotalCount(data.totalCount ?? logs.length);
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
      setAllLogs(prev => {
        const merged = initial ? logs : [...prev, ...logs];
        setGroups(groupLogsByCategory(merged));
        return merged;
      });
    } catch (e) {
      if (queryRef.current === q) setError(e.message);
    } finally {
      if (initial) setLoading(false); else setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    setPage(1); setAllLogs([]); setGroups([]);
    if (query.trim().length >= 2) doSearch(query, 1, true);
    else setTotalCount(0);
  }, [query, doSearch]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingMoreRef.current || loadingMore) return;
      if (page >= totalPages) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

      // Trigger load when user is within 300px from bottom
      if (distanceToBottom < 300) {
        loadingMoreRef.current = true;
        doSearch(queryRef.current, page + 1, false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [page, totalPages, loadingMore, doSearch]);

  if (!query.trim() || query.trim().length < 2) {
    return <div className="fm-empty-state"><span>Escribe al menos 2 caracteres para buscar</span></div>;
  }

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
              {loading ? 'Buscando…'
                : totalCount > 0 ? `${totalCount.toLocaleString('es')} resultados para "${query}"`
                : !error ? `Sin resultados para "${query}"` : ''}
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px 24px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
            <span className="spinner" style={{ width: 16, height: 16 }} /> Buscando en todos los canales…
          </div>
        )}

        {error && !loading && (
          <div className="alert al-r" style={{ marginBottom: 14 }}>
            <div className="al-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}

        {!loading && !error && allLogs.length === 0 && (
          <div className="norm-empty">No se encontraron resultados para &ldquo;{query}&rdquo;</div>
        )}

        {!loading && groups.map(g => <CategoryGroup key={g.categoryId} group={g} />)}

        {loadingMore && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
            <span className="spinner" style={{ width: 16, height: 16 }} />Cargando más resultados…
          </div>
        )}

        {!loading && !error && page >= totalPages && allLogs.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
            Se mostraron todos los {totalCount.toLocaleString('es')} resultados
          </div>
        )}
      </div>
    </div>
  );
}
