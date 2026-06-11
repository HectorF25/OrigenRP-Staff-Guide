'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Shield, RefreshCw, Lock, ChevronLeft, ChevronRight,
  Users, UserX, Activity, Search,
} from 'lucide-react';
import { FM_PROJECT_ID, fmtTimeRelative } from '@/lib/fivemonitor';

// ─── Config ───────────────────────────────────────────────────────────────────
const HIRE_CHANNEL      = '69d3a14ab036cafed646d3fe';
const ADMIN_CHANNEL     = '69d3a12db036cafed646d33e';
const DISCORD_SEARCH_CH = '69d3a24eb036cafed646d59e';
const PAGE_LIMIT        = 100;
const ROWS_PER_PAGE     = 20;
const ALLOWED_IDS       = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE      = '1487429315992879114';

function canAccess(user) {
  if (!user) return false;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

// ─── Parse helpers ────────────────────────────────────────────────────────────
function getField(fields, needle) {
  return (fields || []).find(x => x.name?.includes(needle))?.value ?? null;
}
function parseDiscordId(val) {
  const m = (val || '').match(/<@(\d+)>/);
  return m ? m[1] : null;
}
function parseGameName(val) {
  if (!val) return null;
  const m = val.match(/\*\*Nombre:\*\*\s*(.+)/);
  return m ? m[1].trim() : val.trim();
}
function formatOrgName(id) {
  return (id || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function actionMeta(title) {
  if (title.includes('Contratar'))       return { type: 'hire',   color: 'var(--green)',  icon: '✅' };
  if (title.includes('Remover'))         return { type: 'remove', color: 'var(--red)',    icon: '❌' };
  if (title.includes('Cambio de Rango')) return { type: 'rank',   color: 'var(--yellow)', icon: '🔄' };
  if (title.includes('Crear Rango'))     return { type: 'rank',   color: 'var(--yellow)', icon: '➕' };
  if (title.includes('Asignar'))         return { type: 'assign', color: 'var(--blue)',   icon: '👤' };
  if (title.includes('Configuración'))   return { type: 'config', color: '#8b5cf6',       icon: '⚙️' };
  if (title.includes('Eliminar Banda'))  return { type: 'delete', color: 'var(--red)',    icon: '🗑️' };
  if (title.includes('Garage'))         return { type: 'garage', color: 'var(--text3)',  icon: '🚗' };
  return                                        { type: 'other',  color: 'var(--text3)',  icon: '📋' };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchChannel(channelId, onProgress, signal) {
  const all = [];
  let page = 1;
  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const res = await fetch(`/api/fm/v1/channels/${channelId}/logs?page=${page}&limit=${PAGE_LIMIT}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const logs = Array.isArray(data) ? data : (data.logs || []);
    if (!logs.length) break;
    all.push(...logs);
    onProgress?.(all.length);
    if (logs.length < PAGE_LIMIT) break;
    page++;
    if (page > 50) break;
    await new Promise(r => setTimeout(r, 60));
  }
  return all;
}

async function lookupDiscordName(discordId, signal) {
  try {
    const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${discordId}&limit=1&page=1&cId=${DISCORD_SEARCH_CH}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const fields = data.logs?.[0]?.metadata?.embeds?.[0]?.fields || [];
    return fields.find(f => f.name === 'Nombre')?.value ?? null;
  } catch { return null; }
}

// ─── Build orgs from logs ─────────────────────────────────────────────────────
function buildOrgs(hireLogs, adminLogs) {
  const orgs = {};
  const ensure = id => {
    if (!orgs[id]) orgs[id] = { id, members: [], actions: [], removedNames: new Set() };
    return orgs[id];
  };

  for (const log of hireLogs) {
    const embed  = log.metadata?.embeds?.[0];
    if (!embed) continue;
    const title  = embed.title || '';
    const fields = embed.fields || [];
    const banda  = getField(fields, 'Banda')?.toLowerCase().trim();
    if (!banda) continue;
    const org = ensure(banda);
    const ts  = log.timestamp || log.createdAt;
    const meta = actionMeta(title);

    if (title.includes('Contratar')) {
      const mf      = getField(fields, 'Nuevo miembro') || '';
      const gameName  = parseGameName(mf);
      const discordId = parseDiscordId(mf);
      const rank      = getField(fields, 'Rango asignado') || getField(fields, 'Rango') || '?';
      org.members.push({ gameName, discordId, discordName: null, rank, joinedAt: ts, removed: false });
      org.actions.push({ ...meta, title, ts, detail: `${gameName || '?'} → rango ${rank}`, adminName: null, adminDiscord: null, isAdmin: false });
    } else {
      const exField   = getField(fields, 'ejecutó') || '';
      const adminName = parseGameName(exField);
      const adminDis  = parseDiscordId(exField);
      const affected  = getField(fields, 'afectado') || '';
      const newRank   = getField(fields, 'Nuevo rango') || '';
      const rankName  = getField(fields, 'Nombre del rango') || '';
      const detail    = affected ? `${affected} → ${newRank}` : rankName ? `Nuevo rango: ${rankName}` : title;
      org.actions.push({ ...meta, title, ts, detail, adminName, adminDiscord: adminDis, isAdmin: !!adminName });
    }
  }

  for (const log of adminLogs) {
    const embed  = log.metadata?.embeds?.[0];
    if (!embed) continue;
    const title  = embed.title || '';
    const fields = embed.fields || [];
    const banda  = (getField(fields, 'Banda') || getField(fields, 'banda eliminada') || '').toLowerCase().trim();
    if (!banda) continue;
    const org  = ensure(banda);
    const ts   = log.timestamp || log.createdAt;
    const meta = actionMeta(title);

    const af        = getField(fields, 'Administrador') || getField(fields, 'ejecutó') || '';
    const adminName = parseGameName(af);
    const adminDis  = parseDiscordId(af);

    let detail = '';
    if (title.includes('Remover')) {
      const removed = getField(fields, 'removido') || getField(fields, 'Jugador removido') || '';
      detail = `Removido: ${removed}`;
      if (removed && !removed.startsWith('char') && !removed.startsWith('license')) {
        org.removedNames.add(removed.trim().toLowerCase());
      }
    } else if (title.includes('Asignar')) {
      const assigned = getField(fields, 'asignado') || getField(fields, 'Jugador asignado') || '';
      const rank     = getField(fields, 'Rango') || '?';
      detail = `${assigned} → rango ${rank}`;
    } else if (title.includes('Configuración')) {
      detail = getField(fields, 'Cambios') || 'Configuración modificada';
    } else if (title.includes('Eliminar Banda')) {
      const n = getField(fields, 'afectados') || getField(fields, 'Miembros afectados') || '?';
      detail = `${n} miembro(s) afectados`;
    } else if (title.includes('Garage')) {
      const jugField = getField(fields, 'Jugador') || '';
      const jName    = parseGameName(jugField);
      detail = jName || '';
    } else {
      detail = title;
    }

    const isAdmin = !!adminName && !title.includes('Garage');
    org.actions.push({ ...meta, title, ts, detail, adminName, adminDiscord: adminDis, isAdmin });
  }

  // Cross-reference removals & sort
  for (const org of Object.values(orgs)) {
    for (const m of org.members) {
      if (m.gameName && org.removedNames.has(m.gameName.trim().toLowerCase())) {
        m.removed = true;
      }
    }
    org.actions.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }

  return orgs;
}

// ─── Time ─────────────────────────────────────────────────────────────────────
function countSince(members, days) {
  if (days === 0) return members.length;
  const cut = Date.now() - days * 86_400_000;
  return members.filter(m => new Date(m.joinedAt).getTime() >= cut).length;
}
function fmtShort(ts) {
  if (!ts) return '—';
  try { return new Intl.DateTimeFormat('es', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'UTC' }).format(new Date(ts)); }
  catch { return ts; }
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = ['#ef4444','#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#6366f1'];
function avatarColor(name) {
  const c = [...(name||'A')].find(c => /\p{L}/u.test(c)) ?? 'A';
  return PALETTE[c.toUpperCase().charCodeAt(0) % PALETTE.length];
}
function avatarLetter(name) {
  return ([...(name||'?')].find(c => /\p{L}/u.test(c))?.toUpperCase()) ?? '?';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatPill({ value, label, accent }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', borderTop: `3px solid ${accent || 'var(--border)'}` }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
    </div>
  );
}

function MembersTable({ members, discordCache, onLoadDiscord }) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  useEffect(() => { setPage(0); }, [members.length]);

  const filtered = filter
    ? members.filter(m =>
        (m.gameName || '').toLowerCase().includes(filter.toLowerCase()) ||
        (m.discordId || '').includes(filter) ||
        (discordCache[m.discordId] || '').toLowerCase().includes(filter.toLowerCase())
      )
    : members;

  const sorted   = [...filtered].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  const total    = sorted.length;
  const pages    = Math.ceil(total / ROWS_PER_PAGE);
  const slice    = sorted.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // Trigger lazy discord name loads
  useEffect(() => {
    const ids = [...new Set(slice.filter(m => m.discordId && !discordCache[m.discordId]).map(m => m.discordId))];
    ids.forEach(id => onLoadDiscord(id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, members.length]);

  const active  = members.filter(m => !m.removed).length;
  const removed = members.filter(m => m.removed).length;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>{active}</span> activos
          {removed > 0 && <> · <span style={{ color: 'var(--red)', fontWeight: 700 }}>{removed}</span> removidos</>}
          {' '}· {total} total
        </span>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <svg style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', opacity:.4, pointerEvents:'none' }} width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/></svg>
          <input className="fm-search-input" placeholder="Buscar miembro…" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} style={{ paddingLeft: 26, width: 180 }} />
        </div>
      </div>

      {total === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>Sin miembros</div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 60px 120px 80px', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 10, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--text3)', gap: 10 }}>
              <div>Nombre en juego</div>
              <div>Discord</div>
              <div>Discord ID</div>
              <div>Rango</div>
              <div>Ingresó</div>
              <div>Estado</div>
            </div>
            {slice.map((m, i) => {
              const discordName = m.discordId ? (discordCache[m.discordId] ?? '…') : '—';
              const nameLoading = m.discordId && discordCache[m.discordId] === undefined;
              return (
                <div
                  key={`${m.gameName}-${m.joinedAt}-${i}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 140px 60px 120px 80px',
                    padding: '9px 14px',
                    borderBottom: i < slice.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: 10, alignItems: 'center',
                    background: m.removed ? 'rgba(239,68,68,.04)' : 'transparent',
                    opacity: m.removed ? .65 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = m.removed ? 'rgba(239,68,68,.07)' : 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = m.removed ? 'rgba(239,68,68,.04)' : 'transparent'}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.gameName}>
                    {m.gameName || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: nameLoading ? 'var(--text3)' : 'var(--blue)', fontStyle: nameLoading ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {discordName}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)' }}>
                    {m.discordId ? (
                      <span
                        title="Copiar ID"
                        style={{ cursor: 'pointer', padding: '2px 6px', background: 'rgba(88,101,242,.15)', borderRadius: 4, color: '#7289da', fontSize: 10 }}
                        onClick={() => navigator.clipboard.writeText(m.discordId).catch(() => {})}
                      >
                        {m.discordId}
                      </span>
                    ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(249,202,36,.12)', color: 'var(--yellow)', fontSize: 10, fontWeight: 700 }}>
                      {m.rank}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtShort(m.joinedAt)}</div>
                  <div>
                    {m.removed
                      ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(239,68,68,.15)', color: 'var(--red)', fontWeight: 700 }}>❌ Removido</span>
                      : <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,.12)', color: 'var(--green)', fontWeight: 700 }}>✅ Activo</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} className="btns" style={{ fontSize:11, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, opacity: page===0?.45:1 }}>
                <ChevronLeft size={12} /> Anterior
              </button>
              <span style={{ fontSize:11, color:'var(--text3)' }}>
                Página <strong style={{ color:'var(--text2)' }}>{page+1}</strong> de {pages}
                <span style={{ marginLeft:6, fontSize:10 }}>({total} miembros)</span>
              </span>
              <button onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page>=pages-1} className="btns" style={{ fontSize:11, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, opacity: page>=pages-1?.45:1 }}>
                Siguiente <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActionsLog({ actions, filterType }) {
  const [page, setPage]     = useState(0);
  const [typeFilter, setTypeFilter] = useState(filterType || 'all');
  useEffect(() => { setPage(0); }, [actions.length, typeFilter]);

  const types = ['all', 'hire', 'assign', 'remove', 'rank', 'config', 'delete', 'garage'];
  const typeLabels = { all:'Todo', hire:'Contratar', assign:'Asignar', remove:'Remover', rank:'Rango', config:'Config', delete:'Eliminar', garage:'Garage' };

  const filtered = typeFilter === 'all' ? actions : actions.filter(a => a.type === typeFilter);
  const pages    = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const slice    = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  return (
    <div>
      {/* Type filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {types.map(t => (
          <button key={t} className={`btns${typeFilter===t?' active':''}`} style={{ fontSize:10, padding:'4px 10px' }} onClick={() => setTypeFilter(t)}>
            {typeLabels[t]} {typeFilter!==t && <span style={{ opacity:.5 }}>({t==='all'?actions.length:actions.filter(a=>a.type===t).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding:'32px', textAlign:'center', fontSize:12, color:'var(--text3)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>Sin acciones de este tipo</div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
            {slice.map((a, i) => (
              <div key={i} style={{ background:'var(--surface)', border:`1px solid var(--border)`, borderLeft:`3px solid ${a.color}`, borderRadius:8, padding:'10px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{a.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{a.title}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    {a.adminName && <span style={{ color:'var(--blue)' }}>{a.adminName}</span>}
                    {a.adminName && a.detail ? ' — ' : ''}
                    {a.detail}
                  </div>
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', textAlign:'right', whiteSpace:'nowrap', flexShrink:0 }}>
                  {fmtTimeRelative(a.ts)}<br/>
                  <span style={{ fontSize:9 }}>{fmtShort(a.ts)}</span>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="btns" style={{ fontSize:11, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, opacity:page===0?.45:1 }}>
                <ChevronLeft size={12} /> Anterior
              </button>
              <span style={{ fontSize:11, color:'var(--text3)' }}>
                Página <strong style={{ color:'var(--text2)' }}>{page+1}</strong> de {pages}
              </span>
              <button onClick={() => setPage(p => Math.min(pages-1,p+1))} disabled={page>=pages-1} className="btns" style={{ fontSize:11, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, opacity:page>=pages-1?.45:1 }}>
                Siguiente <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminsPanel({ actions }) {
  const [selected, setSelected] = useState(null);

  const adminMap = new Map();
  for (const a of actions) {
    if (!a.adminName || a.type === 'garage') continue;
    if (!adminMap.has(a.adminName)) adminMap.set(a.adminName, []);
    adminMap.get(a.adminName).push(a);
  }

  const admins = [...adminMap.entries()].sort((a,b) => b[1].length - a[1].length);
  const maxCount = Math.max(1, ...admins.map(([,r]) => r.length));

  if (selected) {
    const aRecs  = adminMap.get(selected) || [];
    const aColor = avatarColor(selected);
    const aLet   = avatarLetter(selected);
    const byType = {};
    for (const a of aRecs) byType[a.type] = (byType[a.type] || 0) + 1;

    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--text3)', padding:'0 0 14px 0' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--text2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
          <ChevronLeft size={14} /> Volver
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background: aColor+'22', border:`2px solid ${aColor}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:aColor }}>
            {aLet}
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{selected}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{aRecs.length} acciones · último {fmtTimeRelative(aRecs[0]?.ts)}</div>
          </div>
        </div>
        {/* Type breakdown */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8, marginBottom:16 }}>
          {Object.entries(byType).map(([type, cnt]) => {
            const meta = actionMeta(type === 'hire' ? 'Contratar' : type === 'remove' ? 'Remover' : type === 'rank' ? 'Cambio de Rango' : type === 'assign' ? 'Asignar' : type === 'config' ? 'Configuración' : type === 'delete' ? 'Eliminar Banda' : type);
            return (
              <div key={type} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', borderTop:`2px solid ${meta.color}` }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{meta.icon}</div>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{cnt}</div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.4px', marginTop:2 }}>{type}</div>
              </div>
            );
          })}
        </div>
        <ActionsLog actions={aRecs} />
      </div>
    );
  }

  if (!admins.length) return (
    <div style={{ padding:'32px', textAlign:'center', fontSize:12, color:'var(--text3)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
      Sin acciones de administrador registradas
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
      {admins.map(([admin, recs], idx) => {
        const aColor = avatarColor(admin);
        const aLet   = avatarLetter(admin);
        const pct    = Math.round((recs.length / maxCount) * 100);
        return (
          <div key={admin} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:aColor+'22', border:`2px solid ${aColor}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:aColor, flexShrink:0 }}>
                {aLet}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin}</div>
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 5px', flexShrink:0 }}>#{idx+1}</div>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:6 }}>
              <span style={{ fontSize:32, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{recs.length}</span>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.8px', color:'var(--text3)', textTransform:'uppercase' }}>acciones</span>
            </div>
            <div style={{ height:4, background:'var(--border)', borderRadius:999, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', borderRadius:999, width:`${pct}%`, background:'var(--blue)', transition:'width .4s' }} />
            </div>
            <div style={{ fontSize:10, color:'var(--text3)', marginBottom:10 }}>
              Último: {fmtTimeRelative(recs[0]?.ts)}
            </div>
            <button onClick={() => setSelected(admin)} className="btns" style={{ width:'100%', textAlign:'center', fontSize:12, padding:'6px' }}>
              Ver detalle →
            </button>
          </div>
        );
      })}
    </div>
  );
}

function OrgDetail({ org, discordCache, onLoadDiscord }) {
  const [tab, setTab] = useState('members');

  const today    = countSince(org.members, 1);
  const week     = countSince(org.members, 7);
  const twoWeeks = countSince(org.members, 14);
  const month    = countSince(org.members, 30);
  const total    = org.members.length;
  const removed  = org.members.filter(m => m.removed).length;
  const active   = total - removed;

  const adminActions = org.actions.filter(a => a.isAdmin);

  return (
    <div>
      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:10, marginBottom:20 }}>
        <StatPill value={today}    label="Hoy"       accent="var(--blue)" />
        <StatPill value={week}     label="7 días"    accent="var(--blue)" />
        <StatPill value={twoWeeks} label="14 días"   accent="var(--blue)" />
        <StatPill value={month}    label="30 días"   accent="var(--blue)" />
        <StatPill value={total}    label="Total reclutados" accent="#8b5cf6" />
        <StatPill value={active}   label="Activos"   accent="var(--green)" />
        {removed > 0 && <StatPill value={removed} label="Removidos" accent="var(--red)" />}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:18 }}>
        {[
          { key:'members', label:`👥 Miembros (${total})` },
          { key:'actions', label:`📋 Acciones (${org.actions.length})` },
          { key:'admins',  label:`🛡️ Admins (${new Set(adminActions.map(a=>a.adminName)).size})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?'var(--blue)':'transparent'}`, marginBottom:-1, padding:'9px 18px', fontSize:13, color: tab===t.key ? 'var(--blue)' : 'var(--text3)', cursor:'pointer', transition:'color .15s', fontWeight: tab===t.key ? 600 : 400 }}
            onMouseEnter={e=>{ if(tab!==t.key) e.currentTarget.style.color='var(--text2)'; }}
            onMouseLeave={e=>{ if(tab!==t.key) e.currentTarget.style.color='var(--text3)'; }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTable members={org.members} discordCache={discordCache} onLoadDiscord={onLoadDiscord} />}
      {tab === 'actions' && <ActionsLog actions={org.actions} />}
      {tab === 'admins'  && <AdminsPanel actions={adminActions} />}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Organizaciones({ user }) {
  const hasAccess = canAccess(user);

  const [orgs,         setOrgs]         = useState({});
  const [loading,      setLoading]      = useState(false);
  const [progress,     setProgress]     = useState('');
  const [error,        setError]        = useState(null);
  const [loadedAt,     setLoadedAt]     = useState(null);
  const [selectedOrg,  setSelectedOrg]  = useState(null);
  const [orgSearch,    setOrgSearch]    = useState('');
  const [discordCache, setDiscordCache] = useState({});
  const abortRef = useRef(null);
  const dcAbortRef = useRef(null);

  async function loadDiscordName(discordId) {
    if (!discordId || discordCache[discordId] !== undefined) return;
    setDiscordCache(c => ({ ...c, [discordId]: undefined })); // mark pending
    const name = await lookupDiscordName(discordId, dcAbortRef.current?.signal);
    setDiscordCache(c => ({ ...c, [discordId]: name }));
  }

  function load() {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setOrgs({});
    setSelectedOrg(null);
    setProgress('Cargando reclutamiento…');

    Promise.all([
      fetchChannel(HIRE_CHANNEL,  n => setProgress(`Reclutamiento: ${n} logs…`),   ctrl.signal),
      fetchChannel(ADMIN_CHANNEL, n => setProgress(`Admin logs: ${n}…`),            ctrl.signal),
    ])
      .then(([hireLogs, adminLogs]) => {
        setProgress('Procesando…');
        const built = buildOrgs(hireLogs, adminLogs);
        setOrgs(built);
        setLoadedAt(new Date());
        setProgress('');
      })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!hasAccess) return;
    dcAbortRef.current = new AbortController();
    load();
    return () => {
      abortRef.current?.abort();
      dcAbortRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="section active">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:14, color:'var(--text3)' }}>
          <Lock size={36} style={{ opacity:.35 }} />
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text2)' }}>Acceso restringido</div>
          <div style={{ fontSize:13, textAlign:'center', maxWidth:300 }}>Solo coordinadores de ilegales pueden ver esta sección.</div>
        </div>
      </div>
    );
  }

  // Sorted org list
  const orgKeys = Object.keys(orgs)
    .filter(k => !orgSearch || k.includes(orgSearch.toLowerCase().replace(/ /g,'_')) || formatOrgName(k).toLowerCase().includes(orgSearch.toLowerCase()))
    .sort((a, b) => orgs[b].members.length - orgs[a].members.length);

  const totalOrgs    = Object.keys(orgs).length;
  const totalMembers = Object.values(orgs).reduce((s, o) => s + o.members.length, 0);

  return (
    <div className="section active">
      {/* Header */}
      <div className="pg-header" style={{ marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="pg-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Shield size={15} style={{ color:'var(--blue)' }} />
            Organizaciones Criminales
          </div>
          <div className="pg-sub">
            {loading
              ? progress || 'Cargando…'
              : loadedAt
                ? `${totalOrgs} organizaciones · ${totalMembers.toLocaleString('es')} reclutados · actualizado ${fmtTimeRelative(loadedAt)}`
                : 'Monitor de bandas y organizaciones'
            }
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btns"
          style={{ display:'flex', alignItems:'center', gap:6, opacity:loading?.5:1 }}>
          <RefreshCw size={12} style={{ animation:loading?'spin 1s linear infinite':'none' }} />
          Actualizar
        </button>
      </div>

      {error && <div className="alert al-r" style={{ marginBottom:14 }}>{error}</div>}

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text3)', fontSize:13, marginBottom:20 }}>
          <span className="spinner" style={{ width:18, height:18 }} />
          {progress}
        </div>
      )}

      {!loading && totalOrgs > 0 && (
        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

          {/* ── Left: org list ── */}
          <div style={{ width:280, flexShrink:0, position:'sticky', top:16 }}>
            {/* Search */}
            <div style={{ position:'relative', marginBottom:10 }}>
              <svg style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', opacity:.4, pointerEvents:'none' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/></svg>
              <input className="fm-search-input" placeholder="Buscar organización…" value={orgSearch} onChange={e => setOrgSearch(e.target.value)} style={{ paddingLeft:28, width:'100%', boxSizing:'border-box' }} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:'calc(100vh - 220px)', overflowY:'auto', paddingRight:2 }}>
              {orgKeys.map(k => {
                const org     = orgs[k];
                const today   = countSince(org.members, 1);
                const week    = countSince(org.members, 7);
                const total   = org.members.length;
                const active  = org.members.filter(m => !m.removed).length;
                const isSelected = selectedOrg === k;
                return (
                  <div
                    key={k}
                    onClick={() => setSelectedOrg(k)}
                    style={{
                      background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                      border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                      borderRadius:10, padding:'10px 12px', cursor:'pointer',
                      transition:'border-color .15s, background .1s',
                    }}
                    onMouseEnter={e => { if(!isSelected){ e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.background='var(--surface2)'; }}}
                    onMouseLeave={e => { if(!isSelected){ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)'; }}}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: isSelected ? 'var(--blue)' : 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:6 }}>
                        {formatOrgName(k)}
                      </div>
                      <div style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'var(--surface2)', color:'var(--text3)', border:'1px solid var(--border)', flexShrink:0, fontWeight:600 }}>
                        {active}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
                      {[['Hoy', today], ['7d', week], ['Total', total]].map(([lbl, val]) => (
                        <div key={lbl} style={{ background:'var(--bg)', borderRadius:5, padding:'4px 6px', textAlign:'center' }}>
                          <div style={{ fontSize:15, fontWeight:800, color: val > 0 ? 'var(--green)' : 'var(--text3)', lineHeight:1 }}>{val}</div>
                          <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.3px', marginTop:1 }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: detail ── */}
          <div style={{ flex:1, minWidth:0 }}>
            {selectedOrg && orgs[selectedOrg] ? (
              <div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:2 }}>
                    🏴 {formatOrgName(selectedOrg)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>
                    {orgs[selectedOrg].members.filter(m=>!m.removed).length} activos
                    {orgs[selectedOrg].members.filter(m=>m.removed).length > 0 &&
                      <> · <span style={{color:'var(--red)'}}>{orgs[selectedOrg].members.filter(m=>m.removed).length} removidos</span></>
                    }
                    {' '}· {orgs[selectedOrg].actions.length} acciones registradas
                  </div>
                </div>
                <OrgDetail
                  key={selectedOrg}
                  org={orgs[selectedOrg]}
                  discordCache={discordCache}
                  onLoadDiscord={loadDiscordName}
                />
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320, color:'var(--text3)', gap:12 }}>
                <Users size={44} style={{ opacity:.2 }} />
                <div style={{ fontSize:15, color:'var(--text2)', fontWeight:600 }}>Selecciona una organización</div>
                <div style={{ fontSize:13, textAlign:'center', maxWidth:280 }}>Elige una org de la lista para ver sus miembros, estadísticas y acciones.</div>
              </div>
            )}
          </div>

        </div>
      )}

      {!loading && totalOrgs === 0 && !error && (
        <div style={{ textAlign:'center', padding:'40px 0', fontSize:13, color:'var(--text3)' }}>
          Sin datos. Presiona Actualizar.
        </div>
      )}
    </div>
  );
}
