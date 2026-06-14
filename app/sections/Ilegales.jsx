import {
  Ban, Crosshair, Banknote, MapPin, Swords, Target,
  AlertTriangle, X, Check, ShieldAlert, Users,
  Car, Flame, Shield, Info
} from 'lucide-react';
import { NIVEL_ARMAS, PRECIOS_ARMAS, OC_FALTAS_GROUPS } from '@/lib/sections-data';

// ── Datos ──────────────────────────────────────────────────────────────────

const PROHIBICIONES = [
  'Abusar de bugs del servidor para beneficio de la organización — disolución inmediata, inapelable. No habrá advertencias ni segundas oportunidades. Si encuentras un bug, repórtalo.',
  'Las bandas/mafias deben ser activas y realizar actividades ilegales — la inactividad puede suponer su eliminación (con avisos previos).',
  'No existe PG liberal. Sin excepciones.',
  'Prohibido vehículos deportivos para ir por montaña. En norte solo por carretera asfaltada.',
  'Robos a establecimientos (con LSPD): prohibido vehículos de sangre que superen los 300 km/h.',
  'Vestimenta de orga y /entorno obligatorios antes o durante cualquier acto delictivo.',
  'MAFIAS: no llevar ropa de orga en ciudad (respetar el rol de entorno). BANDAS: sí pueden ir con ropa de orga siempre que vayan en grupo.',
  'Uso correcto de /me y /do sin abusar ni forzar roles. Mutilaciones y roles +18 no consentidos = sanción admin.',
  'Buen nivel de IDP exigido en todas las bandas/mafias. El jefe es el máximo responsable del grupo.',
  'Bindeos considerados PG tendrán consecuencias administrativas.',
  'Robo a propia organización ("Desertor") = CK ADMINISTRATIVO + 7 DÍAS DE BAN.',
  'Máscaras en zonas seguras sin atraco activo (comisarías, cárceles, bancos) = falta IDP, sancionado directamente.',
  'Vender información de tu OC a la policía = mal IDP, sancionado administrativamente.',
  'Prohibido entrar a sedes/barrios ajenos sin intención de negociar. Si uno de los bandos se niega a negociar, abandonar automáticamente.',
  'Prohibido usar el menú de organización para cachear si vas con vestimenta de paisano.',
  'Prohibido el uso de animaciones en roles agresivos.',
  'Prohibido esconderse en arbustos en roles agresivos.',
  'Prohibido vehículos deportivos en zona norte — solo vehículos 4x4 (incluidos los de sangre).',
  '/entorno obligatorio antes de cualquier acto ilícito, ya sea en ciudad o norte.',
  'No existen secuestros ni CK sin acuerdo previo entre ambas partes y el staff.',
  'Es obligatorio dar un margen de fairplay mínimo de 5 segundos al dar el pare.',
  'Respetar el rol de entorno en actos ilícitos (ej: no ir al garaje de cárcel a preparar el coche con las armas).',
  'No water · No bush · No window · Tracer de disparos · Láser en armas · Miras externas · Kill effect que revele posición.',
];

const ZONA_ROJA = [
  { type: 'x',    text: 'Sin fair play. Solo dar chance de bajarse del vehículo o subir escaleras. Sin valoración de vida.' },
  { type: 'x',    text: 'Zona sin ley — solo aplican normas básicas de rol (VDM, PG, RK…).' },
  { type: 'warn', text: 'Excepción fairplay: valorar vida si vas sin arma o con arma blanca frente a alguien con arma de fuego.' },
  { type: 'warn', text: 'Si entras estás expuesto y te pueden matar sin aviso previo.' },
  { type: 'x',    text: 'Zona roja = todo lo que abarca el cartel. Prohibido disparar desde dentro hacia fuera y viceversa.' },
  { type: 'info', text: 'Toda OC debe acudir con su vestimenta de orga (IDP). Ir de paisano siendo de orga = sanción.' },
  { type: 'x',    text: 'Prohibido campear la zona o dar vueltas por los alrededores cada pocos minutos para vigilar.' },
  { type: 'ok',   text: 'Está permitido abandonar un tiroteo en casos de desventaja numérica obvia (ej: 6 vs 2, 20 vs 5).' },
  { type: 'ok',   text: 'Dentro del punto caliente: cachear y robar todo excepto comida, bebida y herramientas de trabajo. Sin balas = solo quitar balas (excepto en Dominación).' },
  { type: 'x',    text: 'No se pueden tirar reportes dentro de un punto caliente.' },
  { type: 'x',    text: 'Tras ser abatido: prohibido volver al mismo punto caliente durante 30 minutos.' },
  { type: 'x',    text: 'Prohibido usar el menú de organización para cachear si vas de paisano por los puntos calientes.' },
];

const COCHES_MOTOS = [
  { cat: 'Coches', type: 'x',    text: 'Prohibido disparar a abatir desde dentro del coche en movimiento. Solo ruedas y solo acompañantes (no el conductor).' },
  { cat: 'Coches', type: 'x',    text: 'Para disparar a abatir los ocupantes deben bajarse del vehículo obligatoriamente.' },
  { cat: 'Coches', type: 'ok',   text: 'Te pueden disparar a abatir dentro del vehículo ÚNICAMENTE si ha habido reposicionamiento.' },
  { cat: 'Motos',  type: 'x',    text: 'Prohibido disparar a abatir desde moto.' },
  { cat: 'Motos',  type: 'info', text: 'El conductor solo puede disparar a las ruedas con la moto completamente parada. El acompañante solo a las ruedas.' },
  { cat: 'Motos',  type: 'warn', text: 'Si un jugador en moto se detiene, otros NO pueden disparar a matar — dar fairplay para que baje del vehículo.' },
];

const TIROTEOS = [
  { type: 'info', text: 'Los tiroteos se inician tras ocasionar un conflicto con rol previo (rol agresivo o pare tras intento de atraco).' },
  { type: 'x',    text: 'Prohibida la implicación de terceras organizaciones en todo momento, excepto en zonas rojas/dominación.' },
  { type: 'ok',   text: 'Si la situación es desfavorable (sin salida ni forma de sobrevivir), está permitida la huida — sin entrar a zonas seguras, sedes ni barrios.' },
  { type: 'x',    text: 'Al finalizar el conflicto hay margen para cachear y resguardar heridos. Prohibida la implicación de otra OC para iniciar otro tiroteo tras uno previo.' },
  { type: 'x',    text: 'Prohibido campear o esperar a que un conflicto entre orgas termine para después iniciar rol agresivo.' },
  { type: 'x',    text: 'Prohibido disparar a los pies por debajo de los coches.' },
];

const CONFLICTO = [
  { type: 'info', text: 'Inicio: ajuste de cuentas previo con motivo y rol previo. Ambas orgas deben tener contacto para iniciar el conflicto y marchar a la calle.' },
  { type: 'x',    text: 'Solo entre 2 organizaciones. Prohibidas terceras (solo mafia madre puede supervisar el rol).' },
  { type: 'x',    text: 'HQ PROHIBIDO: entrar a un barrio ajeno para hacer tiroteo.' },
  { type: 'warn', text: 'Una vez iniciado: ambos bandos pueden disparar sin pares ni avisos.' },
  { type: 'info', text: 'Puede iniciarse dentro o fuera de la ciudad. Si es entre mafias o mafia-banda, realizarlo a las afueras.' },
  { type: 'ok',   text: 'Termina cuando una parte se rinde o pide alto el fuego. Para escalar a guerra: avisar primero a administración.' },
  { type: 'x',    text: 'Prohibido secuestrar a usuarios del bando contrario durante el conflicto.' },
];

const POLICIA = [
  { type: 'info', text: 'Persecución: encender sirenas = pare oficial.' },
  { type: 'x',    text: 'Prohibido que mafias o bandas busquen enfrentamientos directos con la policía. La función OC es evitar, huir y ocultarse. Incumplimiento = falta IDP.' },
  { type: 'x',    text: 'Retenciones: prohibido retener a un policía para forzar rol o que la policía se retire. Toda retención requiere negociación previa obligatoria. No se puede secuestrar a ningún policía.' },
  { type: 'warn', text: 'En persecuciones con LSPD: rolear los choques, no hacer saltos imposibles ni seguir como si nada. Se dará el rol como perdido.' },
  { type: 'x',    text: 'No entrar a sede/barrio o zona segura en medio de un rol agresivo (con LSPD u otras orgas). Habrá sanciones.' },
  { type: 'ok',   text: 'En controles de tráfico: puedes intentar huir e iniciar persecución, pero no empezar un tiroteo en el control.' },
];

// ── Helper ─────────────────────────────────────────────────────────────────

function RuleList({ rules }) {
  return rules.map((r, i) => {
    const cls = r.type === 'ok' ? 'nrow-ok' : r.type === 'x' ? 'nrow-x' : r.type === 'warn' ? 'nrow-warn' : 'nrow-info';
    const icon = r.type === 'ok' ? <Check size={13} /> : r.type === 'x' ? <X size={13} /> : r.type === 'warn' ? <AlertTriangle size={13} /> : <Info size={13} />;
    return (
      <div key={i} className={`nrow ${cls}`}>
        <span className="ni">{icon}</span>
        <span>{r.cat ? <><strong>{r.cat}:</strong> {r.text}</> : r.text}</span>
      </div>
    );
  });
}

// ── Componente ─────────────────────────────────────────────────────────────

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
          <div className="card-title ct-red">Normativa general OC</div>
        </div>
        {PROHIBICIONES.map((t, i) => (
          <div key={i} className="nrow nrow-x">
            <span className="ni"><X size={13} /></span><span>{t}</span>
          </div>
        ))}
        <div className="alert al-r" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="al-icon"><AlertTriangle size={14} /></span>
          <span>Toda actuación que no esté en la normativa <strong>no significa que sea válida</strong>. La administración se guarda el derecho de decidir si una situación es válida/sancionable.</span>
        </div>
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
        <div className="alert al-r" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="al-icon"><AlertTriangle size={14} /></span>
          <span>Saltarse los precios = <strong>warn de organización</strong>. Reincidencia grave = posible desmantelamiento.</span>
        </div>
      </div>

      <div className="card cl-red" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-red"><MapPin size={15} /></div>
          <div className="card-title ct-red">Zona Roja / Punto Caliente</div>
        </div>
        <RuleList rules={ZONA_ROJA} />
      </div>

      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Car size={15} /></div>
          <div className="card-title ct-blue">Coches y Motos — reglas de disparo</div>
        </div>
        <RuleList rules={COCHES_MOTOS} />
      </div>

      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Flame size={15} /></div>
          <div className="card-title ct-blue">Tiroteos entre organizaciones</div>
        </div>
        <RuleList rules={TIROTEOS} />
      </div>

      <div className="card cl-purple" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-purple"><Swords size={15} /></div>
          <div className="card-title ct-purple">Conflicto entre organizaciones</div>
        </div>
        <RuleList rules={CONFLICTO} />
      </div>

      <div className="card cl-blue" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-blue"><Shield size={15} /></div>
          <div className="card-title ct-blue">Policía — LSPD / Sheriff</div>
        </div>
        <RuleList rules={POLICIA} />
      </div>

      <div className="card cl-yellow" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-icon ci-yellow"><ShieldAlert size={15} /></div>
          <div className="card-title ct-yellow">Sistema de strikes y warns OC</div>
        </div>
        <div className="alert al-y" style={{ marginBottom: 10 }}>
          <span className="al-icon"><Users size={14} /></span>
          <span>
            Sistema de faltas <strong>individual</strong> solo para personas <strong>nuevas</strong> en el sistema ilegal.
            Miembros con experiencia van directo a <strong>strike</strong>. Solo el equipo de ilegales decide si es strike o falta.
          </span>
        </div>
        <div className="nrow nrow-warn">
          <span className="ni"><AlertTriangle size={13} /></span>
          <span><strong>3 strikes sin rectificar = 1 warn a la organización · 3 warns = desmantelamiento.</strong> Los strikes expiran cada 2 semanas y los warns cada mes.</span>
        </div>
        {OC_FALTAS_GROUPS.map(g => (
          <div key={g.key} style={{ marginBottom: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span className={`pill ${g.pillClass}`}>{g.label}</span>
            </div>
            {g.items.map((item, i) => (
              <div key={i} className="nrow nrow-info" style={{ paddingLeft: 8 }}>
                <span className="ni" style={{ opacity: .5 }}>·</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card cl-green">
        <div className="card-header">
          <div className="card-icon ci-green"><Target size={15} /></div>
          <div className="card-title ct-green">Niveles — requisitos para subir</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong>MAFIA Lvl1→Lvl2:</strong> $5M Mafia Madre · cupos llenos · 4k cocaína / heroína / maría · Misión 1 · búnker 600 armas · 3 yates · 6 joyerías · 150 SNS · 120 Vintage · 100 9mm.<br />
          <strong>MAFIA Lvl2→Lvl3:</strong> $10M · cupos llenos · 8k cocaína / heroína / maría · búnker 1500 armas · 6 yates · 12 joyerías · 2 bancos centrales · 250 SNS · 230 Vintage · 200 9mm · 80 Mini-SMG.<br />
          <strong>BANDA Lvl1→Lvl2:</strong> $5M · cupos llenos · 4k cocaína / maría · lab maxeado · 20 badulaques · 8 fleekas · 4 joyerías · 70 SNS · 60 Vintage · 50 9mm · 30 chalecos.<br />
          <strong>BANDA Lvl2→Lvl3:</strong> $10M · cupos llenos · 8k cocaína / maría · lab maxeado · 40 badulaques · 16 fleekas · 10 joyerías · 180 SNS · 150 Vintage · 120 9mm · 40 chalecos.
        </p>
      </div>
    </div>
  );
}
