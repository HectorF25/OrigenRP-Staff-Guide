import { AlertTriangle } from 'lucide-react';
import { OC_DOUBLE_TABLE } from '@/lib/sections-data';

export default function OcMafias() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">OC / Mafias — Tiempo ×2</div>
        <div className="pg-sub">
          Miembros de organizaciones criminales reciben el doble de jail. El Ban no cambia.
        </div>
      </div>
      <div className="alert al-p">
        <span className="al-icon"><AlertTriangle size={14} /></span>
        <span>
          Esta regla aplica <strong>únicamente a sanciones de jail</strong>. Las sanciones de Ban
          permanecen iguales independientemente de si el jugador pertenece a una OC.
        </span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr className="oc-header-row">
              <th>Infracción</th>
              <th>Normal</th>
              <th style={{ color: 'var(--purple)' }}>OC / Mafia</th>
            </tr>
          </thead>
          <tbody>
            {OC_DOUBLE_TABLE.map((r, i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                <td><span className={`pill ${r[3]}`}>{r[1]}</span></td>
                <td><span className="pill poc">{r[2]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
