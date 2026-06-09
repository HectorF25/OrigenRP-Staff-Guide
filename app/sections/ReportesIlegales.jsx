'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BarChart2, RefreshCw, Lock } from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Configuración ────────────────────────────────────────────────────────────
const JAIL_CH_ID   = '69d3a41db036cafed646d85a';
const VALID_TITLES = new Set(['Items Removidos - Jail', 'Jugador Offline Encarcelado - Jail']);
const ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE = '1487429315992879114';
const PAGE_LIMIT   = 50;
const BATCH        = 5;

const ADMINS = [
  { name: 'FranMacia97',          id: '659812927636897810' },
  { name: 'LorenaFlowers',        id: '752057219058630676' },
  { name: 'daviiidz_71',          id: '713393949624107058' },
  { name: 'HectorF25',            id: '343822757911330817' },
  { name: '! Voltajiho',          id: '748287186239094936' },
  { name: 'TheAkilesX',           id: '1310021491827408976' },
  { name: 'HADES',                id: '1395195029747929089' },
  { name: 'MartinV6',             id: '1032794430232592394' },
  { name: '_.marta.2002__97272',  id: '1217206517443461151' },
  { name: 'Zonita',               id: '924496259530756117'  },
  { name: 'maurimol',             id: '704379432348942549'  },
  { name: 'TOKYO',                id: '1233393359578468376' },
  { name: '🔝🔥Noblesse🔥',       id: '1176005329524379779' },
  { name: 'Lil_Angelx',          id: '934932063977607241'  },
  { name: 'sir josetiin',         id: '761145782728261643'  },
  { name: 'Leeoon23',             id: '1171541693569454080' },
  { name: '! Leison',             id: '1105956450414633020' },
  { name: 'BlackFriday',          id: '914490855459532861'  },
  { name: 'gerja25',              id: '517422162647449602'  },
  { name: 'ananvi12',             id: '752975491228500019'  },
  { name: '🕷 Toñito 🕷',         id: '740030258740330576'  },
  { name: '! ivy',                id: '426166856118697997'  },
  { name: '🔱Genkar',             id: '1479936578368438283' },
  { name: 'MonoCuliao',           id: '845589598016765952'  },
  { name: 'angel',                id: '979514530721845328'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function canAccess(user) {
  if (!user) return false;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

function extractAdmin(text) {
  const m = (text ?? '').match(/\*\*Administrador:\*\*\s*([^\n*]+)/);
  return m ? m[1].trim() : null;
}

function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;

  const desc = embed.description ?? log.message ?? '';

  const field = (key) => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = desc.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`));
    return m ? m[1].trim() : null;
  };

  return {
    id:         log._id,
    title:      embed.title,
    adminName:  extractAdmin(desc),
    player:     field('Jugador encarcelado'),
    identifier: field('Identifier encarcelado'),
    motivo:     field('Motivo'),
    duracion:   field('Duración'),
    isOnline:   embed.title === 'Items Removidos - Jail',
    ts:         log.timestamp ?? log.createdAt,
  };
}

async function fetchAdminJails(adminName, signal) {
  const seen  = new Set();
  const jails = [];
  let page       = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const url =
      `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
      `?q=${encodeURIComponent(adminName)}&limit=${PAGE_LIMIT}&page=${page}&cId=${JAIL_CH_ID}`;

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    totalPages = data.totalPages ?? 1;

    for (const log of data.logs ?? []) {
      if (seen.has(log._id)) continue;
      seen.add(log._id);

      const parsed = parseLog(log);
      if (!parsed || !parsed.adminName) continue;
      if (parsed.adminName.toLowerCase() !== adminName.toLowerCase()) continue;
      jails.push(parsed);
    }

    page++;
    if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
  }

  return jails;
}

async function loadAllInBatches(admins, onUpdate, signal) {
  for (let i = 0; i < admins.length; i += BATCH) {
    if (signal?.aborted) break;
    const batch = admins.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (admin) => {
        try {
          const jails = await fetchAdminJails(admin.name, signal);
          if (!signal?.aborted) onUpdate(admin.name, { status: 'done', jails, error: null });
        } catch (e) {
          if (signal?.aborted) return;
          onUpdate(admin.name, { status: 'error', jails: [], error: e.message });
        }
      })
    );
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function JailBadge({ isOnline }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      letterSpacing: '.4px', whiteSpace: 'nowrap', textTransform: 'uppercase',
      background: isOnline ? 'rgba(34,197,94,.13)' : 'rgba(148,163,184,.10)',
      color:      isOnline ? '#22c55e'              : 'var(--text3)',
      border:    `1px solid ${isOnline ? 'rgba(34,197,94,.28)' : 'var(--border)'}`,
    }}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

function JailEntry({ jail }) {
  const player      = jail.player ?? jail.identifier ?? '—';
  const isIdentifier = !jail.player && !!jail.identifier;

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 16px',
      borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
    }}>
      <div style={{ paddingTop: 1, flexShrink: 0 }}>
        <JailBadge isOnline={jail.isOnline} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 2, wordBreak: 'break-all' }}>
          {isIdentifier
            ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text2)' }}>{player}</span>
            : player
          }
        </div>
        {jail.motivo && (
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 1 }}>
            <span style={{ color: 'var(--text3)' }}>Motivo: </span>{jail.motivo}
          </div>
        )}
        {jail.duracion && (
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>⏱ {jail.duracion}</div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
        <div>{fmtTimeRelative(jail.ts)}</div>
        <div style={{ marginTop: 2 }}>{fmtTime(jail.ts)}</div>
      </div>
    </div>
  );
}

function AdminCard({ admin, data, onSelect }) {
  const { status, jails = [], error } = data;
  const loading = status === 'loading';
  const done    = status === 'done';
  const errored = status === 'error';
  const online  = jails.filter(j => j.isOnline).length;
  const offline = jails.filter(j => !j.isOnline).length;
  const total   = jails.length;

  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: 'var(--red)', fontWeight: 700, flexShrink: 0,
        }}>
          {[...admin.name].find(c => /\p{L}/u.test(c))?.toUpperCase() ?? '?'}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.3 }}>
          {admin.name}
        </span>
      </div>

      {/* Conteo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minHeight: 32 }}>
        {loading ? (
          <span className="spinner" style={{ width: 18, height: 18 }} />
        ) : errored ? (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>Error al cargar</span>
        ) : (
          <>
            <span style={{ fontSize: 28, fontWeight: 800, color: total > 0 ? 'var(--red)' : 'var(--text3)', lineHeight: 1 }}>
              {total}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>jails</span>
          </>
        )}
      </div>

      {/* Desglose online/offline */}
      {done && total > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4,
            background: 'rgba(34,197,94,.10)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,.22)',
          }}>🟢 {online} online</span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4,
            background: 'var(--surface2)', color: 'var(--text3)',
            border: '1px solid var(--border)',
          }}>⚫ {offline} offline</span>
        </div>
      )}
      {done && total === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Sin registros</div>
      )}

      {/* Botón ver registros */}
      {done && total > 0 && (
        <button
          onClick={() => onSelect(admin)}
          style={{
            marginTop: 2,
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
            fontSize: 12, color: 'var(--text2)', fontWeight: 500,
            transition: 'background .15s, color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'var(--red)';
            e.currentTarget.style.color        = '#fff';
            e.currentTarget.style.borderColor  = 'var(--red)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'var(--surface2)';
            e.currentTarget.style.color        = 'var(--text2)';
            e.currentTarget.style.borderColor  = 'var(--border2)';
          }}
        >
          Ver registros →
        </button>
      )}

      {errored && (
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{error}</div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReportesIlegales({ user }) {
  const hasAccess = canAccess(user);

  // — estado (todos los hooks siempre se llaman) —
  const [view,      setView]      = useState('overview');
  const [selected,  setSelected]  = useState(null);
  const [sortBy,    setSortBy]    = useState('count');
  const [filter,    setFilter]    = useState('');
  const [adminData, setAdminData] = useState(() => {
    const d = {};
    for (const a of ADMINS) d[a.name] = { status: 'idle', jails: [] };
    return d;
  });
  const abortRef = useRef(null);

  function updateAdmin(name, patch) {
    setAdminData(prev => ({ ...prev, [name]: patch }));
  }

  function startLoad() {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setAdminData(() => {
      const d = {};
      for (const a of ADMINS) d[a.name] = { status: 'loading', jails: [] };
      return d;
    });
    loadAllInBatches(ADMINS, updateAdmin, ctrl.signal);
  }

  useEffect(() => {
    if (!hasAccess) return;
    startLoad();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // — acceso denegado —
  if (!hasAccess) {
    return (
      <div className="section active">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px', gap: 14,
          color: 'var(--text3)',
        }}>
          <Lock size={36} style={{ opacity: .35 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>Acceso restringido</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
            Solo el equipo de encargados de ilegales puede ver esta sección.
          </div>
        </div>
      </div>
    );
  }

  // — métricas globales —
  const loadedCount = Object.values(adminData).filter(d => d.status === 'done' || d.status === 'error').length;
  const allDone     = loadedCount === ADMINS.length;
  const totalJails  = Object.values(adminData).reduce((s, d) => s + (d.jails?.length ?? 0), 0);

  // ── Vista detalle ──────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const data   = adminData[selected.name];
    const jails  = [...(data?.jails ?? [])].sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const online  = jails.filter(j => j.isOnline).length;
    const offline = jails.filter(j => !j.isOnline).length;

    return (
      <div className="section active">
        {/* Cabecera detalle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => { setView('overview'); setSelected(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              fontSize: 12, color: 'var(--text2)', flexShrink: 0,
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <ArrowLeft size={13} /> Volver
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--red)', fontWeight: 700 }}>{jails.length} jails</span>
              <span style={{ color: '#22c55e' }}>🟢 {online} online</span>
              <span>⚫ {offline} offline</span>
            </div>
          </div>
        </div>

        {/* Lista de logs */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {jails.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No hay registros de jail para {selected.name}
            </div>
          ) : (
            jails.map(jail => <JailEntry key={jail.id} jail={jail} />)
          )}
        </div>
      </div>
    );
  }

  // ── Vista overview ─────────────────────────────────────────────────────────
  const adminsArr = ADMINS.map(a => ({ ...a, data: adminData[a.name] }));

  const filtered = filter
    ? adminsArr.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()))
    : adminsArr;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'count') {
      return (b.data.jails?.length ?? 0) - (a.data.jails?.length ?? 0);
    }
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });

  return (
    <div className="section active">
      {/* Cabecera */}
      <div className="pg-header" style={{ marginBottom: 14 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={15} style={{ color: 'var(--red)' }} />
            Reportes Ilegales
          </div>
          <div className="pg-sub">
            {allDone
              ? `${ADMINS.length} administradores · ${totalJails.toLocaleString('es')} jails en total`
              : `Cargando… ${loadedCount} / ${ADMINS.length}`
            }
          </div>
        </div>

        <button
          onClick={startLoad}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
            fontSize: 12, color: 'var(--text2)',
            transition: 'border-color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Barra de progreso */}
      {!allDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, background: 'var(--red)',
              width: `${Math.round((loadedCount / ADMINS.length) * 100)}%`,
              transition: 'width .3s',
            }} />
          </div>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: .4, pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
          >
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
          </svg>
          <input
            className="fm-search-input"
            placeholder="Filtrar administrador…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'count', label: '↓ Jails' },
            { key: 'name',  label: 'A – Z'   },
          ].map(opt => (
            <button
              key={opt.key}
              className={`btns${sortBy === opt.key ? ' active' : ''}`}
              style={{ fontSize: 11, padding: '5px 10px' }}
              onClick={() => setSortBy(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 12,
      }}>
        {sorted.map(({ name, id, data }) => (
          <AdminCard
            key={name}
            admin={{ name, id }}
            data={data}
            onSelect={(admin) => { setSelected(admin); setView('detail'); }}
          />
        ))}
      </div>
    </div>
  );
}
