import {
  AlertTriangle, X, Check, Info, Plane, Fish, Home, Clock
} from 'lucide-react';

// ── Reglas comunes a todos los puntos calientes especiales ─────────────────

const REGLAS_COMUNES = [
  { type: 'x',    text: 'Zona restringida y peligrosa para civiles — únicamente tienen acceso las organizaciones criminales (Bandas y Mafias).' },
  { type: 'x',    text: 'Solo están permitidas las pistolas dentro de policía: SNS, 9MM, Vintage y MK2.' },
  { type: 'info', text: 'Las bandas y mafias deben entrar de manera totalmente organizada (entrar y salir todos juntos, no de forma dispersa) — así se evitan el RK y el MG.' },
  { type: 'x',    text: 'Cualquier detección de F8 quit será sancionada individualmente.' },
  { type: 'info', text: 'Este punto tiene la misma normativa que el resto de puntos calientes.' },
  { type: 'warn', text: 'Toda organización que acuda debe tener un clip para subir a reportar — sin ese soporte el reporte no tendrá lugar.' },
  { type: 'warn', text: 'Todas las personas reportadas deberán poseer obligatoriamente el clip del tiroteo, si no será sancionado individualmente.' },
  { type: 'x',    text: 'Si una organización campea el punto o está por los alrededores con intenciones de iniciar un rol agresivo para aprovecharse de alguna circunstancia o esperar a que dos organizaciones se tiroteen para estar en desventaja, será sancionada.' },
  { type: 'x',    text: 'Cuando una organización o usuario muera en este punto caliente, no puede volver a entrar en media hora. No cumplir con el tiempo supone una sanción individual.' },
];

function RuleList({ rules }) {
  return rules.map((r, i) => {
    const cls = r.type === 'ok' ? 'nrow-ok' : r.type === 'x' ? 'nrow-x' : r.type === 'warn' ? 'nrow-warn' : 'nrow-info';
    const icon = r.type === 'ok' ? <Check size={13} /> : r.type === 'x' ? <X size={13} /> : r.type === 'warn' ? <AlertTriangle size={13} /> : <Info size={13} />;
    return (
      <div key={i} className={`nrow ${cls}`}>
        <span className="ni">{icon}</span><span>{r.text}</span>
      </div>
    );
  });
}

export default function PuntosCalientes() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Puntos Calientes Especiales</div>
        <div className="pg-sub">Cementerio de Aviones · Pesca · Casa Abuela</div>
      </div>

      <div className="alert al-y" style={{ marginBottom: 12 }}>
        <span className="al-icon"><Clock size={14} /></span>
        <span>
          Tras ser abatido en cualquiera de estos puntos, <strong>no puedes volver durante 30 minutos</strong>.
          El incumplimiento conlleva sanción individual.
        </span>
      </div>

      {/* Cementerio de Aviones */}
      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><Plane size={15} /></div>
          <div className="card-title ct-red">Cementerio de Aviones</div>
        </div>
        <RuleList rules={REGLAS_COMUNES} />
        <div className="sec-divider" style={{ margin: '10px 0 6px' }}><span>Reglas específicas del interior</span></div>
        <div className="nrow nrow-x">
          <span className="ni"><X size={13} /></span>
          <span>Está totalmente prohibido disparar desde las zonas de diferente altura o tejados.</span>
        </div>
        <div className="nrow nrow-x">
          <span className="ni"><X size={13} /></span>
          <span>No se podrá disparar a los coches que pasen por las carreteras cercanas al punto caliente.</span>
        </div>
      </div>

      {/* Pesca */}
      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Fish size={15} /></div>
          <div className="card-title ct-blue">Pesca</div>
        </div>
        <div className="nrow nrow-x" style={{ marginBottom: 4 }}>
          <span className="ni"><X size={13} /></span>
          <span><strong>No se puede acceder a la zona con vehículos</strong> — deberán dejarse fuera del límite de la zona roja.</span>
        </div>
        <RuleList rules={REGLAS_COMUNES} />
      </div>

      {/* Casa Abuela */}
      <div className="card cl-green">
        <div className="card-header">
          <div className="card-icon ci-green"><Home size={15} /></div>
          <div className="card-title ct-green">Casa Abuela</div>
        </div>
        <RuleList rules={REGLAS_COMUNES} />
      </div>
    </div>
  );
}
