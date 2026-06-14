import {
  Gavel, AlertTriangle, MapPin, Check, X, Shield, Info
} from 'lucide-react';
import { OC_SANCIONES_TABLE, ZONA_DOMINACION } from '@/lib/sections-data';

function ZonaRow({ type, text }) {
  const cls = type === 'ok' ? 'nrow-ok' : type === 'x' ? 'nrow-x' : type === 'warn' ? 'nrow-warn' : 'nrow-info';
  const icon = type === 'ok' ? <Check size={13} /> : type === 'x' ? <X size={13} /> : type === 'warn' ? <AlertTriangle size={13} /> : <Info size={13} />;
  return (
    <div className={`nrow ${cls}`}>
      <span className="ni">{icon}</span><span>{text}</span>
    </div>
  );
}

export default function SancionesIlegales() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Sanciones Ilegales OC</div>
        <div className="pg-sub">Tabla oficial de sanciones para organizaciones criminales</div>
      </div>

      <div className="alert al-y" style={{ marginBottom: 12 }}>
        <span className="al-icon"><AlertTriangle size={14} /></span>
        <span>
          3 strikes sin rectificar = <strong>warn a la organización</strong>. A los 3 warns, la organización es desmantelada.
          Los strikes expiran cada <strong>2 semanas</strong> y los warns cada <strong>mes</strong>.
        </span>
      </div>

      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><Gavel size={15} /></div>
          <div className="card-title ct-red">Tabla de sanciones OC</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Infracción</th>
              <th style={{ whiteSpace: 'nowrap' }}>Sanción</th>
            </tr>
          </thead>
          <tbody>
            {OC_SANCIONES_TABLE.map(([desc, sancion], i) => (
              <tr key={i}>
                <td>{desc}</td>
                <td>
                  <span className={`pill ${
                    sancion.startsWith('Ban') ? 'pr' :
                    sancion === 'Lo valorará el staff' ? 'py' :
                    parseInt(sancion) >= 90 ? 'py' : 'pg'
                  }`}>
                    {sancion}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card cl-purple">
        <div className="card-header">
          <div className="card-icon ci-purple"><MapPin size={15} /></div>
          <div className="card-title ct-purple">Zona de Dominación</div>
        </div>
        {ZONA_DOMINACION.map((row, i) => (
          <ZonaRow key={i} type={row.type} text={row.text} />
        ))}
      </div>
    </div>
  );
}
