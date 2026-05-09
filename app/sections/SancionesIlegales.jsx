import {
  Gavel, AlertTriangle, Clock, MapPin, Zap, PhoneOff,
  Shirt, Package, Check, X, Shield
} from 'lucide-react';
import { OC_SANCIONES_TABLE, ZONA_DOMINACION } from '@/lib/sections-data';

export default function SancionesIlegales() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Sanciones Ilegales OC</div>
        <div className="pg-sub">Tiempos fijos — no aplica multiplicador ×2</div>
      </div>

      <div className="alert al-y" style={{ marginBottom: 12 }}>
        <span className="al-icon"><AlertTriangle size={14} /></span>
        <span>
          Las sanciones de esta tabla tienen tiempos <strong>fijos</strong> establecidos para organizaciones criminales.
          Cualquier sanción general <strong>fuera de esta tabla</strong> sigue aplicando el
          multiplicador <strong>×2</strong> habitual de OC.
        </span>
      </div>

      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><Gavel size={15} /></div>
          <div className="card-title ct-red">Tabla de sanciones OC — tiempos fijos</div>
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
                    parseInt(sancion) >= 300 ? 'pr' :
                    parseInt(sancion) >= 180 ? 'py' : 'pg'
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
        <div className="nrow nrow-warn">
          <span className="ni"><Zap size={13} /></span>
          <span>{ZONA_DOMINACION[0]}</span>
        </div>
        <div className="nrow nrow-info">
          <span className="ni"><Shield size={13} /></span>
          <span>{ZONA_DOMINACION[1]}</span>
        </div>
        <div className="nrow nrow-info">
          <span className="ni"><Clock size={13} /></span>
          <span>{ZONA_DOMINACION[2]}</span>
        </div>
        <div className="nrow nrow-ok">
          <span className="ni"><Check size={13} /></span>
          <span>{ZONA_DOMINACION[3]}</span>
        </div>
        <div className="nrow nrow-ok">
          <span className="ni"><Check size={13} /></span>
          <span>{ZONA_DOMINACION[4]}</span>
        </div>
        <div className="nrow nrow-ok">
          <span className="ni"><Check size={13} /></span>
          <span>{ZONA_DOMINACION[5]}</span>
        </div>
        <div className="nrow nrow-x">
          <span className="ni"><X size={13} /></span>
          <span>{ZONA_DOMINACION[6]}</span>
        </div>
        <div className="nrow nrow-x">
          <span className="ni"><X size={13} /></span>
          <span>{ZONA_DOMINACION[7]}</span>
        </div>
        <div className="nrow nrow-x">
          <span className="ni"><PhoneOff size={13} /></span>
          <span>{ZONA_DOMINACION[8]}</span>
        </div>
        <div className="nrow nrow-warn">
          <span className="ni"><Clock size={13} /></span>
          <span>{ZONA_DOMINACION[9]}</span>
        </div>
      </div>
    </div>
  );
}
