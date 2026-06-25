'use client';

import { useEffect, useRef, useState } from 'react';
import { Package, RefreshCw, Lock, AlertTriangle, User, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { FM_PROJECT_ID, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Config ───────────────────────────────────────────────────────────────────
const GIVE_CH_ID    = '69d39606438bd79dd2a182fc';
const ALLOWED_IDS   = new Set(['343822757911330817', '752975491228500019','1484372154022756362']);
const ALLOWED_ROLE  = '1487429315992879114';
const SUPER_ROLES  = new Set(['1484372151111782510','1484372154022756362']);

const PAGE_LIMIT    = 100;
const MAX_PAGES_ALL = 100;
const RECORDS_PER_PAGE = 15;

const VALID_TITLES = new Set(['GiveItem', 'AddItem']);

const PERIODS = [
  { label: 'Hoy',         days: 1  },
  { label: 'Esta semana', days: 7  },
  { label: '2 semanas',   days: 14 },
  { label: 'Este mes',    days: 30 },
  { label: 'Todo',        days: 0  },
];

const PALETTE = ['#ef4444','#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#6366f1'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function canAccess(user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.some(role => SUPER_ROLES.has(role))) return true;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

function avatarColor(name) {
  const c = [...name].find(c => /\p{L}/u.test(c)) ?? 'A';
  return PALETTE[c.toUpperCase().charCodeAt(0) % PALETTE.length];
}
function avatarLetter(name) {
  return ([...name].find(c => /\p{L}/u.test(c))?.toUpperCase()) ?? '?';
}

// "admin" ha dado NxITEM a "player"
const LOG_RE = /^"([^"]+)" ha dado (\d+)x ([^\s]+) a "([^"]+)"/;

function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;
  const msg = embed.description ?? log.message ?? '';
  const m   = msg.match(LOG_RE);
  if (!m) return null;
  const admin  = m[1].trim();
  const amount = parseInt(m[2]);
  const item   = m[3].trim();
  const player = m[4].trim();
  return {
    id:       log._id,
    type:     embed.title,
    admin,
    amount,
    item,
    player,
    selfGive: admin.toLowerCase() === player.toLowerCase(),
    ts:       log.timestamp ?? log.createdAt,
  };
}

function dayKey(ts)   { return new Date(ts).toISOString().slice(0, 10); }
function shortDay(ds) {
  try { return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(ds)); }
  catch { return ds.slice(5); }
}

function buildActivityData(records, periodDays) {
  const days = periodDays > 0 ? Math.min(periodDays, 60) : 30;
  const now  = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d   = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: shortDay(key), count: records.filter(r => dayKey(r.ts) === key).length };
  });
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchGiveLogs(periodDays, onProgress, signal) {
  const cutoff   = periodDays > 0 ? Date.now() - periodDays * 86_400_000 : 0;
  const maxPages = periodDays === 0 ? MAX_PAGES_ALL : 9999;
  const seen = new Set();
  const records = [];
  let page = 1, totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
      `?q=${encodeURIComponent('ha dado')}&limit=${PAGE_LIMIT}&page=${page}&cId=${GIVE_CH_ID}`;
    const res  = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    totalPages = Math.min(data.totalPages ?? 1, maxPages);
    onProgress?.(page, totalPages);

    for (const log of data.logs ?? []) {
      if (seen.has(log._id)) continue;
      seen.add(log._id);
      const ts = new Date(log.timestamp ?? log.createdAt).getTime();
      if (cutoff > 0 && ts < cutoff) continue;
      const parsed = parseLog(log);
      if (parsed) records.push(parsed);
    }

    // Si el último log de la página ya es más viejo que el corte, paramos
    const lastLog = data.logs?.[data.logs.length - 1];
    if (lastLog && cutoff > 0) {
      const lastTs = new Date(lastLog.timestamp ?? lastLog.createdAt).getTime();
      if (lastTs < cutoff) break;
    }

    page++;
    if (page <= totalPages && page <= maxPages) await new Promise(r => setTimeout(r, 80));
  }

  return records.sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

// ─── UI Components ────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const isGive = type === 'GiveItem';
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      letterSpacing: '.4px', whiteSpace: 'nowrap', textTransform: 'uppercase',
      background: isGive ? 'rgba(59,130,246,.13)' : 'rgba(139,92,246,.13)',
      color:      isGive ? '#3b82f6'               : '#8b5cf6',
      border:    `1px solid ${isGive ? 'rgba(59,130,246,.28)' : 'rgba(139,92,246,.28)'}`,
    }}>
      {type}
    </span>
  );
}

function DashStatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      borderTop: `3px solid ${accent ?? 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
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
              title={`${d.label}: ${d.count} uso${d.count !== 1 ? 's' : ''}`}
              style={{
                width: '100%',
                height: `${Math.max((d.count / max) * 68, d.count > 0 ? 5 : 2)}px`,
                background: d.count > 0 ? 'var(--blue)' : 'var(--surface2)',
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

function ItemBar({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
        {label}
      </div>
      <div style={{ width: 90, height: 14, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, right: 'auto', width: `${pct}%`, background: 'var(--blue)', borderRadius: 3, opacity: .7, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  );
}

function RecordsTable({ records }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
  const slice = records.slice(page * RECORDS_PER_PAGE, (page + 1) * RECORDS_PER_PAGE);
  useEffect(() => { setPage(0); }, [records.length]);

  if (records.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
        Sin registros
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 50px 72px', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 10, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--text3)', gap: 10 }}>
          <div>Tipo</div>
          <div>Ítem</div>
          <div>Jugador</div>
          <div style={{ textAlign: 'right' }}>Cant.</div>
          <div style={{ textAlign: 'right' }}>Hace</div>
        </div>
        {slice.map((r, i) => (
          <div
            key={r.id}
            style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 50px 72px', padding: '9px 14px', borderBottom: i < slice.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', gap: 10, transition: 'background .1s', background: r.selfGive ? 'rgba(239,68,68,.04)' : 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = r.selfGive ? 'rgba(239,68,68,.08)' : 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = r.selfGive ? 'rgba(239,68,68,.04)' : 'transparent'}
          >
            <div><TypeBadge type={r.type} /></div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.item}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              {r.selfGive && <span style={{ fontSize: 9, color: 'var(--red)', fontWeight: 700, flexShrink: 0 }}>⚠</span>}
              <span style={{ fontSize: 12, color: r.selfGive ? 'var(--red)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.player}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{r.amount}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtTimeRelative(r.ts)}</div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: page === 0 ? 'default' : 'pointer', fontSize: 11, color: page === 0 ? 'var(--text3)' : 'var(--text2)', opacity: page === 0 ? .45 : 1 }} onMouseEnter={e => { if (page > 0) e.currentTarget.style.borderColor = 'var(--border2)'; }} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <ChevronLeft size={12} /> Anterior
          </button>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            Página <strong style={{ color: 'var(--text2)' }}>{page + 1}</strong> de {totalPages}
            <span style={{ marginLeft: 6, fontSize: 10 }}>({records.length} registros)</span>
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 11, color: page >= totalPages - 1 ? 'var(--text3)' : 'var(--text2)', opacity: page >= totalPages - 1 ? .45 : 1 }} onMouseEnter={e => { if (page < totalPages - 1) e.currentTarget.style.borderColor = 'var(--border2)'; }} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            Siguiente <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Admin detail ─────────────────────────────────────────────────────────────
function AdminDashboard({ admin, records, periodDays, onBack }) {
  const aColor  = avatarColor(admin);
  const aLetter = avatarLetter(admin);

  const total         = records.length;
  const selfGives     = records.filter(r => r.selfGive).length;
  const uniqueItems   = new Set(records.map(r => r.item)).size;
  const uniquePlayers = new Set(records.map(r => r.player.toLowerCase())).size;

  const itemMap = new Map();
  for (const r of records) itemMap.set(r.item, (itemMap.get(r.item) ?? 0) + 1);
  const topItems = [...itemMap.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const maxItem  = topItems[0]?.count ?? 1;

  const activity = buildActivityData(records, periodDays || 30);
  const busiest  = activity.reduce((b, d) => d.count > b.count ? d : b, { count: 0, label: '—' });

  return (
    <div className="section active">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', padding: '0 0 10px 0', transition: 'color .15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          <ChevronLeft size={14} /> Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: aColor + '22', border: `2px solid ${aColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: aColor }}>
            {aLetter}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{admin}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {total.toLocaleString('es')} usos en el período
              {records[0] && <> · último {fmtTimeRelative(records[0].ts)}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <DashStatCard icon={<Package size={11} />}       label="Total usos"        value={total}         sub="en el período"                                            accent="var(--blue)" />
        <DashStatCard icon={<AlertTriangle size={11} />} label="Ítems únicos"      value={uniqueItems}   sub="distintos"                                                accent="#8b5cf6" />
        <DashStatCard icon={<Users size={11} />}         label="Jugadores únicos"  value={uniquePlayers} sub="destinatarios"                                            accent="#22c55e" />
        <DashStatCard icon={<AlertTriangle size={11} />} label="Auto-gives"        value={selfGives}     sub={selfGives > 0 ? '⚠ dado a sí mismo' : 'sin incidencias'} accent={selfGives > 0 ? 'var(--red)' : 'var(--text3)'} />
      </div>

      {/* Actividad diaria */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Actividad diaria</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {periodDays > 0 ? `Últimos ${periodDays} días` : 'Últimos 30 días'}
            {busiest.count > 0 && <> · Día pico: <strong style={{ color: 'var(--text2)' }}>{busiest.label}</strong> ({busiest.count})</>}
          </div>
        </div>
        {total === 0
          ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)' }}>Sin actividad</div>
          : <ActivityChart data={activity} />
        }
      </div>

      {/* Top ítems + últimas entregas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>Ítems más entregados</div>
          {topItems.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin datos</div>
            : topItems.map(it => <ItemBar key={it.label} label={it.label} count={it.count} maxCount={maxItem} />)
          }
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Últimas entregas</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
            {records.slice(0, 20).map((r, i) => (
              <div key={r.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < Math.min(records.length, 20) - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start', background: r.selfGive ? 'rgba(239,68,68,.04)' : 'transparent' }}>
                <div style={{ paddingTop: 2, flexShrink: 0 }}><TypeBadge type={r.type} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.amount}x {r.item}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {r.selfGive && <span style={{ fontSize: 9, color: 'var(--red)', fontWeight: 700 }}>⚠</span>}
                    <span style={{ fontSize: 11, color: r.selfGive ? 'var(--red)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      → {r.player}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>{fmtTimeRelative(r.ts)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla completa */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
          Todos los registros
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>— {total} en total</span>
        </div>
        <RecordsTable records={records} />
      </div>
    </div>
  );
}

// ─── Admin overview card ──────────────────────────────────────────────────────
function AdminCard({ admin, records, rank, maxCount, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const total         = records.length;
  const selfGives     = records.filter(r => r.selfGive).length;
  const uniquePlayers = new Set(records.map(r => r.player.toLowerCase())).size;

  const itemMap = new Map();
  for (const r of records) itemMap.set(r.item, (itemMap.get(r.item) ?? 0) + 1);
  const topItem = [...itemMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const lastTs  = records[0]?.ts;

  const pct     = maxCount > 0 ? Math.round((total / maxCount) * 100) : 0;
  const aColor  = avatarColor(admin);
  const aLetter = avatarLetter(admin);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,.08)' : 'none',
      }}
    >
      {/* Avatar + nombre + rank */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: aColor + '22', border: `2px solid ${aColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: aColor }}>
          {aLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin}</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
          #{rank}
        </div>
      </div>

      {/* Total grande + alerta auto-give */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', color: 'var(--text3)', textTransform: 'uppercase' }}>USOS</span>
        {selfGives > 0 && (
          <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--red)', fontWeight: 700, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.28)', borderRadius: 4, padding: '1px 5px' }}>
            ⚠ {selfGives} auto
          </span>
        )}
      </div>

      {/* Barra relativa */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: 'var(--blue)', transition: 'width .4s' }} />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Users size={10} style={{ flexShrink: 0 }} />
          {uniquePlayers} jugador{uniquePlayers !== 1 ? 'es' : ''}
        </span>
        {topItem && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={topItem[0]}>
            Top: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{topItem[0]}</span>
          </span>
        )}
      </div>

      {lastTs && (
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Último: {fmtTimeRelative(lastTs)}</div>
      )}

      <button
        onClick={() => onSelect(admin)}
        style={{ background: hovered ? 'var(--blue)' : 'var(--surface2)', border: `1px solid ${hovered ? 'var(--blue)' : 'var(--border2)'}`, borderRadius: 7, padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: hovered ? '#fff' : 'var(--text2)', fontWeight: 500, transition: 'all .15s', textAlign: 'center' }}
      >
        Ver detalle →
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GiveItemMonitor({ user }) {
  const hasAccess = canAccess(user);

  const [periodIdx, setPeriodIdx] = useState(1);
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState({ page: 0, total: 0 });
  const [error,     setError]     = useState(null);
  const [loadedAt,  setLoadedAt]  = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [sortBy,    setSortBy]    = useState('count');
  const [filter,    setFilter]    = useState('');
  const abortRef = useRef(null);

  function load(idx) {
    const period = PERIODS[idx ?? periodIdx];
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setRecords([]);
    setProgress({ page: 0, total: 0 });
    setSelected(null);
    fetchGiveLogs(period.days, (p, t) => setProgress({ page: p, total: t }), ctrl.signal)
      .then(r  => { setRecords(r); setLoadedAt(new Date()); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!hasAccess) return;
    load(1);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // ── Acceso denegado ──────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="section active">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 14, color: 'var(--text3)' }}>
          <Lock size={36} style={{ opacity: .35 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>Acceso restringido</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>Solo los coordinadores de ilegales pueden ver esta sección.</div>
        </div>
      </div>
    );
  }

  // ── Vista detalle de admin ───────────────────────────────────────────────
  if (selected) {
    const adminRecords = records.filter(r => r.admin === selected);
    return (
      <AdminDashboard
        admin={selected}
        records={adminRecords}
        periodDays={PERIODS[periodIdx].days}
        onBack={() => setSelected(null)}
      />
    );
  }

  // ── Vista overview ───────────────────────────────────────────────────────
  const adminMap = new Map();
  for (const r of records) {
    if (!adminMap.has(r.admin)) adminMap.set(r.admin, []);
    adminMap.get(r.admin).push(r);
  }

  const totalUsos    = records.length;
  const totalSelf    = records.filter(r => r.selfGive).length;
  const uniqueItems  = new Set(records.map(r => r.item)).size;
  const activeAdmins = adminMap.size;

  const adminsFiltered = filter
    ? [...adminMap.entries()].filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()))
    : [...adminMap.entries()];

  const adminsSorted = [...adminsFiltered].sort((a, b) => {
    if (sortBy === 'count')  return b[1].length - a[1].length;
    if (sortBy === 'recent') {
      const ta = new Date(a[1][0]?.ts ?? 0).getTime();
      const tb = new Date(b[1][0]?.ts ?? 0).getTime();
      return tb - ta;
    }
    return a[0].localeCompare(b[0], 'es', { sensitivity: 'base' });
  });

  const maxCount = Math.max(1, ...adminsSorted.map(([, r]) => r.length));

  return (
    <div className="section active">

      {/* Header */}
      <div className="pg-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={15} style={{ color: 'var(--blue)' }} />
            GiveItem / AddItem
          </div>
          <div className="pg-sub">
            {loading
              ? progress.total > 0
                ? `Cargando… página ${progress.page} de ${progress.total}`
                : 'Iniciando carga…'
              : loadedAt
                ? `${totalUsos.toLocaleString('es')} registros · ${activeAdmins} admins · actualizado ${fmtTimeRelative(loadedAt)}`
                : 'Monitor de entregas de ítems'
            }
          </div>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: loading ? 'default' : 'pointer', fontSize: 12, color: 'var(--text2)', opacity: loading ? .5 : 1, transition: 'border-color .15s' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border2)'; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Barra de progreso de carga */}
      {loading && progress.total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'var(--blue)', width: `${Math.round((progress.page / progress.total) * 100)}%`, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {/* Filtro de período */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            className={`btns${periodIdx === i ? ' active' : ''}`}
            style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => { setPeriodIdx(i); load(i); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert al-r" style={{ marginBottom: 14 }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {/* Stat cards globales */}
      {!loading && totalUsos > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          <DashStatCard icon={<Package size={11} />}       label="Total usos"     value={totalUsos.toLocaleString('es')} sub={PERIODS[periodIdx].label}                               accent="var(--blue)"   />
          <DashStatCard icon={<User size={11} />}          label="Admins activos" value={activeAdmins}                   sub="con registros"                                           accent="#8b5cf6"       />
          <DashStatCard icon={<AlertTriangle size={11} />} label="Ítems únicos"   value={uniqueItems}                    sub="distintos"                                               accent="#22c55e"       />
          <DashStatCard icon={<AlertTriangle size={11} />} label="Auto-gives"     value={totalSelf}                      sub={totalSelf > 0 ? '⚠ dados a sí mismo' : 'sin incidencias'} accent={totalSelf > 0 ? 'var(--red)' : 'var(--text3)'} />
        </div>
      )}

      {/* Filtro + orden */}
      {!loading && adminsSorted.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: .4, pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
            </svg>
            <input className="fm-search-input" placeholder="Filtrar admin…" value={filter} onChange={e => setFilter(e.target.value)} style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ key: 'count', label: '↓ Usos' }, { key: 'recent', label: 'Reciente' }, { key: 'name', label: 'A – Z' }].map(opt => (
              <button key={opt.key} className={`btns${sortBy === opt.key ? ' active' : ''}`} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setSortBy(opt.key)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)', fontSize: 13, padding: '30px 0' }}>
          <span className="spinner" style={{ width: 18, height: 18 }} />
          Descargando registros del canal de inventario…
          {PERIODS[periodIdx].days === 0 && (
            <span style={{ fontSize: 11, marginLeft: 4 }}>(máx. {MAX_PAGES_ALL} páginas)</span>
          )}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && adminsSorted.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--text3)' }}>
          Sin registros en este período
        </div>
      )}

      {/* Grid de cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
          {adminsSorted.map(([admin, recs], idx) => (
            <AdminCard
              key={admin}
              admin={admin}
              records={recs}
              rank={idx + 1}
              maxCount={maxCount}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
