'use client';

import { useState } from 'react';
import {
  fmtTime, fmtTimeRelative, levelPillClass, levelLabel,
  levelBorderVar, embedColorToCss, getPopulatedChannel, getCategory,
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
    if (token.startsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={match.index} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9em', background: 'var(--code-bg)', color: 'var(--mono)', padding: '0 4px' }}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('<@')) {
      const id = token.replace(/^<@!?/, '').replace(/>$/, '');
      parts.push(<span key={match.index} style={{ color: 'var(--blue)' }}>@{id}</span>);
    } else if (token.startsWith('||')) {
      parts.push(<span key={match.index} style={{ background: 'var(--border2)', color: 'transparent', borderRadius: 2, padding: '0 4px', cursor: 'default' }} title={token.slice(2, -2)}>[oculto]</span>);
    } else if (token.startsWith('[')) {
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

function FieldsGrid({ fields }) {
  if (!fields?.length) return null;
  const rows = [];
  let current = [];
  for (const f of fields) {
    if (f.inline) {
      current.push(f);
      if (current.length === 3) { rows.push(current); current = []; }
    } else {
      if (current.length) { rows.push(current); current = []; }
      rows.push([f]);
    }
  }
  if (current.length) rows.push(current);

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.length === 1 ? '1fr' : `repeat(${row.length}, 1fr)`, gap: 8 }}>
          {row.map((f, fi) => (
            <div key={fi} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55, wordBreak: 'break-word' }}><Md text={f.value} /></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}


export function StatCard({ label, value, color }) {
  return (
    <div className="rob-card">
      <div className="rob-val" style={{ color }}>{typeof value === 'number' ? value.toLocaleString('es') : value}</div>
      <div className="rob-lbl">{label}</div>
    </div>
  );
}


export default function LogEntry({ log, showChannel = false }) {
  const [expanded, setExpanded] = useState(false);

  const embed      = log.metadata?.embeds?.[0];
  const level      = log.level ?? 'info';
  const pillCls    = levelPillClass(level);
  const lvlBdr     = embedColorToCss(embed?.color) ?? levelBorderVar(level);
  const popChannel = getPopulatedChannel(log);
  const popCategory = getCategory(log);
  const hasExpandable = embed && (embed.fields?.length ?? 0) > 0;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${lvlBdr}`, marginBottom: 6, transition: 'border-color .14s' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: expanded || hasExpandable ? '1px solid var(--border)' : 'none', cursor: hasExpandable ? 'pointer' : 'default', flexWrap: 'wrap' }}
        onClick={() => hasExpandable && setExpanded(v => !v)}
      >
        <span className={`pill ${pillCls}`} style={{ fontSize: 9, letterSpacing: 1.5, flexShrink: 0 }}>{levelLabel(level)}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{log.source}</span>
        {showChannel && popChannel && (
          <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
            {popCategory && <><span style={{ color: 'var(--text3)' }}>{popCategory.name}</span><span style={{ margin: '0 4px' }}>/</span></>}
            <span style={{ color: 'var(--blue)' }}>#{popChannel.name}</span>
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {embed?.title || log.message}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginLeft: 'auto' }} title={fmtTime(log.timestamp ?? log.createdAt ?? '')}>
          {fmtTimeRelative(log.timestamp ?? log.createdAt ?? '')}
        </span>
        {hasExpandable && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform .18s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text3)', flexShrink: 0 }}>
            <polyline points="2,4 6,8 10,4" />
          </svg>
        )}
      </div>

      {(expanded || (!hasExpandable && (embed?.description || embed?.fields?.length))) && (
        <div style={{ padding: '10px 14px', borderLeft: `2px solid ${lvlBdr}22` }}>
          {embed?.description && (
            <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: hasExpandable ? 0 : 4 }}>
              <Md text={embed.description} />
            </div>
          )}
          {expanded && embed?.fields && <FieldsGrid fields={embed.fields} />}
          {expanded && embed?.footer?.text && (
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>{embed.footer.text}</div>
          )}
        </div>
      )}
    </div>
  );
}
