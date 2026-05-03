'use client';

// Consultor IA — analiza una situación contra la normativa completa de OrigenRP.
import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { QUICK_CHIPS } from '@/lib/sections-data';

export default function ConsultorIA({ onSessionExpired }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { vClass, verdict, text }
  const [history, setHistory] = useState([]);

  async function consultar() {
    const txt = input.trim();
    if (!txt) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ situacion: txt })
      });
      if (res.status === 401) { onSessionExpired(); throw new Error('Tu sesión ha caducado.'); }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }
      const data = await res.json();
      const text = data.text || 'Sin respuesta.';
      let vClass = 'inconc', verdict = 'Depende del contexto';
      if (text.includes('VEREDICTO: SANCIONABLE') && !text.includes('NO SANCIONABLE')) {
        vClass = 'sanc'; verdict = 'Sancionable';
      } else if (text.includes('VEREDICTO: NO SANCIONABLE')) {
        vClass = 'no-sanc'; verdict = 'No sancionable';
      }
      const clean = text.replace(/VEREDICTO:\s*(SANCIONABLE|NO SANCIONABLE|DEPENDE DEL CONTEXTO)/g, '').trim();
      setResult({ vClass, verdict, text: clean });
      setHistory(h => [{ q: txt, vClass, verdict, text: clean }, ...h].slice(0, 10));
    } catch (e) {
      setResult({ vClass: 'inconc', verdict: 'Error de conexión', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.ctrlKey && e.key === 'Enter') consultar();
  }

  function loadHist(h) {
    setInput(h.q);
    setResult({ vClass: h.vClass, verdict: h.verdict, text: h.text });
  }

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Consultor de Sanciones</div>
        <div className="pg-sub">Powered by Gemini · Normativa OrigenRP integrada</div>
      </div>
      <div className="ai-panel">
        <div className="ai-panel-title"><Sparkles size={16} />Consulta inteligente</div>
        <div className="ai-panel-sub">
          Describe la situación con detalle. La IA analizará la normativa completa — general, ilegales, OC, robos —
          y te dirá si sancionar, qué infracción es y el tiempo exacto.
        </div>
        <div className="sec-lbl" style={{ color: 'var(--text3)', marginBottom: 8, letterSpacing: 1.5 }}>
          Consultas rápidas
        </div>
        <div className="ai-chips">
          {QUICK_CHIPS.map((c, i) => (
            <div key={i} className="ai-chip" onClick={() => setInput(c.q)}>{c.label}</div>
          ))}
        </div>
        <textarea
          className="ai-textarea"
          placeholder="Ej: Un miembro de mafia dispara desde dentro del coche a abatir, sin que la víctima intentara huir..."
          rows={4}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="ai-btn-submit" disabled={loading} onClick={consultar}>
            <Send size={14} /> Consultar normativa
          </button>
          <div className="ai-hint">Ctrl + Enter para enviar</div>
        </div>
        {loading && (
          <div className="ai-loading show">
            <div className="spinner" />
            <span>Analizando normativa OrigenRP...</span>
          </div>
        )}
        {result && (
          <div className="ai-response show">
            <div className="ai-response-header">
              <div className={`ai-verdict ${result.vClass}`}>{result.verdict}</div>
            </div>
            <div className="ai-text">{result.text}</div>
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="ai-history">
          <div className="ai-hist-title">Consultas recientes</div>
          {history.map((h, i) => {
            const color = h.vClass === 'sanc' ? 'var(--ni-x)'
                        : h.vClass === 'no-sanc' ? 'var(--ni-ok)'
                        : 'var(--ni-warn)';
            return (
              <div key={i} className="ai-hist-item" onClick={() => loadHist(h)}>
                <div className="ai-hist-q">{h.q}</div>
                <div className="ai-hist-v" style={{ color }}>{h.verdict}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
