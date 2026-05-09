export const COMMANDS_INGAME = [
  { name: '/ac (asunto)', desc: 'Chat privado del Staff. Solo el equipo puede verlo.' },
  { name: '/administrar', desc: 'Tu ID se vuelve invisible. Activa modo administrativo.' },
  { name: '/reportes', desc: 'Lista de reportes. Verde = no atendido · Rojo = atendido.' },
  { name: '/jail [id] [min] "Motivo"', desc: 'Jail administrativo. Motivo entre comillas. Registrar en TX del usuario.', accent: 'red' },
  { name: '/unjail (id)', desc: 'Saca de jail. Si estaba mal puesto, eliminar también del TX.' },
  { name: '/Bring (id)', desc: 'Teletransporta al usuario hacia tu posición.' },
  { name: '/Goto (id)', desc: 'Te teletransportas a la posición del usuario.' },
  { name: '/Verinv (id)', desc: 'Ver inventario completo del usuario.' },
  { name: '/Clearinv (id)', desc: 'Borra todo el inventario. Usar con precaución.' },
  { name: '/Revive (id)', desc: 'Revive a un usuario abatido o inconsciente.' },
  { name: '/Heal (id)', desc: 'Llena la salud al máximo.' },
  { name: '/Pedmenu (id)', desc: 'Abre el menú de ropa del usuario.' },
  { name: '/Setdimension (id)', desc: 'Cambia al usuario de dimensión.' },
  { name: '/fgm', desc: 'Abre el panel de FiveGuard (anticheat y monitoreo).' },
  { name: '/dv radio', desc: 'Elimina los vehículos cercanos a tu posición.' },
  { name: '/gc (id)', desc: 'Enviar player a garaje central.' },
  { name: '/ars (id)', desc: 'Enviar player a airsoft.' },
  { name: '/jailof [id] [min] "Motivo"', desc: 'Jail para usuarios fuera del servidor. Id obtenido del !info en Discord (identifier char1). Registrar en TX.', accent: 'red' },
  { name: '/giveitem [id] [item] [cant]', desc: 'Solo Admin Junior en adelante o autorizados.', accent: 'yellow' }
];

export const BOT_TICKETS = [
  { name: '$rename', desc: 'Cambia el nombre del ticket activo.', accent: 'blue' },
  { name: '$add [ID Discord]', desc: 'Añade a alguien al ticket.', accent: 'blue' },
  { name: '$remove [ID Discord]', desc: 'Saca a alguien del ticket.', accent: 'blue' },
  { name: '$delete', desc: 'Borra el ticket. Solo cuando corresponda.', accent: 'red' }
];

export const BOT_GROUPS = [
  {
    title: 'Usuarios & Información', color: 'cyan', icon: 'user',
    cmds: [
      { c: '!info [ID]', d: 'Información completa de un usuario.' },
      { c: '!identifier [char:xxx]', d: 'Identifica Discord por char ID.' },
      { c: '!nombre [ID]', d: 'Ver nombre de un usuario.' },
      { c: '!nombres [ID]', d: 'Ver todos los nombres de un usuario.' },
      { c: '!vinculardiscord [ID]', d: 'Vincular cuenta de Discord.' },
      { c: '!totalusers', d: 'Total de usuarios registrados.' },
      { c: '!compras [ID]', d: 'Ver compras en Tebex.' },
      { c: '!sistema', d: 'Muestra información detallada sobre el sistema.' },
      { c: '!ayuda', d: 'Muestra los comandos disponibles.' }
    ]
  },
  {
    title: 'Notas & Warns', color: 'yellow', icon: 'file-text',
    cmds: [
      { c: '!nota [ID] [texto]', d: 'Agrega nota al perfil de un usuario.' },
      { c: '!notas [ID]', d: 'Ver las últimas 5 notas de un usuario.' },
      { c: '!eliminarnota [ID]', d: 'Elimina una nota específica.' },
      { c: '!warn [ID] [motivo]', d: 'Aplica un warn formal a un usuario.' },
      { c: '!warnstaff [ID] [motivo]', d: 'Warn a un miembro del staff.' }
    ]
  },
  {
    title: 'Sanciones & Bans', color: 'red', icon: 'ban',
    cmds: [
      { c: '!banear [ID] [motivo]', d: 'Banear usuario del Discord.' },
      { c: '!desbanear [ID]', d: 'Desbanear usuario del Discord.' },
      { c: '!checkban [ID]', d: 'Ver motivo del baneo.' },
      { c: '!banserver [ID]', d: 'Ban del servidor de juego.' },
      { c: '!unbanserver [ID]', d: 'Desbanear del servidor de juego.' },
      { c: '!blacklist [ID]', d: 'Agregar usuario a la blacklist.' },
      { c: '!massban', d: 'Banear múltiples usuarios a la vez.' },
      { c: '!apelable', d: 'Verifica si el usuario al que respondiste es apto para apelar.' },
      { c: '!hacker [ID]', d: 'Marcar usuario como hacker.' },
      { c: '!policiacorrupto [ID]', d: 'Marcar policía corrupto.' },
      { c: '!ck [ID]', d: 'Character Kill a un personaje.' },
      { c: '!ckid [char]', d: 'Aplica CK a un personaje por ID.' },
      { c: '!ckinactivos', d: 'Aplicar CK a personajes inactivos.' }
    ]
  },
  {
    title: 'Jail', color: 'orange', icon: 'lock',
    cmds: [
      { c: '!jail [ID] [min] [motivo]', d: 'Enjaular a un usuario.' },
      { c: '!jaileados', d: 'Ver lista de usuarios actualmente enjailiados.' }
    ]
  },
  {
    title: 'Inventario & Armas', color: 'purple', icon: 'package-open',
    cmds: [
      { c: '!verinv [ID]', d: 'Ver inventario de un usuario.' },
      { c: '!verinvid [char]', d: 'Ver inventario por char ID.' },
      { c: '!borrarinventario [ID]', d: 'Borrar el inventario completo.' },
      { c: '!retirararma [ID]', d: 'Retirar arma a un usuario.' },
      { c: '!armasabuse [ID]', d: 'Reportar abuso de armas.' },
      { c: '!buscararmas [ID]', d: 'Buscar armas de un usuario.' },
      { c: '!sospechosoweapon [ID]', d: 'Marcar como sospechoso por arma.' }
    ]
  },
  {
    title: 'Vehículos', color: 'blue', icon: 'car',
    cmds: [
      { c: '!darcar [char] [modelo]', d: 'Da un coche normal a un usuario.' },
      { c: '!darcoche [char] [modelo]', d: 'Da un coche VIP a un usuario.' },
      { c: '!darcochegracioso [char] [modelo]', d: 'Da un coche gracioso.' },
      { c: '!darcocheltd [char] [modelo]', d: 'Da un coche LTD.' },
      { c: '!borrarcoche [matrícula]', d: 'Elimina un coche por matrícula.' },
      { c: '!darnitro [ID]', d: 'Dar nitro a un usuario.' },
      { c: '!darslot [ID]', d: 'Dar slot de vehículo.' },
      { c: '!comprobarmaletero [ID]', d: 'Comprobar contenido del maletero.' },
      { c: '!comprobarguantera [ID]', d: 'Comprobar contenido de la guantera.' },
      { c: '!recuperar_vehiculos [ID]', d: 'Recuperar vehículos de un usuario.' }
    ]
  },
  {
    title: 'Dinero & Economía', color: 'green', icon: 'banknote',
    cmds: [
      { c: '!comprobarmoney [ID]', d: 'Comprobar el dinero de un usuario.' },
      { c: '!comprobarmoney_guantera [ID]', d: 'Comprobar dinero en la guantera.' },
      { c: '!buscardinero [ID]', d: 'Buscar dinero de un usuario.' },
      { c: '!top_dinero', d: 'Ranking de usuarios con más dinero.' }
    ]
  },
  {
    title: 'Horas & XP', color: 'cyan', icon: 'clock',
    cmds: [
      { c: '!horas [ID]', d: 'Ver las horas de un usuario.' },
      { c: '!addhoras [ID] [cantidad]', d: 'Añadir horas a un usuario.' },
      { c: '!sumarhoras [ID] [cantidad]', d: 'Sumar horas a un usuario.' },
      { c: '!comprobarhoras [ID]', d: 'Comprobar horas de un usuario.' },
      { c: '!serverhoras', d: 'Ver horas totales del servidor.' },
      { c: '!topxp', d: 'Ranking de XP.' },
      { c: '!addxp [ID] [cantidad]', d: 'Añadir XP a un usuario.' },
      { c: '!quitarxp [ID] [cantidad]', d: 'Quitar XP a un usuario.' }
    ]
  },
  {
    title: 'Mensualidades', color: 'orange', icon: 'calendar',
    cmds: [
      { c: '!añadir', d: 'Añade una nueva mensualidad.' },
      { c: '!buscar [ID]', d: 'Busca todas las mensualidades de un usuario.' },
      { c: '!listar', d: 'Lista todas las mensualidades.' },
      { c: '!renovar [ID]', d: 'Renueva una mensualidad.' },
      { c: '!eliminar [ID]', d: 'Elimina una mensualidad.' },
      { c: '!hoy', d: 'Mensualidades que vencen hoy.' },
      { c: '!proximas', d: 'Mensualidades que vencerán próximamente.' },
      { c: '!vencidas', d: 'Todas las mensualidades vencidas.' },
      { c: '!todas', d: 'Todas las suscripciones registradas.' },
      { c: '!estadisticas', d: 'Estadísticas de todas las mensualidades.' },
      { c: '!cmensualidades', d: 'Conteo de mensualidades.' },
      { c: '!posponer [ID]', d: 'Pospone los recordatorios de una mensualidad.' },
      { c: '!cambiarfecha [ID]', d: 'Cambia la fecha de una mensualidad.' }
    ]
  },
  {
    title: 'Gangs & Facciones', color: 'purple', icon: 'users',
    cmds: [
      { c: '!miembrosgang [nombre]', d: 'Ver miembros de una gang.' },
      { c: '!miembrosgangid [ID]', d: 'Ver miembros de gang por ID.' },
      { c: '!desempleado [ID]', d: 'Marcar usuario como desempleado.' },
      { c: '!massdesempleado', d: 'Marcar múltiples usuarios como desempleados.' },
      { c: '!enfermos', d: 'Ver lista de usuarios enfermos.' }
    ]
  },
  {
    title: 'Personajes & Recuperación', color: 'gray', icon: 'user-cog',
    cmds: [
      { c: '!reemplazarchar [char] [nuevo]', d: 'Reemplaza un personaje.' },
      { c: '!recuperar_charid [ID]', d: 'Recuperar el char ID de un usuario.' },
      { c: '!recuperar_telefono [ID]', d: 'Recuperar teléfono de un usuario.' },
      { c: '!cambiarnombre [ID] [nombre]', d: 'Cambiar nombre de usuario.' },
      { c: '!consultarstaffs', d: 'Verifica qué licencias no pertenecen a staff activo.' }
    ]
  },
  {
    title: 'Staff & Moderación', color: 'red', icon: 'shield',
    cmds: [
      { c: '!borrar24h [ID]', d: 'El ticket se borra en 24h sin respuesta.' },
      { c: '!borrarticket [ID]', d: 'Borra un ticket directamente.' },
      { c: '!addtoticket [ID]', d: 'Añadir usuario a un ticket.' },
      { c: '!prioridad', d: 'Mueve un canal a la categoría de prioridad.' },
      { c: '!pin', d: 'Fija un mensaje en el canal.' },
      { c: '!clear [cantidad]', d: 'Limpia mensajes del canal.' },
      { c: '!borrardiscord [ID]', d: 'Borra cuenta de Discord vinculada.' },
      { c: '!afkhouse [ID]', d: 'Gestión de casa AFK.' },
      { c: '!picado [ID]', d: 'Acción de picado.' },
      { c: '!evento', d: 'Gestión de eventos del servidor.' },
      { c: '!resetevent', d: 'Resetea el evento activo.' },
      { c: '!votar', d: 'Iniciar votación.' },
      { c: '!nitro [ID]', d: 'Gestión de Nitro.' },
      { c: '!reclamarnitro', d: 'Reclamar recompensa de Nitro.' }
    ]
  }
];

export const TEBEX_CMDS = [
  { c: '!givepeds [ID]', d: 'Dar PEDs a un usuario.' },
  { c: '!removepeds [ID]', d: 'Quitar PEDs de un usuario.' },
  { c: '!borrarped [ID]', d: 'Borra el PED actual del usuario.' },
  { c: '!darped [ID] [PED]', d: 'Asigna un PED al usuario.' },
  { c: '!cambiarped [ID]', d: 'Cambia el PED actual.' },
  { c: '!verpeds [ID]', d: 'Lista los PEDs del usuario.' }
];

export const ITEMS_GROUPS = [
  {
    cat: 'armas', title: 'Armas', color: 'red', icon: 'crosshair',
    items: [
      { id: 'weapon_pistol', name: '9MM', ammo: 'ammo-9' },
      { id: 'weapon_combatpistol', name: 'Combat Pistol', ammo: 'ammo-9' },
      { id: 'weapon_appistol', name: 'AP Pistol', ammo: 'ammo-9' },
      { id: 'weapon_snspistol', name: 'SNS Pistol', ammo: 'ammo-45' },
      { id: 'weapon_vintagepistol', name: 'Vintage Pistol', ammo: 'ammo-9' },
      { id: 'weapon_smg', name: 'SMG', ammo: 'ammo-45' },
      { id: 'weapon_microsmg', name: 'Micro SMG', ammo: 'ammo-45' },
      { id: 'weapon_pumpshotgun', name: 'Escopeta' },
      { id: 'weapon_combatshotgun', name: 'Escopeta de Combate' },
      { id: 'weapon_assaultrifle', name: 'Rifle de Asalto', ammo: 'ammo-rifle' },
      { id: 'weapon_carbinerifle', name: 'Carabina', ammo: 'ammo-rifle' },
      { id: 'weapon_compactrifle', name: 'AK-47', ammo: 'ammo-rifle2' },
      { id: 'weapon_sniperrifle', name: 'Francotirador', ammo: 'ammo-sniper' },
      { id: 'weapon_knife', name: 'Cuchillo' },
      { id: 'weapon_switchblade', name: 'Navaja' },
      { id: 'weapon_bat', name: 'Bate' },
      { id: 'weapon_grenade', name: 'Granada' },
      { id: 'WEAPON_STUNGUN', name: 'Taser' },
      { id: 'WEAPON_MACHINEPISTOL', name: 'Pistola TEC', ammo: 'ammo-45' },
      { id: 'weapon_raypistol', name: 'Atomizadora' },
      { id: 'weapon_pistol_mk2', name: 'Pistola MK2' }
    ]
  },
  {
    cat: 'ammo', title: 'Munición', color: 'orange', icon: 'zap',
    items: [
      { id: 'ammo-9', name: 'Pistola / Combat / AP / Vintage' },
      { id: 'ammo-45', name: 'SMG / Micro SMG / SNS' },
      { id: 'ammo-rifle', name: 'Rifle de Asalto / Carabina' },
      { id: 'ammo-rifle2', name: 'AK-47' },
      { id: 'ammo-sniper', name: 'Francotirador' }
    ]
  },
  {
    cat: 'food', title: 'Comida & Bebida', color: 'green', icon: 'utensils',
    items: [
      { id: 'bread', name: 'Pan' },
      { id: 'water', name: 'Agua' },
      { id: 'burger', name: 'Hamburguesa' },
      { id: 'cola', name: 'Gaseosa' }
    ]
  },
  {
    cat: 'money', title: 'Dinero', color: 'yellow', icon: 'banknote',
    items: [
      { id: 'money', name: 'Dinero Legal' },
      { id: 'black_money', name: 'Dinero Negro' }
    ]
  },
  {
    cat: 'ileg', title: 'Ilegales', color: 'purple', icon: 'flask-conical',
    items: [
      { id: 'poppyresin', name: 'Hojas de Opio' },
      { id: 'hojacoca', name: 'Hoja de Coca' },
      { id: 'cannabis', name: 'Hoja de Marihuana' },
      { id: 'meth_bag', name: 'Metanfetamina' },
      { id: 'heroin', name: 'Bolsa de Heroína' },
      { id: 'cocaine_bag', name: 'Bolsa de Cocaína' },
      { id: 'cocaine', name: 'Cocaína (alternativa)' },
      { id: 'package_weed', name: 'Marihuana Procesada' }
    ]
  },
  {
    cat: 'extra', title: 'Extras', color: 'cyan', icon: 'box',
    items: [
      { id: 'phone', name: 'Teléfono' },
      { id: 'cigarette', name: 'Cigarrillo' },
      { id: 'mechero', name: 'Mechero' },
      { id: 'repair_kit', name: 'Kit de Reparación' },
      { id: 'medikit', name: 'Kit Médico' },
      { id: 'radio', name: 'Radio' },
      { id: 'megaphone', name: 'Megáfono' },
      { id: 'body_bandage', name: 'Vendaje Cuerpo' },
      { id: 'leg_plaster', name: 'Vendaje Pierna' },
      { id: 'arm_wrap', name: 'Vendaje Brazo' },
      { id: 'head_bandage', name: 'Vendaje Cabeza' },
      { id: 'bandage', name: 'Vendaje General' },
      { id: 'tvremote', name: 'Control Remoto' },
      { id: 'business_cad', name: 'Tablet Negocios' },
      { id: 'armour', name: 'Chaleco Antibalas' },
      { id: 'lighting_controller', name: 'Controlador de Iluminación' },
      { id: 'ilegalcad', name: 'Cad Ilegal' }
    ]
  }
];

export const ITEM_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'armas', label: 'Armas' },
  { key: 'ammo', label: 'Munición' },
  { key: 'food', label: 'Comida' },
  { key: 'money', label: 'Dinero' },
  { key: 'ileg', label: 'Ilegales' },
  { key: 'extra', label: 'Extras' }
];

export const SANCIONES_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'per', label: 'Permanentes' },
  { key: 'gra', label: 'Graves' },
  { key: 'med', label: 'Medias' },
  { key: 'lev', label: 'Leves' }
];

export const SANCIONES_GROUPS = [
  {
    key: 'per', title: 'Permanentes / Muy graves', color: 'red', icon: 'ban', pillClass: 'pr',
    rows: [
      ['Uso de cheats o programas externos', 'Ban permanente'],
      ['Intento de soborno a un staff', 'Ban permanente'],
      ['Corrupción policial', 'CK + Ban 1 mes'],
      ['Acoso OOC (usar IC para OOC)', 'Ban 3 meses'],
      ['Amenazas OOC al staff', 'Ban 2 meses'],
      ['Propagar toxicidad OOC', 'Ban 2 meses'],
      ['Evasión/omisión múltiples sanciones', 'Ban 2 meses']
    ]
  },
  {
    key: 'gra', title: 'Graves', color: 'orange', icon: 'alert-triangle', pillClass: 'po',
    rows: [
      ['Insultar al staff', 'Ban 30 días'],
      ['Hacerse pasar por LSPD/EMS', 'CK admin + Ban 1 día'],
      ['Insultos OOC', 'Ban 3-5 días'],
      ['Roles de violación (no consentidos)', 'Ban 14 días'],
      ['MG (Metagaming)', 'Ban 3-7 días'],
      ['Aceptar dinero de un hacker', 'CK admin + Ban 14 días'],
      ['Mentir en el reporte', '240 min jail'],
      ['DM masivo', '240 min jail'],
      ['Evadir soporte', '270 min jail'],
      ['VDM masivo', '280 min jail']
    ]
  },
  {
    key: 'med', title: 'Medias', color: 'yellow', icon: 'minus-circle', pillClass: 'py',
    rows: [
      ['Tirar de cable en rol', '120 min jail'],
      ['Tirar de cable en reporte', 'Ban 2 días'],
      ['Sanciones leves — usuario desconectado', 'Ban 1 día/sanción'],
      ['Pegar en reporte', '90 min jail'],
      ['Salirse de rol', '60 min jail'],
      ['Usar armas de OC sin pertenecer', '60 min jail'],
      ['Robar vehículos de facciones legales', '120 min jail']
    ]
  },
  {
    key: 'lev', title: 'Leves', color: 'green', icon: 'circle-dot', pillClass: 'pg',
    rows: [
      ['DM / VDM / RDM', '60 min'],
      ['PG', '40 min'],
      ['PG masivo', '60 min'],
      ['Evadir el rol', '40 min'],
      ['Meterse en rol ajeno', '40 min'],
      ['Forzar rol', '40 min'],
      ['Bunny Jump (BJ)', '20 min'],
      ['Robar en zona segura', '40 min'],
      ['No valorar la vida', '50 min'],
      ['No tirar /entorno', '20 min'],
      ['No respetar rol de entorno', '40 min'],
      ['Nula IDP', '60 min'],
      ['No rolear choques ni heridas', '30 min'],
      ['RK (Revenge Kill)', '30 min'],
      ['Abuso interacciones/animaciones', '50 min'],
      ['Dejar esposado a un usuario', '30 min'],
      ['Falta de fair-play', '50 min'],
      ['Burlarse/insultar a usuario abatido', '40 min'],
      ['Mal uso /me y /do', '5 min'],
      ['Mal uso /oop /ayuda /anon', '30 min'],
      ['Hablar mientras estás muerto', '15 min'],
      ['AFK en entorno de rol', '40 min'],
      ['Rolear con skin/ropa default', 'Warn + CK admin']
    ]
  }
];

// Tabla completa de jails con x2 para OC. El Ban NO cambia nunca.
export const OC_DOUBLE_TABLE = [
  ['Tirar de cable en rol',            '120 min', '240 min', 'py'],
  ['Usar armas de OC sin pertenecer',  ' 60 min', '120 min', 'py'],
  ['Pegar en reporte',                 ' 90 min', '180 min', 'py'],
  ['Salirse de rol',                   ' 60 min', '120 min', 'py'],
  ['Robar vehículos de facciones legales', '120 min', '240 min', 'py'],
  ['DM / VDM / RDM',                   ' 60 min', '120 min', 'pg'],
  ['PG',                               ' 40 min', ' 80 min', 'pg'],
  ['PG masivo',                        ' 60 min', '120 min', 'pg'],
  ['Evadir el rol',                    ' 40 min', ' 80 min', 'pg'],
  ['Meterse en rol ajeno',             ' 40 min', ' 80 min', 'pg'],
  ['Forzar rol',                       ' 40 min', ' 80 min', 'pg'],
  ['Forzar rol agresivo sin motivo',   ' 40 min', ' 80 min', 'pg'],
  ['Forzar rol de tiroteo',            ' 50 min', '100 min', 'pg'],
  ['Forzar rol sin motivo a policía',  ' 60 min', '120 min', 'pg'],
  ['Bunny Jump (BJ)',                  ' 20 min', ' 40 min', 'pg'],
  ['Robar en zona segura',             ' 40 min', ' 80 min', 'pg'],
  ['No valorar la vida',               ' 50 min', '100 min', 'pg'],
  ['No tirar /entorno',                ' 20 min', ' 40 min', 'pg'],
  ['No respetar rol de entorno',       ' 40 min', ' 80 min', 'pg'],
  ['Nula IDP',                         ' 60 min', '120 min', 'pg'],
  ['No rolear choques ni heridas',     ' 30 min', ' 60 min', 'pg'],
  ['RK (Revenge Kill)',                ' 40 min', ' 80 min', 'pg'],
  ['Abuso interacciones/animaciones',  ' 50 min', '100 min', 'pg'],
  ['Dejar esposado a un usuario',      '120 min', '240 min', 'pg'],
  ['Falta de fair-play',               ' 60 min', '120 min', 'pg'],
  ['Burlarse/insultar a abatido',      ' 60 min', '120 min', 'pg'],
  ['Omitir pérdida de memoria del PJ', ' 40 min', ' 80 min', 'pg'],
  ['Reportar sin motivo',              ' 40 min', ' 80 min', 'pg'],
  ['Mal uso /me y /do',                ' 30 min', ' 60 min', 'pg'],
  ['Mal uso /oop /ayuda /anon',        ' 30 min', ' 60 min', 'pg'],
  ['Hablar mientras estás muerto',     ' 15 min', ' 30 min', 'pg'],
  ['AFK en entorno de rol',            ' 40 min', ' 80 min', 'pg'],
];

export const OC_FALTAS_GROUPS = [
  {
    key: 'lev', label: 'Faltas leves', color: 'green', pillClass: 'pg',
    items: [
      'Forzar rol.',
      'No usar el /entorno en actos delictivos.',
      'Ir enmascarados cuando no están cometiendo actos delictivos.',
      'Excederse en los robos y secuestros permitidos.',
      'Incumplimiento de la normativa del servidor.',
      'Iniciar roles agresivos sin motivo dentro o fuera de la ciudad.',
      'PG (Powergaming).',
    ]
  },
  {
    key: 'med', label: 'Faltas medias', color: 'yellow', pillClass: 'py',
    items: [
      'No respetar el rol de entorno.',
      'Dejar con las bridas puestas a un usuario por diversión.',
      'Iniciar tiroteo con la policía sin rol previo.',
      'Robar al mismo usuario constantemente.',
      'Tirar de F8 en mitad de un rol o tiroteo.',
      'No valorar la vida.',
      'Falta de FairPlay.',
      'Vestir con vestimenta de mafia por ciudad / Vestir de paisano en roles agresivos (bandas).',
      'Matar encima de vehículos sin que sea por reposicionamiento.',
    ]
  },
  {
    key: 'gra', label: 'Faltas graves', color: 'red', pillClass: 'pr',
    items: [
      'No respetar el rol de entorno de las sedes y barrios.',
      'Formar alianzas con otras organizaciones criminales.',
      'Robar armamento policial — conlleva además BAN permanente del usuario.',
      'Uso de programas externos para MG.',
      'Realizar mutilaciones o roles +18 no consentidos.',
      'Faltar el respeto al equipo de staff.',
      'Ignorar comunicados del staff.',
      'Propagar toxicidad sobre el servidor y el staff.',
      'Llevar armas de gran calibre o no permitidas por nivel dentro de ciudad.',
      'Mensajes de odio a otros usuarios.',
    ]
  }
];

export const OC_SANCIONES_TABLE = [
  // [descripción, sanción]
  ['Forzar rol agresivo',                               'Jail 180 min'],
  ['No usar /entorno',                                  'Jail 120 min'],
  ['Excederse en robos/secuestros',                     'Jail 120 min'],
  ['Incumplimiento de normativa',                       'Jail 180 min'],
  ['Iniciar roles agresivos sin motivo',                'Jail 240 min'],
  ['PG en rol con LSPD',                                'Jail 120 min'],
  ['No respetar rol de entorno',                        'Jail 180 min'],
  ['Dejar con bridas por diversión',                    'Jail 120 min'],
  ['Iniciar tiroteo con policía sin rol previo',        'Jail 180 min'],
  ['Tirar F8 en mitad de rol/tiroteo',                  'Jail 360 min'],
  ['No valorar la vida',                                'Jail 180 min'],
  ['Falta de FairPlay',                                 'Jail 180 min'],
  ['Falta IDP en vehículos',                            'Jail 180 min'],
  ['Vestirse de paisano en roles agresivos',            'Jail 180 min'],
  ['Matar encima de vehículos sin reposicionamiento',   'Jail 360 min'],
  ['No respetar entorno de sedes/barrios',              'Jail 240 min'],
  ['Alianzas con otras OC',                             'Jail 240 min'],
  ['Cachear en zona segura',                            'Jail 180 min'],
  ['Robar armamento policial',                          'Jail 240 min'],
  ['Uso de programas externos (MG)',                    'Jail 180 min'],
  ['Mutilaciones/roles +18 no consentidos',             'Jail 240 min'],
  ['Faltar el respeto al staff',                        'Ban 10 días'],
  ['Ignorar comunicados del staff',                     'Jail 240 min'],
  ['Ignorar órdenes del staff',                         'Ban hasta obedecer'],
  ['Propagar toxicidad',                                'Ban 2 días'],
  ['Armas no permitidas por nivel dentro de ciudad',    'Jail 360 min'],
  ['Mensajes de odio a usuarios',                       'Jail 180 min'],
  ['Entrar a sede ajena sin negociar',                  'Jail 300 min'],
  ['Campear zona roja o sedes',                         'Jail 240 min'],
];

export const ZONA_DOMINACION = [
  'La Zona de Dominación es un área especial en el mapa donde las OC pueden disputar el control territorial.',
  'Solo pueden participar organizaciones con nivel 2 o superior.',
  'El enfrentamiento se activa en días y horas establecidos por la administración.',
  'No se requiere rol previo — el área es zona de conflicto activo durante el evento.',
  'Se permiten todas las armas habilitadas para el nivel de la OC.',
  'La OC dominante obtiene beneficios económicos y de reputación mientras mantenga el control.',
  'Prohibido campear o defender el punto fuera del horario oficial del evento.',
  'Las normas de No Water / No Bush siguen aplicando dentro de la Zona de Dominación.',
  'No se pueden tirar reportes dentro de la Zona de Dominación durante el evento activo.',
  'Tras ser abatido, el tiempo de espera para volver es de ~1 hora (igual que zona roja).',
];

export const ROBOS_ESTABLECIMIENTOS = [
  {
    title: 'Badulaque / Licorería', color: 'green', icon: 'shopping-bag',
    stats: [
      ['Atracadores', 'Máx 2'],
      ['Armas', 'Cuchillo / Pistola'],
      ['LSPD mínimo', '2'],
      ['Rehenes', 'Máx 2'],
      ['Límite', '5 / día por OC']
    ]
  },
  {
    title: 'Joyería — Solo bandas / pandillas', color: 'blue', icon: 'gem',
    stats: [
      ['Atracadores', '4-5 (mín 4 dentro)'],
      ['Armas', 'Pistola + 2 auto (×5)'],
      ['LSPD mínimo', '7'],
      ['Rehenes', 'Máx 4'],
      ['Límite', '3 / semana']
    ]
  },
  {
    title: 'Fleekas (Bancos)', color: 'yellow', icon: 'vault',
    stats: [
      ['Atracadores', '3-4 (mín 3 dentro)'],
      ['Armas', 'Pistola'],
      ['LSPD mínimo', '5'],
      ['Rehenes', 'Máx 3'],
      ['Límite', '1 / día por OC']
    ]
  },
  {
    title: 'Yate', color: 'cyan', icon: 'anchor',
    stats: [
      ['Atracadores', '6-7'],
      ['Armas', 'AP mín + subfusiles'],
      ['LSPD mínimo', '10'],
      ['Rehenes', 'Sin rehenes'],
      ['Límite', '1 / semana']
    ]
  },
  {
    title: 'Banco Central — Solo OC', color: 'red', icon: 'landmark',
    stats: [
      ['Atracadores', 'Mín 12'],
      ['Armas', 'Todo tipo'],
      ['LSPD mínimo', '16 (siempre +2)'],
      ['Rehenes', 'Máx 6'],
      ['Límite', '1 cada 2 semanas']
    ],
    note: '1 francotirador máx · 2 helicópteros en llegada (no en huida) · solo coches de huida · solicitar por ticket.'
  }
];

export const ROBOS_PERSONAS = [
  ['Civil en ciudad', '4 en servicio', 'Cuchillo o pistola · No DNI / comida / bebida', 'pg'],
  ['Policía en ciudad', '12 en servicio', 'Pistola o más calibre · Solo secuestro', 'po'],
  ['Civil fuera de ciudad', '8 en servicio', 'Todo tipo · No DNI / comida / bebida', 'pg'],
  ['Sheriff fuera de ciudad', '18 en servicio', 'Pistola o más calibre · Solo secuestro', 'po']
];

export const NIVEL_ARMAS = [
  ['Lvl 1', 'Cuchillos / SNS / 9mm / Vintage / MK2', 'Cuchillos / SNS / 9mm / Vintage / MK2', 'pg'],
  ['Lvl 2', 'Anterior + Mini-SMG / TEC', 'Cualquier pistola / Mini-SMG / Micro / TEC', 'py'],
  ['Lvl 3', 'Anterior + Micro-SMG / AK-recortada', 'Anterior + AK-recortada / AK-47 / Franco', 'po']
];

export const PRECIOS_ARMAS = [
  ['SNS', '$30.000', '$40.000'],
  ['Vintage', '$40.000', '$60.000'],
  ['9mm', '$55.000', '$76.000'],
  ['Mini SMG', '$120.000', '$150.000'],
  ['TEC', '$140.000', '$180.000'],
  ['Micro', '$150.000', '$190.000'],
  ['AK Recortada', '$160.000', '$200.000'],
  ['Rifle MK2', '$340.000', '$400.000'],
  ['Francotirador', '$850.000', '$1.000.000']
];

export const QUICK_CHIPS = [
  { label: 'AK dentro de ciudad', q: 'Un jugador de una banda usa un AK-47 dentro de ciudad para robar a un civil' },
  { label: 'Desconexión antes de jail', q: 'Un jugador se desconecta justo cuando el staff iba a meterle jail' },
  { label: 'Alianza entre bandas', q: 'Dos bandas se alían para ir juntas a un tiroteo contra otra OC' },
  { label: 'Mafia vende a civil', q: 'Un miembro de mafia vende armas a un civil en la ciudad' },
  { label: 'Volver a zona roja', q: 'Un jugador vuelve a zona roja en menos de 1 hora tras ser abatido allí' },
  { label: 'OC vestido de paisano', q: 'Un miembro de OC va a zona roja vestido de paisano' },
  { label: 'Banda vs policía', q: 'Una banda busca activamente a la policía para pelear' },
  { label: 'Disparar desde coche', q: 'Un atracador dispara a abatir desde dentro del coche en movimiento' }
];
