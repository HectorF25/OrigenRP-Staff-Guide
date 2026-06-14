'use client';

import { useRef, useState } from 'react';
import { Search, Lock, Clock, AlertTriangle, ChevronDown, User } from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Configuración ────────────────────────────────────────────────────────────
const JAIL_CH_ID   = '69d3a41db036cafed646d85a';
const VALID_TITLES = new Set(['Items Removidos - Jail', 'Jugador Offline Encarcelado - Jail']);
const ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019']);
const SUPER_ROLE   = '1484372151111782510';
const PAGE_LIMIT   = 50;

const RANGES = [
  { label: 'Última semana',     days: 7  },
  { label: 'Últimas 2 semanas', days: 14 },
  { label: 'Último mes',        days: 30 },
  { label: 'Todo el historial', days: 0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function field(desc, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = desc.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`));
  return m ? m[1].trim() : null;
}

function parseLog(log) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed || !VALID_TITLES.has(embed.title)) return null;
  const desc = embed.description ?? log.message ?? '';
  const dur  = parseInt((field(desc, 'Duración') ?? '0').replace(/[^0-9]/g, '')) || 0;
  return {
    id:         log._id,
    title:      embed.title,
    isOnline:   embed.title === 'Items Removidos - Jail',
    admin:      field(desc, 'Administrador'),
    player:     field(desc, 'Jugador encarcelado'),
    identifier: field(desc, 'Identifier encarcelado'),
    motivo:     field(desc, 'Motivo'),
    duracion:   field(desc, 'Duración'),
    durMins:    dur,
    ts:         log.timestamp ?? log.createdAt,
  };
}

function matchesSearch(log, term) {
  const embed = log.metadata?.embeds?.[0];
  if (!embed) return false;
  const desc = embed.description ?? log.message ?? '';
  const low  = term.toLowerCase();

  const player = field(desc, 'Jugador encarcelado');
  if (player && player.toLowerCase().includes(low)) return true;

  const ident = field(desc, 'Identifier encarcelado');
  if (ident && ident.toLowerCase().includes(low)) return true;

  return false;
}

function fmtMins(mins) {
  if (!mins) return '0m';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || !parts.length) parts.push(`${m}m`);
  return parts.join(' ');
}

function fmtDate(ts) {
  try {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    }).format(new Date(ts));
  } catch { return ts; }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
      borderTop: `3px solid ${accent ?? 'var(--border)'}`,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

function BarRow({ label, count, maxCount, totalMins, color }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 130, flexShrink: 0, fontSize: 12, color: 'var(--text2)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textAlign: 'right',
      }} title={label}>
        {label}
      </div>
      <div style={{ flex: 1, position: 'relative', height: 20, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: color ?? 'var(--red)',
          borderRadius: 4, transition: 'width .5s ease',
          opacity: .85,
        }} />
        <div style={{
          position: 'absolute', left: 8, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center',
          fontSize: 11, fontWeight: 600,
          color: pct > 30 ? '#fff' : 'var(--text)',
          zIndex: 1,
        }}>
          {count}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', width: 50, textAlign: 'right' }}>
        {fmtMins(totalMins)}
      </div>
    </div>
  );
}

function MotivoRow({ label, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <div style={{
        flex: 1, fontSize: 12, color: 'var(--text2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={label}>
        {label}
      </div>
      <div style={{ width: 100, height: 16, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: 'var(--blue)',
          borderRadius: 3, opacity: .75, transition: 'width .5s',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>
        {count}
      </div>
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

function Timeline({ jails }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? jails : jails.slice(0, 15);

  return (
    <div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {visible.map((jail, i) => (
          <div key={jail.id} style={{
            display: 'flex', gap: 10, padding: '10px 16px',
            borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'flex-start',
          }}>
            <div style={{ paddingTop: 1, flexShrink: 0 }}>
              <JailBadge isOnline={jail.isOnline} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                  {jail.admin ?? '—'}
                </span>
                {jail.durMins > 0 && (
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 3,
                    background: 'var(--surface2)', color: 'var(--text3)',
                    border: '1px solid var(--border)',
                  }}>
                    ⏱ {jail.duracion}
                  </span>
                )}
              </div>
              {jail.motivo && (
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {jail.motivo}
                </div>
              )}
              {jail.identifier && (
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2, wordBreak: 'break-all' }}>
                  {jail.identifier}
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
              <div>{fmtTimeRelative(jail.ts)}</div>
              <div style={{ marginTop: 2 }}>{fmtTime(jail.ts)}</div>
            </div>
          </div>
        ))}
      </div>

      {jails.length > 15 && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, margin: '10px auto 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text3)',
          }}
        >
          <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          {expanded ? 'Mostrar menos' : `Ver ${jails.length - 15} más`}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard de resultados ──────────────────────────────────────────────────
function Dashboard({ data }) {
  const { term, jails, range } = data;
  if (jails.length === 0) {
    return (
      <div style={{
        padding: '50px 20px', textAlign: 'center',
        color: 'var(--text3)', fontSize: 13,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10,
      }}>
        <User size={32} style={{ opacity: .3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
        Sin registros de jail para <strong style={{ color: 'var(--text2)' }}>{term}</strong> en el período &ldquo;{range}&rdquo;.
      </div>
    );
  }

  // — métricas ─
  const totalJails   = jails.length;
  const online       = jails.filter(j => j.isOnline).length;
  const offline      = jails.filter(j => !j.isOnline).length;
  const totalMins    = jails.reduce((s, j) => s + j.durMins, 0);

  // admin breakdown
  const adminMap = new Map();
  for (const j of jails) {
    const a = j.admin ?? 'Desconocido';
    if (!adminMap.has(a)) adminMap.set(a, { count: 0, mins: 0 });
    const e = adminMap.get(a);
    e.count++;
    e.mins += j.durMins;
  }
  const admins  = [...adminMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);
  const maxAdm  = admins[0]?.count ?? 1;

  // motivo breakdown (top 8)
  const motivoMap = new Map();
  for (const j of jails) {
    const m = (j.motivo ?? 'Sin motivo').trim();
    motivoMap.set(m, (motivoMap.get(m) ?? 0) + 1);
  }
  const motivos = [...motivoMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxMot  = motivos[0]?.count ?? 1;

  // player name display (use most common player field)
  const playerDisplay = jails.find(j => j.player)?.player
    ?? jails.find(j => j.identifier)?.identifier
    ?? term;

  const mostRecentTs = jails[0]?.ts;
  const mostAdmin    = admins[0]?.name ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Jugador header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'var(--surface2)', border: '2px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: 'var(--red)', fontWeight: 700, flexShrink: 0,
        }}>
          {[...playerDisplay].find(c => /\p{L}/u.test(c))?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{playerDisplay}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Período: {range}
            {mostRecentTs && <> · Último jail: {fmtDate(mostRecentTs)}</>}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        <StatCard
          icon={<AlertTriangle size={11} />}
          label="Total jails"
          value={totalJails}
          sub={`${online} online · ${offline} offline`}
          accent="var(--red)"
        />
        <StatCard
          icon={<Clock size={11} />}
          label="Tiempo total"
          value={fmtMins(totalMins)}
          sub={`${totalMins.toLocaleString('es')} minutos`}
          accent="var(--orange)"
        />
        <StatCard
          icon={<User size={11} />}
          label="Admin frecuente"
          value={mostAdmin}
          sub={`${admins[0]?.count ?? 0} veces`}
          accent="var(--blue)"
        />
        <StatCard
          icon={<AlertTriangle size={11} />}
          label="Motivo top"
          value={motivos[0]?.count ?? 0}
          sub={motivos[0]?.label ?? '—'}
          accent="var(--purple)"
        />
      </div>

      {/* Admin breakdown + Motivos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Admin breakdown */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
            Sanciones por administrador
          </div>
          {admins.map(a => (
            <BarRow
              key={a.name}
              label={a.name}
              count={a.count}
              maxCount={maxAdm}
              totalMins={a.mins}
              color="var(--red)"
            />
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>
            Barras: cantidad · Derecha: tiempo total
          </div>
        </div>

        {/* Motivos */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
            Motivos más frecuentes
          </div>
          {motivos.map(m => (
            <MotivoRow key={m.label} label={m.label} count={m.count} maxCount={maxMot} />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
          Historial — {totalJails} registros
        </div>
        <Timeline jails={jails} />
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReporteJugador({ user }) {
  const hasAccess = ALLOWED_IDS.has(user?.id) || (Array.isArray(user?.roles) && user.roles.includes(SUPER_ROLE));

  // hooks siempre se llaman (Rules of Hooks)
  const [query,    setQuery]    = useState('');
  const [rangeIdx, setRangeIdx] = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [results,  setResults]  = useState(null);
  const abortRef = useRef(null);

  async function handleSearch(e) {
    e?.preventDefault();
    const term = query.trim();
    if (!term || loading) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const seen  = new Set();
      const raw   = [];
      let page       = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        if (ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const url =
          `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
          `?q=${encodeURIComponent(term)}&limit=${PAGE_LIMIT}&page=${page}&cId=${JAIL_CH_ID}`;
        const res  = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        totalPages = data.totalPages ?? 1;

        for (const log of data.logs ?? []) {
          if (seen.has(log._id)) continue;
          seen.add(log._id);
          if (!matchesSearch(log, term)) continue;
          const parsed = parseLog(log);
          if (parsed) raw.push(parsed);
        }

        page++;
        if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
      }

      // filtrar por rango de fechas
      const range  = RANGES[rangeIdx];
      const cutoff = range.days > 0 ? Date.now() - range.days * 86_400_000 : 0;
      const jails  = (cutoff > 0 ? raw.filter(j => new Date(j.ts).getTime() >= cutoff) : raw)
        .sort((a, b) => new Date(b.ts) - new Date(a.ts));

      setResults({ term, jails, range: range.label });
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }

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
            Esta herramienta es solo para coordinadores principales de ilegales.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Cabecera */}
      <div className="pg-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} style={{ color: 'var(--red)' }} />
            Reporte por Jugador
          </div>
          <div className="pg-sub">
            Historial de jails, admins y motivos para un jugador específico
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 16px', alignItems: 'flex-end',
        }}
      >
        {/* Input jugador */}
        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            Nombre de jugador o identifier
          </label>
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: .4, pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
            >
              <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="15" y2="15" />
            </svg>
            <input
              className="fm-search-input"
              placeholder="ej. ChillySpider5915 o char1:abc…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Selector de rango */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            Período
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {RANGES.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRangeIdx(i)}
                className={`btns${rangeIdx === i ? ' active' : ''}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón buscar */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 7, padding: '8px 18px',
            cursor: query.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: 13, fontWeight: 600,
            opacity: query.trim() && !loading ? 1 : .5,
            transition: 'opacity .15s',
            flexShrink: 0,
          }}
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={13} />}
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="alert al-r" style={{ marginBottom: 16 }}>
          <span className="al-icon"><AlertTriangle size={13} /></span>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Loading progress */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--text3)', fontSize: 13, padding: '20px 0',
        }}>
          <span className="spinner" style={{ width: 16, height: 16 }} />
          Buscando en todos los registros del canal…
        </div>
      )}

      {/* Dashboard */}
      {results && !loading && <Dashboard data={results} />}
    </div>
  );
}
