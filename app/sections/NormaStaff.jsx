// Normativa de Staff — principios, obligaciones y faltas graves.
import {
  Shield, Scale, Settings, Calendar, ShieldOff, Target, Mail,
  ShieldCheck, Ban, Clipboard, Clock, AlertTriangle, FileText, Lock, X
} from 'lucide-react';

const FALTAS_GRAVES = [
  'Participar en facciones ilegales siendo staff.',
  'Ausencias repetidas sin aviso previo.',
  'Uso indebido de comandos de staff.',
  'Falta de respeto hacia usuarios o compañeros.',
  'Actuar como staff sin estar en servicio.',
  'No priorizar tareas administrativas sobre el rol personal.'
];

export default function NormaStaff() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Normativa de Staff</div>
        <div className="pg-sub">Principios, obligaciones y faltas graves</div>
      </div>

      <div className="alert al-r">
        <span className="al-icon"><Shield size={14} /></span>
        <span>
          Representas al servidor en todo momento. El <strong>abuso de poder</strong> lleva a expulsión inmediata.
        </span>
      </div>

      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Scale size={15} /></div>
          <div className="card-title ct-blue">Principios</div>
        </div>
        <div className="nrow nrow-info"><span className="ni"><Target size={13} /></span><span>Actuar con <strong>respeto, profesionalismo e imparcialidad</strong> en todo momento.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Scale size={13} /></span><span>Sanciones solo con <strong>pruebas y de forma objetiva</strong>.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Mail size={13} /></span><span>Sanciones graves — reportar al <strong>staff superior con evidencia</strong>.</span></div>
      </div>

      <div className="card cl-yellow" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-yellow"><Settings size={15} /></div>
          <div className="card-title ct-yellow">Normas generales</div>
        </div>
        <div className="nrow nrow-info"><span className="ni"><ShieldCheck size={13} /></span><span>Participar en facciones legales requiere <strong>aprobación del staff superior</strong>.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Target size={13} /></span><span>Prioridad siempre: <strong>trabajo administrativo</strong> sobre el rol personal.</span></div>
        <div className="nrow nrow-x"><span className="ni"><Ban size={13} /></span><span>Prohibido usar el rango para <strong>beneficiarse en rol</strong>.</span></div>
        <div className="nrow nrow-x"><span className="ni"><Ban size={13} /></span><span>Prohibido usar comandos (noclip, etc.) para <strong>ventajas personales</strong>.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Clipboard size={13} /></span><span>TX jail: <strong>Motivo · Tiempo · Nombre Staff · Fecha</strong>.</span></div>
      </div>

      <div className="card cl-green" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-green"><Calendar size={15} /></div>
          <div className="card-title ct-green">Actividad y compromiso</div>
        </div>
        <div className="nrow nrow-info"><span className="ni"><Clock size={13} /></span><span>Cumplir con el <strong>mínimo de actividad semanal</strong>.</span></div>
        <div className="nrow nrow-warn"><span className="ni"><AlertTriangle size={13} /></span><span>Más de <strong>5 días inactivo sin aviso</strong> puede implicar expulsión del staff.</span></div>
        <div className="nrow nrow-info"><span className="ni"><FileText size={13} /></span><span>Obligatorio <strong>llevar registro</strong> de reportes y acciones.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Lock size={13} /></span><span>Nunca <strong>contradecir a un superior</strong> frente a usuarios.</span></div>
      </div>

      <div className="card cl-red">
        <div className="card-header">
          <div className="card-icon ci-red"><ShieldOff size={15} /></div>
          <div className="card-title ct-red">Faltas graves — expulsión</div>
        </div>
        {FALTAS_GRAVES.map((t, i) => (
          <div key={i} className="nrow nrow-x">
            <span className="ni"><X size={13} /></span><span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
