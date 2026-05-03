'use client';

// Normativa Completa — pestañas con la normativa oficial del servidor (alimenta también la IA).
import { useState } from 'react';

const TABS = [
  { key: 'general',  label: 'General' },
  { key: 'ilegales', label: 'Ilegales (Mafias/Bandas)' },
  { key: 'actos',    label: 'Actos Ilícitos' },
  { key: 'admin',    label: 'Sanciones Admin' }
];

export default function NormativaCompleta() {
  const [tab, setTab] = useState('general');
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Normativa Completa</div>
        <div className="pg-sub">Normativa oficial del servidor — esta misma información alimenta el Consultor IA</div>
      </div>
      <div className="norm-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`norm-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'general'  && <NormGeneral />}
      {tab === 'ilegales' && <NormIlegales />}
      {tab === 'actos'    && <NormActos />}
      {tab === 'admin'    && <NormAdmin />}
    </div>
  );
}

function NormGeneral() {
  return (
    <div className="norm-content">
      <h2>Definiciones esenciales</h2>
      <strong>IDP</strong> (Interpretación del Personaje): historia IC, evolución y conducta acorde al PJ.{'\n'}
      <strong>OOC</strong> (Out of Character): todo lo que ocurre fuera de rol.{'\n'}
      <strong>IC</strong> (In Character): todo lo que le ocurre al PJ dentro del juego.{'\n'}
      <strong>Valorar vida</strong>: priorizar la vida del PJ por encima de todo.{'\n'}
      <strong>Rol de heridas</strong>: simular daño realista tras un accidente.{'\n'}
      <strong>MG</strong> (Metagaming): usar info OOC para beneficio IC.{'\n'}
      <strong>PG</strong> (Powergaming): acciones imposibles en la vida real (esconderse en arbustos, casco+gorra en tiroteos, conducir vehículos no 4x4 por montaña).{'\n'}
      <strong>DM</strong> (Deathmatch): matar IC sin rol previo o injustamente.{'\n'}
      <strong>VDM</strong> (Vehicle Deathmatch): matar usando vehículo a alta velocidad. Prohibido.{'\n'}
      <strong>BJ</strong> (Bunny Jump): abusar del salto repetido. Prohibido.{'\n'}
      <strong>RK</strong> (Revenge Kill): vengarte ignorando tu inconsciencia previa. Prohibido.{'\n'}
      <strong>PK</strong> (Player Kill): inconsciencia con pérdida parcial de memoria. No recuerdas quién, cómo, lugar ni causa (salvo testigo IC).{'\n'}
      <strong>PKT</strong> (Player Kill Total): pérdida de memoria sobre parte de tu vida.{'\n'}
      <strong>CK</strong> (Character Kill): muerte total del PJ. Borrado del servidor. Prohibido recrearlo.

      <h2>Chats y comandos</h2>
      <strong>/me</strong> describir acciones del PJ · <strong>/do</strong> describir estados o entorno.{'\n'}
      <strong>/entorno</strong>: aviso a LSPD ANTES o DURANTE acto delictivo. Obligatorio.{'\n'}
      <strong>/auxilio</strong>: aviso a EMS tras ser abatido o por accidente.{'\n'}
      <strong>/oop</strong>: dudas/ayuda OOC. NO insultos ni quejas.{'\n'}
      <strong>/ayuda</strong>: dudas OOC sobre el servidor.{'\n'}
      <strong>/anon</strong>: prohibido anunciar compraventa ilegal (usar Dark Chat o contacto directo). Prohibido "free coca", "free heroína", "zzzz", "ez" o comentarios OOC.{'\n'}
      <strong>/msg</strong>: chat privado OOC. PROHIBIDO usar para MG (no IC).

      <h2>Rol de entorno y fair-play</h2>
      Hay que tener en cuenta el entorno simulado: policías invisibles en comisaría, médicos en hospitales, gente por la calle, seguridad en locales, cámaras públicas. <strong>Fair-play</strong>: ambos jugadores en igualdad de condiciones — esencial para una experiencia sana.

      <h2>Evasión y forzar rol</h2>
      <strong>Evasión</strong>: evitar rol comenzado (escapar, desconectar, zona segura, AFK, /e indebido).{'\n'}
      <strong>Forzar rol</strong>: obligar a alguien a seguir un rol concreto para incomodar.

      <h2>Prohibiciones generales</h2>
      • Rola-bug y speed-boost prohibidos.{'\n'}
      • Ghost-pick (GP) abusivo es sancionable. Para validar disparo: asomar mínimo medio cuerpo con arma visible.{'\n'}
      • Citizen / mods inapropiados que den ventaja = BAN PERMANENTE.{'\n'}
      • Apoyar o promocionar servidores que hagan SPAM = BAN PERMANENTE e irreversible.

      <h2>Zonas seguras</h2>
      Comisaría · Hospital Central · Taller mecánico · Garaje Central · Ayuntamiento INEM · Zona trabajadores INEM · Negocios y discotecas · Casino · Concesionario · Armería · Gimnasio.{'\n'}
      <strong>NO segura</strong>: Gasolinera del norte (cercana a punto caliente).{'\n'}
      Reglas: no actos delictivos ni roles agresivos. Si rol agresivo dentro de establecimiento escala → resolver fuera. Prohibido entrar para evadir rol previo. Prohibido campear para iniciar secuestro/robo. Respetar decisiones de dueños/trabajadores.

      <h2>Regla general</h2>
      Toda actuación NO en normativa NO significa que sea válida. La administración se reserva el derecho de decidir si una situación es válida o sancionable.
    </div>
  );
}

function NormIlegales() {
  return (
    <div className="norm-content">
      <h2>General OC</h2>
      Abusar bugs = disolución inmediata, no apelable.{'\n'}
      Inactividad organización = posible eliminación.{'\n'}
      Vehículos de pago prohibidos para actos ilegales (solo coches del apartado de organizaciones).{'\n'}
      Vestimenta + entorno OC obligatorios antes/durante cualquier acto delictivo.{'\n'}
      /me y /do obligatorios sin abuso. Mutilaciones y +18 NO consentidos = sanción admin.{'\n'}
      Buen IDP exigido. Jefe es máximo responsable.{'\n'}
      Prohibido muros en sedes/casas = housing borrado.{'\n'}
      Robo a propia OC ("desertor") = CK ADMIN + BAN 7 DÍAS.{'\n'}
      Vender info OC a policía = MAL IDP, sancionable.{'\n'}
      Vestimenta + color asignado obligatorios.{'\n'}
      PROHIBIDO: No water/no bush/no window/tracer disparos/láser armas/miras externas/kill effect.

      <h2>Bandas</h2>
      Sin alianzas (solo tratados de paz). Pueden comercializar con cualquier mafia.{'\n'}
      Pueden vender armas a civiles SOLO en sus barrios. Prohibido en zona segura.{'\n'}
      Anunciar venta en chat = sanción admin.{'\n'}
      No se envían entornos dentro de barrios.{'\n'}
      DENTRO ciudad: solo cuchillos y pistolas NO automáticas. Fuera ciudad: armamento de gran calibre.

      <h2>Mafias</h2>
      Sin alianzas (solo tratados de paz). Pueden contratar varias bandas.{'\n'}
      DENTRO ciudad: solo pistolas. Fuera ciudad: armamento mayor según nivel.{'\n'}
      Función: proveer armas a bandas. Prohibido vender armas a civiles en ciudad. Solo en el norte.{'\n'}
      Prohibido cualquier estafa en tratos.

      <h2>Zona Roja / Punto Caliente</h2>
      Prohibido disparar dentro↔fuera. Toda OC con vestimenta de OC. De paisano = sanción.{'\n'}
      Prohibido campear. Prohibido evadir rol.{'\n'}
      Dentro: cachear y robar todo (incluso abatidos), sin importar tiroteos.{'\n'}
      No reportes dentro. Si te abaten: no volver al mismo punto durante ~1h.{'\n'}
      No hay fair-play (solo dar chance a bajar del vehículo). Sin valoración vida. Solo VDM/PG/RK.{'\n'}
      Excepción: persona sin arma o con arma blanca frente a alguien con arma de fuego SÍ debe valorar vida.

      <h2>Tiroteos entre OC</h2>
      Inicio: tras conflicto con rol previo. Prohibida implicación de terceras OC.{'\n'}
      Permitido huida si situación desfavorable (sin entrar zonas seguras / sedes / barrios).{'\n'}
      Tras finalizar: margen para cachear y resguardar heridos.{'\n'}
      Solo cachear AL FINALIZAR. Prohibido campear esperando fin de conflicto.{'\n'}
      Tras tiroteo: secuestro permitido SOLO para info, no rescate por dinero/items.{'\n'}
      Prohibido disparar a pies bajo coches.

      <h2>Conflicto OC</h2>
      Inicio: ajuste cuentas previo con motivo y rol previo. Solo entre 2 organizaciones.{'\n'}
      HQ PROHIBIDO. Una vez iniciado: ambos bandos disparan sin pares.{'\n'}
      Si es entre mafias o mafia-banda: a las afueras.{'\n'}
      Termina cuando una parte se rinde / pide alto el fuego.{'\n'}
      Para escalar a guerra: avisar admin.{'\n'}
      Prohibido secuestrar bando contrario durante el conflicto.

      <h2>Policía y OC</h2>
      OC NO puede buscar enfrentamiento directo con policía. Función = evitar/huir/ocultarse.{'\n'}
      Retención de policía: prohibida si es para forzar rol o forzar retirada.{'\n'}
      Toda retención requiere negociación previa obligatoria.{'\n'}
      Matar policía secuestrado durante negociación = asesinato con consecuencias IC.

      <h2>Sistema de Faltas Individuales (solo nuevos)</h2>
      Penalizadas con jails (no warns). Cada 3 faltas sin rectificar = warn organización.{'\n'}
      Equipo ilegales decide si es WARN o FALTA según pruebas.{'\n'}
      Faltas leve/media/grave valoradas por equipo de ilegales.{'\n'}
      A miembros antiguos NO aplica este sistema, va directo a WARN.

      <h2>Faltas Leves OC</h2>
      Forzar rol · No usar /entorno · Ir enmascarados sin acto delictivo · Excederse en robos/secuestros · Iniciar roles agresivos sin motivo · PG.

      <h2>Faltas Medias OC</h2>
      No respetar rol entorno · Dejar bridas por diversión · Iniciar tiroteo policía sin rol previo · Robar mismo usuario constantemente · F8 en mitad rol · No valorar vida · Falta FairPlay · Vestimenta Mafia por ciudad · Matar encima vehículos sin reposición.

      <h2>Faltas Graves OC</h2>
      No respetar rol entorno sedes/barrios · Alianzas con otras OC · Robar armamento policial (+ BAN permanente) · Programas externos para MG · Mutilaciones/+18 no consentidos · Faltar respeto staff · Ignorar comunicados staff · Toxicidad · Armas no permitidas por nivel dentro ciudad · Mensajes de odio.{'\n'}
      Cheats = BAN PERMANENTE.
    </div>
  );
}

function NormActos() {
  return (
    <div className="norm-content">
      <h2>Reglas generales</h2>
      • LSPD persiguiendo OC/civil que entra a punto caliente: usuarios del punto NO pueden interferir (sería rol ajeno).{'\n'}
      • Rostro totalmente oculto / vestimenta que dificulte ver el rostro = LSPD puede intervenir SIN rol previo para multar y cachear.{'\n'}
      • Portar/guardar armamento policial o EMS = BAN 3 MESES.{'\n'}
      • Chocar bruscamente para iniciar rol = PG, sancionable. Choque leve = ambos rolean.{'\n'}
      • Vehículos 4x4 del apartado F4 → Organizaciones SÍ permitidos para actos ilícitos.{'\n'}
      • Falta fair-play en roles agresivos/delictivos = sancionable.{'\n'}
      • Argumentar GoPro/BodyCam para salirse de rol = PROHIBIDO.{'\n'}
      • Tras matarte/abatirte: esperar fin de rol. Tirar F8/ESPACIO = sanción admin.{'\n'}
      • Si apareces en hospital: NO recordar ni reincorporarte al mismo rol.{'\n'}
      • Tiroteos/persecuciones: el PILOTO nunca dispara desde vehículo en movimiento. Solo copiloto/pasajeros.{'\n'}
      • Abuso de mecánicas/dumpeo/métodos no permitidos en sistema ilegales = DISOLUCIÓN INMEDIATA de la OC.

      <h2>Coches</h2>
      Prohibido disparar a abatir desde coche en movimiento. Solo a ruedas, y solo acompañantes (no conductor). Para disparar a abatir: bajarse obligatorio.

      <h2>Motos</h2>
      Prohibido disparar a abatir. Solo a ruedas con la moto COMPLETAMENTE PARADA. Si jugador en moto se detiene, otros NO pueden disparar a matar. 2+ ruedas pinchadas = obligatorio detener vehículo.

      <h2>Robo de vehículos y otras reglas</h2>
      • Prohibido robar vehículos en zonas seguras.{'\n'}
      • En el resto: tirar /entorno antes de robar.{'\n'}
      • NO interaccionar con abatido para quitar máscara, foto, burla, acoso, insultos OOC.{'\n'}
      • Mientras alguien trabaja en trabajo legal (basurero, camionero, electricista...) = PROHIBIDO matar/robar/rol agresivo sin motivo.{'\n'}
      • Civiles sin OC: prohibido portar arma larga/automática para actos delictivos.{'\n'}
      • Prohibido estafar (civil o OC).{'\n'}
      • Obligar a retirar dinero del banco y transferir = BAN PERMANENTE.{'\n'}
      • Cachear abatido sin rol previo = sancionable (excepto en punto caliente).{'\n'}
      • Burlarse/pegar/insultar a abatido = sancionable.

      <h2>Atracos a usuarios</h2>
      • Mín 1 atracador a pie. Mín 2 con moto/coche. Si solo 1 con vehículo: víctima no obligada a parar.{'\n'}
      • Máx 6 atracadores en cualquier rol de atraco.{'\n'}
      • PROHIBIDO atracar/secuestrar en carreteras transitadas. Solo callejones, calles poco vigiladas, acueductos y vías del tren DURANTE EL DÍA.{'\n'}
      • Ciudad entera permitida solo de NOCHE.{'\n'}
      • Tras pare: breve interacción y chance para que la víctima baje y levante manos. Mal fairplay = sanción.{'\n'}
      • Omisión al pare: dar margen para huida o tiroteo. Prohibido pinchar al segundo del pare.{'\n'}
      • Sacar arma desde dentro del coche NO es válido. Bajarse para que la víctima vea el arma.{'\n'}
      • Si víctima valora vida: prohibido abatir sin motivo.{'\n'}
      • Tras abatir y coche cerrado: NO quitar llaves ni acceder al interior con menú OC.{'\n'}
      • Prohibido campear barrios o zonas seguras para atracar.

      <h2>Tiroteos</h2>
      • No disparar a abatir a usuario conduciendo o subido a vehículo. Primero pinchar ruedas.{'\n'}
      • Excepción: si a mitad del conflicto huye/se sube a vehículo, SÍ puede ser abatido dentro.{'\n'}
      • Al finalizar tiroteo: prohibido terceras OC intervengan o cacheen (excepto en punto caliente).{'\n'}
      • Apartarse del grupo cacheando para guardar armas = abandono de rol.

      <h2>Uso de /entorno</h2>
      • Secuestro: entorno al dar el pare.{'\n'}
      • Robo a civil: entorno al dar el pare.{'\n'}
      • Conflicto OC: entorno DESPUÉS del conflicto, ANTES de cachear (siempre).

      <h2>Robos a establecimientos</h2>
      Coches y motos de sangre PROHIBIDOS para robos a establecimientos.

      <strong>Badulaque / Licorería:</strong> Máx 2 atracadores enmascarados · Cuchillo · 3 LSPD disponibles · Máx 2 rehenes (tendero cuenta) · Tiroteos solo con mismo nº de usuarios · MAX 5/día por OC · Solo huida.

      <strong>Joyería</strong> (solo bandas): 4-5 atracadores enmascarados, mín 4 dentro · 7 LSPD disponibles · Pistola y automáticas (máx 2 si son 5) · Máx 4 rehenes · Solo coches huida · Tiroteos máx 5 usuarios · MAX 3/semana por OC · Atraco activo y coordinado obligatorio · Si llega otra OC con rehenes y la primera incumple, el atraco pasa a la segunda.

      <strong>Fleekas (bancos):</strong> 3-4 atracadores, mín 3 dentro · Pistola · 5 LSPD disponibles · Máx 3 rehenes · MAX 1/día por OC.

      <strong>Yate:</strong> 6-7 atracadores · Min AP + subfusiles · 10 LSPD disponibles · Sin rehenes ni negociación · Helicóptero abandona zona si todos abatidos. No /espacio si abaten · MAX 1/semana por OC.

      <strong>Banco Central</strong> (solo OC): Mín 12 atracadores · 16 LSPD mínimo (siempre +2 que atracadores) · Todo tipo armas · Solo 1 francotirador (vía ticket) · 2 helicópteros llegada (no huida) · Solo coches huida · Máx 6 rehenes · MAX 1 cada 2 semanas por OC.

      <h2>Robos a personas</h2>
      <strong>Dentro ciudad:</strong>{'\n'}
      • Civil: cuchillo o pistola, mín 4 policías servicio. NO robar comida/bebida/DNI. /entorno obligatorio.{'\n'}
      • Policía: prohibido cachear/robar (solo como moneda). Pistola+. Mín 12 policías. /entorno obligatorio.{'\n'}
      <strong>Fuera ciudad:</strong>{'\n'}
      • Civil: todo tipo armas. Mín 8 policías. NO comida/bebida/DNI. /entorno obligatorio.{'\n'}
      • Sheriff: prohibido cachear/robar. Pistola+. Mín 18 sheriffs. /entorno obligatorio.

      <h2>Secuestros</h2>
      • Solo bandas y mafias. NO siendo "bambi" o civil.{'\n'}
      • Bandas: vestimenta de organización OBLIGATORIA en ciudad.{'\n'}
      • Civil: mín 8 policías. LSPD: mín 12 policías + cooldown 7 días. Sheriff: mín 16 + cooldown 7 días.{'\n'}
      • Múltiples policías secuestrados: duplicar el mínimo.{'\n'}
      • Helicóptero CÓNDOR puede desplegarse durante toda la negociación.{'\n'}
      • Entre miembros de bandas: sin mínimo policías si hay rol previo. Solo 1/semana por OC.{'\n'}
      • Bandas pueden secuestrar a otras OC con conflicto/enemistad previa, o a civiles con motivo.{'\n'}
      • /entorno OBLIGATORIO antes.{'\n'}
      • Máximo retención: 45 minutos. Empatizar con la otra parte.{'\n'}
      • PROHIBIDO secuestrar trabajador INEM o EMS.{'\n'}
      • Comprensión: dar comida/bebida (puede influir negociación). Robar todo MENOS comida/bebida al rehén.{'\n'}
      • Flexibilidad obligatoria. NO romper negociación a la primera.{'\n'}
      • Rehén DEBE valorar vida. Nula valoración = posible CK.{'\n'}
      • Finalidad: dinero/armas/droga. Para ajuste de cuentas = inicio de conflicto OC.{'\n'}
      • Tras negociación: entrega obligatoria de rehenes y botín. Prohibido retomar la misma negociación.{'\n'}
      • Prohibido secuestrar tras rotura de negociación previa.

      <h2>Secuestro a policías (estricto)</h2>
      Por fuerza mayor (info relevante o necesidad inminente). Por gusto/aburrimiento = sanción grave a la OC.{'\n'}
      • Investigar nº de policías de la facción concreta (LSPD/SHERIFF) antes.{'\n'}
      • Prohibido campear comisarías/zonas seguras.{'\n'}
      • Prohibido obligar a policía a burlas/humillaciones.{'\n'}
      • Ficha de investigación automática a la OC en caso de captura.{'\n'}
      • Negociación: máx 300K por agente normal · Subinspector+ hasta 500K o limpiar historial OC (máx 3 integrantes). Agente NO puede mentir sobre su rango.{'\n'}
      • Si rompen negociaciones: 10 segundos de tregua antes del tiroteo.{'\n'}
      • Tras huida: permitida implicación del resto de OC para emboscada.{'\n'}
      • Uso de armas alto calibre ilegal en tiroteo (AK recortada, AK-47, francotirador) = policía autorizada a usar tirador con francotirador.{'\n'}
      • Secuestro masivo policial = posible REDADA tras evaluación admin.

      <h2>Venta de información y colaboración con autoridades</h2>
      <strong>Desvinculación previa OBLIGATORIA</strong>: quien venda info debe haber dejado formalmente cualquier OC antes. Si aún pertenece = falta IDP, sanción.{'\n'}
      <strong>Pruebas obligatorias</strong>: fotos, videos, grabaciones del rol completo demostrando cómo y cuándo se obtuvo la info. Sin pruebas = info NULA en rol.{'\n'}
      <strong>Prohibido MG</strong>: no obtener info por medios externos al rol. No usar Discord/streams/chats OOC. No transmitir info MG a policía u OC.{'\n'}
      <strong>Sanciones</strong>: jail admin · wipe de personaje · ban temporal o permanente según gravedad y recurrencia.

      <h2>Regla final</h2>
      Toda actuación NO en normativa NO significa que sea válida. La administración decide.
    </div>
  );
}

function NormAdmin() {
  return (
    <div className="norm-content">
      <h2>🛑 Permanentes</h2>
      • Uso de cheats o programas externos = <strong>BAN PERMANENTE</strong>{'\n'}
      • Intento de soborno a un staff = <strong>BAN PERMANENTE</strong>{'\n'}
      • Corrupción policial = <strong>CK + BAN 1 MES</strong>{'\n'}
      • Acoso OOC (usar IC para OOC) = <strong>BAN 3 MESES</strong>{'\n'}
      • Amenazas OOC al staff = <strong>BAN 2 MESES</strong>{'\n'}
      • Propagar toxicidad OOC = <strong>BAN 2 MESES</strong>{'\n'}
      • Evasión u omisión de múltiples sanciones = <strong>BAN 2 MESES</strong>

      <h2>🟧 Graves</h2>
      • Insultar al STAFF = <strong>BAN 30 días</strong>{'\n'}
      • Hacerse pasar por LSPD/EMS = <strong>CK admin + BAN 1 día</strong>{'\n'}
      • Insultos OOC = <strong>BAN 3-5 días</strong>{'\n'}
      • Roles de violación (no consentidos) = <strong>BAN 14 días</strong>{'\n'}
      • MG (Metagaming) = <strong>BAN 3-7 días</strong>{'\n'}
      • Aceptar dinero de un hacker = <strong>CK admin + BAN 14 días</strong>{'\n'}
      • Mentir en el reporte = <strong>240 min /jail</strong>{'\n'}
      • DM masivo = <strong>240 min /jail</strong>{'\n'}
      • Evadir soporte = <strong>270 min /jail</strong>{'\n'}
      • VDM masivo = <strong>280 min /jail</strong>

      <h2>🟨 Medias</h2>
      • Tirar de cable en rol = <strong>240 min /jail</strong>{'\n'}
      • Tirar de cable en reporte = <strong>BAN 2 días</strong>{'\n'}
      • Sanciones leves de usuarios desconectados = <strong>BAN 1 día por sanción</strong>{'\n'}
      • Pegar en reporte = <strong>90 min /jail</strong>{'\n'}
      • Salirse de rol = <strong>60 min /jail</strong>{'\n'}
      • Usar armas de OC sin pertenecer = <strong>60 min /jail</strong>{'\n'}
      • Robar vehículos de facciones legales = <strong>120 min /jail</strong>

      <h2>🟩 Leves</h2>
      • DM = 60 min · VDM = 60 min · PG = 40 min · PG masivo = 60 min{'\n'}
      • Evadir el rol = 40 min · Meterse en rol ajeno = 40 min · Forzar rol = 40 min{'\n'}
      • Bunny Jump (BJ) = 20 min · Robar zona segura = 40 min{'\n'}
      • Reportar sin motivo (solo molestar) = 40 min · Omitir pérdida memoria PJ = 40 min{'\n'}
      • Forzar rol agresivo sin motivo = 40 min · Forzar rol de tiroteo = 50 min{'\n'}
      • Forzar rol sin motivo a policía = 60 min · No tirar /entorno = 20 min{'\n'}
      • No respetar rol de entorno = 40 min · Nula IDP = 60 min{'\n'}
      • No rolear choques ni heridas = 30 min · RK = 40 min{'\n'}
      • Abuso interacciones/animaciones = 50 min · Dejar esposado = 120 min{'\n'}
      • Falta de fair-play = 60 min · Burlarse/pegar/insultar abatido = 60 min{'\n'}
      • Mal uso /me y /do = 30 min · Mal uso /oop /ayuda /anon = 30 min{'\n'}
      • Quedarse AFK en entorno de rol = 40 min{'\n'}
      • Rolear con skin + ropa default = <strong>CK administrativo</strong>

      <h2>Criterio del staff</h2>
      • Hay casos donde el staff puede solo amonestar sin sancionar. Si hay reincidencia, la sanción puede aumentar.{'\n'}
      • Desconexión antes de aplicar jail IC = <strong>BAN 8h, 12h o hasta 1 día</strong> según gravedad.

      <h2>OC / Mafia</h2>
      Las sanciones de jail se <strong>DUPLICAN</strong> si el infractor pertenece a una OC. El BAN no cambia.
    </div>
  );
}
