'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, RefreshCw, Search, Users, Activity, Flag, Copy, Check } from 'lucide-react';
import { FM_PROJECT_ID, fmtTime, fmtTimeRelative } from '@/lib/fivemonitor';

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const HIRE_CHANNEL      = '69d3a14ab036cafed646d3fe';
const ADMIN_CHANNEL     = '69d3a12db036cafed646d33e';
const DISCORD_SEARCH_CH = '69d3a24eb036cafed646d59e';
const PAGE_LIMIT        = 100;
const MAX_PAGES         = 50;
const ROWS_PER_PAGE     = 20;
const ALLOWED_IDS       = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE      = '1487429315992879114';

// Search terms per channel
const HIRE_QUERIES  = ['Contratar Miembro', 'Cambio de Rango', 'Crear Rango'];
const ADMIN_QUERIES = [
  'Remover Jugador de Banda',
  'Asignar Jugador a Banda',
  'Modificar Configuración de Banda',
  'Eliminar Banda',
  'Garage Común',
];

/* ─── Time helpers ───────────────────────────────────────────────────────────── */
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function inPeriod(ts, period) {
  const t = new Date(ts).getTime();
  const n = Date.now();
  if (period === 'today')    return t >= startOfToday();
  if (period === 'week')     return t >= n - 7  * 86_400_000;
  if (period === 'twoWeeks') return t >= n - 14 * 86_400_000;
  if (period === 'month')    return t >= n - 30 * 86_400_000;
  return true;
}
const PERIODS = [
  { key: 'today',    label: 'Hoy'        },
  { key: 'week',     label: 'Esta semana' },
  { key: 'twoWeeks', label: '2 semanas'  },
  { key: 'month',    label: 'Este mes'   },
  { key: 'all',      label: 'Todo'       },
];

/* ─── Parse helpers ──────────────────────────────────────────────────────────── */
function getField(fields, kw) {
  return (fields ?? []).find(f => f.name?.includes(kw))?.value ?? '';
}
// Extracts { gameName, discordId } from embed text like:
// "**Nombre:** NAME\n**ID:** 123\n...\n**Discord:** <@DISCORD_ID>"
function parsePlayer(text) {
  const nm = (text ?? '').match(/\*\*Nombre:\*\*\s*([^\n]+)/);
  const dm = (text ?? '').match(/<@(\d+)>/);
  return {
    gameName:  nm?.[1]?.trim() ?? '',
    discordId: dm?.[1]         ?? '',
  };
}
function orgLabel(key) {
  return (key || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── API ────────────────────────────────────────────────────────────────────── */
// Fetches all pages of a search query from the FiveMonitor search API
async function searchAllPages(query, channelId, signal) {
  const all = [];
  const q = encodeURIComponent(query);
  for (let p = 1; p <= MAX_PAGES; p++) {
    if (signal?.aborted) break;
    try {
      const r = await fetch(
        `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${q}&limit=${PAGE_LIMIT}&page=${p}&cId=${channelId}`,
        { signal }
      );
      if (!r.ok) break;
      const data = await r.json();
      const logs       = Array.isArray(data) ? data : (data.logs ?? []);
      const totalPages = data.totalPages ?? 1;
      if (!logs.length) break;
      all.push(...logs);
      if (p >= totalPages || logs.length < PAGE_LIMIT) break;
    } catch { break; }
  }
  return all;
}

// Deduplicate logs by _id
function dedupById(logs) {
  const seen = new Set();
  return logs.filter(l => {
    if (!l._id || seen.has(l._id)) return false;
    seen.add(l._id);
    return true;
  });
}

// Module-level Discord name cache (persists while tab is open)
const _dCache = {};
async function lookupDiscordName(discordId, signal) {
  if (!discordId) return '—';
  if (_dCache[discordId]) return _dCache[discordId];
  try {
    const r = await fetch(
      `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${discordId}&limit=1&page=1&cId=${DISCORD_SEARCH_CH}`,
      { signal }
    );
    if (!r.ok) return '—';
    const data = await r.json();
    const logs = Array.isArray(data) ? data : (data.logs ?? []);
    const embed = logs[0]?.metadata?.embeds?.[0];
    const name  = embed?.fields?.find(f => f.name === 'Nombre')?.value ?? '—';
    _dCache[discordId] = name;
    return name;
  } catch { return '—'; }
}

/* ─── Data builder ───────────────────────────────────────────────────────────── */
function buildOrgs(hireLogs, adminLogs) {
  const map = new Map();

  /* ── Pass 0: build label→key map from "Modificar Configuración de Banda" logs ──
     Some logs (e.g. Garage) store the band label ("la 76") instead of the key
     ("la_76"). We use the config logs — which always have the real key — to build
     a normalizer so those logs resolve to the correct org.                        */
  const labelToKey   = {};   // label.toLowerCase() → canonical key
  const configTs     = {};   // canonical key → latest timestamp seen
  const keyToLabel   = {};   // canonical key → human label from last config log

  for (const log of adminLogs) {
    const embed = log.metadata?.embeds?.[0];
    if (!embed?.title?.includes('Modificar Configuración')) continue;
    const fields  = embed.fields ?? [];
    const orgKey  = getField(fields, 'Banda');
    const changes = getField(fields, 'Cambios');
    const ts      = log.timestamp;
    if (!orgKey || !changes) continue;
    // Only keep the most recent config entry per org
    if (configTs[orgKey] && new Date(ts) <= new Date(configTs[orgKey])) continue;
    configTs[orgKey] = ts;
    const lm = changes.match(/^Label:\s*(.+)$/m);
    if (lm) {
      const label = lm[1].trim();
      labelToKey[label.toLowerCase()] = orgKey;
      keyToLabel[orgKey] = label;
    }
  }

  // Resolves a raw band value to the canonical org key.
  // Handles both "la_76" (already a key) and "la 76" (label variant).
  function normalizeKey(raw) {
    if (!raw) return raw;
    const trimmed = raw.trim();
    return labelToKey[trimmed.toLowerCase()] ?? trimmed;
  }

  function getOrg(rawKey) {
    const key = normalizeKey(rawKey);
    if (!key) return null;
    if (!map.has(key)) {
      // Use real label from config log if available, else derive from key
      const label = keyToLabel[key] ?? orgLabel(key);
      map.set(key, {
        key,
        label,
        members:      [],
        hireActions:  [],
        adminActions: [],
        removedNames: new Set(),
      });
    }
    return map.get(key);
  }

  /* ── Hire channel ── */
  for (const log of hireLogs) {
    const embed  = log.metadata?.embeds?.[0];
    if (!embed) continue;
    const title  = embed.title  ?? '';
    const fields = embed.fields ?? [];
    const ts     = log.timestamp;

    if (title.includes('Contratar Miembro')) {
      const orgKey    = getField(fields, 'Banda');
      const memberTxt = getField(fields, 'Nuevo miembro');
      const rank      = getField(fields, 'Rango asignado');
      const { gameName, discordId } = parsePlayer(memberTxt);
      const org = getOrg(orgKey); if (!org) continue;
      org.members.push({ gameName, discordId, rank, timestamp: ts, removed: false });
      org.hireActions.push({ type: 'hire', title, gameName, discordId, rank, timestamp: ts });

    } else if (title.includes('Cambio de Rango')) {
      const orgKey   = getField(fields, 'Banda');
      const actorTxt = getField(fields, 'Quien ejecutó');
      const { gameName: actorName } = parsePlayer(actorTxt);
      const affected = getField(fields, 'Miembro afectado');
      const newRank  = getField(fields, 'Nuevo rango');
      const org = getOrg(orgKey); if (!org) continue;
      org.hireActions.push({ type: 'rank_change', title, actorName, affected, newRank, timestamp: ts });

    } else if (title.includes('Crear Rango')) {
      const orgKey   = getField(fields, 'Banda');
      const actorTxt = getField(fields, 'Quien ejecutó');
      const { gameName: actorName } = parsePlayer(actorTxt);
      const rankName = getField(fields, 'Nombre del rango');
      const org = getOrg(orgKey); if (!org) continue;
      org.hireActions.push({ type: 'rank_create', title, actorName, rankName, timestamp: ts });
    }
  }

  /* ── Admin channel ── */
  for (const log of adminLogs) {
    const embed  = log.metadata?.embeds?.[0];
    if (!embed) continue;
    const title  = embed.title  ?? '';
    const fields = embed.fields ?? [];
    const ts     = log.timestamp;

    const isGarage  = title.includes('Garage');
    const actorTxt  = isGarage ? getField(fields, 'Jugador') : getField(fields, 'Administrador');
    const { gameName: actorName, discordId: actorDiscordId } = parsePlayer(actorTxt);

    if (title.includes('Asignar Jugador')) {
      const orgKey   = getField(fields, 'Banda');
      const assigned = getField(fields, 'Jugador asignado');
      const rank     = getField(fields, 'Rango');
      const org = getOrg(orgKey); if (!org) continue;
      org.adminActions.push({ type: 'assign', actorName, actorDiscordId, assigned, rank, timestamp: ts, isAdmin: true });

    } else if (title.includes('Remover Jugador')) {
      const orgKey     = getField(fields, 'Banda');
      const removedTxt = getField(fields, 'Jugador removido');
      const { gameName: removedName } = parsePlayer(removedTxt);
      const org = getOrg(orgKey); if (!org) continue;
      if (removedName) org.removedNames.add(removedName.toLowerCase().trim());
      org.adminActions.push({ type: 'remove', actorName, actorDiscordId, removedName, timestamp: ts, isAdmin: true });

    } else if (title.includes('Eliminar Banda')) {
      const orgKey   = getField(fields, 'Banda eliminada');
      const affected = getField(fields, 'Miembros afectados');
      const org = getOrg(orgKey); if (!org) continue;
      org.adminActions.push({ type: 'delete_band', actorName, actorDiscordId, affected, timestamp: ts, isAdmin: true });

    } else if (title.includes('Modificar Configuración')) {
      const orgKey  = getField(fields, 'Banda');
      const changes = getField(fields, 'Cambios');
      const org = getOrg(orgKey); if (!org) continue;
      org.adminActions.push({ type: 'config', actorName, actorDiscordId, changes, timestamp: ts, isAdmin: true });

    } else if (isGarage) {
      // Garage "Banda" field may contain the label ("la 76") — normalizeKey handles it
      const orgKey = getField(fields, 'Banda');
      const org = getOrg(orgKey); if (!org) continue;
      const plate  = getField(fields, 'Placa');
      const netId  = getField(fields, 'NetId');
      const action = title.includes('Sacar') ? 'Sacar vehículo' : title.includes('Guardar') ? 'Guardar vehículo' : 'Garage';
      org.adminActions.push({ type: 'garage', actorName, actorDiscordId, action, plate, netId, timestamp: ts, isAdmin: false });
    }
  }

  /* ── Cross-org dedup: player can only be in their most recent org ── */
  // Build global map: gameName.lower → { orgKey, timestamp }
  const playerLatest = new Map();
  for (const [orgKey, org] of map.entries()) {
    for (const m of org.members) {
      const k = m.gameName.toLowerCase().trim();
      if (!k) continue;
      const existing = playerLatest.get(k);
      if (!existing || new Date(m.timestamp) > new Date(existing.timestamp)) {
        playerLatest.set(k, { orgKey, timestamp: m.timestamp });
      }
    }
  }
  // Remove members who belong to a different (more recent) org
  for (const [orgKey, org] of map.entries()) {
    org.members = org.members.filter(m => {
      const k = m.gameName.toLowerCase().trim();
      if (!k) return true;
      return playerLatest.get(k)?.orgKey === orgKey;
    });
  }

  /* ── Cross-reference removals ── */
  for (const org of map.values()) {
    for (const m of org.members) {
      if (org.removedNames.has(m.gameName.toLowerCase().trim())) {
        m.removed = true;
      }
    }
  }

  /* ── Stats + admins per org ── */
  return [...map.values()]
    .map(org => {
      const { members } = org;
      org.stats = {
        today:    members.filter(m => inPeriod(m.timestamp, 'today')).length,
        week:     members.filter(m => inPeriod(m.timestamp, 'week')).length,
        twoWeeks: members.filter(m => inPeriod(m.timestamp, 'twoWeeks')).length,
        month:    members.filter(m => inPeriod(m.timestamp, 'month')).length,
        total:    members.length,
        active:   members.filter(m => !m.removed).length,
        removed:  members.filter(m =>  m.removed).length,
      };

      const adminOnly = org.adminActions.filter(a => a.isAdmin);
      const adminsMap = new Map();
      for (const a of adminOnly) {
        if (!a.actorName) continue;
        const k = a.actorDiscordId || a.actorName;
        if (!adminsMap.has(k)) adminsMap.set(k, { name: a.actorName, discordId: a.actorDiscordId, actions: [] });
        adminsMap.get(k).actions.push(a);
      }
      org.admins = [...adminsMap.values()].sort((a, b) => b.actions.length - a.actions.length);
      return org;
    })
    .sort((a, b) => b.stats.total - a.stats.total);
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setOk(true); setTimeout(() => setOk(false), 1500); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 2px', lineHeight: 1 }}
    >
      {ok ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}
    </button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${color}`,
      borderRadius: 10,
      padding: '10px 16px',
      textAlign: 'center',
      minWidth: 90,
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function PeriodFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)}
          style={{
            padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
            background: value === p.key ? 'var(--red)' : 'var(--surface2)',
            color: value === p.key ? '#fff' : 'var(--text)',
            fontWeight: value === p.key ? 700 : 400,
          }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

const ACTION_LABELS = {
  hire:        'Contratación',
  rank_change: 'Cambio Rango',
  rank_create: 'Crear Rango',
  assign:      'Asignar Admin',
  remove:      'Remover Admin',
  delete_band: 'Eliminar Banda',
  config:      'Configuración',
  garage:      'Garage',
};
const ACTION_COLORS = {
  hire:        'var(--green)',
  rank_change: 'var(--yellow)',
  rank_create: 'var(--cyan)',
  assign:      'var(--blue)',
  remove:      'var(--red)',
  delete_band: 'var(--red)',
  config:      '#8b5cf6',
  garage:      'var(--muted)',
};

function actionSummary(a) {
  if (a.type === 'hire')        return `Contratado: ${a.gameName}`;
  if (a.type === 'rank_change') return `${a.actorName || '?'} cambió rango de "${a.affected}" → ${a.newRank}`;
  if (a.type === 'rank_create') return `${a.actorName || '?'} creó rango: ${a.rankName}`;
  if (a.type === 'assign')      return `${a.actorName || '?'} asignó a ${a.assigned} (rango ${a.rank})`;
  if (a.type === 'remove')      return `${a.actorName || '?'} removió a ${a.removedName || '?'}`;
  if (a.type === 'delete_band') return `${a.actorName || '?'} eliminó la banda (${a.affected} miembros)`;
  if (a.type === 'config')      return `${a.actorName || '?'} modificó configuración`;
  if (a.type === 'garage')      return `${a.actorName || '?'}: ${a.action} ${a.plate || a.netId || ''}`;
  return a.type;
}

/* ── Members Table ── */
function MembersTable({ members, orgKey }) {
  const [period, setPeriod] = useState('all');
  const [search, setSearch] = useState('');
  const [pg, setPg]         = useState(1);
  const [names, setNames]   = useState({});
  const abortRef            = useRef(null);

  useEffect(() => { setPeriod('all'); setSearch(''); setPg(1); }, [orgKey]);

  useEffect(() => {
    const ids = [...new Set(members.map(m => m.discordId).filter(id => id && !names[id] && !_dCache[id]))];
    // Populate from cache first
    const fromCache = {};
    for (const m of members) if (_dCache[m.discordId]) fromCache[m.discordId] = _dCache[m.discordId];
    if (Object.keys(fromCache).length) setNames(prev => ({ ...prev, ...fromCache }));
    if (!ids.length) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    (async () => {
      for (const id of ids) {
        if (ctrl.signal.aborted) break;
        const name = await lookupDiscordName(id, ctrl.signal);
        if (!ctrl.signal.aborted) setNames(prev => ({ ...prev, [id]: name }));
      }
    })();
    return () => ctrl.abort();
  }, [members]); // eslint-disable-line

  const filtered = members.filter(m => {
    if (!inPeriod(m.timestamp, period)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.gameName.toLowerCase().includes(q) ||
      m.discordId.includes(q) ||
      (names[m.discordId] ?? '').toLowerCase().includes(q)
    );
  });

  const totalPgs = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePg   = Math.min(pg, totalPgs);
  const rows     = filtered.slice((safePg - 1) * ROWS_PER_PAGE, safePg * ROWS_PER_PAGE);

  const th = { padding: '6px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <PeriodFilter value={period} onChange={v => { setPeriod(v); setPg(1); }} />
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPg(1); }}
            placeholder="Buscar miembro..."
            style={{ width: '100%', padding: '5px 8px 5px 26px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} mostrados · {members.filter(m => !m.removed).length} activos · {members.length} total
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nombre en juego', 'Discord', 'Discord ID', 'Rango', 'Ingresó', 'Estado'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={i} style={{ background: m.removed ? 'rgba(231,76,60,0.05)' : 'transparent' }}>
                {/* Nombre en juego = lookup result (nombre real en el servidor) */}
                <td style={td}>
                  {m.discordId
                    ? names[m.discordId] !== undefined
                      ? (names[m.discordId] || '—')
                      : <span style={{ opacity: 0.4, fontSize: 11 }}>cargando…</span>
                    : '—'}
                </td>
                {/* Discord = nombre de Discord del jugador (campo **Nombre:** del embed) */}
                <td style={{ ...td, color: 'var(--muted)' }}>{m.gameName || '—'}</td>
                {/* Discord ID */}
                <td style={td}>
                  {m.discordId
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--blue)' }}>{m.discordId}</span>
                        <CopyBtn text={m.discordId} />
                      </span>
                    : '—'}
                </td>
                <td style={{ ...td, color: 'var(--muted)' }}>{m.rank || '—'}</td>
                <td style={{ ...td, color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtTime(m.timestamp)}</td>
                <td style={td}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: m.removed ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.15)',
                    color: m.removed ? 'var(--red)' : 'var(--green)',
                  }}>
                    {m.removed ? 'Removido' : 'Activo'}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: 28 }}>
                Sin miembros para el período seleccionado.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPgs > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <button onClick={() => setPg(p => Math.max(1, p - 1))} disabled={safePg === 1}
            style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>‹</button>
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: '26px' }}>{safePg} / {totalPgs}</span>
          <button onClick={() => setPg(p => Math.min(totalPgs, p + 1))} disabled={safePg === totalPgs}
            style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>›</button>
        </div>
      )}
    </div>
  );
}

/* ── Actions Log ── */
function ActionsLog({ hireActions, adminActions, orgKey }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [pg, setPg] = useState(1);
  useEffect(() => { setTypeFilter('all'); setPg(1); }, [orgKey]);

  const all = [...hireActions, ...adminActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const types = ['all', ...new Set(all.map(a => a.type))];
  const filtered = typeFilter === 'all' ? all : all.filter(a => a.type === typeFilter);
  const totalPgs = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePg   = Math.min(pg, totalPgs);
  const rows     = filtered.slice((safePg - 1) * ROWS_PER_PAGE, safePg * ROWS_PER_PAGE);

  const th = { padding: '6px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', textAlign: 'left' };
  const td = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {types.map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); setPg(1); }}
            style={{
              padding: '3px 10px', borderRadius: 6, border: 'none',
              borderBottom: `2px solid ${typeFilter === t ? (ACTION_COLORS[t] || 'var(--blue)') : 'transparent'}`,
              cursor: 'pointer', fontSize: 11, background: 'var(--surface2)',
              color: typeFilter === t ? 'var(--text)' : 'var(--muted)',
              fontWeight: typeFilter === t ? 700 : 400,
            }}>
            {t === 'all' ? `Todos (${all.length})` : (ACTION_LABELS[t] || t)}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Tipo', 'Descripción', 'Cuándo'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={i}>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: (ACTION_COLORS[a.type] || 'var(--muted)') + '22',
                    color: ACTION_COLORS[a.type] || 'var(--muted)',
                  }}>
                    {ACTION_LABELS[a.type] || a.type}
                  </span>
                </td>
                <td style={{ ...td, maxWidth: 380 }}>{actionSummary(a)}</td>
                <td style={{ ...td, color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtTimeRelative(a.timestamp)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: 28 }}>Sin acciones.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPgs > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <button onClick={() => setPg(p => Math.max(1, p - 1))} disabled={safePg === 1}
            style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>‹</button>
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: '26px' }}>{safePg} / {totalPgs}</span>
          <button onClick={() => setPg(p => Math.min(totalPgs, p + 1))} disabled={safePg === totalPgs}
            style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>›</button>
        </div>
      )}
    </div>
  );
}

/* ── Admins Panel ── */
function AdminsPanel({ admins, orgKey }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => { setSelected(null); }, [orgKey]);

  if (!admins.length) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Sin acciones de administradores registradas.</div>
  );

  const maxCount = admins[0]?.actions.length || 1;
  const th = { padding: '6px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', textAlign: 'left' };
  const td = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' };

  if (selected) {
    const admin  = admins.find(a => (a.discordId || a.name) === selected);
    const sorted = [...(admin?.actions ?? [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return (
      <div>
        <button onClick={() => setSelected(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', marginBottom: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Volver
        </button>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text)' }}>{admin?.name}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Tipo', 'Descripción', 'Cuándo'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map((a, i) => (
                <tr key={i}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: (ACTION_COLORS[a.type] || 'var(--muted)') + '22',
                      color: ACTION_COLORS[a.type] || 'var(--muted)',
                    }}>
                      {ACTION_LABELS[a.type] || a.type}
                    </span>
                  </td>
                  <td style={{ ...td, maxWidth: 340 }}>{actionSummary(a)}</td>
                  <td style={{ ...td, color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtTimeRelative(a.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {admins.map(admin => {
        const key  = admin.discordId || admin.name;
        const pct  = Math.round((admin.actions.length / maxCount) * 100);
        const last = [...admin.actions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const typeCounts = admin.actions.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
        return (
          <div key={key} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{admin.name}</div>
                {admin.discordId && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{admin.discordId}</div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{admin.actions.length}</span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 4, height: 5, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {Object.entries(typeCounts).map(([t, c]) => (
                <span key={t} style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  background: (ACTION_COLORS[t] || 'var(--muted)') + '22',
                  color: ACTION_COLORS[t] || 'var(--muted)',
                }}>
                  {ACTION_LABELS[t] || t}: {c}
                </span>
              ))}
            </div>
            {last && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Última: {fmtTimeRelative(last.timestamp)}</div>}
            <button onClick={() => setSelected(key)}
              style={{ marginTop: 10, width: '100%', padding: 5, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}>
              Ver detalle →
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Org Detail ── */
function OrgDetail({ org }) {
  const [tab, setTab] = useState('members');
  useEffect(() => { setTab('members'); }, [org.key]);

  const tabs = [
    { key: 'members', label: `Miembros (${org.members.length})`,                               Icon: Users    },
    { key: 'actions', label: `Acciones (${org.hireActions.length + org.adminActions.length})`,  Icon: Activity },
    { key: 'admins',  label: `Admins (${org.admins.length})`,                                   Icon: Shield   },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
          <Flag size={16} color="var(--yellow)" /> {org.label}
        </h2>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          {org.stats.active} activos · {org.hireActions.length + org.adminActions.length} acciones registradas
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatPill label="Hoy"              value={org.stats.today}    color="var(--blue)"   />
          <StatPill label="7 días"           value={org.stats.week}     color="var(--cyan)"   />
          <StatPill label="14 días"          value={org.stats.twoWeeks} color="var(--yellow)" />
          <StatPill label="30 días"          value={org.stats.month}    color="#e67e22"        />
          <StatPill label="Total reclutados" value={org.stats.total}    color="#9b59b6"        />
          <StatPill label="Activos"          value={org.stats.active}   color="var(--green)"  />
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === key ? 'var(--blue)' : 'transparent'}`,
              cursor: 'pointer',
              color: tab === key ? 'var(--text)' : 'var(--muted)',
              fontWeight: tab === key ? 700 : 400,
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, marginBottom: -1,
            }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTable members={org.members} orgKey={org.key} />}
      {tab === 'actions' && <ActionsLog   hireActions={org.hireActions} adminActions={org.adminActions} orgKey={org.key} />}
      {tab === 'admins'  && <AdminsPanel  admins={org.admins} orgKey={org.key} />}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function Organizaciones({ user }) {
  const allowed = user && (ALLOWED_IDS.has(user.id) || (Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE)));
  if (!allowed) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
      <Shield size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div>No tienes acceso a esta sección.</div>
    </div>
  );

  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [updated, setUpdated]   = useState(null);
  const abortRef                = useRef(null);

  async function load() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError(''); setProgress('Buscando registros…');
    try {
      // Fetch all query terms in parallel
      setProgress('Cargando reclutamientos…');
      const [hireResults, adminResults] = await Promise.all([
        Promise.all(HIRE_QUERIES.map(q => searchAllPages(q, HIRE_CHANNEL, ctrl.signal))),
        Promise.all(ADMIN_QUERIES.map(q => searchAllPages(q, ADMIN_CHANNEL, ctrl.signal))),
      ]);
      if (ctrl.signal.aborted) return;

      const hireLogs  = dedupById(hireResults.flat());
      const adminLogs = dedupById(adminResults.flat());

      setProgress('Procesando…');
      const built = buildOrgs(hireLogs, adminLogs);
      setOrgs(built);
      setUpdated(new Date());
      if (built.length && !selected) setSelected(built[0].key);
    } catch (e) {
      if (!ctrl.signal.aborted) setError('Error al cargar datos.');
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setProgress(''); }
    }
  }

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, []); // eslint-disable-line

  const visibleOrgs = search
    ? orgs.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || o.key.includes(search.toLowerCase()))
    : orgs;

  const activeOrg = orgs.find(o => o.key === selected);
  const totalRecr = orgs.reduce((s, o) => s + o.stats.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
            <Flag size={15} /> Organizaciones Criminales
          </h1>
          {updated && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {orgs.length} organizaciones · {totalRecr} reclutados · actualizado {fmtTimeRelative(updated)}
            </div>
          )}
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? (progress || 'Cargando…') : 'Actualizar'}
        </button>
        {error && <div style={{ width: '100%', color: 'var(--red)', fontSize: 12 }}>{error}</div>}
      </div>

      {/* Body — minHeight:0 prevents flex children from overflowing their parent */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 280, minWidth: 280, maxWidth: 280, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flexShrink: 0, padding: '10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar organización…"
                style={{ width: '100%', padding: '6px 8px 6px 26px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 4px' }}>
            {loading && !orgs.length && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{progress || 'Cargando…'}</div>
            )}
            {visibleOrgs.map(org => {
              const isActive = selected === org.key;
              return (
                <button
                  key={org.key}
                  onClick={() => setSelected(org.key)}
                  className="org-card"
                  data-active={isActive}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: isActive ? 'var(--surface2)' : 'var(--surface)',
                    border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
                    borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 6,
                    padding: '9px 10px',
                    cursor: 'pointer',
                    marginBottom: 4,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: isActive ? 'var(--text)' : '#c8cdd4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 175,
                    }}>
                      {org.label}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? 'var(--blue)' : '#8b9bb0',
                      background: 'var(--surface2)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}>
                      {org.stats.total}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[['HOY', org.stats.today, 'var(--blue)'], ['7D', org.stats.week, 'var(--cyan)'], ['TOTAL', org.stats.total, 'var(--green)']].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: c, lineHeight: 1.1 }}>{v}</div>
                        <div style={{ fontSize: 9, color: '#8b9bb0', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: 20 }}>
          {activeOrg
            ? <OrgDetail org={activeOrg} />
            : !loading && <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 60 }}>Selecciona una organización.</div>
          }
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .org-card:hover { background: var(--surface2) !important; border-color: var(--blue) !important; }
        .org-card:hover span:first-child { color: var(--text) !important; }
      `}</style>
    </div>
  );
}
