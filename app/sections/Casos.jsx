'use client';

// Casos Prácticos — situaciones de rol con respuesta interactiva.
import { useState } from 'react';
import { CASOS } from '@/lib/data';

export default function Casos() {
  const [open, setOpen] = useState({});

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Casos Prácticos</div>
        <div className="pg-sub">Selecciona cada caso para ver si es sancionable y la sanción exacta</div>
      </div>
      <div>
        {CASOS.map(x => {
          const isOpen = !!open[x.id];
          const cls = isOpen ? (x.sancionable ? 'caso ry' : 'caso rn') : 'caso';
          return (
            <div key={x.id} className={cls} onClick={() => setOpen(o => ({ ...o, [x.id]: !o[x.id] }))}>
              <div className="caso-h">
                <span className="caso-n">#{String(x.id).padStart(2, '0')}</span>
                <span className="caso-t">{x.caso}</span>
              </div>
              {isOpen ? (
                <div className="caso-ans show">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className={`pill ${x.sancionable ? 'pr' : 'pg'}`}>
                      {x.sancionable ? 'Sancionable' : 'No sancionable'}
                    </span>
                    <span className="pill pb">{x.tipo}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                    {x.resp}
                  </p>
                </div>
              ) : (
                <p className="caso-tap">Seleccionar para ver la respuesta</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
