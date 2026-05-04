'use client';

import { useState, useRef } from 'react';
import { Sparkles, Send, Download, Cpu, AlertTriangle } from 'lucide-react';
import { QUICK_CHIPS } from '@/lib/sections-data';
import { NORMATIVA_FULL } from '@/lib/normativa';

const WEB_MODEL      = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const WEB_MODEL_SIZE = '670 MB';

const LOCAL_SYSTEM = `Eres un asistente experto en la normativa del servidor de roleplay FiveM "OrigenRP". Ayudas al STAFF a determinar si una situación es sancionable, qué infracción es y la sanción exacta.

NORMATIVA OFICIAL (incluye normas generales, organizaciones criminales, robos y sanciones administrativas):
${NORMATIVA_FULL}

INSTRUCCIONES:
1. Analiza la situación.
2. Primera línea SIEMPRE: "VEREDICTO: SANCIONABLE", "VEREDICTO: NO SANCIONABLE" o "VEREDICTO: DEPENDE DEL CONTEXTO"
3. Indica la infracción exacta.
4. Indica la sanción exacta (minutos jail, BAN, etc).
5. Si pertenece a OC/Mafia, el jail se DUPLICA.
6. Explica el razonamiento basándote en la normativa.
7. Sé conciso y claro. Responde en español.`;

function parseResponse(raw) {
  const text = raw || 'Sin respuesta.';
  let vClass = 'inconc', verdict = 'Depende del contexto';
  if (text.includes('VEREDICTO: SANCIONABLE') && !text.includes('NO SANCIONABLE')) {
    vClass = 'sanc'; verdict = 'Sancionable';
  } else if (text.includes('VEREDICTO: NO SANCIONABLE')) {
    vClass = 'no-sanc'; verdict = 'No sancionable';
  }
  const clean = text
    .replace(/VEREDICTO:\s*(SANCIONABLE|NO SANCIONABLE|DEPENDE DEL CONTEXTO)/g, '')
    .trim();
  return { vClass, verdict, text: clean };
}

export default function ConsultorIA({ onSessionExpired }) {
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [history, setHistory] = useState([]);

  const [webllm,        setWebllm]        = useState('off');
  const [wllmProgress,  setWllmProgress]  = useState({ text: '', percent: 0 });
  const engineRef = useRef(null);

  const isLocal = webllm === 'ready';

  async function consultar() {
    const txt = input.trim();
    if (!txt || loading) return;

    if (isLocal) { await consultarLocal(txt); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ situacion: txt }),
      });

      if (res.status === 401) { onSessionExpired(); return; }

      if (res.status === 429) {
        setWebllm('offered');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }

      const data   = await res.json();
      const parsed = parseResponse(data.text);
      setResult(parsed);
      setHistory(h => [{ q: txt, ...parsed }, ...h].slice(0, 10));
    } catch (e) {
      setResult({ vClass: 'inconc', verdict: 'Error de conexión', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function initWebLLM() {
    if (!navigator.gpu) {
      setResult({
        vClass: 'inconc',
        verdict: 'WebGPU no disponible',
        text: 'Tu navegador no soporta WebGPU.\nUsa Chrome 113+ o Edge 113+ para usar el modelo local.',
      });
      setWebllm('off');
      return;
    }
    setWebllm('loading');
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const engine = await CreateMLCEngine(WEB_MODEL, {
        initProgressCallback: (p) =>
          setWllmProgress({
            text:    p.text    || '',
            percent: Math.round((p.progress || 0) * 100),
          }),
      });
      engineRef.current = engine;
      setWebllm('ready');
      setWllmProgress({ text: 'Modelo listo ✓', percent: 100 });
    } catch (e) {
      setResult({ vClass: 'inconc', verdict: 'Error cargando modelo', text: e.message });
      setWebllm('offered');
    }
  }

  async function consultarLocal(txt) {
    if (!engineRef.current) return;
    setLoading(true);
    setResult(null);
    try {
      const reply = await engineRef.current.chat.completions.create({
        messages: [
          { role: 'system', content: LOCAL_SYSTEM },
          { role: 'user',   content: txt },
        ],
        temperature: 0.3,
        max_tokens:  900,
      });
      const raw    = reply.choices[0]?.message?.content || '';
      const parsed = parseResponse(raw);
      setResult(parsed);
      setHistory(h => [{ q: txt, ...parsed }, ...h].slice(0, 10));
    } catch (e) {
      setResult({ vClass: 'inconc', verdict: 'Error del modelo local', text: e.message });
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
        <div className="pg-sub">
          {isLocal
            ? 'Modelo local · Llama 3.2 1B · Sin límite de consultas'
            : 'Powered by Gemini · Normativa OrigenRP integrada'}
        </div>
      </div>

      <div className="ai-panel">
        <div className="ai-panel-title">
          {isLocal ? <Cpu size={16} /> : <Sparkles size={16} />}
          Consulta inteligente
          {isLocal && <span className="ai-local-badge">LOCAL</span>}
        </div>
        <div className="ai-panel-sub">
          Describe la situación con detalle. La IA analizará la normativa completa —
          general, ilegales, OC, robos — y te dirá si sancionar, qué infracción es y el
          tiempo exacto.
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
          <button
            className="ai-btn-submit"
            disabled={loading || webllm === 'loading'}
            onClick={consultar}
          >
            <Send size={14} />
            {isLocal ? 'Consultar (local)' : 'Consultar normativa'}
          </button>
          <div className="ai-hint">Ctrl + Enter para enviar</div>
        </div>

        {webllm === 'offered' && (
          <div className="ai-wllm-offer">
            <div className="ai-wllm-offer-title">
              <AlertTriangle size={14} />
              Límite diario de Gemini alcanzado
            </div>
            <div className="ai-wllm-offer-text">
              Puedes continuar con un <strong>modelo de IA que corre en tu navegador</strong>.
              Se descarga <strong>una sola vez (~{WEB_MODEL_SIZE})</strong> y queda en
              caché para sesiones futuras. No tiene límite de consultas.
              <br />
              Requiere <strong>Chrome 113+</strong> o Edge con WebGPU activado.
            </div>
            <div className="ai-wllm-offer-btns">
              <button className="ai-btn-submit" onClick={initWebLLM}>
                <Download size={14} /> Descargar modelo local
              </button>
              <button className="btns" onClick={() => setWebllm('off')}>Cancelar</button>
            </div>
          </div>
        )}

        {webllm === 'loading' && (
          <div className="ai-wllm-progress">
            <div className="ai-wllm-progress-header">
              <div className="spinner" />
              <span>Descargando Llama 3.2 1B…</span>
              <span className="ai-wllm-pct">{wllmProgress.percent}%</span>
            </div>
            <div className="ai-wllm-bar">
              <div className="ai-wllm-fill" style={{ width: `${wllmProgress.percent}%` }} />
            </div>
            <div className="ai-wllm-msg">{wllmProgress.text || 'Iniciando…'}</div>
            <div className="ai-hint">Solo ocurre una vez · queda en caché del navegador.</div>
          </div>
        )}

        {webllm === 'ready' && (
          <div className="ai-wllm-ready">
            <Cpu size={12} /> {WEB_MODEL} — listo
          </div>
        )}

        {loading && (
          <div className="ai-loading show">
            <div className="spinner" />
            <span>
              {isLocal ? 'Procesando con modelo local…' : 'Analizando normativa OrigenRP…'}
            </span>
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
            const color =
              h.vClass === 'sanc'    ? 'var(--ni-x)'  :
              h.vClass === 'no-sanc' ? 'var(--ni-ok)' : 'var(--ni-warn)';
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
