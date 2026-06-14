'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BarChart2, RefreshCw, Lock,
  Users, Shield, TrendingUp,
  AlertTriangle, Clock, User, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { FM_PROJECT_ID, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Configuración ────────────────────────────────────────────────────────────
const LOG_CH_ID     = '69d3a41db036cafed646d85a';
const ALLOWED_IDS   = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE  = '1487429315992879114';
const PAGE_LIMIT    = 50;
const BATCH         = 5;
const WEEK_MS       = 7 * 24 * 60 * 60 * 1000;
const ROWS_PER_PAGE = 15;

const PERIODS = [
  { label: 'Hoy',         days: 1  },
  { label: 'Esta semana', days: 7  },
  { label: '2 semanas',   days: 14 },
  { label: 'Este mes',    days: 30 },
  { label: 'Todo',        days: 0  },
];

const STAFF = [
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
const PALETTE = ['#ef4444','#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#6366f1'];
function avatarColor(name) {
  const c = [...name].find(c => /\p{L}/u.test(c)) ?? 'A';
  return PALETTE[c.toUpperCase().charCodeAt(0) % PALETTE.length];
}
function avatarLetter(name) {
  return ([...name].find(c => /\p{L}/u.test(c))?.toUpperCase()) ?? '?';
}
function activityInfo(w) {
  if (w >= 10) return { label: 'Muy activo', color: '#22c55e' };
  if (w >= 4)  return { label: 'Activo',     color: '#f59e0b' };
  return              { label: 'Bajo',        color: '#f97316' };
}
function canAccess(user) {
  if (!user) return false;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}
function dayKey(ts)   { return new Date(ts).toISOString().slice(0, 10); }
function shortDay(ds) {
  try { return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(ds)); }
  catch { return ds.slice(5); }
}
function filterByPeriod(logs, days) {
  if (!days) return logs;
  const cut = Date.now() - days * 86_400_000;
  return logs.filter(l => new Date(l.ts).getTime() >= cut);
}
function buildActivityData(logs, periodDays) {
  const days = periodDays > 0 ? Math.min(periodDays, 60) : 30;
  const now  = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d   = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: shortDay(key), count: logs.filter(l => dayKey(l.ts) === key).length };
  });
}

// ─── Parse / Fetch ────────────────────────────────────────────────────────────
function extractAdmin(text) {
  const m = (text ?? '').match(/\*\*Administrador:\*\*\s*([^\n*]+)/);
  return m ? m[1].trim() : null;
}
function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  const desc  = embed?.description ?? log.message ?? '';
  const admin = extractAdmin(desc);
  if (!admin) return null;
  return {
    id:    log._id,
    admin,
    title: embed?.title ?? 'Acción',
    ts:    log.timestamp ?? log.createdAt,
    desc,
  };
}
async function fetchStaffLogs(staffName, signal) {
  const seen = new Set(), logs = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
      `?q=${encodeURIComponent(staffName)}&limit=${PAGE_LIMIT}&page=${page}&cId=${LOG_CH_ID}`;
    const res  = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    totalPages = data.totalPages ?? 1;
    for (const log of data.logs ?? []) {
      if (seen.has(log._id)) continue;
      seen.add(log._id);
      const p = parseLog(log);
      if (!p?.admin || p.admin.toLowerCase() !== staffName.toLowerCase()) continue;
      logs.push(p);
    }
    page++;
    if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
  }
  return logs;
}
async function loadAllInBatches(staff, onUpdate, signal) {
  for (let i = 0; i < staff.length; i += BATCH) {
    if (signal?.aborted) break;
    await Promise.allSettled(
      staff.slice(i, i + BATCH).map(async (s) => {
        try {
          const logs = await fetchStaffLogs(s.name, signal);
          if (!signal?.aborted) onUpdate(s.name, { status: 'done', logs });
        } catch (e) {
          if (!signal?.aborted) onUpdate(s.name, { status: 'error', logs: [], error: e.message });
        }
      })
    );
  }
}

// ─── Componentes globales ─────────────────────────────────────────────────────
function GlobalStatCard({ icon: Icon, value, label, color = 'var(--blue)', loading }) {
  return (
    <div style={{
      flex: '1 1 130px', minWidth: 0,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ─── Componentes del dashboard de staff ──────────────────────────────────────
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
              title={`${d.label}: ${d.count} acción${d.count !== 1 ? 'es' : ''}`}
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

function TipoBar({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
        {label}
      </div>
      <div style={{ width: 90, height: 14, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, right: 'auto', width: `${pct}%`, background: 'var(--blue)', borderRadius: 3, opacity: .7, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  );
}

function ActionBadge({ title }) {
  const short = (title ?? 'Acción').slice(0, 22);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      letterSpacing: '.3px', whiteSpace: 'nowrap',
      background: 'rgba(99,102,241,.12)',
      color: '#818cf8',
      border: '1px solid rgba(99,102,241,.25)',
      maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block',
    }} title={title}>
      {short}
    </span>
  );
}

// Tabla de registros con paginación
function LogsTable({ logs }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(logs.length / ROWS_PER_PAGE);
  const slice = logs.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  useEffect(() => { setPage(0); }, [logs.length]);

  if (logs.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '28px 16px', textAlign: 'center',
        fontSize: 12, color: 'var(--text3)',
      }}>
        Sin registros en este período
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        {/* Cabecera */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 72px',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)',
          fontSize: 10, fontWeight: 700, letterSpacing: '.4px',
          textTransform: 'uppercase', color: 'var(--text3)',
          gap: 10,
        }}>
          <div>Acción</div>
          <div style={{ textAlign: 'right' }}>Hace</div>
        </div>

        {/* Filas */}
        {slice.map((l, i) => (
          <div
            key={l.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 72px',
              padding: '9px 14px',
              borderBottom: i < slice.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              gap: 10,
              transition: 'background .1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ minWidth: 0 }}>
              <ActionBadge title={l.title} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right', whiteSpace: 'nowrap' }}>
              {fmtTimeRelative(l.ts)}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', cursor: page === 0 ? 'default' : 'pointer',
              fontSize: 11, color: page === 0 ? 'var(--text3)' : 'var(--text2)',
              opacity: page === 0 ? .45 : 1,
            }}
          >
            <ChevronLeft size={12} /> Anterior
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              Página <strong style={{ color: 'var(--text2)' }}>{page + 1}</strong> de {totalPages}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>({logs.length} registros)</span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px',
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              fontSize: 11, color: page >= totalPages - 1 ? 'var(--text3)' : 'var(--text2)',
              opacity: page >= totalPages - 1 ? .45 : 1,
            }}
          >
            Siguiente <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// Lista reciente (panel derecho)
function RecentLogs({ logs }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
      maxHeight: 440, overflowY: 'auto',
    }}>
      {logs.length === 0
        ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
            Sin registros en este período
          </div>
        : logs.map((l, i) => (
          <div key={l.id} style={{
            display: 'flex', gap: 10, padding: '10px 14px',
            borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ paddingTop: 1, flexShrink: 0 }}>
              <ActionBadge title={l.title} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right', marginLeft: 'auto' }}>
              {fmtTimeRelative(l.ts)}
            </div>
          </div>
        ))
      }
    </div>
  );
}

// Dashboard completo de un staff
function StaffDashboard({ staff, logs: allLogs, onBack }) {
  const [periodIdx, setPeriodIdx] = useState(1);
  const period = PERIODS[periodIdx];
  const logs   = filterByPeriod(allLogs, period.days);
  const total  = logs.length;

  const tipoMap = new Map();
  for (const l of logs) {
    const t = (l.title ?? 'Acción').trim();
    tipoMap.set(t, (tipoMap.get(t) ?? 0) + 1);
  }
  const tipos   = [...tipoMap.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const maxTipo = tipos[0]?.count ?? 1;

  const activity = buildActivityData(logs, period.days || 30);
  const busiest  = activity.reduce((b, d) => d.count > b.count ? d : b, { count: 0, label: '—' });

  const avg30 = (allLogs.filter(l => new Date(l.ts).getTime() >= Date.now() - 30 * 86400000).length / 30).toFixed(1);

  const aColor  = avatarColor(staff.name);
  const aLetter = avatarLetter(staff.name);

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
          }}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{staff.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {allLogs.length.toLocaleString('es')} acciones en total
            {allLogs[0] && <> · activo {fmtTimeRelative(allLogs[0].ts)}</>}
          </div>
        </div>
      </div>

      {/* Período */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' }}>
        {PERIODS.map((p, i) => (
          <button key={i} className={`btns${periodIdx === i ? ' active' : ''}`} style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => setPeriodIdx(i)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <DashStatCard icon={<AlertTriangle size={11} />} label="Total acciones" value={total} sub={period.days ? `En ${period.label.toLowerCase()}` : 'Sin filtro'} accent="var(--blue)" />
        <DashStatCard icon={<Clock size={11} />} label="Tipos distintos" value={tipos.length} sub="tipos de log" accent="#f59e0b" />
        <DashStatCard icon={<TrendingUp size={11} />} label="Prom. diario" value={avg30} sub="últ. 30 días" accent="#22c55e" />
        <DashStatCard icon={<FileText size={11} />} label="Total histórico" value={allLogs.length.toLocaleString('es')} sub="sin filtro" accent="var(--text3)" />
      </div>

      {/* Actividad diaria */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Actividad diaria</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {period.days > 0 ? `Últimos ${period.days} días` : 'Últimos 30 días'}
            {busiest.count > 0 && <> · Día pico: <strong style={{ color: 'var(--text2)' }}>{busiest.label}</strong> ({busiest.count})</>}
          </div>
        </div>
        {total === 0
          ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)' }}>Sin actividad en este período</div>
          : <ActivityChart data={activity} />
        }
      </div>

      {/* Tipos + Últimas acciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>Tipos de acción más frecuentes</div>
          {tipos.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin datos en este período</div>
            : tipos.map(t => <TipoBar key={t.label} label={t.label} count={t.count} maxCount={maxTipo} />)
          }
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Últimas acciones del período</div>
          <RecentLogs logs={logs} />
        </div>
      </div>

      {/* Resumen histórico */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>Resumen histórico</div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{allLogs.length.toLocaleString('es')}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>acciones registradas</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{new Set(allLogs.map(l => l.title)).size}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>tipos de acción distintos</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>{avg30}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>acciones/día (últ. 30d)</div>
          </div>
        </div>
      </div>

      {/* Todos los registros paginados */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          Registros del período
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>— {logs.length} registros</span>
        </div>
        <LogsTable logs={logs} />
      </div>
    </div>
  );
}

// ─── StaffCard (overview) ─────────────────────────────────────────────────────
function StaffCard({ staff, data, rank, maxPeriod, period, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const { status, logs: allLogs = [] } = data;
  const loading = status === 'loading';
  const done    = status === 'done';

  const logs       = filterByPeriod(allLogs, period.days);
  const total      = logs.length;
  const periodPct  = maxPeriod > 0 ? Math.round((total / maxPeriod) * 100) : 0;
  const lastLog    = allLogs[0];

  const weekly = allLogs.filter(l => new Date(l.ts).getTime() >= Date.now() - WEEK_MS).length;
  const { label: actLabel, color: actColor } = activityInfo(weekly);
  const aColor  = avatarColor(staff.name);
  const aLetter = avatarLetter(staff.name);

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
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {staff.name}
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
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
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', color: 'var(--text3)', textTransform: 'uppercase' }}>ACCIONES</span>
        </div>
      )}

      {/* Actividad */}
      {done && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: actColor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{actLabel}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: actColor, background: actColor + '18', border: `1px solid ${actColor}30`, borderRadius: 4, padding: '2px 7px' }}>
            +{total} {period.label.toLowerCase()}
          </span>
        </div>
      )}

      {/* Barra relativa */}
      {done && total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, width: `${periodPct}%`, background: 'var(--blue)', transition: 'width .4s' }} />
          </div>
        </div>
      )}

      {done && total === 0 && <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '6px 0' }}>Sin registros</div>}
      {status === 'error' && <div style={{ fontSize: 11, color: 'var(--red)', opacity: .8 }}>Error al cargar</div>}

      {/* Footer */}
      {done && total > 0 && lastLog && (
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
          activo {fmtTimeRelative(lastLog.ts)}
        </div>
      )}

      {done && total > 0 && (
        <button
          onClick={() => onSelect(staff)}
          style={{
            background: hovered ? 'var(--blue)' : 'var(--surface2)',
            border: `1px solid ${hovered ? 'var(--blue)' : 'var(--border2)'}`,
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
export default function ReportesGenerales({ user }) {
  const hasAccess = canAccess(user);

  const [view,      setView]      = useState('overview');
  const [selected,  setSelected]  = useState(null);
  const [sortBy,    setSortBy]    = useState('count');
  const [filter,    setFilter]    = useState('');
  const [periodIdx, setPeriodIdx] = useState(1);
  const [staffData, setStaffData] = useState(() => {
    const d = {};
    for (const s of STAFF) d[s.name] = { status: 'idle', logs: [] };
    return d;
  });
  const abortRef = useRef(null);

  function updateStaff(name, patch) {
    setStaffData(prev => ({ ...prev, [name]: patch }));
  }
  function startLoad() {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStaffData(() => {
      const d = {};
      for (const s of STAFF) d[s.name] = { status: 'loading', logs: [] };
      return d;
    });
    loadAllInBatches(STAFF, updateStaff, ctrl.signal);
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 14, color: 'var(--text3)' }}>
          <Lock size={36} style={{ opacity: .35 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>Acceso restringido</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>Solo el equipo autorizado puede ver esta sección.</div>
        </div>
      </div>
    );
  }

  // Vista dashboard individual
  if (view === 'dashboard' && selected) {
    const data = staffData[selected.name];
    const logs = [...(data?.logs ?? [])].sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return (
      <StaffDashboard
        staff={selected}
        logs={logs}
        onBack={() => { setView('overview'); setSelected(null); }}
      />
    );
  }

  // Vista overview
  const loadedCount = Object.values(staffData).filter(d => d.status === 'done' || d.status === 'error').length;
  const allDone     = loadedCount === STAFF.length;
  const isLoading   = loadedCount === 0;
  const now         = Date.now();

  const period     = PERIODS[periodIdx];
  const allLogs    = Object.values(staffData).flatMap(d => d.logs ?? []);
  const periodLogs = filterByPeriod(allLogs, period.days);
  const totalLogs  = periodLogs.length;
  const totalWeekly = allLogs.filter(l => new Date(l.ts).getTime() >= now - WEEK_MS).length;

  const filtered = filter
    ? STAFF.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))
    : [...STAFF];

  const sorted = [...filtered].sort((a, b) => {
    const da = staffData[a.name], db = staffData[b.name];
    if (sortBy === 'count') {
      return filterByPeriod(db.logs ?? [], period.days).length - filterByPeriod(da.logs ?? [], period.days).length;
    }
    if (sortBy === 'activity') {
      const wa = (da.logs ?? []).filter(l => new Date(l.ts).getTime() >= now - WEEK_MS).length;
      const wb = (db.logs ?? []).filter(l => new Date(l.ts).getTime() >= now - WEEK_MS).length;
      return wb - wa;
    }
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });

  const maxPeriod = Math.max(1, ...Object.values(staffData).map(d =>
    filterByPeriod(d.logs ?? [], period.days).length
  ));

  return (
    <div className="section active">
      <div className="pg-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={15} style={{ color: 'var(--blue)' }} />
            Reportes Generales
          </div>
          <div className="pg-sub">
            {allDone
              ? `${STAFF.length} staff · ${totalLogs.toLocaleString('es')} acciones · ${totalWeekly} esta semana`
              : `Cargando… ${loadedCount} / ${STAFF.length}`}
          </div>
        </div>
        <button
          onClick={startLoad}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text2)' }}
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Barra de progreso */}
      {!allDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'var(--blue)', width: `${Math.round((loadedCount / STAFF.length) * 100)}%`, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {/* Período */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {PERIODS.map((p, i) => (
          <button key={i} className={`btns${periodIdx === i ? ' active' : ''}`} style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => setPeriodIdx(i)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Global stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <GlobalStatCard icon={Users}      value={STAFF.length}                   label="en el equipo"       color="var(--blue)"   loading={false}     />
        <GlobalStatCard icon={Shield}     value={totalLogs.toLocaleString('es')} label={`acciones ${period.label.toLowerCase()}`} color="#8b5cf6" loading={isLoading} />
        <GlobalStatCard icon={TrendingUp} value={`+${totalWeekly}`}              label="actividad reciente" color="#22c55e"        loading={isLoading} />
        <GlobalStatCard icon={FileText}   value={new Set(periodLogs.map(l => l.title)).size} label="tipos de acción" color="#f59e0b" loading={isLoading} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: .4, pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
          </svg>
          <input className="fm-search-input" placeholder="Filtrar staff…" value={filter} onChange={e => setFilter(e.target.value)} style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ key: 'count', label: '↓ Acciones' }, { key: 'activity', label: 'Actividad' }, { key: 'name', label: 'A – Z' }].map(opt => (
            <button key={opt.key} className={`btns${sortBy === opt.key ? ' active' : ''}`} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setSortBy(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
        {sorted.map((staff, idx) => (
          <StaffCard
            key={staff.name}
            staff={staff}
            data={staffData[staff.name]}
            rank={idx + 1}
            maxPeriod={maxPeriod}
            period={period}
            onSelect={(s) => { setSelected(s); setView('dashboard'); }}
          />
        ))}
      </div>
    </div>
  );
}
