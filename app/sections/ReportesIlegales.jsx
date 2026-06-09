'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BarChart2, RefreshCw, Lock,
  Users, Shield, Wifi, TrendingUp,
  AlertTriangle, Clock, User,
} from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Configuración ────────────────────────────────────────────────────────────
const JAIL_CH_ID   = '69d3a41db036cafed646d85a';
const VALID_TITLES = new Set(['Items Removidos - Jail', 'Jugador Offline Encarcelado - Jail']);
const ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE = '1487429315992879114';
const PAGE_LIMIT   = 50;
const BATCH        = 5;
const WEEK_MS      = 7 * 24 * 60 * 60 * 1000;

const PERIODS = [
  { label: 'Hoy',         days: 1  },
  { label: 'Esta semana', days: 7  },
  { label: '2 semanas',   days: 14 },
  { label: 'Este mes',    days: 30 },
  { label: 'Todo',        days: 0  },
];

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

// Colores de avatar
const PALETTE = [
  '#ef4444','#3b82f6','#8b5cf6','#10b981',
  '#f59e0b','#06b6d4','#ec4899','#6366f1',
];
function avatarColor(name) {
  const first = [...name].find(c => /\p{L}/u.test(c)) ?? 'A';
  return PALETTE[first.toUpperCase().charCodeAt(0) % PALETTE.length];
}
function avatarLetter(name) {
  return ([...name].find(c => /\p{L}/u.test(c))?.toUpperCase()) ?? '?';
}
function activityInfo(weeklyCount) {
  if (weeklyCount >= 10) return { label: 'Muy activo', color: '#22c55e' };
  if (weeklyCount >= 4)  return { label: 'Activo',     color: '#f59e0b' };
  return                        { label: 'Bajo',        color: '#f97316' };
}

// ─── Helpers de cálculo ───────────────────────────────────────────────────────
function canAccess(user) {
  if (!user) return false;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

function fmtMins(mins) {
  if (!mins) return '0m';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const p = [];
  if (d) p.push(`${d}d`);
  if (h) p.push(`${h}h`);
  if (m || !p.length) p.push(`${m}m`);
  return p.join(' ');
}

function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function shortDay(dateStr) {
  try {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(dateStr));
  } catch { return dateStr.slice(5); }
}

function filterByPeriod(jails, periodDays) {
  if (!periodDays) return jails;
  const cutoff = Date.now() - periodDays * 86_400_000;
  return jails.filter(j => new Date(j.ts).getTime() >= cutoff);
}

function buildActivityData(jails, periodDays) {
  const days = periodDays > 0 ? Math.min(periodDays, 60) : 30;
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const count = jails.filter(j => dayKey(j.ts) === key).length;
    result.push({ key, label: shortDay(key), count });
  }
  return result;
}

// ─── Parseo de logs ───────────────────────────────────────────────────────────
function extractAdmin(text) {
  const m = (text ?? '').match(/\*\*Administrador:\*\*\s*([^\n*]+)/);
  return m ? m[1].trim() : null;
}

function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;
  const desc = embed.description ?? log.message ?? '';
  const field = (key) => {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m   = desc.match(new RegExp(`\\*\\*${esc}:\\*\\*\\s*([^\\n]+)`));
    return m ? m[1].trim() : null;
  };
  const durStr  = field('Duración');
  const durMins = durStr ? (parseInt(durStr.replace(/[^0-9]/g, '')) || 0) : 0;
  return {
    id:         log._id,
    title:      embed.title,
    adminName:  extractAdmin(desc),
    player:     field('Jugador encarcelado'),
    identifier: field('Identifier encarcelado'),
    motivo:     field('Motivo'),
    duracion:   durStr,
    durMins,
    isOnline:   embed.title === 'Items Removidos - Jail',
    ts:         log.timestamp ?? log.createdAt,
  };
}

// ─── Fetching ─────────────────────────────────────────────────────────────────
async function fetchAdminJails(adminName, signal) {
  const seen  = new Set();
  const jails = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const url =
      `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
      `?q=${encodeURIComponent(adminName)}&limit=${PAGE_LIMIT}&page=${page}&cId=${JAIL_CH_ID}`;
    const res  = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    totalPages = data.totalPages ?? 1;
    for (const log of data.logs ?? []) {
      if (seen.has(log._id)) continue;
      seen.add(log._id);
      const parsed = parseLog(log);
      if (!parsed?.adminName) continue;
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

// ─── Componentes UI ───────────────────────────────────────────────────────────

// Stat card para cabecera global
function GlobalStatCard({ icon: Icon, value, label, color = 'var(--red)', loading }) {
  return (
    <div style={{
      flex: '1 1 130px', minWidth: 0,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        {loading
          ? <div style={{ height: 22, width: 48, borderRadius: 4, background: 'var(--border)' }} />
          : <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        }
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// Stat card para el dashboard de admin
function DashStatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      borderTop: `3px solid ${accent ?? 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

// Gráfico de barras de actividad diaria
function ActivityChart({ data }) {
  const max        = Math.max(...data.map(d => d.count), 1);
  const showLabels = data.length <= 14;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, padding: '0 4px' }}>
        {data.map(d => (
          <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {d.count > 0 && data.length <= 20 && (
              <div style={{ fontSize: 9, color: 'var(--text3)', lineHeight: 1 }}>{d.count}</div>
            )}
            <div
              title={`${d.label}: ${d.count} jail${d.count !== 1 ? 's' : ''}`}
              style={{
                width: '100%',
                height: `${Math.max((d.count / max) * 60, d.count > 0 ? 4 : 2)}px`,
                background: d.count > 0 ? 'var(--red)' : 'var(--surface2)',
                borderRadius: '3px 3px 0 0',
                opacity: d.count > 0 ? .85 : .3,
                transition: 'height .4s',
                minHeight: 2,
              }}
            />
          </div>
        ))}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 3, padding: '0 4px' }}>
          {data.map(d => (
            <div key={d.key} style={{
              flex: 1, fontSize: 9, color: 'var(--text3)',
              textAlign: 'center', overflow: 'hidden', minWidth: 0,
            }}>
              {d.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Barra de motivo
function MotivoBar({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{
        flex: 1, fontSize: 11, color: 'var(--text2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={label}>{label}</div>
      <div style={{
        width: 90, height: 14, background: 'var(--surface2)',
        borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, right: 'auto',
          width: `${pct}%`, background: 'var(--red)',
          borderRadius: 3, opacity: .7, transition: 'width .5s',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  );
}

// Badge online/offline (detalle)
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

// Lista de jails recientes
function RecentList({ jails, showAll }) {
  const items = showAll ? jails : jails.slice(0, 12);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      {items.length === 0
        ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
            Sin registros en este período
          </div>
        : items.map((j, i) => (
          <div key={j.id} style={{
            display: 'flex', gap: 10, padding: '9px 14px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'flex-start',
          }}>
            <div style={{ paddingTop: 1, flexShrink: 0 }}><JailBadge isOnline={j.isOnline} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text)',
                marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {j.player ?? (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)' }}>
                    {j.identifier}
                  </span>
                ) ?? '—'}
              </div>
              {j.motivo && (
                <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {j.motivo}
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
              <div>{j.duracion ?? '—'}</div>
              <div style={{ marginTop: 1 }}>{fmtTimeRelative(j.ts)}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// Dashboard completo de un admin
function AdminDashboard({ admin, jails: allJails, onBack }) {
  const [periodIdx, setPeriodIdx] = useState(1);
  const [showAll,   setShowAll]   = useState(false);

  const period = PERIODS[periodIdx];
  const jails  = filterByPeriod(allJails, period.days);

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

  const activity = buildActivityData(jails, period.days || 30);
  const busiest  = activity.reduce((b, d) => d.count > b.count ? d : b, { count: 0, label: '—' });

  const allTimeMins = allJails.reduce((s, j) => s + (j.durMins ?? 0), 0);
  const avg30       = (allJails.filter(j => new Date(j.ts).getTime() >= Date.now() - 30 * 86400000).length / 30).toFixed(1);

  const aColor  = avatarColor(admin.name);
  const aLetter = avatarLetter(admin.name);

  return (
    <div className="section active">

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
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

        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: aColor + '22', border: `2px solid ${aColor}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: aColor,
        }}>
          {aLetter}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{admin.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {allJails.length.toLocaleString('es')} jails en total
          </div>
        </div>
      </div>

      {/* Selector de período */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' }}>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            className={`btns${periodIdx === i ? ' active' : ''}`}
            style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => { setPeriodIdx(i); setShowAll(false); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <DashStatCard
          icon={<AlertTriangle size={11} />}
          label="Total jails"
          value={total}
          sub={period.days ? `En ${period.label.toLowerCase()}` : 'Sin filtro'}
          accent="var(--red)"
        />
        <DashStatCard
          icon={<TrendingUp size={11} />}
          label="Online"
          value={online}
          sub={total > 0 ? `${Math.round((online / total) * 100)}% del total` : '—'}
          accent="#22c55e"
        />
        <DashStatCard
          icon={<User size={11} />}
          label="Offline"
          value={offline}
          sub={total > 0 ? `${Math.round((offline / total) * 100)}% del total` : '—'}
          accent="var(--text3)"
        />
        <DashStatCard
          icon={<Clock size={11} />}
          label="Tiempo total"
          value={fmtMins(totalMins)}
          sub={`${totalMins.toLocaleString('es')} min`}
          accent="var(--orange, #f97316)"
        />
      </div>

      {/* Gráfico de actividad */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Actividad diaria</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
            {period.days > 0 ? `Últimos ${period.days} días` : 'Últimos 30 días'}
            {busiest.count > 0 && (
              <> · Día pico: <strong style={{ color: 'var(--text2)' }}>{busiest.label}</strong> ({busiest.count})</>
            )}
          </div>
        </div>
        {total === 0
          ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)' }}>
              Sin actividad en este período
            </div>
          : <ActivityChart data={activity} />
        }
      </div>

      {/* Motivos + jails recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
            Motivos más frecuentes
          </div>
          {motivos.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin datos en este período</div>
            : motivos.map(m => <MotivoBar key={m.label} label={m.label} count={m.count} maxCount={maxMot} />)
          }
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
              Últimas sanciones del período
            </div>
            {jails.length > 12 && (
              <button
                onClick={() => setShowAll(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--red)', padding: 0,
                }}
              >
                {showAll ? 'Ver menos' : `Ver todos (${jails.length})`}
              </button>
            )}
          </div>
          <RecentList jails={jails} showAll={showAll} />
        </div>
      </div>

      {/* Resumen histórico */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 18px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
          Resumen histórico
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>
              {allJails.length.toLocaleString('es')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails registrados</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--orange, #f97316)' }}>
              {fmtMins(allTimeMins)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>tiempo total acumulado</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>
              {avg30}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails/día (últ. 30d)</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
              {allJails.length > 0 ? `${Math.round((allJails.filter(j => j.isOnline).length / allJails.length) * 100)}%` : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>reportes online</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AdminCard (overview) ─────────────────────────────────────────────────────
function AdminCard({ admin, data, rank, maxWeekly, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const { status, jails = [], error } = data;
  const loading = status === 'loading';
  const done    = status === 'done';

  const now        = Date.now();
  const total      = jails.length;
  const weekly     = jails.filter(j => new Date(j.ts).getTime() >= now - WEEK_MS).length;
  const online     = jails.filter(j => j.isOnline).length;
  const offline    = jails.filter(j => !j.isOnline).length;
  const onlinePct  = total > 0 ? Math.round((online / total) * 100) : 0;
  const weeklyPct  = maxWeekly > 0 ? Math.round((weekly / maxWeekly) * 100) : 0;
  const lastJail   = jails[0];

  const { label: actLabel, color: actColor } = activityInfo(weekly);
  const aColor  = avatarColor(admin.name);
  const aLetter = avatarLetter(admin.name);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 11,
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,.08)' : 'none',
      }}
    >
      {/* Avatar + nombre + posición */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: aColor + '22', border: `2px solid ${aColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: aColor,
        }}>
          {aLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {admin.name}
          </div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text3)',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 5, padding: '2px 6px', flexShrink: 0,
        }}>
          #{rank}
        </div>
      </div>

      {/* Número grande */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
          <span className="spinner" style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Cargando…</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minHeight: 40 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', color: 'var(--text3)', textTransform: 'uppercase' }}>
            JAILS
          </span>
        </div>
      )}

      {/* Actividad + delta semana */}
      {done && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: actColor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{actLabel}</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: actColor,
            background: actColor + '18', border: `1px solid ${actColor}30`,
            borderRadius: 4, padding: '2px 7px',
          }}>
            +{weekly} esta semana
          </span>
        </div>
      )}

      {/* Barras de progreso */}
      {done && total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${onlinePct}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              transition: 'width .4s',
            }} />
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${weeklyPct}%`,
              background: actColor,
              transition: 'width .4s',
            }} />
          </div>
        </div>
      )}

      {/* Badges online/offline */}
      {done && total > 0 && (
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '4px 6px', borderRadius: 6,
            background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.22)',
          }}>
            <Wifi size={10} style={{ color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>{online}</span>
            <span style={{ fontSize: 10, color: '#22c55e', opacity: .7 }}>online</span>
          </div>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '4px 6px', borderRadius: 6,
            background: 'var(--surface2)', border: '1px solid var(--border)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{offline}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>offline</span>
          </div>
        </div>
      )}

      {/* Footer */}
      {done && total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{onlinePct}% reportes online</span>
          {lastJail && <span style={{ fontSize: 10, color: 'var(--text3)' }}>activo {fmtTimeRelative(lastJail.ts)}</span>}
        </div>
      )}

      {done && total === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '6px 0' }}>Sin registros</div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: 11, color: 'var(--red)', opacity: .8 }}>Error al cargar</div>
      )}

      {/* Botón */}
      {done && total > 0 && (
        <button
          onClick={() => onSelect(admin)}
          style={{
            background: hovered ? 'var(--red)' : 'var(--surface2)',
            border: `1px solid ${hovered ? 'var(--red)' : 'var(--border2)'}`,
            borderRadius: 7, padding: '7px 12px', cursor: 'pointer',
            fontSize: 12, color: hovered ? '#fff' : 'var(--text2)',
            fontWeight: 500, transition: 'all .15s', textAlign: 'center',
          }}
        >
          Ver dashboard →
        </button>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReportesIlegales({ user }) {
  const hasAccess = canAccess(user);

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

  if (!hasAccess) {
    return (
      <div className="section active">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px', gap: 14, color: 'var(--text3)',
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

  // ── Vista dashboard de admin ───────────────────────────────────────────────
  if (view === 'dashboard' && selected) {
    const data  = adminData[selected.name];
    const jails = [...(data?.jails ?? [])].sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return (
      <AdminDashboard
        admin={selected}
        jails={jails}
        onBack={() => { setView('overview'); setSelected(null); }}
      />
    );
  }

  // ── Vista overview ─────────────────────────────────────────────────────────
  const loadedCount = Object.values(adminData).filter(d => d.status === 'done' || d.status === 'error').length;
  const allDone     = loadedCount === ADMINS.length;
  const loading     = loadedCount === 0;
  const now         = Date.now();

  const allJails    = Object.values(adminData).flatMap(d => d.jails ?? []);
  const totalJails  = allJails.length;
  const totalOnline = allJails.filter(j => j.isOnline).length;
  const totalWeekly = allJails.filter(j => new Date(j.ts).getTime() >= now - WEEK_MS).length;

  const filtered = filter
    ? ADMINS.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()))
    : [...ADMINS];

  const sorted = [...filtered].sort((a, b) => {
    const da = adminData[a.name];
    const db = adminData[b.name];
    if (sortBy === 'count') return (db.jails?.length ?? 0) - (da.jails?.length ?? 0);
    if (sortBy === 'activity') {
      const wa = (da.jails ?? []).filter(j => new Date(j.ts).getTime() >= now - WEEK_MS).length;
      const wb = (db.jails ?? []).filter(j => new Date(j.ts).getTime() >= now - WEEK_MS).length;
      return wb - wa;
    }
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });

  const maxWeekly = Math.max(
    1,
    ...Object.values(adminData).map(d =>
      (d.jails ?? []).filter(j => new Date(j.ts).getTime() >= now - WEEK_MS).length
    )
  );

  return (
    <div className="section active">
      {/* Cabecera */}
      <div className="pg-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={15} style={{ color: 'var(--red)' }} />
            Reportes Ilegales
          </div>
          <div className="pg-sub">
            {allDone
              ? `${ADMINS.length} administradores · ${totalJails.toLocaleString('es')} jails en total · ${totalWeekly} esta semana`
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
            fontSize: 12, color: 'var(--text2)', transition: 'border-color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Barra de carga */}
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

      {/* Stats globales */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <GlobalStatCard icon={Users}      value={ADMINS.length}                   label="en el equipo"        color="var(--blue)"   loading={false}   />
        <GlobalStatCard icon={Shield}     value={totalJails.toLocaleString('es')} label="histórico acumulado" color="var(--red)"    loading={loading} />
        <GlobalStatCard icon={Wifi}       value={totalOnline.toLocaleString('es')}label="reportes online"     color="#22c55e"       loading={loading} />
        <GlobalStatCard icon={TrendingUp} value={`+${totalWeekly}`}               label="actividad reciente"  color="var(--orange, #f97316)" loading={loading} />
      </div>

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
            { key: 'count',    label: '↓ Jails'  },
            { key: 'activity', label: 'Actividad' },
            { key: 'name',     label: 'A – Z'     },
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

      {/* Grid auto-fill */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 12,
      }}>
        {sorted.map((admin, idx) => (
          <AdminCard
            key={admin.name}
            admin={admin}
            data={adminData[admin.name]}
            rank={idx + 1}
            maxWeekly={maxWeekly}
            onSelect={(a) => { setSelected(a); setView('dashboard'); }}
          />
        ))}
      </div>
    </div>
  );
}
