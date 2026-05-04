// Toda la normativa de OrigenRP en formato compacto para alimentar el contexto de la IA.
// Fuentes:
//   • https://origen-roleplay.gitbook.io/normativa
//   • https://origen-roleplay.gitbook.io/normativa/actos-ilicitos
//   • https://origen-roleplay.gitbook.io/normativa/sanciones-administrativas
//   • Normativa Ilegales (docx interno)

export const NORMATIVA_GENERAL = `NORMATIVA GENERAL ORIGENRP — DEFINICIONES Y REGLAS BÁSICAS

DEFINICIONES:
- IDP = Interpretación del personaje (historia IC, evolución, conducta acorde).
- OOC = Out of Character (todo lo que ocurre fuera del rol).
- IC = In Character (todo lo que le ocurre al PJ dentro del juego).
- VALORAR VIDA = priorizar la vida del PJ por encima de todo.
- ROL DE HERIDAS = simular daño realista tras un accidente.
- MG (Metagaming) = usar info OOC para beneficio IC. SANCIONABLE.
- PG (Powergaming) = acciones imposibles en la vida real.
  Ejemplos PG: meterse en arbustos para esconderse y disparar; llevar casco+gorra en tiroteos o como vestimenta OC; conducir vehículos NO 4x4 por terrenos de tierra/montaña (solo SUVs concesionario, salvo Pegassi Toros, Urus, Lampadati Novak); ruedas montaña/suspensión elevada NO valen.
- DM (Deathmatch) = matar IC sin rol previo o injustamente.
- VDM (Vehicle Deathmatch) = matar usando vehículo a alta velocidad como arma. PROHIBIDO.
- BJ (Bunny Jump) = abusar del salto repetido para boost de velocidad. PROHIBIDO.
- RK (Revenge Kill) = vengarte ignorando tu estado de inconsciencia previo. PROHIBIDO.
- PK (Player Kill) = inconsciencia con pérdida de memoria parcial: NO recuerdas quién, cómo, lugar ni causa. Excepción: si testigo te lo cuenta IC.
- PKT (Player Kill Total) = inconsciencia con pérdida de memoria sobre parte de tu vida.
- CK (Character Kill) = muerte total del PJ. PJ borrado. PROHIBIDO recrear el mismo PJ con misma historia.

CHATS Y COMANDOS:
- /me = describir acciones del PJ.
- /do = describir estados físicos/anímicos o entorno.
- /entorno = aviso a LSPD antes/durante acto delictivo. OBLIGATORIO.
- /auxilio = aviso a EMS tras ser abatido o por accidente.
- /oop = duda/ayuda OOC. NO usar para insultos/odio/quejas.
- /ayuda = preguntas OOC sobre el servidor.
- /anon = PROHIBIDO anunciar compraventa ilegal (usar Dark Chat o contactar Mafia/Banda). PROHIBIDO insultos OC, "free coca", "free heroína", "zzzz", "ez", o comentarios OOC.
- /msg = chat privado. PROHIBIDO usar para MG (es OOC, no IC).

ROL DE ENTORNO: simular ciudad viva (policías invisibles en comisaría, médicos en hospitales, gente en calles, seguridad en locales, cámaras públicas). Rolear según ese entorno.

FAIR-PLAY: ambos jugadores en igualdad de condiciones. ESENCIAL.

EVASIÓN DE ROL: evitar rol comenzado (escapar, desconectar, zona segura, AFK, /e indebido en mitad de rol).

FORZAR ROL: obligar a alguien a seguir un rol concreto para incomodar.

AFK: evita quedarte ausente donde pueda iniciar un rol; refúgiate en zona segura o desconecta.

PROHIBIDOS GENERALES:
- Rola-bug y speed-boost = PROHIBIDO.
- Ghost-pick (GP) abusivo = SANCIONABLE. Para validar disparo, asomar mínimo medio cuerpo con arma visible.
- Citizen/mods inapropiados que den ventaja = BAN PERMANENTE.
- SPAM o promoción de servidores que hagan SPAM = BAN PERMANENTE e irreversible.

ZONAS SEGURAS:
Comisaría · Hospital Central · Taller mecánico · Garaje Central · Ayuntamiento INEM · Zona trabajadores INEM · Negocios y discotecas · Casino · Concesionario · Armería · Gimnasio.
NO segura: Gasolinera del norte (cercana a punto caliente).

REGLAS ZONAS SEGURAS:
- Prohibido actos delictivos / roles agresivos en zonas seguras.
- Si rol agresivo dentro de establecimiento escala → resolver fuera.
- Prohibido entrar zona segura para evadir rol previo.
- Prohibido campear zona segura para iniciar secuestro/robo/ajuste de cuentas.
- Respetar decisiones de dueños/trabajadores en propiedad o negocio privado.

REGLA GENERAL: Toda actuación NO en normativa NO significa que sea válida. La administración decide si una situación es válida/sancionable.`;

export const NORMATIVA_ACTOS_ILICITOS = `NORMATIVA ACTOS ILÍCITOS ORIGENRP

REGLAS GENERALES:
- Si LSPD persigue OC/civil que entra en punto caliente, los usuarios/OC del punto NO pueden interferir (sería "intervenir en rol ajeno").
- Rostro totalmente oculto o vestimenta que dificulte ver el rostro = LSPD puede intervenir SIN rol previo para multar y cachear.
- Portar/guardar armamento policial o EMS = BAN 3 MESES.
- Chocar bruscamente con otros vehículos (intencional o no) para iniciar rol = PG, sancionable. Choque leve = ambos rolean.
- Vehículos 4x4 del apartado F4 → Organizaciones SÍ permitidos para actos ilícitos.
- Falta fair-play en roles agresivos/delictivos = sancionable.
- Argumentar GoPro/BodyCam para salirse de rol = PROHIBIDO.
- Tras ser matado/abatido en rol agresivo o con LSPD: esperar fin de rol. Tirar F8/ESPACIO = sanción admin.
- Si te matan y apareces en hospital: NO recordar ni reincorporarte al mismo rol.
- En tiroteos/persecuciones/roles delictivos: PILOTO NUNCA dispara con coche/moto en movimiento o alta velocidad. Solo copiloto/pasajeros.
- Abuso de mecánicas, dumpeo, métodos no permitidos en sistema ilegales = DISOLUCIÓN INMEDIATA de la OC sin aviso. Reportar bugs obligatorio.

COCHES:
- PROHIBIDO disparar a abatir desde coche en movimiento.
- Solo permitido disparar a ruedas, y solo acompañantes (NO conductor).
- Para disparar a abatir: bajarse del vehículo OBLIGATORIO.

MOTOS:
- PROHIBIDO disparar a abatir.
- Solo se puede disparar a ruedas con la moto COMPLETAMENTE PARADA.
- Si jugador en moto se detiene, otros NO pueden disparar a matar.
- 2+ ruedas pinchadas = obligatorio detener vehículo (igual con moto y rueda pinchada).

ROBO DE VEHÍCULOS:
- Prohibido robar vehículos en zonas seguras.
- En el resto: tirar /entorno antes de robar cualquier vehículo.

OTRAS REGLAS:
- NO interaccionar con usuario abatido para quitar máscara, foto, burla/acoso, insultos OOC.
- Mientras un usuario trabaja un trabajo legal (basurero, camionero, electricista, etc.) PROHIBIDO matarlo o robarlo. Rol agresivo sin motivo = sanción.
- Civiles sin OC NO pueden portar arma larga/automática dentro/fuera de ciudad para actos delictivos.
- PROHIBIDO estafar (civil o OC).
- PROHIBIDO obligar a retirar dinero del banco y transferir = BAN PERMANENTE.
- PROHIBIDO cachear abatido sin rol previo (meterse en rol ajeno). Excepción: dentro de punto caliente.
- Burlarse/pegar/insultar a abatido = sancionable.

ATRACOS A USUARIOS:
- Mín 1 atracador a pie. Mín 2 con moto/coche (uno conduce, otro actúa). Si solo 1 con vehículo, la víctima NO obligada a parar (no se siente amenazada).
- Máx 6 atracadores en cualquier rol de atraco a usuarios.
- PROHIBIDO atracar/secuestrar en carreteras transitadas. Solo permitido en callejones, calles poco vigiladas, acueductos y vías del tren DURANTE EL DÍA.
- Toda la ciudad permitida solo de NOCHE.
- Prohibido secuestrar para llevarlo a callejón y cachear.
- Tras pare a usuario: breve interacción/respuesta y chance para bajar del vehículo y levantar manos. Mal fairplay = sanción.
- Si víctima omite el pare: dar margen para huida o iniciar tiroteo. PROHIBIDO dar pare y al segundo pinchar (dentro o fuera ciudad).
- Sacar arma desde dentro de vehículo NO es válido (no se ve el arma); bajarse para que la víctima valore vida.
- Si víctima valora vida en todo momento: PROHIBIDO abatir sin motivo.
- Tras atraco: atracadores pueden pedir abrir coche. Si víctima abatida y coche cerrado: NO quitar llaves ni acceder al interior con menú OC (abuso de interacciones, sancionable).
- PROHIBIDO campear barrios o zonas seguras para atracar.

TIROTEOS:
- Iniciado tiroteo: NO disparar a abatir a usuario conduciendo o subido a vehículo. Primero pinchar ruedas para detenerlo (mayor fairplay).
- Excepción: si a mitad del conflicto el usuario huye/se posiciona subiéndose a vehículo, SÍ puede ser abatido dentro.
- Al finalizar tiroteo entre 2 bandos: PROHIBIDO terceras OC intervengan o cacheen. Excepción: punto caliente.
- PROHIBIDO apartarse del grupo cacheando para ir a guardar armas (abandono de rol).

USO DE ENTORNO (no sirven los bindeados):
- Secuestro: entorno al dar el pare.
- Robo a civil: entorno al dar el pare.
- Conflicto OC: entorno DESPUÉS del conflicto, ANTES de cachear (siempre).

ROBOS A ESTABLECIMIENTOS — Coches/motos de sangre PROHIBIDOS.

BADULAQUE / LICORERÍA:
- Máx 2 atracadores enmascarados. Cuchillo. 3 LSPD disponibles.
- Rehén NO amigo del atracador. Máx 2 rehenes (tendero cuenta).
- Tiroteos solo con mismo nº de usuarios.
- MAX 5 robos/día por OC. NO acumulan. SOLO HUIDA.

JOYERÍA (solo bandas y pandillas):
- 4-5 atracadores enmascarados, mín 4 dentro. 7 LSPD disponibles.
- Pistola y automáticas. Si son 5 = máx 2 automáticas; si menos = sin automáticas.
- Máx 4 rehenes. Solo coches huida. Tiroteos máx 5 usuarios.
- MAX 3 robos/semana por OC. HUIDA O HUIDA ACABADA EN TIROTEO.
- PROHIBIDO quedarse quieto en cuarto trasero esperando policía. Atraco activo y coordinado.
- Si llega otra OC con rehenes y la primera incumple = atraco pasa a la segunda.

FLEEKAS (BANCOS):
- 3-4 atracadores enmascarados, mín 3 dentro. Pistola. 5 LSPD disponibles. Máx 3 rehenes.
- HUIDA O HUIDA ACABADA EN TIROTEO.
- MAX 1 robo/día por OC.

YATE:
- 6-7 atracadores enmascarados. Min AP + subfusiles. 10 LSPD disponibles. Sin rehenes ni negociación.
- Helicóptero abandona zona si todos abatidos o neutralizado.
- Si abaten: NO usar /espacio, seguir rol al volver del hospital.
- MAX 1 robo/semana por OC.

BANCO CENTRAL (solo OC):
- Mín 12 atracadores enmascarados. Min 16 LSPD disponibles (siempre 2 más que atracadores).
- Todo tipo armas. Solo 1 francotirador (interno o externo) con disponibilidad por ticket.
- 2 helicópteros para llegada (NO huida). Solo coches huida.
- Si tiroteo y abaten: hospital = no reincorporar si rol no terminó.
- Máx 6 rehenes.
- MAX 1 robo cada 2 semanas por OC.

ROBOS PERSONAS:
DENTRO CIUDAD:
- Civil: cuchillo o pistola. Mín 4 policías servicio. NO robar comida/bebida/DNI. /entorno OBLIGATORIO antes.
- Policía: PROHIBIDO cachear/robar (solo como moneda secuestro/atraco grande). Pistola+. Mín 12 policías servicio. /entorno obligatorio.
- Reinicio servidor durante robo: rol pausado, retomar cuando ambos lo acuerden.
FUERA CIUDAD:
- Civil: todo tipo armas. Mín 8 policías servicio. NO robar comida/bebida/DNI. /entorno obligatorio.
- Sheriff: PROHIBIDO cachear/robar (solo como moneda). Pistola+. Mín 18 sheriffs servicio. /entorno obligatorio.

SECUESTROS:
- Solo bandas y mafias pueden secuestrar.
- Mafias/bandas NO pueden secuestrar siendo "bambis o civiles" en ciudad ni norte.
- Bandas: vestimenta de organización OBLIGATORIA al secuestrar en ciudad.
- Civil: mín 8 policías servicio.
- Policía LSPD: mín 12 policías servicio. Cooldown 7 días para próximo secuestro.
- Sheriff: mín 16 sheriffs servicio. Cooldown 7 días.
- Múltiples policías/sheriffs: duplicar el mínimo requerido.
- Tras secuestro policía/civil: cuerpo policial puede desplegar helicóptero CÓNDOR (presente toda negociación, negociable).
- Secuestro entre miembros de bandas: sin mínimo policías si hay rol previo. Solo 1 secuestro/semana por OC.
- Bandas pueden secuestrar a otras OC con conflicto/enemistad previa, o a civiles con motivos de peso (en ciudad).
- /entorno OBLIGATORIO antes de secuestrar.
- Máximo retención: 45 minutos. Empatizar con la otra parte.
- PROHIBIDO secuestrar trabajador INEM o EMS.
- Ser comprensivo: dar comida/bebida (puede influir negociación).
- Flexibilidad obligatoria. NO romper negociación a la primera.
- Robar todo MENOS comida y bebida al rehén.
- Rehén DEBE valorar vida en todo momento. Cooperación mínima exigida. Nula valoración vida del rehén = posible CK al PJ.
- Finalidad: pedir dinero/armas/droga. Si es ajuste de cuentas = inicio de conflicto OC.
- Tras negociación: ENTREGA OBLIGATORIA de rehenes y botín. PROHIBIDO retomar cualquier negociación tras cerrar.
- PROHIBIDO secuestrar tras rotura de negociación o negociación anterior con la misma persona (evita abuso de detenciones).

SECUESTRO A POLICÍAS (regla estricta):
- Es por fuerza mayor (info relevante o necesidad inminente). Múltiples consecuencias.
- PROHIBIDO secuestrar por gusto/aburrimiento = sanción grave a la OC.
- OC debe investigar nº de policías de la facción específica (LSPD o SHERIFF) antes de secuestrar.
- PROHIBIDO campear comisarías/zonas seguras para secuestrar policías.
- PROHIBIDO forzar roles de secuestro (deben estar bien elaborados). Policía puede reaccionar y refugiarse.
- PROHIBIDO obligar a policía a burlas/humillaciones/similares.
- Cualquier secuestro a policía: ficha de investigación automática a la OC en caso de captura.
- Negociación: depende de nº rehenes y rango.
  • Máximo 300K por agente normal.
  • Subinspector+: hasta 500K o limpiar historial OC/miembros (máx 3 integrantes).
  • Agente secuestrado: PROHIBIDO mentir sobre su rango.
- Si rompen negociaciones: 10 segundos de tregua antes del tiroteo en el mismo lugar.
- Tras huida: permitida implicación del resto de OC para emboscada policial (importancia según nivel OC).
- Policía actúa según protocolos.
- Uso de arma alto calibre ilegal (AK recortada, AK-47, francotirador) en tiroteo = policía autorizada a usar tirador con francotirador.
- Secuestro masivo policial = posible REDADA tras evaluación admin. PROHIBIDO borrar fichas de secuestros / cancelar investigaciones.

VENTA DE INFO Y COLABORACIÓN CON AUTORIDADES (estricto):

DESVINCULACIÓN PREVIA OBLIGATORIA:
- Quien venda info de su OC debe haber salido FORMALMENTE de cualquier OC antes (info propia o ajena).
- Si aún pertenece a OC al vender: falta IDP, sanción según normativa.
- Carga de prueba sobre el informante (registro salida, pruebas rol, etc.).

REQUISITOS PARA INFORMAR A POLICÍA:
- Pruebas obligatorias: fotos, videos, grabaciones del rol completo.
- Demostrar: cómo y cuándo se obtuvo info, interacción con OC, desarrollo del rol.
- SIN pruebas válidas = info NULA en rol.

PROHIBICIÓN DE METAGAMING:
- Prohibido obtener info por medios externos al rol.
- Prohibido usar info de Discord, streams, chats OOC.
- Prohibido transmitir info MG a policía u OC.

SANCIONES POR MG / FALTA DE IDP EN VENTA INFO:
Vender info MG, info sin respaldo en rol, o aún siendo miembro de la OC implicada (falta IDP):
- Jail administrativo
- Wipe de personaje
- Baneo temporal o permanente
- Otras según gravedad y recurrencia.

Cada usuario es responsable de la legalidad y coherencia en rol de la info que vende. Desconocimiento NO exime de sanción.`;

export const NORMATIVA_SANCIONES_ADMIN = `SANCIONES ADMINISTRATIVAS ORIGENRP — TABLA OFICIAL

PERMANENTES:
- Uso de cheats o programas externos = BAN PERMANENTE.
- Intento de soborno a staff para quitar sanción = BAN PERMANENTE.
- Corrupción policial = CK + BAN 1 MES.
- Acoso OOC (usar IC para OOC) = BAN 3 MESES.
- Amenazas OOC al staff = BAN 2 MESES.
- Propagar toxicidad OOC sobre el servidor = BAN 2 MESES.
- Evasión u omisión de múltiples sanciones = BAN 2 MESES.

GRAVES:
- Insultar al STAFF = BAN 30 días.
- Hacerse pasar por LSPD/EMS = CK admin + BAN 1 día.
- Insultos OOC = BAN 3-5 días.
- Roles de violación (no consentidos) = BAN 14 días.
- MG (Metagaming) = BAN 3-7 días.
- Aceptar dinero de un hacker = CK admin + BAN 14 días.
- Mentir en el reporte = 240 min /jail.
- DM masivo = 240 min /jail.
- Evadir soporte = 270 min /jail.
- VDM masivo = 280 min /jail.

MEDIAS:
- Tirar de cable en rol = 240 min /jail.
- Tirar de cable en reporte = BAN 2 días.
- Sanciones leves de usuarios desconectados = BAN 1 día por sanción.
- Pegar en reporte = 90 min /jail.
- Salirse de rol = 60 min /jail.
- Usar armas de OC sin pertenecer = 60 min /jail.
- Robar vehículos de facciones legales = 120 min /jail.

LEVES:
- DM = 60 min /jail.
- VDM = 60 min /jail.
- PG = 40 min /jail.
- PG masivo = 60 min /jail.
- Evadir el rol = 40 min /jail.
- Meterse en rol ajeno = 40 min /jail.
- Forzar rol = 40 min /jail.
- Abusar Bunny Jump (BJ) = 20 min /jail.
- Robar en zona segura = 40 min /jail.
- Reportar sin motivo (solo molestar) = 40 min /jail.
- Omitir pérdida de memoria del PJ = 40 min /jail.
- Forzar rol agresivo sin motivo = 40 min /jail.
- Forzar rol de tiroteo = 50 min /jail.
- Forzar rol sin motivo a policía = 60 min /jail.
- No tirar de /entorno = 20 min /jail.
- No respetar rol de entorno = 40 min /jail.
- Nula Interpretación de Personaje (IDP) = 60 min /jail.
- No rolear choques ni heridas = 30 min /jail.
- RK (Revenge Kill) = 40 min /jail.
- Abuso de interacciones y animaciones = 50 min /jail.
- Dejar esposado a un usuario = 120 min /jail.
- Falta de fair-play = 60 min /jail.
- Burlarse/pegar/insultar a abatido = 60 min /jail.
- Mal uso /me y /do = 30 min /jail.
- Mal uso /oop /ayuda /anon = 30 min /jail.
- Quedarse AFK en entorno de rol = 40 min /jail.
- Rolear con skin default + ropa default = CK administrativo.

CRITERIO STAFF:
- Hay casos donde el staff puede solo amonestar sin sancionar. Pero si hay reincidencia, la sanción puede aumentar (no ha mejorado conducta).
- Desconexión antes de aplicar jail IC = BAN 8h, 12h o hasta 1 día según gravedad e interpretación del staff.

REGLA OC/MAFIA: el tiempo de jail se DUPLICA si el infractor pertenece a una OC. El BAN no cambia.`;

export const NORMATIVA_ILEGALES = `NORMATIVA ORGANIZACIONES CRIMINALES (MAFIAS Y BANDAS) ORIGENRP — DOCX OFICIAL

GENERAL OC:
- Abusar bugs OC = disolución inmediata, no apelable. Reportar bugs obligatorio.
- Inactividad organización = posible eliminación (con avisos previos).
- Vehículos de pago prohibidos para actos ilegales (solo coches del apartado de organizaciones).
- Vestimenta + entorno OC obligatorios antes/durante cualquier acto delictivo.
- /me y /do obligatorios sin abuso. Mutilaciones y +18 NO consentidos = sanción admin.
- Buen IDP exigido. Jefe es máximo responsable de incumplimientos del grupo.
- Prohibido muros en sedes/casas = housing borrado y pérdida de contenido.
- Bindeos PG = sanción.
- Robo a propia OC ("desertor") = CK ADMIN + BAN 7 DÍAS.
- Falta IDP (máscaras en zonas seguras sin atraco, etc.) = sanción directa.
- Vender info OC a policía = MAL IDP, sancionable.
- Vestimenta + color asignado obligatorios.
- Prohibido usar menú de organización para cachear si vas de paisano.
- PROHIBIDO: No water/no bush/no window/tracer disparos/láser armas/miras externas/kill effect que revele posición.

NIVELES OC: Para subir nivel hay que completar misiones (ver Discord ilegales).

NORMATIVA BANDA:
- Sin alianzas entre bandas (solo tratados de paz).
- Prohibido alianzas para tiroteos, compartir enemistades sin motivo o cooperar en rol ajeno.
- Pueden comercializar con cualquier mafia.
- Vehículos coherentes con interpretación PJ (color asignado).
- Pueden vender armas a civiles SOLO en sus barrios. Prohibido en zona segura. Anunciar venta en chat = sanción admin.
- No se envían entornos dentro de barrios.
- DENTRO ciudad: solo cuchillos y pistolas NO automáticas. Fuera ciudad: armamento de gran calibre permitido.

NORMATIVA MAFIA:
- Sin alianzas entre mafias (solo tratados de paz).
- Prohibido alianzas para tiroteos, compartir enemistades sin motivo o cooperar en rol ajeno.
- Pueden contratar varias bandas para trabajos.
- Vehículos coherentes con interpretación PJ.
- DENTRO ciudad: solo pistolas (cualquier tipo). Fuera ciudad: armamento mayor según nivel.
- Función: proveer armas a bandas. Prohibido vender armas a civiles en ciudad. Solo permitido en el norte.
- Prohibido cualquier estafa en tratos.

ARMAMENTO POR NIVEL:
- BANDAS LVL1: Cuchillos/SNS/9mm/Vintage/MK2. LVL2: +Mini-SMG/TEC. LVL3: +Micro-SMG/AK-recortada.
- MAFIAS LVL1: Cuchillos/SNS/9mm/Vintage/MK2. LVL2: cualquier pistola/Mini-SMG/Micro-SMG/TEC. LVL3: +AK-recortada/AK-47/Francotirador.

PRECIOS ARMAS (mín-máx):
SNS=30k-40k, Vintage=40k-60k, 9mm=55k-76k, Mini-SMG=120k-150k, TEC=140k-180k, Micro-SMG=150k-190k, AK-Recortada=160k-200k, Rifle MK2=340k-400k, Franco=850k-1M.
Saltarse precios = warn organización; gravedad = posible desmantelamiento.

ZONA ROJA / PUNTO CALIENTE:
- Todo lo que abarque el cartel de ZONA ROJA. Prohibido disparar dentro↔fuera.
- Toda OC debe ir con vestimenta de OC. De paisano = sanción.
- Prohibido campear zona roja.
- Prohibido evadir rol y abandonar punto caliente si empezó uno previo.
- Dentro: se puede cachear y robar todo (incluso abatidos), independiente de tiroteos.
- No reportes dentro.
- Si te abaten, no volver al mismo punto durante ~1h. Con pruebas = sanción admin.
- Prohibido usar menú OC para cachear si vas de paisano.
- En zona roja NO hay fair-play (solo dar chance a bajar del vehículo). Sin valoración vida. Solo aplican normas básicas (VDM/PG/RK siguen).
- Excepción fair-play: persona sin arma o con arma blanca frente a alguien con arma de fuego SÍ debe valorar vida.

TIROTEOS ENTRE OC:
- Inicio: tras conflicto con rol previo (rol agresivo o pare tras intento atraco).
- Prohibido implicación de terceras OC durante todo el conflicto.
- Permitido huida si la situación es desfavorable (sin entrar zonas seguras, sedes, barrios). NO aplica en puntos calientes.
- Tras finalizar conflicto: margen para cachear y resguardar heridos. Prohibido implicación de otra OC para iniciar otro tiroteo después.
- Solo permitido cachear AL FINALIZAR.
- Prohibido campear / esperar fin de conflicto OC para iniciar rol agresivo.
- Tras fin tiroteo: permitido secuestrar implicado SOLO para info (no rescate por dinero/items).
- Prohibido disparar a pies por debajo de coches.

CONFLICTO OC:
- Inicio: ajuste de cuentas previo con motivo y rol previo. Ambas OC implicadas con contacto previo.
- Solo entre 2 organizaciones. Prohibido terceras.
- HQ PROHIBIDO (entrar a barrio para tiroteo).
- Una vez iniciado: ambos bandos disparan sin pares ni avisos.
- Dentro o fuera de ciudad. Si es entre mafias o mafia-banda: a las afueras.
- Termina cuando una parte se rinde o pide alto el fuego. Para escalar a guerra: avisar admin.
- Prohibido secuestrar a usuarios del bando contrario durante el conflicto.

POLICÍA Y OC:
- Persecución: sirena = pare oficial.
- OC NO puede buscar enfrentamiento directo con policía. Función OC = evitar/huir/ocultarse. Incumplimiento = sancionable IDP.
- Retención de policía: prohibida si es para forzar rol o forzar retirada policial.
- Toda retención requiere negociación previa obligatoria.
- Policía mantendrá perímetro de seguridad.
- Matar policía secuestrado durante negociación = asesinato con consecuencias IC.

SISTEMA FALTAS INDIVIDUAL (solo personas NUEVAS en sistema ilegal):
- Faltas individuales registradas en Discord ilegales, penalizadas con jails (no warns).
- Cada 3 faltas individuales sin rectificar = warn organización.
- Equipo ilegales decide si es WARN o FALTA según pruebas.
- Faltas se valoran leve/media/grave por equipo de ilegales.
- A miembros antiguos NO se les aplica este sistema, va directo a WARN.

FALTAS LEVES OC: Forzar rol, no usar /entorno, ir enmascarados sin acto delictivo, excederse en robos/secuestros, incumplir normativa server, iniciar roles agresivos sin motivo, PG.

FALTAS MEDIAS OC: No respetar rol entorno, dejar bridas a usuario por diversión, iniciar tiroteo policía sin rol previo, robar al mismo usuario constantemente, F8 en mitad rol/tiroteo, no valorar vida, falta FairPlay, vestimenta Mafia por ciudad / paisano en roles agresivos, matar encima vehículos sin reposicionamiento.

FALTAS GRAVES OC: No respetar rol entorno sedes/barrios, alianzas con otras OC, robar armamento policial (+ BAN permanente), uso programas externos para MG, mutilaciones/+18 no consentidos, faltar respeto staff, ignorar comunicados staff, propagar toxicidad, llevar armas no permitidas por nivel dentro ciudad, mensajes de odio.

CHEATS = BAN PERMANENTE + infracción grave a la organización.

REQUISITOS NIVEL UP:
MAFIA LVL1→LVL2: $5M a Mafia Madre, cupos llenos, 4k Cocaína, 4k Heroína, 4k María, Misión 1, 600 armas búnker, 3 yates exitosos, 6 joyerías, 150 SNS, 120 Vintage, 100 9mm.
MAFIA LVL2→LVL3: $10M a Mafia Madre, cupos llenos, 8k Cocaína, 8k Heroína, 8k María, Misión 1, 1500 armas búnker, 6 yates, 12 joyerías, 2 bancos centrales, 250 SNS, 230 Vintage, 200 9mm, 80 Mini-SMG.
BANDA LVL1→LVL2: $5M a Mafia Madre, cupos llenos, 4k Cocaína, 4k María, Misión 1, lab maxeado, 20 badulaques, 8 fleekas, 4 joyerías, 70 SNS, 60 Vintage, 50 9mm, 30 chalecos.
BANDA LVL2→LVL3: $10M a Mafia Madre, cupos llenos, 8k Cocaína, 8k María, Misión 1, lab maxeado, 40 badulaques, 16 fleekas, 10 joyerías, 180 SNS, 150 Vintage, 120 9mm, 40 chalecos.`;

export const NORMATIVA_FULL = [
  NORMATIVA_GENERAL,
  NORMATIVA_ACTOS_ILICITOS,
  NORMATIVA_SANCIONES_ADMIN,
  NORMATIVA_ILEGALES
].filter(Boolean).join('\n\n');

// Versión condensada (~1400 tokens) para el modelo local (Llama 3.2 1B, ctx 4096).
export const NORMATIVA_LOCAL = `NORMATIVA ORIGENRP — RESUMEN PARA SANCIONES

DEFINICIONES CLAVE:
- MG (Metagaming) = usar info OOC en IC. BAN 3-7 días.
- DM (Deathmatch) = matar sin rol previo. Jail 60 min.
- VDM (Vehicle Deathmatch) = matar con vehículo. Jail 60 min. Masivo: jail 280 min.
- PG (Powergaming) = acciones imposibles en la realidad. Jail 40 min. Masivo: 60 min.
- BJ (Bunny Jump) = abuso de salto repetido. Jail 20 min.
- RK (Revenge Kill) = vengarse ignorando inconsciencia previa. Jail 40 min.
- PK = inconsciencia, pierdes memoria de quién, cómo, dónde y por qué.
- CK = muerte total del personaje, PJ borrado.
- IDP = interpretación del personaje. Nula IDP: jail 60 min.

REGLA OC/MAFIA: Si el infractor pertenece a una organización criminal (OC), el tiempo de JAIL se DUPLICA. El BAN no cambia.

TABLA DE SANCIONES ADMINISTRATIVAS:
BAN PERMANENTE: cheats/hacks, soborno a staff, SPAM de servidores.
BAN 3 MESES: acoso OOC (usar IC para acosar OOC).
BAN 2 MESES: amenazas OOC al staff, toxicidad OOC, evasión múltiple de sanciones.
BAN 1 MES: corrupción policial (+ CK).
BAN 30 días: insultar al STAFF.
BAN 14 días: roles de violación no consentidos; aceptar dinero de hacker (+ CK admin).
BAN 7 días: MG grave.
BAN 3-5 días: insultos OOC.
BAN 3 días: MG leve.
BAN 2 días: tirar de cable en reporte.
BAN 1 día: hacerse pasar por LSPD/EMS (+ CK admin); sanciones leves de usuarios desconectados.
BAN 8-24h: desconexión antes de aplicar jail (según gravedad).
Jail 280 min: VDM masivo.
Jail 270 min: evadir soporte.
Jail 240 min: mentir en reporte; DM masivo; tirar de cable en rol.
Jail 120 min: robar vehículo de facción legal; dejar esposado a usuario.
Jail 90 min: pegar en reporte.
Jail 60 min: salirse de rol; usar armas de OC sin pertenecer; DM; IDP nula; falta fair-play; burlarse/pegar/insultar a abatido; forzar rol a policía sin motivo.
Jail 50 min: forzar rol de tiroteo; abuso de interacciones/animaciones.
Jail 40 min: PG; evadir rol; meterse en rol ajeno; forzar rol; robar en zona segura; reportar sin motivo; omitir pérdida memoria PJ; forzar rol agresivo sin motivo; no respetar entorno; quedarse AFK en entorno de rol.
Jail 30 min: no rolear choques/heridas; mal uso /me /do; mal uso /oop /ayuda /anon.
Jail 20 min: BJ (Bunny Jump); no tirar /entorno.
CK admin: skin/ropa default; hacerse pasar por LSPD/EMS.

PROHIBICIONES CLAVE:
- Disparar a abatir desde coche en movimiento: PROHIBIDO. Solo acompañantes pueden disparar a ruedas.
- Disparar a abatir desde moto: PROHIBIDO. Solo ruedas con moto completamente parada.
- Portar/guardar armamento policial o EMS: BAN 3 MESES.
- Obligar a retirar dinero del banco y transferir: BAN PERMANENTE.
- Robar/matar a trabajador legal (basurero, camionero, etc.) sin motivo: sancionable.
- No usar /entorno antes de acto delictivo: jail 20 min.
- Robar en zona segura: jail 40 min.
- Robo a propia OC ("desertor"): CK ADMIN + BAN 7 DÍAS.
- Civiles sin OC NO pueden portar armas largas/automáticas para actos delictivos.

ARMAMENTO POR NIVEL OC:
- BANDAS LVL1: Cuchillo, SNS, 9mm, Vintage, MK2.
  LVL2: + Mini-SMG, TEC.
  LVL3: + Micro-SMG, AK-recortada.
- MAFIAS LVL1: Cuchillo, SNS, 9mm, Vintage, MK2.
  LVL2: cualquier pistola, Mini-SMG, Micro-SMG, TEC.
  LVL3: + AK-recortada, AK-47, Francotirador.
- DENTRO ciudad: Bandas solo cuchillos y pistolas NO automáticas. Mafias solo pistolas (cualquier tipo).
- FUERA ciudad: armamento mayor según nivel.
- Usar armas de OC sin pertenecer: jail 60 min (x2 si OC).

ZONAS SEGURAS: Comisaría, Hospital, Taller, Garaje, Ayuntamiento/INEM, Negocios, Discotecas, Casino, Concesionario, Armería, Gimnasio. Prohibido actos delictivos. Entrar para evadir rol = evasión de rol (jail 40 min).

ZONA ROJA/PUNTO CALIENTE: Sin fair-play (excepto sin armas vs armas fuego). Se puede cachear abatidos. VDM/PG/RK siguen aplicando.

SANCIONES OC ADICIONALES:
- Alianzas entre OC para tiroteos: prohibido, sancionable.
- Abuso bugs OC: disolución inmediata.
- No llevar vestimenta OC en roles: falta IDP directa.`;

