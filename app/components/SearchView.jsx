'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogEntry from './LogEntry';
import { groupLogsByCategory, FM_PROJECT_ID } from '@/lib/fivemonitor';

const PAGE_SIZE = 20;

function CategoryGroup({ group, query }) {
  const [collapsed, setCollapsed] = useState(true);
  const CAT_COLORS = ['var(--red)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--orange)', 'var(--cyan)'];
  const colorIdx = Math.abs([...group.categoryName].reduce((a, c) => a + c.charCodeAt(0), 0)) % CAT_COLORS.length;
  const catColor = CAT_COLORS[colorIdx];
  const total = group.channels.reduce((s, c) => s + c.logs.length, 0);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', userSelect: 'none' }} onClick={() => setCollapsed(v => !v)}>
        <div style={{ width: 4, height: 18, background: catColor, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>{group.categoryName}</span>
        <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '1px 7px' }}>{total}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ transition: 'transform .18s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </div>
      {!collapsed && group.channels.map(ch => (
        <div key={ch.channelId} style={{ marginBottom: 12, paddingLeft: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace', fontWeight: 700 }}>#</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{ch.channelName}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '0 5px' }}>{ch.logs.length}</span>
          </div>
          {ch.logs.map(log => <LogEntry key={log._id} log={log} showChannel={true} defaultExpanded={true} />)}
        </div>
      ))}
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
  const loaderRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const doSearch = useCallback(async (q, p, initial) => {
    if (!q.trim()) { setGroups([]); setAllLogs([]); setTotalCount(0); return; }
    if (initial) setLoading(true); else setLoadingMore(true);
    loadingMoreRef.current = true;
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

  // Intersection Observer para carga automática
  useEffect(() => {
    if (!loaderRef.current || loading || page >= totalPages || loadingMoreRef.current) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages && !loadingMoreRef.current && queryRef.current.trim().length >= 2) {
        doSearch(queryRef.current, page + 1, false);
      }
    }, { threshold: 0.1 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, totalPages, loading, doSearch]);

  if (!query.trim() || query.trim().length < 2) {
    return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Escribe al menos 2 caracteres para buscar en todos los logs</div>;
  }

  return (
    <div>
      <div className="pg-header">
        <div className="pg-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--red)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Búsqueda global
        </div>
        <div className="pg-sub">
          {loading ? 'Buscando…' : totalCount > 0
            ? `${totalCount.toLocaleString('es')} resultado${totalCount !== 1 ? 's' : ''} para "${query}"`
            : !error ? `Sin resultados para "${query}"` : ''}
        </div>
      </div>

      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}><span className="spinner" style={{ width: 18, height: 18 }} /> Buscando en todos los canales…</div>}

      {error && !loading && (
        <div className="alert al-r" style={{ marginBottom: 14 }}>
          <div className="al-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
          <div><strong>Error en la búsqueda:</strong> {error}</div>
        </div>
      )}

      {!loading && !error && allLogs.length === 0 && <div className="norm-empty">No se encontraron resultados para &ldquo;{query}&rdquo;</div>}
      {!loading && groups.map(g => <CategoryGroup key={g.categoryId} group={g} query={query} />)}

      {!loading && page < totalPages && <div ref={loaderRef} style={{ height: 1 }} />}

      {loadingMore && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0', color: 'var(--text3)', fontSize: 13, justifyContent: 'center' }}>
          <span className="spinner" style={{ width: 16, height: 16 }} />
          <span>Cargando más resultados…</span>
        </div>
      )}
    </div>
  );
}
