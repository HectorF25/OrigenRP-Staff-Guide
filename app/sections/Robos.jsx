// Robos & Secuestros — requisitos por establecimiento y robos a personas.
import { MapPin } from 'lucide-react';
import { ROBOS_ESTABLECIMIENTOS, ROBOS_PERSONAS } from '@/lib/sections-data';
import Lucide from '@/app/components/Lucide';

export default function Robos() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Robos & Secuestros</div>
        <div className="pg-sub">Requisitos mínimos por establecimiento</div>
      </div>
      <div className="alert al-y">
        <span className="al-icon"><MapPin size={14} /></span>
        <span>Coches y motos de sangre están <strong>prohibidos</strong> para robos a establecimientos.</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {ROBOS_ESTABLECIMIENTOS.map((est, i) => (
          <div key={i} className={`card cl-${est.color}`}>
            <div className="card-header">
              <div className={`card-icon ci-${est.color}`}><Lucide name={est.icon} size={15} /></div>
              <div className={`card-title ct-${est.color}`}>{est.title}</div>
            </div>
            <div className="rob-grid">
              {est.stats.map((s, si) => (
                <div key={si} className="rob-stat">
                  <div className="rob-stat-label">{s[0]}</div>
                  <div className="rob-stat-val">{s[1]}</div>
                </div>
              ))}
            </div>
            {est.note && (
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
                {est.note}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="sec-divider"><span>Robos a personas</span></div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Tipo</th><th>Policías mínimo</th><th>Armas</th></tr></thead>
          <tbody>
            {ROBOS_PERSONAS.map((r, i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                <td><span className={`pill ${r[3]}`}>{r[1]}</span></td>
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
