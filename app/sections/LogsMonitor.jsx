'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import LogViewer from '@/app/components/LogViewer';
import SearchView from '@/app/components/SearchView';
import { FM_PROJECT_ID } from '@/lib/fivemonitor';

const CATEGORY_COLORS = ['ct-red', 'ct-blue', 'ct-purple', 'ct-green', 'ct-orange', 'ct-cyan', 'ct-yellow'];

export default function LogsMonitor() {
  const [categories, setCategories]     = useState([]);
  const [channels, setChannels]         = useState({});
  const [expanded, setExpanded]         = useState(new Set());
  const [selectedChannel, setSelected]  = useState(null);
  const [selectedCategory, setSelCat]   = useState(null);
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [navOpen, setNavOpen]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch(`/api/fm/v1/projects/${FM_PROJECT_ID}/categories`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setCategories(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  async function loadChannels(cat) {
    if (channels[cat._id]) return;
    try {
      const res = await fetch(`/api/fm/v1/categories/${cat._id}/channels`);
      if (!res.ok) return;
      const data = await res.json();
      setChannels(prev => ({ ...prev, [cat._id]: data }));
    } catch {}
  }

  function toggleCategory(cat) {
    const next = new Set(expanded);
    if (next.has(cat._id)) { next.delete(cat._id); }
    else { next.add(cat._id); loadChannels(cat); }
    setExpanded(next);
  }

  function selectChannel(ch, cat) {
    setSelected(ch);
    setSelCat(cat);
    setSearch('');
    setDebounced('');
    setNavOpen(false);
  }

  const isSearchMode = debouncedSearch.trim().length >= 2;
  const totalChannels = Object.values(channels).reduce((s, c) => s + c.length, 0);

  return (
    <div className="section active fm-section">
      <div className="pg-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pg-title">Logs del Servidor</div>
          <div className="pg-sub">
            {loading ? 'Conectando con FiveMonitor…' : error ? `Error: ${error}` : `${categories.length} categorías · ${totalChannels} canales`}
          </div>
        </div>
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input
            className="fm-search-input"
            placeholder="Buscar en todos los canales…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="fm-nav-toggle btns" onClick={() => setNavOpen(o => !o)} title="Canales">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          Canales
        </button>
      </div>

      <div className={`fm-split${isSearchMode ? ' search-mode' : ''}`}>
        <div className={`fm-nav${navOpen ? ' open' : ''}${isSearchMode ? ' hidden' : ''}`}>
          <div className="fm-nav-head">CATEGORÍAS</div>

          {loading && <div style={{ padding: '16px 12px', color: 'var(--text3)', fontSize: 12 }}>Cargando…</div>}
          {error && <div style={{ padding: '16px 12px', color: 'var(--red)', fontSize: 12 }}>{error}</div>}

          {categories.map((cat, i) => {
            const isExpanded = expanded.has(cat._id);
            const catChannels = channels[cat._id] ?? [];
            return (
              <div key={cat._id}>
                <button className="fm-cat-btn" onClick={() => toggleCategory(cat)}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform .15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                    <polyline points="4,2 8,6 4,10" />
                  </svg>
                  <span className="fm-cat-name">{cat.name}</span>
                  {catChannels.length > 0 && <span className="fm-cat-count">{catChannels.length}</span>}
                </button>

                {isExpanded && (
                  <div className="fm-channels">
                    {catChannels.length === 0
                      ? <div style={{ padding: '4px 10px 4px 24px', color: 'var(--text3)', fontSize: 11 }}>Cargando…</div>
                      : catChannels.map(ch => (
                          <button
                            key={ch._id}
                            className={`fm-ch-btn${selectedChannel?._id === ch._id ? ' active' : ''}`}
                            onClick={() => selectChannel(ch, cat)}
                          >
                            <span className="fm-ch-hash">#</span>
                            <span className="fm-ch-name">{ch.name}</span>
                          </button>
                        ))
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`fm-content${isSearchMode ? ' fullwidth' : ''}`}>
          {isSearchMode ? (
            <SearchView query={debouncedSearch} />
          ) : selectedChannel ? (
            <LogViewer channel={selectedChannel} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
              <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: .4 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Selecciona un canal</div>
                <div style={{ fontSize: 11 }}>o usa la búsqueda global para buscar en todos</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
