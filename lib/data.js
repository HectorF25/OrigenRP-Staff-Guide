// Datos compartidos por las secciones del panel.

export const CONCEPTOS = [
  { term: 'MG — Metagaming', def: 'Usar información OOC (Discord, stream, chat externo) para beneficiar al personaje IC dentro del juego.', sancion: 'Ban 3-7 días' },
  { term: 'PG — Powergaming', def: 'Acciones imposibles en la vida real: disparar siendo conductor, esconderse en arbustos, casco+gorra OC en tiroteos, conducir vehículo normal por montaña.', sancion: '40 min / 60 masivo' },
  { term: 'DM — Deathmatch', def: 'Matar a un jugador sin rol previo ni justificación IC.', sancion: '60 min jail' },
  { term: 'VDM — Vehicle DM', def: 'Matar a alguien usando un vehículo como arma intencionada a alta velocidad.', sancion: '60 min jail' },
  { term: 'RK — Revenge Kill', def: 'Vengarte de quien te abatió ignorando el estado de inconsciencia (PK) de tu personaje.', sancion: '30 min jail' },
  { term: 'PK — Player Kill', def: 'Estado de inconsciencia. Pierdes memoria PARCIAL: no recuerdas quién te abatió, cómo era, el lugar ni el motivo. Solo si un testigo te lo cuenta IC lo puedes saber.', sancion: 'N/A' },
  { term: 'CK — Character Kill', def: 'Muerte TOTAL del personaje. Queda borrado del servidor. Prohibido recrear el mismo PJ con su historia y círculo social.', sancion: 'CK admin por reglas' },
  { term: 'BJ — Bunny Jump', def: 'Saltar repetidamente para desplazarse más rápido. Completamente prohibido en el servidor.', sancion: '20 min jail' },
  { term: 'Fair-play', def: 'Dar a ambas partes igualdad de condiciones: tiempo para reaccionar, valorar la vida, tomar decisiones. En zona roja solo aplica dar chance de bajarse del vehículo.', sancion: '50 min jail por falta' },
  { term: 'Evasión de rol', def: 'Escapar de un rol activo: desconectarse, entrar a zona segura, AFK, tirar F8/ESPACIO, argumentar GoPro/BodyCam como excusa.', sancion: '40 min jail' },
  { term: 'IDP — Interpretación del PJ', def: 'Actuar de forma coherente con la historia, personalidad y contexto del personaje. La base del roleplay de calidad.', sancion: '60 min jail' },
  { term: '/entorno', def: 'Aviso a la LSPD de un acto delictivo. Se tira ANTES o DURANTE el acto ilícito. En tiroteos: AL ACABAR el rol y ANTES de cachear.', sancion: '20 min (no tirarlo)' },
  { term: 'Zona Roja / Punto Caliente', def: 'Zona sin ley donde no hay fair-play normal ni valoración de vida. Se puede cachear/robar todo incluso abatidos. No se puede reportar dentro. Solo aplican VDM, PG y RK.', sancion: 'N/A' },
  { term: 'Tirar de cable', def: 'Desconectarse o escapar irregularmente durante un reporte o rol para evitar las consecuencias.', sancion: '120 min rol / Ban 2d reporte' },
  { term: 'Conflicto OC', def: 'Enfrentamiento entre dos OC con rol previo. Cuando da inicio, ambos bandos pueden disparar sin pares ni avisos. Prohibida implicación de terceras OC.', sancion: 'N/A' },
  { term: 'Corrupción policial', def: 'Policía que beneficia ilegalmente a organizaciones criminales o a sí mismo abusando de su cargo.', sancion: 'CK + Ban 1 mes' },
  { term: 'Acoso OOC', def: 'Usar situaciones IC para acosar a alguien fuera del rol (OOC). Antes llamado "Ghosting". Actualizado 12/01/26.', sancion: 'Ban 3 meses' },
  { term: 'Rol de entorno', def: 'La ciudad tiene vida: cámaras de seguridad, testigos, policías patrullando. Debes actuar en consecuencia y no ignorar el entorno simulado.', sancion: '40 min (no respetar)' },
  { term: '/me y /do', def: '/me describe acciones del personaje. /do describe estados físicos o del entorno. Su mal uso tiene sanción leve.', sancion: '5 min jail (mal uso)' },
  { term: 'GP — Ghost Pick', def: 'Disparar sin asomarse del cover. Para que sea válido debes asomar al menos la mitad del cuerpo con el arma visible.', sancion: 'Sancionable' }
];

export const CASOS = [
  { id: 1, caso: 'Un jugador mata a otro sin ningún rol previo, simplemente porque sí.', sancionable: true, tipo: 'DM', resp: 'DM sin rol previo. 60 min jail. Si pertenece a OC: 120 min.' },
  { id: 2, caso: 'Un miembro de mafia entra a la comisaría en plena persecución activa para escapar.', sancionable: true, tipo: 'Evasión de rol', resp: 'Las zonas seguras no cancelan roles activos. Evasión de rol: 40 min (OC: 80 min).' },
  { id: 3, caso: 'Un jugador usa información de un stream en vivo para localizar a un rival IC.', sancionable: true, tipo: 'MG — Metagaming', resp: 'Información OOC usada IC = Metagaming. Ban 3-7 días. Igual para jugadores de OC.' },
  { id: 4, caso: 'El conductor de un coche dispara a abatir al rival desde el vehículo en movimiento.', sancionable: true, tipo: 'PG / Normativa vehículos', resp: 'El conductor NUNCA puede disparar. Solo pasajeros y únicamente a ruedas. Para disparar a abatir: bajarse obligatoriamente. PG: 40 min (OC: 80 min).' },
  { id: 5, caso: 'Un atracador da el pare a un civil y sin esperar respuesta le pincha las ruedas.', sancionable: true, tipo: 'Falta de fair-play', resp: 'Obligatorio dar margen para que el jugador valore su vida y reaccione. 50 min (OC: 100 min).' },
  { id: 6, caso: 'Una banda (LVL2) usa un AK-47 dentro de la ciudad para un atraco.', sancionable: true, tipo: 'Armamento no permitido en ciudad', resp: 'Bandas dentro de ciudad: solo cuchillos y pistolas NO automáticas, independientemente del nivel. Sancionable.' },
  { id: 7, caso: 'Un miembro de mafia vende armas a un civil dentro de la ciudad.', sancionable: true, tipo: 'Normativa de venta — Mafia', resp: 'Mafias solo pueden vender armas a bandas. Prohibido vender a civiles en ciudad. Solo permitido en el norte. Sancionable.' },
  { id: 8, caso: 'Dos bandas se alían y van juntas a un tiroteo contra otra OC.', sancionable: true, tipo: 'Alianza entre OC', resp: 'Prohibido realizar alianzas para juntarse en tiroteos. Solo tratados de paz. Warn a la organización.' },
  { id: 9, caso: 'Un jugador vuelve a la zona roja 30 minutos después de haber sido abatido allí.', sancionable: true, tipo: 'Retorno prematuro a zona roja', resp: 'Prohibido volver a la misma zona roja aproximadamente 1 hora tras ser abatido. Con pruebas = sanción administrativa.' },
  { id: 10, caso: 'Una mafia busca activamente a la policía para iniciar un enfrentamiento.', sancionable: true, tipo: 'Nula IDP — Función OC', resp: 'La función de las OC es evitar, huir y ocultarse, NO enfrentarse directamente a la policía. Es una falta grave de IDP. Sancionable.' },
  { id: 11, caso: 'Un jugador intenta sobornar al staff con ítems del juego para quitarse un ban.', sancionable: true, tipo: 'Soborno al staff', resp: 'Ban PERMANENTE sin excepciones. La sanción más grave del servidor.' },
  { id: 12, caso: 'Una OC atraca la joyería con solo 3 atracadores.', sancionable: true, tipo: 'Mínimo de atracadores — Joyería', resp: 'La joyería requiere mínimo 4 atracadores dentro del establecimiento (4-5 total). Con 3 el atraco no es válido. Sancionable.' },
  { id: 13, caso: 'Una OC va a la zona roja vestida con ropa de paisano.', sancionable: true, tipo: 'Vestimenta OC — Zona Roja', resp: 'Toda OC debe acudir a zona roja con su vestimenta de OC. Ir de paisano = sanción administrativa directa.' },
  { id: 14, caso: 'Tras finalizar un tiroteo, una tercera OC que no participó llega a cachear a los abatidos.', sancionable: true, tipo: 'Meterse en rol ajeno', resp: 'Solo los bandos implicados en el tiroteo pueden cachear al finalizar. Excepción: dentro de punto caliente. 40 min (OC: 80 min).' },
  { id: 15, caso: "Un miembro de OC roba a su propia organización en un rol de 'desertor'.", sancionable: true, tipo: 'Robo a propia OC', resp: 'Explícitamente prohibido en la normativa. Sanción directa: CK administrativo + Ban 7 días.' },
  { id: 16, caso: 'Un rehén lleva 50 minutos retenido sin avances en la negociación.', sancionable: true, tipo: 'Retención excesiva', resp: 'El tiempo máximo de retención es 45 minutos. Obligatorio avanzar en la negociación y empatizar.' },
  { id: 17, caso: 'Un jugador usa la GoPro como excusa para salirse de un rol de secuestro activo.', sancionable: true, tipo: 'Evasión de rol', resp: 'Explícitamente prohibido en la normativa. No se puede usar GoPro/BodyCam para evadir un rol. 40 min jail.' },
  { id: 18, caso: 'Un jugador rollea con la skin y la ropa por defecto del juego sin personalizar.', sancionable: true, tipo: 'Skin / ropa default', resp: 'Warn + CK administrativo. La personalización del personaje es obligatoria para hacer roleplay.' }
];

export const PAGES = [
  { t: 'Consultor IA',           s: 'Powered by Gemini · Normativa OrigenRP integrada' },
  { t: 'Comandos In-Game',       s: 'Referencia rápida para uso en el servidor' },
  { t: 'Bot & Tickets',          s: 'Comandos de Discord, bot y Tebex' },
  { t: 'Items & Armas',          s: 'Nombres de ítems para /giveitem' },
  { t: 'Sanciones',              s: 'Tabla oficial actualizada 17/01/26' },
  { t: 'OC / Mafias ×2',         s: 'Sanciones con tiempo doble para organizaciones criminales' },
  { t: 'Ilegales',               s: 'Normativa de mafias, bandas y OC' },
  { t: 'Robos',                  s: 'Requisitos por establecimiento y secuestros' },
  { t: 'Norma Staff',            s: 'Principios y obligaciones del equipo' },
  { t: 'Conceptos RP',           s: 'Términos clave que todo staff debe dominar' },
  { t: 'Casos Prácticos',        s: 'Situaciones reales — ¿sancionar o no?' },
  { t: 'Flashcards',             s: 'Repaso rápido de conceptos clave' },
  { t: 'Normativa Completa',     s: 'Normativa oficial del servidor — buscador' },
  { t: 'Logs del Servidor',      s: 'Acceso a FiveMonitor para revisar logs' }
];
