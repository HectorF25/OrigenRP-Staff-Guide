'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Lock, AlertTriangle, Car, RefreshCw } from 'lucide-react';
import LogEntry, { StatCard } from '@/app/components/LogEntry';
import { FM_PROJECT_ID } from '@/lib/fivemonitor';

// ─── Configuración ────────────────────────────────────────────────────────────
const BUG_CH_ID    = '69d39636438bd79dd2a1831b'; // canal "maleteros-logs"
const ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019']);
const ALLOWED_ROLE = '1487429315992879114';
const SUPER_ROLE   = '1484372151111782510';

const DAYS_BACK   = 3;          // ventana de tiempo para la vista "recientes"
const PAGE_LIMIT  = 100;        // límite por página pedido
const MAX_PAGES   = 400;        // tope de seguridad (~40k logs) para no colgar el navegador
const SEARCH_LIMIT = 100;

// Tipos de almacenamiento que nos interesan en esta página.
const TRACKED_TYPES = ['MALETERO', 'GUANTERA'];

function canAccess(user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes(SUPER_ROLE)) return true;
  if (ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ALLOWED_ROLE);
}

// ─── Helpers de extracción (admite embed.fields[] o texto "**Clave:** valor") ──
function fieldsArr(log) {
  return log.metadata?.embeds?.[0]?.fields ?? [];
}
function embedDesc(log) {
  return log.metadata?.embeds?.[0]?.description ?? log.message ?? '';
}
function findByName(log, kwRegex) {
  for (const f of fieldsArr(log)) {
    if (kwRegex.test(f.name ?? '')) return (f.value ?? '').trim();
  }
  const text = embedDesc(log);
  const lineRe = /\*\*([^*\n]+?):\*\*\s*([^\n]+)/g;
  let m;
  while ((m = lineRe.exec(text)) !== null) {
    if (kwRegex.test(m[1])) return m[2].trim();
  }
  return null;
}
function fullText(log) {
  return [embedDesc(log), ...fieldsArr(log).map(f => `${f.name ?? ''} ${f.value ?? ''}`)].join('\n');
}

function extractPlate(log) {
  const raw = findByName(log, /placa|matr[ií]cula/i);
  if (!raw) return null;
  const m = raw.match(/[A-Z0-9]{3,12}/i);
  return (m ? m[0] : raw).trim().toUpperCase();
}

function extractDiscordId(log) {
  const text = fullText(log);
  const mention = text.match(/<@!?(\d{15,21})>/);
  if (mention) return mention[1];
  // Formato real en "Identificadores del Jugador": "**Discord:** discord:762730553480708096"
  const tag = text.match(/discord\s*:\s*(\d{15,21})/i);
  if (tag) return tag[1];
  const named = findByName(log, /discord/i);
  if (named) {
    const m = named.match(/(\d{15,21})/);
    if (m) return m[1];
  }
  return null;
}

function extractStorageType(log) {
  const raw = findByName(log, /tipo de almacenamiento|almacenamiento/i);
  return (raw || '').trim().toUpperCase();
}

// Solo nos interesan acciones de GUANTERA o MALETERO.
function isTrackedStorage(log) {
  const type = extractStorageType(log);
  if (type) return TRACKED_TYPES.some(t => type.includes(t));
  return /maletero|guantera/i.test(fullText(log));
}

function plateLength(plate) {
  return plate?.length ?? 0;
}

// Placas normales: 6-7 caracteres. Las que inician por "VIP" pueden tener 8.
// Cualquier otra placa con más de 7 caracteres se considera sospechosa (posible bug).
function isSuspiciousPlate(plate) {
  if (!plate) return false;
  if (plate.toUpperCase().startsWith('VIP')) return false;
  return plateLength(plate) > 7;
}

function matchesTerm(log, term) {
  if (!term) return true;
  const id = extractDiscordId(log);
  if (id && id.includes(term)) return true;
  return fullText(log).toLowerCase().includes(term.toLowerCase());
}

function logTime(log) {
  return new Date(log.timestamp ?? log.createdAt ?? 0).getTime();
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MaleterosBug({ user }) {
  const hasAccess = canAccess(user);

  const [mode, setMode]   = useState('recent'); // 'recent' | 'search'
  const [query, setQuery] = useState('');
  // Esta página SIEMPRE muestra solo matrículas bug (no hay opción de ver todas).

  const [recentLogs, setRecentLogs]       = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentError, setRecentError]     = useState(null);
  const [recentProgress, setRecentProgress] = useState(0); // página que se está cargando
  const [recentTruncated, setRecentTruncated] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [searchedTerm, setSearchedTerm]   = useState('');

  const loadAbortRef   = useRef(null);
  const searchAbortRef = useRef(null);

  async function loadRecentWindow() {
    if (loadAbortRef.current) loadAbortRef.current.abort();
    const ctrl = new AbortController();
    loadAbortRef.current = ctrl;

    setLoadingRecent(true);
    setRecentError(null);
    setRecentTruncated(false);
    setRecentProgress(0);

    try {
      const cutoff = Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000;
      const seen = new Set();
      const all  = [];
      let page = 1;

      while (page <= MAX_PAGES) {
        if (ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        setRecentProgress(page);

        const res = await fetch(`/api/fm/v1/channels/${BUG_CH_ID}/logs?page=${page}&limit=${PAGE_LIMIT}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const entries = Array.isArray(raw) ? raw : (raw.logs ?? []);
        if (entries.length === 0) break;

        let reachedCutoff = false;
        for (const log of entries) {
          const ts = logTime(log);
          if (ts < cutoff) { reachedCutoff = true; continue; }
          if (seen.has(log._id)) continue;
          seen.add(log._id);
          all.push(log);
        }

        if (reachedCutoff) break;
        page++;
        if (page <= MAX_PAGES) await new Promise(r => setTimeout(r, 50));
      }

      if (page > MAX_PAGES) setRecentTruncated(true);

      all.sort((a, b) => logTime(b) - logTime(a));
      setRecentLogs(all);
    } catch (e) {
      if (e.name !== 'AbortError') setRecentError(e.message);
    } finally {
      setLoadingRecent(false);
    }
  }

  function cancelRecentLoad() {
    if (loadAbortRef.current) loadAbortRef.current.abort();
    setLoadingRecent(false);
  }

  useEffect(() => {
    if (hasAccess) loadRecentWindow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  async function handleSearch(e) {
    e?.preventDefault();
    const term = query.trim();
    if (!term || searching) return;

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;

    setSearching(true);
    setSearchError(null);
    setMode('search');
    setSearchedTerm(term);

    try {
      const seen = new Set();
      const all  = [];
      let page = 1, totalPages = 1;

      while (page <= totalPages) {
        if (ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search` +
          `?q=${encodeURIComponent(term)}&limit=${SEARCH_LIMIT}&page=${page}&cId=${BUG_CH_ID}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        totalPages = data.totalPages ?? 1;
        for (const log of data.logs ?? []) {
          if (seen.has(log._id)) continue;
          seen.add(log._id);
          if (matchesTerm(log, term)) all.push(log);
        }
        page++;
        if (page <= totalPages) await new Promise(r => setTimeout(r, 100));
      }

      all.sort((a, b) => logTime(b) - logTime(a));
      setSearchResults(all);
    } catch (e) {
      if (e.name !== 'AbortError') setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    setMode('recent');
    setQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSearchedTerm('');
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
            Esta herramienta es solo para administradores autorizados.
          </div>
        </div>
      </div>
    );
  }

  const isSearchMode = mode === 'search';
  const baseLogs    = isSearchMode ? searchResults : recentLogs;
  const trackedLogs = baseLogs.filter(isTrackedStorage);
  const annotated = trackedLogs.map(log => {
    const plate = extractPlate(log);
    return { log, plate, suspicious: isSuspiciousPlate(plate) };
  });
  const visible         = annotated.filter(a => a.suspicious);
  const suspiciousCount = visible.length;
  const loading = isSearchMode ? searching : loadingRecent;
  const error   = isSearchMode ? searchError : recentError;

  return (
    <div className="section active">
      {/* Cabecera */}
      <div className="pg-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={15} style={{ color: 'var(--red)' }} />
            Maleteros Bug
          </div>
          <div className="pg-sub">
            Solo matrículas bug (más de 7 caracteres, excepto VIP) · guantera y maletero · últimos {DAYS_BACK} días · búsqueda por ID de Discord
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 16px', alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            ID de Discord, jugador o placa
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
              placeholder="ej. 343822757911330817 o GO8A55T3"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || searching}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 7, padding: '8px 18px',
            cursor: query.trim() && !searching ? 'pointer' : 'not-allowed',
            fontSize: 13, fontWeight: 600,
            opacity: query.trim() && !searching ? 1 : .5,
            flexShrink: 0,
          }}
        >
          {searching ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={13} />}
          {searching ? 'Buscando…' : 'Buscar'}
        </button>

        {isSearchMode && (
          <button type="button" onClick={clearSearch} className="btns" style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}>
            ✕ Limpiar
          </button>
        )}
      </form>

      {/* Stats */}
      <div className="rob-grid" style={{ marginBottom: 14 }}>
        <StatCard label={isSearchMode ? 'Resultados' : `Cargados (${DAYS_BACK}d)`} value={baseLogs.length} color="var(--text)" />
        <StatCard label="Guantera/Maletero" value={trackedLogs.length} color="var(--text2)" />
        <StatCard label="Matrículas bug" value={suspiciousCount} color="var(--red)" />
      </div>

      {/* Error */}
      {error && (
        <div className="alert al-r" style={{ marginBottom: 16 }}>
          <span className="al-icon"><AlertTriangle size={13} /></span>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>
          <span className="spinner" style={{ width: 16, height: 16 }} />
          <span>
            {isSearchMode
              ? `Buscando "${searchedTerm}" en #maleteros-bug…`
              : `Cargando últimos ${DAYS_BACK} días de guantera y maletero… (página ${recentProgress})`}
          </span>
          {!isSearchMode && (
            <button type="button" className="btns" style={{ fontSize: 11, padding: '4px 10px', marginLeft: 'auto' }} onClick={cancelRecentLoad}>
              Cancelar
            </button>
          )}
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && visible.length === 0 && (
        <div className="norm-empty">
          {isSearchMode
            ? `Sin resultados para "${searchedTerm}".`
            : trackedLogs.length === 0 && baseLogs.length > 0
              ? 'No hay acciones de guantera/maletero en los últimos días cargados.'
              : trackedLogs.length > 0
                ? 'No se detectaron matrículas bug en guantera/maletero de los últimos días.'
                : 'No hay reportes en este canal.'}
        </div>
      )}

      {/* Lista */}
      {!loading && visible.map(({ log, plate, suspicious }) => (
        <div key={log._id} style={{ marginBottom: 10 }}>
          {suspicious && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)',
              borderRadius: '8px 8px 0 0', padding: '6px 14px',
              fontSize: 11, color: 'var(--red)', fontWeight: 600,
            }}>
              <AlertTriangle size={12} />
              Placa sospechosa: {plate} ({plateLength(plate)} caracteres)
            </div>
          )}
          <div style={suspicious ? { marginTop: -1 } : undefined}>
            <LogEntry log={log} />
          </div>
        </div>
      ))}

      {/* Pie (solo modo recientes) */}
      {!isSearchMode && !loading && !error && (
        <div style={{
          marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <button
            className="btns"
            style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={loadRecentWindow}
          >
            <RefreshCw size={11} /> Actualizar (últimos {DAYS_BACK} días)
          </button>
          {recentTruncated && (
            <span style={{ fontSize: 11, color: 'var(--yellow)' }}>
              ⚠ Se alcanzó el límite de páginas antes de cubrir los {DAYS_BACK} días completos. Algunos registros antiguos pueden faltar.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
