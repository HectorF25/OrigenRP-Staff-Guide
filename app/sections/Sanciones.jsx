'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SANCIONES_FILTERS, SANCIONES_GROUPS } from '@/lib/sections-data';
import Lucide from '@/app/components/Lucide';

export default function Sanciones() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Tabla de Sanciones</div>
        <div className="pg-sub">Actualizada 17/01/26 · Registrar jails en TX: Motivo · Tiempo · Staff · Fecha</div>
      </div>
      <div className="filters">
        {SANCIONES_FILTERS.map(f => (
          <button
            key={f.key}
            className={`fbtn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {SANCIONES_GROUPS.map((g, gi) => {
        if (filter !== 'all' && filter !== g.key) return null;
        return (
          <div key={gi} style={gi > 0 ? { marginTop: 12 } : {}}>
            <div className="sec-lbl" style={{ color: `var(--${g.color})` }}>
              <Lucide name={g.icon} />{g.title}
            </div>
            <div className="card">
              <table className="tbl"><tbody>
                {g.rows.map((r, ri) => (
                  <tr key={ri}>
                    <td>{r[0]}</td>
                    <td><span className={`pill ${g.pillClass}`}>{r[1]}</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            {g.key === 'lev' && (
              <div className="alert al-r" style={{ marginTop: 10 }}>
                <span className="al-icon"><AlertTriangle size={14} /></span>
                <span>
                  Desconexión antes del jail IC — Ban <strong>8h / 12h / hasta 1 día</strong> según criterio del staff.
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
