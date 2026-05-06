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

  return (
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

        <span className="fm-card-time" title={fmtTime(log.timestamp ?? log.createdAt ?? '')}>
          {fmtTimeRelative(log.timestamp ?? log.createdAt ?? '')}
        </span>
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
      </div>
    </div>
  );
}
