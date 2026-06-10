'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Lock, User, AlertTriangle, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Config ───────────────────────────────────────────────────────────────────
const JAIL_CH_ID    = '69d3a41db036cafed646d85a';
const VALID_TITLES  = new Set(['Items Removidos - Jail', 'Jugador Offline Encarcelado - Jail']);
const ALLOWED_ROLE  = '1487429315992879114';
const PAGE_LIMIT    = 50;
const JAILS_PER_PAGE = 15;

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

const PERIODS = [
  { label: 'Hoy',         days: 1  },
  { label: 'Esta semana', days: 7  },
  { label: '2 semanas',   days: 14 },
  { label: 'Este mes',    days: 30 },
  { label: 'Todo',        days: 0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PALETTE = ['#ef4444','#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#6366f1'];
function avatarColor(name) {
  const c = [...name].find(c => /\p{L}/u.test(c)) ?? 'A';
  return PALETTE[c.toUpperCase().charCodeAt(0) % PALETTE.length];
}
function avatarLetter(name) {
  return ([...name].find(c => /\p{L}/u.test(c))?.toUpperCase()) ?? '?';
}

function canAccess(user) {
  if (!user) return false;
  if (ADMINS.some(a => a.id === user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

function fmtMins(mins) {
  if (!mins) return '0m';
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const p = [];
  if (d) p.push(`${d}d`); if (h) p.push(`${h}h`); if (m || !p.length) p.push(`${m}m`);
  return p.join(' ');
}

function dayKey(ts)   { return new Date(ts).toISOString().slice(0, 10); }
function shortDay(ds) {
  try { return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(ds)); }
  catch { return ds.slice(5); }
}

function filterByPeriod(jails, days) {
  if (!days) return jails;
  const cut = Date.now() - days * 86_400_000;
  return jails.filter(j => new Date(j.ts).getTime() >= cut);
}

function buildActivityData(jails, periodDays) {
  const days = periodDays > 0 ? Math.min(periodDays, 60) : 30;
  const now  = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d   = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: shortDay(key), count: jails.filter(j => dayKey(j.ts) === key).length };
  });
}

// ─── Parseo / Fetch ───────────────────────────────────────────────────────────
function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;
  const desc  = embed.description ?? log.message ?? '';
  const field = (key) => {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m   = desc.match(new RegExp(`\\*\\*${esc}:\\*\\*\\s*([^\\n]+)`));
    return m ? m[1].trim() : null;
  };
  const admin  = field('Administrador');
  if (!admin) return null;
  const durStr = field('Duración');
  return {
    id:         log._id,
    isOnline:   embed.title === 'Items Removidos - Jail',
    admin,
    player:     field('Jugador encarcelado'),
    identifier: field('Identifier encarcelado'),
    motivo:     field('Motivo'),
    duracion:   durStr,
    durMins:    durStr ? (parseInt(durStr.replace(/[^0-9]/g, '')) || 0) : 0,
    ts:         log.timestamp ?? log.createdAt,
  };
}

async function fetchAllJails(adminName, signal) {
  const seen = new Set(), jails = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
      `?q=${encodeURIComponent(adminName)}&limit=${PAGE_LIMIT}&page=${page}&cId=${JAIL_CH_ID}`;
    const res  = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    totalPages = data.totalPages ?? 1;
    for (const log of data.logs ?? []) {
      if (seen.has(log._id)) continue;
      seen.add(log._id);
      const p = parseLog(log);
      if (!p || p.admin.toLowerCase() !== adminName.toLowerCase()) continue;
      jails.push(p);
    }
    page++;
    if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
  }
  return jails.sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

// ─── Componentes UI ───────────────────────────────────────────────────────────
function DashStatCard({ icon, label, value, sub, accent, loading }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      borderTop: `3px solid ${accent ?? 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</div>
      {loading
        ? <span className="spinner" style={{ width: 20, height: 20, marginTop: 4 }} />
        : <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      }
      {!loading && sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

function ActivityChart({ data }) {
  const max        = Math.max(...data.map(d => d.count), 1);
  const showLabels = data.length <= 14;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {data.map(d => (
          <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {d.count > 0 && data.length <= 20 && (
              <div style={{ fontSize: 9, color: 'var(--text3)', lineHeight: 1 }}>{d.count}</div>
            )}
            <div
              title={`${d.label}: ${d.count} jail${d.count !== 1 ? 's' : ''}`}
              style={{
                width: '100%',
                height: `${Math.max((d.count / max) * 68, d.count > 0 ? 5 : 2)}px`,
                background: d.count > 0 ? 'var(--red)' : 'var(--surface2)',
                borderRadius: '3px 3px 0 0',
                opacity: d.count > 0 ? .85 : .3,
                transition: 'height .4s',
              }}
            />
          </div>
        ))}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 3 }}>
          {data.map(d => (
            <div key={d.key} style={{ flex: 1, fontSize: 9, color: 'var(--text3)', textAlign: 'center', overflow: 'hidden', minWidth: 0 }}>
              {d.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MotivoBar({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
        {label}
      </div>
      <div style={{ width: 90, height: 14, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, right: 'auto', width: `${pct}%`, background: 'var(--red)', borderRadius: 3, opacity: .7, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  );
}

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

function RecentSanciones({ jails }) {
  const items = jails;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', maxHeight: 440, overflowY: 'auto',
    }}>
      {items.length === 0
        ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
            Sin registros en este período
          </div>
        : items.map((j, i) => (
          <div key={j.id} style={{
            display: 'flex', gap: 10, padding: '10px 14px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'flex-start',
          }}>
            <div style={{ paddingTop: 2, flexShrink: 0 }}><JailBadge isOnline={j.isOnline} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {j.player
                  ? j.player
                  : j.identifier
                    ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)' }}>{j.identifier}</span>
                    : '—'
                }
              </div>
              {j.motivo && (
                <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {j.motivo}
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
              <div>{j.duracion ?? '—'}</div>
              <div style={{ marginTop: 2 }}>{fmtTimeRelative(j.ts)}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function JailsTable({ jails }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(jails.length / JAILS_PER_PAGE);
  const slice = jails.slice(page * JAILS_PER_PAGE, (page + 1) * JAILS_PER_PAGE);
  useEffect(() => { setPage(0); }, [jails.length]);

  if (jails.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
        Sin registros
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '70px 1fr 1fr 64px 72px',
          padding: '8px 14px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)', fontSize: 10, fontWeight: 700,
          letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--text3)', gap: 10,
        }}>
          <div>Tipo</div><div>Jugador</div><div>Motivo</div>
          <div style={{ textAlign: 'right' }}>Duración</div>
          <div style={{ textAlign: 'right' }}>Hace</div>
        </div>
        {slice.map((j, i) => (
          <div
            key={j.id}
            style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 64px 72px', padding: '9px 14px', borderBottom: i < slice.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', gap: 10, transition: 'background .1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div><JailBadge isOnline={j.isOnline} /></div>
            <div style={{ minWidth: 0 }}>
              {j.player
                ? <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.player}</div>
                : j.identifier
                  ? <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.identifier}</div>
                  : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>
              }
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.motivo ?? <span style={{ color: 'var(--text3)' }}>—</span>}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', whiteSpace: 'nowrap' }}>{j.duracion ?? '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtTimeRelative(j.ts)}</div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: page === 0 ? 'default' : 'pointer', fontSize: 11, color: page === 0 ? 'var(--text3)' : 'var(--text2)', opacity: page === 0 ? .45 : 1, transition: 'border-color .15s' }}
            onMouseEnter={e => { if (page > 0) e.currentTarget.style.borderColor = 'var(--border2)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <ChevronLeft size={12} /> Anterior
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              Página <strong style={{ color: 'var(--text2)' }}>{page + 1}</strong> de {totalPages}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>({jails.length} registros)</span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 11, color: page >= totalPages - 1 ? 'var(--text3)' : 'var(--text2)', opacity: page >= totalPages - 1 ? .45 : 1, transition: 'border-color .15s' }}
            onMouseEnter={e => { if (page < totalPages - 1) e.currentTarget.style.borderColor = 'var(--border2)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Siguiente <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardAdmin({ user }) {
  const hasAccess = canAccess(user);
  const myAdmin   = ADMINS.find(a => a.id === user?.id);

  const [allJails,   setAllJails]   = useState([]);
  const [periodIdx,  setPeriodIdx]  = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [loadedAt,   setLoadedAt]   = useState(null);
  const abortRef = useRef(null);

  function load() {
    if (!myAdmin) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    fetchAllJails(myAdmin.name, ctrl.signal)
      .then(jails => { setAllJails(jails); setLoadedAt(new Date()); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!hasAccess || !myAdmin) return;
    load();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // ── Acceso denegado ──────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="section active">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 14, color: 'var(--text3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: .35 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>Acceso restringido</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Solo el equipo de ilegales puede ver esto.</div>
        </div>
      </div>
    );
  }

  // ── No registrado ────────────────────────────────────────────────────────
  if (!myAdmin) {
    return (
      <div className="section active">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 14, color: 'var(--text3)' }}>
          <User size={36} style={{ opacity: .35 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>No registrado</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
            Tu cuenta de Discord no está asociada a ningún admin en el sistema.
          </div>
        </div>
      </div>
    );
  }

  // ── Datos filtrados por período ──────────────────────────────────────────
  const period    = PERIODS[periodIdx];
  const jails     = filterByPeriod(allJails, period.days);
  const total     = jails.length;
  const online    = jails.filter(j => j.isOnline).length;
  const offline   = jails.filter(j => !j.isOnline).length;
  const totalMins = jails.reduce((s, j) => s + (j.durMins ?? 0), 0);

  const motivoMap = new Map();
  for (const j of jails) {
    const m = (j.motivo ?? 'Sin motivo').trim().toUpperCase();
    motivoMap.set(m, (motivoMap.get(m) ?? 0) + 1);
  }
  const motivos = [...motivoMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxMot = motivos[0]?.count ?? 1;

  const activity  = buildActivityData(jails, period.days || 30);
  const busiest   = activity.reduce((b, d) => d.count > b.count ? d : b, { count: 0, label: '—' });

  const allTimeMins  = allJails.reduce((s, j) => s + (j.durMins ?? 0), 0);
  const avg30        = (allJails.filter(j => new Date(j.ts).getTime() >= Date.now() - 30 * 86400000).length / 30).toFixed(1);
  const allOnlinePct = allJails.length > 0 ? Math.round((allJails.filter(j => j.isOnline).length / allJails.length) * 100) : 0;

  const aColor  = avatarColor(myAdmin.name);
  const aLetter = avatarLetter(myAdmin.name);

  return (
    <div className="section active">

      {/* ── Cabecera ── */}
      <div style={{ marginBottom: 20 }}>
        {/* Fila superior: Volver */}
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text3)', padding: '0 0 10px 0',
            transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          <ChevronLeft size={14} />
          Volver
        </button>

        {/* Fila perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: aColor + '22', border: `2px solid ${aColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: aColor,
          }}>
            {aLetter}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {myAdmin.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {loading
                ? 'Cargando historial…'
                : loadedAt
                  ? `${allJails.length.toLocaleString('es')} jails en total · actualizado ${fmtTimeRelative(loadedAt)}`
                  : 'Dashboard personal de ilegales'
              }
            </div>
          </div>

          {/* Actualizar */}
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 12px', cursor: loading ? 'default' : 'pointer',
              fontSize: 12, color: 'var(--text2)', opacity: loading ? .5 : 1,
              transition: 'border-color .15s', flexShrink: 0,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border2)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert al-r" style={{ marginBottom: 14 }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {/* ── Período ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' }}>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            className={`btns${periodIdx === i ? ' active' : ''}`}
            style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => setPeriodIdx(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <DashStatCard
          icon={<AlertTriangle size={11} />} label="Total jails"
          value={loading ? null : total}
          sub={period.days ? `En ${period.label.toLowerCase()}` : 'Sin filtro'}
          accent="var(--red)" loading={loading}
        />
        <DashStatCard
          icon={<TrendingUp size={11} />} label="Online"
          value={loading ? null : online}
          sub={!loading && total > 0 ? `${Math.round((online / total) * 100)}% del total` : '—'}
          accent="#22c55e" loading={loading}
        />
        <DashStatCard
          icon={<User size={11} />} label="Offline"
          value={loading ? null : offline}
          sub={!loading && total > 0 ? `${Math.round((offline / total) * 100)}% del total` : '—'}
          accent="var(--text3)" loading={loading}
        />
        <DashStatCard
          icon={<Clock size={11} />} label="Tiempo total"
          value={loading ? null : fmtMins(totalMins)}
          sub={!loading ? `${totalMins.toLocaleString('es')} min` : null}
          accent="var(--orange, #f97316)" loading={loading}
        />
      </div>

      {/* ── Actividad diaria ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Actividad diaria</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {period.days > 0 ? `Últimos ${period.days} días` : 'Últimos 30 días'}
            {!loading && busiest.count > 0 && (
              <> · Día pico: <strong style={{ color: 'var(--text2)' }}>{busiest.label}</strong> ({busiest.count})</>
            )}
          </div>
        </div>
        {loading
          ? <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" style={{ width: 18, height: 18 }} /></div>
          : total === 0
            ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)' }}>Sin actividad en este período</div>
            : <ActivityChart data={activity} />
        }
      </div>

      {/* ── Motivos + Últimas sanciones ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>Motivos más frecuentes</div>
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16 }} />
            : motivos.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin datos en este período</div>
              : motivos.map(m => <MotivoBar key={m.label} label={m.label} count={m.count} maxCount={maxMot} />)
          }
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
            Últimas sanciones del período
          </div>
          {loading
            ? <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px', display: 'flex', justifyContent: 'center' }}>
                <span className="spinner" style={{ width: 18, height: 18 }} />
              </div>
            : <RecentSanciones jails={jails} />
          }
        </div>
      </div>

      {/* ── Resumen histórico ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 20px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
          Resumen histórico — {myAdmin.name}
        </div>
        {loading
          ? <span className="spinner" style={{ width: 16, height: 16 }} />
          : (
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{allJails.length.toLocaleString('es')}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails registrados</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--orange, #f97316)' }}>{fmtMins(allTimeMins)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>tiempo total acumulado</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{avg30}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails/día (últ. 30d)</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>{allOnlinePct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>reportes online</div>
              </div>
            </div>
          )
        }
      </div>

      {/* ── Todos los registros paginados ── */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          Registros del período
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>
            — {loading ? '…' : `${jails.length} registros`}
          </span>
        </div>
        <JailsTable jails={jails} />
      </div>
    </div>
  );
}
