'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Clock, AlertTriangle, Lock, TrendingUp, User } from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

const JAIL_CH_ID   = '69d3a41db036cafed646d85a';
const VALID_TITLES = new Set(['Items Removidos - Jail', 'Jugador Offline Encarcelado - Jail']);
const ALLOWED_ROLE = '1487429315992879114';
const PAGE_LIMIT   = 50;

const ADMINS = [
  { name: 'FranMacia97',         id: '659812927636897810' },
  { name: 'LorenaFlowers',       id: '752057219058630676' },
  { name: 'daviiidz_71',         id: '713393949624107058' },
  { name: 'HectorF25',           id: '343822757911330817' },
  { name: '! Voltajiho',         id: '748287186239094936' },
  { name: 'TheAkilesX',          id: '1310021491827408976' },
  { name: 'HADES',               id: '1395195029747929089' },
  { name: 'MartinV6',            id: '1032794430232592394' },
  { name: '_.marta.2002__97272', id: '1217206517443461151' },
  { name: 'Zonita',              id: '924496259530756117'  },
  { name: 'maurimol',            id: '704379432348942549'  },
  { name: 'TOKYO',               id: '1233393359578468376' },
  { name: '🔝🔥Noblesse🔥',      id: '1176005329524379779' },
  { name: 'Lil_Angelx',         id: '934932063977607241'  },
  { name: 'sir josetiin',        id: '761145782728261643'  },
  { name: 'Leeoon23',            id: '1171541693569454080' },
  { name: '! Leison',            id: '1105956450414633020' },
  { name: 'BlackFriday',         id: '914490855459532861'  },
  { name: 'gerja25',             id: '517422162647449602'  },
  { name: 'ananvi12',            id: '752975491228500019'  },
  { name: '🕷 Toñito 🕷',        id: '740030258740330576'  },
  { name: '! ivy',               id: '426166856118697997'  },
  { name: '🔱Genkar',            id: '1479936578368438283' },
  { name: 'MonoCuliao',          id: '845589598016765952'  },
  { name: 'angel',               id: '979514530721845328'  },
];

const PERIODS = [
  { label: 'Hoy',              days: 1  },
  { label: 'Esta semana',      days: 7  },
  { label: '2 semanas',        days: 14 },
  { label: 'Este mes',         days: 30 },
  { label: 'Todo',             days: 0  },
];

function canAccess(user) {
  if (!user) return false;
  if (ADMINS.some(a => a.id === user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

function fld(desc, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = desc.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`));
  return m ? m[1].trim() : null;
}

function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;
  const desc   = embed.description ?? log.message ?? '';
  const admin  = fld(desc, 'Administrador');
  if (!admin) return null;
  const durRaw = fld(desc, 'Duración') ?? '';
  const dur    = parseInt(durRaw.replace(/[^0-9]/g, '')) || 0;
  return {
    id:         log._id,
    isOnline:   embed.title === 'Items Removidos - Jail',
    admin,
    player:     fld(desc, 'Jugador encarcelado'),
    identifier: fld(desc, 'Identifier encarcelado'),
    motivo:     fld(desc, 'Motivo'),
    duracion:   fld(desc, 'Duración'),
    durMins:    dur,
    ts:         log.timestamp ?? log.createdAt,
  };
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

async function fetchAllJails(adminName, signal) {
  const seen  = new Set();
  const jails = [];
  let page = 1, totalPages = 1;

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
      if (!parsed) continue;
      if (parsed.admin.toLowerCase() !== adminName.toLowerCase()) continue;
      jails.push(parsed);
    }
    page++;
    if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
  }

  return jails.sort((a, b) => new Date(b.ts) - new Date(a.ts));
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

function StatCard({ icon, label, value, sub, accent, loading }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 18px',
      borderTop: `3px solid ${accent ?? 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}{label}
      </div>
      {loading
        ? <span className="spinner" style={{ width: 20, height: 20, marginTop: 4 }} />
        : <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      }
      {!loading && sub && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
      )}
    </div>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const showLabels = data.length <= 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 3,
        height: 80, padding: '0 4px',
      }}>
        {data.map(d => (
          <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {d.count > 0 && (
              <div style={{
                fontSize: 9, color: 'var(--text3)', lineHeight: 1,
                display: data.length > 20 ? 'none' : 'block',
              }}>
                {d.count}
              </div>
            )}
            <div style={{
              width: '100%', background: d.count > 0 ? 'var(--red)' : 'var(--surface2)',
              height: `${Math.max((d.count / max) * 60, d.count > 0 ? 4 : 2)}px`,
              borderRadius: '3px 3px 0 0',
              opacity: d.count > 0 ? .85 : .3,
              transition: 'height .4s ease',
              position: 'relative',
              minHeight: 2,
            }}
              title={`${d.label}: ${d.count} jail${d.count !== 1 ? 's' : ''}`}
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

function RecentList({ jails }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {jails.length === 0
        ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
            Sin registros en este período
          </div>
        : jails.slice(0, 10).map((j, i) => (
          <div key={j.id} style={{
            display: 'flex', gap: 10, padding: '9px 14px',
            borderBottom: i < Math.min(jails.length, 10) - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'flex-start',
          }}>
            <div style={{ paddingTop: 1, flexShrink: 0 }}>
              <JailBadge isOnline={j.isOnline} />
            </div>
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
      {jails.length > 10 && (
        <div style={{
          padding: '8px 14px', fontSize: 11, color: 'var(--text3)',
          borderTop: '1px solid var(--border)', textAlign: 'center',
        }}>
          +{jails.length - 10} más en este período
        </div>
      )}
    </div>
  );
}

function MotivoBar({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{
        flex: 1, fontSize: 11, color: 'var(--text2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={label}>
        {label}
      </div>
      <div style={{
        width: 90, height: 14, background: 'var(--surface2)',
        borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: 'var(--red)',
          borderRadius: 3, opacity: .7, transition: 'width .5s',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 18, textAlign: 'right', flexShrink: 0 }}>
        {count}
      </div>
    </div>
  );
}

export default function DashboardAdmin({ user }) {
  const hasAccess  = canAccess(user);
  const myAdmin    = ADMINS.find(a => a.id === user?.id);

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
      .then(jails => {
        setAllJails(jails);
        setLoadedAt(new Date());
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!hasAccess || !myAdmin) return;
    load();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

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
          <div style={{ fontSize: 13 }}>Solo el equipo de encargados de ilegales puede ver esto.</div>
        </div>
      </div>
    );
  }

  if (!myAdmin) {
    return (
      <div className="section active">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px', gap: 14,
          color: 'var(--text3)',
        }}>
          <User size={36} style={{ opacity: .35 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>No registrado</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
            Tu cuenta de Discord no está asociada a ningún nombre de admin en el sistema.
          </div>
        </div>
      </div>
    );
  }

  const period    = PERIODS[periodIdx];
  const jails     = filterByPeriod(allJails, period.days);
  const total     = jails.length;
  const online    = jails.filter(j => j.isOnline).length;
  const offline   = jails.filter(j => !j.isOnline).length;
  const totalMins = jails.reduce((s, j) => s + j.durMins, 0);

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
  const maxAct   = Math.max(...activity.map(d => d.count), 1);

  const busiest  = activity.reduce((b, d) => d.count > b.count ? d : b, { count: 0, label: '—' });

  return (
    <div className="section active">

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 18, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'var(--surface2)', border: '2px solid var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--red)', fontWeight: 800, flexShrink: 0,
          }}>
            {[...myAdmin.name].find(c => /\p{L}/u.test(c))?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {myAdmin.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {loading
                ? 'Cargando historial…'
                : loadedAt
                  ? `Actualizado ${fmtTimeRelative(loadedAt)} · ${allJails.length.toLocaleString('es')} jails en total`
                  : 'Dashboard personal de ilegales'
              }
            </div>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 12px', cursor: loading ? 'default' : 'pointer',
            fontSize: 12, color: 'var(--text2)', opacity: loading ? .5 : 1,
            transition: 'border-color .15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border2)'; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert al-r" style={{ marginBottom: 14 }}>
          <span className="al-icon"><AlertTriangle size={13} /></span>
          <span>{error}</span>
        </div>
      )}

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatCard
          icon={<AlertTriangle size={11} />}
          label="Total jails"
          value={total}
          sub={period.days ? `En ${period.label.toLowerCase()}` : 'Sin filtro de fecha'}
          accent="var(--red)"
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp size={11} />}
          label="Online"
          value={online}
          sub={total > 0 ? `${Math.round((online / total) * 100)}% del total` : '—'}
          accent="var(--green, #22c55e)"
          loading={loading}
        />
        <StatCard
          icon={<User size={11} />}
          label="Offline"
          value={offline}
          sub={total > 0 ? `${Math.round((offline / total) * 100)}% del total` : '—'}
          accent="var(--text3)"
          loading={loading}
        />
        <StatCard
          icon={<Clock size={11} />}
          label="Tiempo total"
          value={fmtMins(totalMins)}
          sub={`${totalMins.toLocaleString('es')} min`}
          accent="var(--orange, #f97316)"
          loading={loading}
        />
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
            Actividad diaria
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
            {period.days > 0 ? `Últimos ${period.days} días` : 'Últimos 30 días'}
            {busiest.count > 0 && (
              <> · Día más activo: <strong style={{ color: 'var(--text2)' }}>{busiest.label}</strong> ({busiest.count})</>
            )}
          </div>
        </div>
        {loading
          ? <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="spinner" style={{ width: 18, height: 18 }} />
            </div>
          : total === 0
            ? <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)' }}>
                Sin actividad en este período
              </div>
            : <ActivityChart data={activity} />
        }
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
            Motivos más frecuentes
          </div>
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16 }} />
            : motivos.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin datos</div>
              : motivos.map(m => (
                  <MotivoBar key={m.label} label={m.label} count={m.count} maxCount={maxMot} />
                ))
          }
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
            Últimas sanciones del período
          </div>
          {loading
            ? <div style={{ padding: 16 }}><span className="spinner" style={{ width: 16, height: 16 }} /></div>
            : <RecentList jails={jails} />
          }
        </div>
      </div>

      {!loading && allJails.length > 0 && (
        <AllTimeBadges adminName={myAdmin.name} total={allJails.length} totalMins={allJails.reduce((s, j) => s + j.durMins, 0)} />
      )}

    </div>
  );
}

function AllTimeBadges({ adminName, total, totalMins }) {
  const avgPerDay  = (total / 30).toFixed(1); // promedio rough
  const longestRun = fmtMins(totalMins);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
        Resumen histórico — {adminName}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{total.toLocaleString('es')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails totales registrados</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange, #f97316)' }}>{longestRun}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>tiempo total acumulado</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>{avgPerDay}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>jails/día (últimos 30d)</div>
        </div>
      </div>
    </div>
  );
}
