'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LogViewer from '@/app/components/LogViewer';
import SearchView from '@/app/components/SearchView';
import { FM_PROJECT_ID } from '@/lib/fivemonitor';

const POLL_INTERVAL = 60_000; // 60s
const LS_LAST_VISITED = 'fm_lastVisited';
const LS_LATEST_TS    = 'fm_latestTs';

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function LogsMonitor() {
  const [categories, setCategories]   = useState([]);
  const [channels, setChannels]       = useState({});
  const [expanded, setExpanded]       = useState(new Set());
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError]       = useState(null);
  const [unread, setUnread]           = useState({});
  const [lastVisited, setLastVisited] = useState({});
  const [latestTs, setLatestTs]       = useState({});
  const [navOpen, setNavOpen]         = useState(false);

  const mountedRef = useRef(true);
  const channelsRef = useRef({});

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLastVisited(loadLS(LS_LAST_VISITED));
    setLatestTs(loadLS(LS_LATEST_TS));
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const res = await fetch(`/api/fm/v1/projects/${FM_PROJECT_ID}/categories`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cats = await res.json();
        if (cancelled) return;
        setCategories(cats);
        setLoadingCats(false);

        const results = await Promise.allSettled(
          cats.map(cat =>
            fetch(`/api/fm/v1/categories/${cat._id}/channels`)
              .then(r => r.ok ? r.json() : [])
              .then(chs => ({ catId: cat._id, chs }))
          )
        );
        if (cancelled) return;
        const map = {};
        for (const r of results) {
          if (r.status === 'fulfilled') map[r.value.catId] = r.value.chs;
        }
        channelsRef.current = map;
        setChannels(map);
      } catch (e) {
        if (!cancelled) { setCatError(e.message); setLoadingCats(false); }
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  const pollUnread = useCallback(async () => {
    const allChannels = Object.values(channelsRef.current).flat();
    if (!allChannels.length) return;
    const lv  = loadLS(LS_LAST_VISITED);
    const lts = loadLS(LS_LATEST_TS);
    const newLts = { ...lts };
    const newUnread = {};

    await Promise.allSettled(
      allChannels.map(async ch => {
        try {
          const r = await fetch(`/api/fm/v1/channels/${ch._id}/logs?page=1&limit=1`);
          if (!r.ok) return;
          const raw = await r.json();
          const latest = (Array.isArray(raw) ? raw[0] : raw.logs?.[0]);
          if (!latest) return;
          const ts = latest.timestamp ?? latest.createdAt ?? '';
          newLts[ch._id] = ts;
          const visitedAt = lv[ch._id] ?? 0;
          if (ts && new Date(ts).getTime() > visitedAt) {
            const total = Array.isArray(raw) ? raw.length : (raw.totalCount ?? 0);
            newUnread[ch._id] = total; // We show "•" not exact count
          }
        } catch {}
      })
    );
    if (!mountedRef.current) return;
    saveLS(LS_LATEST_TS, newLts);
    setLatestTs(newLts);
    setUnread(prev => {
      const merged = { ...newUnread };
      return merged;
    });
  }, []);

  useEffect(() => {
    if (!Object.keys(channels).length) return;
    pollUnread();
    const id = setInterval(pollUnread, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [channels, pollUnread]);

  function toggleCategory(catId) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }

  function selectChannel(channel, category) {
    const now = Date.now();
    const newLV = { ...lastVisited, [channel._id]: now };
    setLastVisited(newLV);
    saveLS(LS_LAST_VISITED, newLV);
    setUnread(prev => { const n = { ...prev }; delete n[channel._id]; return n; });
    setSelected({ channel, category });
    setSearch('');
    setDebounced('');
    setNavOpen(false);
  }

  const isSearch = debouncedSearch.trim().length >= 2;
  const totalChannels = Object.values(channels).reduce((s, c) => s + c.length, 0);

  return (
    <div className="section active fm-section">
      <div className="fm-split">
        <div className={`fm-nav${navOpen ? ' open' : ''}`}>
          <div className="fm-nav-page-header">
            <div className="fm-nav-pg-title">Logs del Servidor</div>
            <div className="fm-nav-pg-sub">Acceso a FiveMonitor para revisar logs</div>
          </div>

          <div className="fm-nav-head">
            <span>CATEGORÍAS</span>
            {!loadingCats && !catError && (
              <span className="fm-nav-head-sub">
                {categories.length} categorías · {totalChannels} canales
              </span>
            )}
          </div>

          {loadingCats && <div className="fm-nav-loading">Cargando…</div>}

          {categories.map(cat => {
            const isExp = expanded.has(cat._id);
            const catChs = channels[cat._id] ?? [];
            const catUnread = catChs.filter(ch => unread[ch._id]).length;

            return (
              <div key={cat._id}>
                <button className={`fm-cat-btn${catUnread ? ' has-unread' : ''}`} onClick={() => toggleCategory(cat._id)}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transition: 'transform .15s', transform: isExp ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
                    <polyline points="4,2 8,6 4,10" />
                  </svg>
                  <span className="fm-cat-name">{cat.name}</span>
                  {catChs.length > 0
                    ? <span className="fm-cat-count">{catChs.length}</span>
                    : loadingCats ? null : <span className="fm-cat-count" style={{ opacity: .4 }}>—</span>
                  }
                  {catUnread > 0 && <span className="fm-cat-unread-dot" />}
                </button>

                {isExp && (
                  <div className="fm-channels">
                    {catChs.length === 0
                      ? <div className="fm-ch-empty">—</div>
                      : catChs.map(ch => {
                          const isActive  = selected?.channel._id === ch._id && !isSearch;
                          const hasUnread = !!unread[ch._id];
                          return (
                            <button key={ch._id}
                              className={`fm-ch-btn${isActive ? ' active' : ''}${hasUnread ? ' unread' : ''}`}
                              onClick={() => selectChannel(ch, cat)}
                            >
                              <span className="fm-ch-hash">#</span>
                              <span className="fm-ch-name">{ch.name}</span>
                              {hasUnread && <span className="fm-ch-unread-dot" />}
                            </button>
                          );
                        })
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="fm-content">

          <div className="fm-content-toolbar">
            <div className="fm-search-wrap" style={{ flex: 1 }}>
              <svg className="fm-search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
              </svg>
              <input
                className="fm-search-input"
                placeholder="Buscar en todos los canales…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
              {search && (
                <button className="fm-search-clear" onClick={() => { setSearch(''); setDebounced(''); }}>✕</button>
              )}
            </div>
            <button className="fm-nav-toggle btns" onClick={() => setNavOpen(o => !o)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Canales
            </button>
          </div>

          <div className="fm-content-body">
            {isSearch ? (
              <SearchView query={debouncedSearch} />
            ) : selected ? (
              <LogViewer
                key={selected.channel._id}
                channel={selected.channel}
                category={selected.category}
                lastVisited={lastVisited[selected.channel._id]}
              />
            ) : (
              <div className="fm-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <p>Selecciona un canal en el panel izquierdo</p>
                <span>o usa la búsqueda para buscar en todos los canales a la vez</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
