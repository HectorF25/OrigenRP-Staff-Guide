import {
  Ban, Crosshair, Banknote, MapPin, Swords, Target,
  AlertTriangle, Zap, Shirt, Package, PhoneOff, X, Check, Clock
} from 'lucide-react';
import { NIVEL_ARMAS, PRECIOS_ARMAS } from '@/lib/sections-data';

const PROHIBICIONES = [
  'Abusar de bugs/mecánicas del servidor — disolución inmediata de la OC, inapelable.',
  'Vehículos de pago para actos delictivos. Solo los del apartado de organizaciones.',
  'Muros en sedes ni casas — housing se borra automáticamente.',
  'Robo a propia organización (rol de "desertor") — CK admin + Ban 7 días.',
  'Máscaras en zonas seguras sin atraco activo — falta IDP sancionable.',
  'Vender información de la OC a la policía — mal IDP + sanción administrativa.',
  'Alianzas entre OC. Solo tratados de paz. Prohibido juntarse para tiroteos.',
  'HQ: entrar al barrio/sede enemiga para hacer tiroteo.',
  'Buscar enfrentamientos directos con la policía — función OC es huir y ocultarse.',
  'Conductor disparando desde coche. Solo pasajeros pueden, y solo a ruedas.',
  'Disparar desde moto en movimiento. Solo ruedas y con moto completamente parada.',
  'No water / no bush / no window / tracer disparos / láser armas / miras externas / kill effect que revele posición.'
];

export default function Ilegales() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Normativa Ilegales</div>
        <div className="pg-sub">Mafias, Bandas y Organizaciones Criminales</div>
      </div>

      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><Ban size={15} /></div>
          <div className="card-title ct-red">Prohibiciones generales OC</div>
        </div>
        {PROHIBICIONES.map((t, i) => (
          <div key={i} className="nrow nrow-x">
            <span className="ni"><X size={13} /></span><span>{t}</span>
          </div>
        ))}
      </div>

      <div className="card cl-purple" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-purple"><Crosshair size={15} /></div>
          <div className="card-title ct-purple">Niveles de armamento</div>
        </div>
        <table className="tbl">
          <thead><tr><th>Nivel</th><th>Bandas</th><th>Mafias</th></tr></thead>
          <tbody>
            {NIVEL_ARMAS.map((r, i) => (
              <tr key={i}>
                <td><span className={`pill ${r[3]}`}>{r[0]}</span></td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="alert al-y" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="al-icon"><AlertTriangle size={14} /></span>
          <span>
            <strong>Dentro de ciudad:</strong> Bandas solo cuchillos y pistolas no automáticas ·
            Mafias solo pistolas. Armas grandes solo fuera de ciudad.
          </span>
        </div>
      </div>

      <div className="card cl-orange" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-orange"><Banknote size={15} /></div>
          <div className="card-title ct-orange">Precios de armas — mínimos y máximos</div>
        </div>
        <table className="tbl">
          <thead><tr><th>Arma</th><th>Mínimo</th><th>Máximo</th></tr></thead>
          <tbody>
            {PRECIOS_ARMAS.map((r, i) => (
              <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><MapPin size={15} /></div>
          <div className="card-title ct-red">Zona Roja</div>
        </div>
        <div className="nrow nrow-warn"><span className="ni"><Zap size={13} /></span><span>Sin fair-play normal. Solo dar chance de bajarse del vehículo. Sin valoración de vida. Solo aplican normas básicas (VDM, PG, RK).</span></div>
        <div className="nrow nrow-info"><span className="ni"><Shirt size={13} /></span><span>Toda OC debe acudir con su vestimenta de OC. Ir de paisano implica sanción directa.</span></div>
        <div className="nrow nrow-info"><span className="ni"><Package size={13} /></span><span>Dentro del punto caliente se puede cachear y robar todo, incluso a abatidos.</span></div>
        <div className="nrow nrow-x"><span className="ni"><PhoneOff size={13} /></span><span>No se puede tirar reportes dentro del punto caliente.</span></div>
        <div className="nrow nrow-warn"><span className="ni"><Clock size={13} /></span><span>Prohibido volver a zona roja ~1h tras ser abatido. Con pruebas = sanción administrativa.</span></div>
        <div className="nrow nrow-x"><span className="ni"><X size={13} /></span><span>Prohibido disparar desde dentro hacia fuera y viceversa del área de zona roja.</span></div>
      </div>

      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Swords size={15} /></div>
          <div className="card-title ct-blue">Tiroteos y conflictos entre OC</div>
        </div>
        <div className="nrow nrow-ok"><span className="ni"><Check size={13} /></span><span>Tiroteos inician tras rol previo (rol agresivo o pare tras atraco).</span></div>
        <div className="nrow nrow-x"><span className="ni"><X size={13} /></span><span>Prohibida implicación de terceras OC en tiroteos activos.</span></div>
        <div className="nrow nrow-ok"><span className="ni"><Check size={13} /></span><span>Solo se puede cachear al finalizar el conflicto.</span></div>
        <div className="nrow nrow-ok"><span className="ni"><Check size={13} /></span><span>Tras tiroteo: permitido secuestrar a un implicado <strong>solo para sacar información</strong>, no pedir rescate.</span></div>
        <div className="nrow nrow-x"><span className="ni"><X size={13} /></span><span>Prohibido disparar por debajo de los coches (a los pies).</span></div>
        <div className="nrow nrow-warn"><span className="ni"><AlertTriangle size={13} /></span><span>En conflicto activo: ambos bandos pueden disparar sin pares ni avisos previos.</span></div>
        <div className="nrow nrow-x"><span className="ni"><X size={13} /></span><span>Prohibido secuestrar a usuarios del bando contrario durante el conflicto.</span></div>
      </div>

      <div className="card cl-green">
        <div className="card-header">
          <div className="card-icon ci-green"><Target size={15} /></div>
          <div className="card-title ct-green">Niveles — requisitos para subir</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong>MAFIA Lvl1→Lvl2:</strong> $5M Mafia Madre, cupos llenos, 4k cocaína/heroína/maría, Misión 1, búnker 600 armas, 3 yates · 6 joyerías · 150 SNS · 120 Vintage · 100 9mm.<br />
          <strong>MAFIA Lvl2→Lvl3:</strong> $10M, cupos llenos, 8k cocaína/heroína/maría, búnker 1500 armas, 6 yates · 12 joyerías · 2 bancos centrales · 250 SNS · 230 Vintage · 200 9mm · 80 Mini-SMG.<br />
          <strong>BANDA Lvl1→Lvl2:</strong> $5M, cupos llenos, 4k cocaína/maría, lab maxeado, 20 badulaques · 8 fleekas · 4 joyerías · 70 SNS · 60 Vintage · 50 9mm · 30 chalecos.<br />
          <strong>BANDA Lvl2→Lvl3:</strong> $10M, cupos llenos, 8k cocaína/maría, lab maxeado, 40 badulaques · 16 fleekas · 10 joyerías · 180 SNS · 150 Vintage · 120 9mm · 40 chalecos.
        </p>
      </div>
    </div>
  );
}
