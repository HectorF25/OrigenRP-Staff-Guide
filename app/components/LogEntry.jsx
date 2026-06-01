'use client';

import { useState, useEffect } from 'react';
import {
  fmtTime, fmtTimeRelative, levelPillClass, levelLabel,
  levelBorderVar, embedColorToCss, getPopulatedChannel, getCategory,
  FM_PROJECT_ID,
} from '@/lib/fivemonitor';

function Md({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {parseLine(line)}
        </span>
      ))}
    </>
  );
}

function parseLine(text) {
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|<@!?\d+>|\|\|[^|\n]+?\|\||\[[^\]\n]+?\]\([^)\n]+?\))/g;
  const parts = [];
  let last = 0, match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**'))
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*'))
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    else if (token.startsWith('`'))
      parts.push(<code key={match.index} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.9em', background: 'var(--code-bg)', color: 'var(--mono)', padding: '0 4px' }}>{token.slice(1, -1)}</code>);
    else if (token.startsWith('<@')) {
      const id = token.replace(/^<@!?/, '').replace(/>$/, '');
      parts.push(<span key={match.index} style={{ color: 'var(--blue)' }}>@{id}</span>);
    } else if (token.startsWith('||'))
      parts.push(<span key={match.index} style={{ background: 'var(--border2)', color: 'transparent', borderRadius: 2, padding: '0 4px', cursor: 'default' }} title={token.slice(2, -2)}>[oculto]</span>);
    else if (token.startsWith('[')) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        const isHidden = m[2].toLowerCase().includes('hidden') || m[2].includes('||');
        parts.push(isHidden
          ? <span key={match.index} style={{ color: 'var(--text3)' }}>[Hidden]</span>
          : <a key={match.index} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>{m[1]}</a>
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function StatCard({ label, value, color }) {
  return (
    <div className="rob-card">
      <div className="rob-val" style={{ color }}>{typeof value === 'number' ? value.toLocaleString('es') : value}</div>
      <div className="rob-lbl">{label}</div>
    </div>
  );
}

function isEmptyValue(v) {
  return !v || v.trim() === '' || v === '​' || v === '​';
}

function FieldsGrid({ fields }) {
  if (!fields?.length) return null;

  const rows = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.inline && fields[i + 1]?.inline) {
      rows.push({ type: 'pair', L: f, R: fields[i + 1] });
      i += 2;
    } else {
      rows.push({ type: 'block', f });
      i++;
    }
  }

  const first = rows[0];
  const hasColHeaders =
    first?.type === 'pair' &&
    isEmptyValue(first.L.value) &&
    isEmptyValue(first.R.value);

  return (
    <div className="fm-fields-wrap">
      {rows.map((row, ri) => {
        if (row.type === 'block') {
          const isHighlight = row.f.name?.toLowerCase().includes('discord');
          return (
            <div key={ri} className={`fm-field-block${isHighlight ? ' fm-field-hl' : ''}`}>
              <span className="fm-field-key">{row.f.name}</span>
              <span className="fm-field-val"><Md text={row.f.value} /></span>
            </div>
          );
        }

        if (ri === 0 && hasColHeaders) {
          return (
            <div key={ri} className="fm-fields-col-headers">
              <div className="fm-fields-col-head">{row.L.name}</div>
              <div className="fm-fields-col-head">{row.R.name}</div>
            </div>
          );
        }

        const isHighlight =
          row.L.name?.toLowerCase().includes('discord') ||
          row.R.name?.toLowerCase().includes('discord');

        return (
          <div key={ri} className={`fm-fields-row${isHighlight ? ' fm-field-hl' : ''}`}>
            <div className="fm-field-cell">
              <span className="fm-field-key">{row.L.name}</span>
              <span className="fm-field-val"><Md text={row.L.value} /></span>
            </div>
            <div className="fm-field-cell">
              <span className="fm-field-key">{row.R.name}</span>
              <span className="fm-field-val"><Md text={row.R.value} /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function extractExecutorName(embed) {
  const fields = embed?.fields ?? [];

  for (const field of fields) {
    const fname = (field.name ?? '').toLowerCase();
    if (fname.includes('ejecut') || fname.includes('acción') || fname.includes('accion')) {
      const m = (field.value ?? '').match(/Nombre:\s*([^\n]+)/i);
      if (m) return m[1].trim();
    }
  }

  let inExecutorSection = false;
  for (const field of fields) {
    const fname = (field.name ?? '').toLowerCase();
    if (fname.includes('ejecut') || fname.includes('acción') || fname.includes('accion')) {
      inExecutorSection = true;
      continue;
    }
    if (inExecutorSection) {
      if (fname === 'nombre') return (field.value ?? '').trim();
      if (fname.includes('cachea') || fname.includes('objetivo') || fname.includes('cacheado')) break;
    }
  }

  const first = fields.find(f => (f.name ?? '').toLowerCase() === 'nombre');
  return first ? (first.value ?? '').trim() : null;
}

function DarLogRow({ log }) {
  const msg = log.message
    ?? log.metadata?.embeds?.[0]?.description
    ?? log.metadata?.embeds?.[0]?.title
    ?? '—';
  const ts = log.timestamp ?? log.createdAt ?? '';
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 14px', marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{fmtTime(ts)}</div>
    </div>
  );
}

function CacheoModal({ log, onClose }) {
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [executorName, setExecutorName] = useState('');
  const [channelFound, setChannelFound] = useState(null);

  const embed   = log.metadata?.embeds?.[0];
  const logTime = new Date(log.timestamp ?? log.createdAt ?? 0).getTime();

  useEffect(() => {
    const name = extractExecutorName(embed) ?? '';
    setExecutorName(name);
  }, [embed]);

  useEffect(() => {
    if (!executorName) {
      setLoading(false);
      return;
    }

    const WINDOW_MS = 15 * 60 * 1000; // ±15 min
    let cancelled = false;

    async function search() {
      try {
        const catsRes = await fetch(`/api/fm/v1/projects/${FM_PROJECT_ID}/categories`);
        if (!catsRes.ok) throw new Error('No se pudo cargar categorías');
        const cats = await catsRes.json();

        let darChId = null;
        let darChName = null;
        outer: for (const cat of cats) {
          const chsRes = await fetch(`/api/fm/v1/categories/${cat._id}/channels`);
          if (!chsRes.ok) continue;
          const chs = await chsRes.json();
          for (const ch of chs) {
            const n = ch.name.toLowerCase().replace(/\s/g, '-');
            if (n.includes('dar-log') || n.includes('dar_log') || n.includes('dar log')) {
              darChId = ch._id;
              darChName = ch.name;
              break outer;
            }
          }
        }

        if (cancelled) return;

        if (!darChId) {
          setError('Canal "dar-logs" no encontrado en ninguna categoría');
          setLoading(false);
          return;
        }

        setChannelFound(darChName);

        // Search by executor name in dar-logs
        const url = `/api/fm/v1/projects/${FM_PROJECT_ID}/logs/search?q=${encodeURIComponent(executorName)}&limit=100&page=1&cId=${darChId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const all = data.logs ?? [];

        const filtered = all.filter(l => {
          const t = new Date(l.timestamp ?? l.createdAt ?? 0).getTime();
          return Math.abs(t - logTime) <= WINDOW_MS;
        });

        filtered.sort((a, b) => {
          const ta = Math.abs(new Date(a.timestamp ?? a.createdAt ?? 0).getTime() - logTime);
          const tb = Math.abs(new Date(b.timestamp ?? b.createdAt ?? 0).getTime() - logTime);
          return ta - tb;
        });

        if (!cancelled) setResults(filtered);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    search();
    return () => { cancelled = true; };
  }, [executorName, logTime]);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10,
        width: '100%', maxWidth: 740, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>
              🔍 Items cacheados
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
              {executorName
                ? <>Canal <strong style={{ color: 'var(--text2)' }}>#{channelFound ?? 'dar-logs'}</strong> · búsqueda por <strong style={{ color: 'var(--blue)' }}>{executorName}</strong> · ±15 min del cacheo</>
                : 'No se pudo determinar el nombre del jugador que ejecutó la acción'
              }
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontSize: 18, padding: '2px 6px',
              borderRadius: 4, lineHeight: 1, flexShrink: 0, marginLeft: 12,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)', fontSize: 13, padding: '24px 0' }}>
              <span className="spinner" style={{ width: 15, height: 15 }} />
              Buscando en dar-logs…
            </div>
          )}

          {error && !loading && (
            <div style={{ color: 'var(--red)', fontSize: 13, padding: '8px 0' }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && !executorName && (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
              No se pudo extraer el nombre del ejecutor para buscar en dar-logs.
            </div>
          )}

          {!loading && !error && executorName && results.length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
              Sin resultados en dar-logs para <strong style={{ color: 'var(--text2)' }}>{executorName}</strong> en ±15 min del cacheo.
            </div>
          )}

          {results.map(l => <DarLogRow key={l._id} log={l} />)}
        </div>

        {/* Footer */}
        {!loading && results.length > 0 && (
          <div style={{
            padding: '10px 18px', borderTop: '1px solid var(--border)',
            flexShrink: 0, fontSize: 11, color: 'var(--text3)',
          }}>
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}


export default function LogEntry({ log, showChannel = false, defaultExpanded = false, isNew = false }) {
  const embed       = log.metadata?.embeds?.[0];
  const level       = log.level ?? 'info';
  const pillCls     = levelPillClass(level);
  const lvlBdr      = embedColorToCss(embed?.color) ?? levelBorderVar(level);
  const popChannel  = getPopulatedChannel(log);
  const popCategory = getCategory(log);

  const hasFields   = (embed?.fields?.length ?? 0) > 0;
  const title       = embed?.title || log.message;
  const description = embed?.description;

  const ts          = log.timestamp ?? log.createdAt ?? '';
  const isCacheo    = title?.toLowerCase().includes('cachear');

  const [showCacheoModal, setShowCacheoModal] = useState(false);

  return (
    <>
      <div className={`fm-card${isNew ? ' fm-card-new' : ''}`} style={{ borderLeft: `3px solid ${lvlBdr}` }}>

        {/* ── Header ── */}
        <div className="fm-card-head">
          <span className={`pill ${pillCls} fm-card-pill`}>{levelLabel(level)}</span>

          <div className="fm-card-path">
            <span className="fm-card-src">{log.source || 'OrigenRP'}</span>
            <span className="fm-card-sep">/</span>
            <span className="fm-card-src">Logs</span>
            {popCategory && (
              <>
                <span className="fm-card-sep">/</span>
                <span className="fm-card-src">{popCategory.name}</span>
              </>
            )}
            {popChannel && (
              <span className="fm-card-ch-chip">
                <span className="fm-ch-hash" style={{ fontSize: 12 }}>#</span>
                {popChannel.name}
              </span>
            )}
          </div>

          {/* Relative time + full date */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="fm-card-time">{fmtTimeRelative(ts)}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, whiteSpace: 'nowrap' }}>
              {fmtTime(ts)}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="fm-card-body">
          {title && (
            <div className="fm-card-title"><Md text={title} /></div>
          )}
          {description && (
            <div className="fm-card-desc"><Md text={description} /></div>
          )}
          {hasFields && <FieldsGrid fields={embed.fields} />}
          {embed?.footer?.text && (
            <div className="fm-card-footer">{embed.footer.text}</div>
          )}

          {/* Cacheo button */}
          {isCacheo && (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setShowCacheoModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  borderRadius: 5, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 11, color: 'var(--text2)', fontWeight: 500,
                  transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Ver items cacheados
              </button>
            </div>
          )}
        </div>
      </div>

      {showCacheoModal && (
        <CacheoModal log={log} onClose={() => setShowCacheoModal(false)} />
      )}
    </>
  );
}
