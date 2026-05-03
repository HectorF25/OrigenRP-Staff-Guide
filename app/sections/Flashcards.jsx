'use client';

// Flashcards — repaso rápido de conceptos con volteo.
import { useState } from 'react';
import { CONCEPTOS } from '@/lib/data';

export default function Flashcards() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const c = CONCEPTOS[i];

  function next() { setI((i + 1) % CONCEPTOS.length); setFlipped(false); }
  function prev() { setI((i - 1 + CONCEPTOS.length) % CONCEPTOS.length); setFlipped(false); }

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Flashcards</div>
        <div className="pg-sub">Repaso rápido de conceptos — selecciona para voltear</div>
      </div>
      <div className="fc-wrap">
        <p style={{
          color: 'var(--text3)', fontSize: 12, fontWeight: 600,
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: 1, textTransform: 'uppercase'
        }}>
          {i + 1} / {CONCEPTOS.length}
        </p>
        <div className={`fc${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
          <div className="fc-lbl">{flipped ? 'Definición' : 'Término'}</div>
          <div className={flipped ? 'fc-def' : 'fc-term'}>
            {flipped ? c.def : c.term}
          </div>
          {!flipped && <div className="fc-hint">Seleccionar para ver la definición</div>}
          {flipped && c.sancion !== 'N/A' && (
            <div className="pill pr" style={{ marginTop: 12 }}>{c.sancion}</div>
          )}
        </div>
        <div className="fc-ctrls">
          <button className="btns" onClick={prev}>Anterior</button>
          <button className="btnp" onClick={next}>Siguiente</button>
        </div>
        <div className="fc-dots">
          {CONCEPTOS.map((_, idx) => (
            <div
              key={idx}
              className={`dot${idx === i ? ' active' : ''}`}
              onClick={() => { setI(idx); setFlipped(false); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
