import {
  Sparkles, Terminal, Bot, PackageOpen, Scale, Users, Building2,
  Landmark, Shield, BookOpen, Target, Layers, FileText, Activity, Cctv, Gavel, BarChart2, Search, LayoutDashboard, Gift, Swords, Flame, ClipboardList
} from 'lucide-react';
import { SERVER_ICON } from '@/lib/constants';

const SUPERVISOR_ALLOWED_ROLE = '1484372153108533308';
const SUPERVISOR_ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019', '1484372153108533308']);
const ILEGALES_ALLOWED_IDS  = new Set(['343822757911330817', '752975491228500019', '1484372153108533308']);
const ILEGALES_ALLOWED_ROLE = '1487429315992879114';
const COORD_IDS             = new Set(['343822757911330817', '752975491228500019', '1484372153108533308']);
const ILEGALES_ADMIN_IDS    = new Set([
  '659812927636897810','752057219058630676','713393949624107058','343822757911330817',
  '748287186239094936','1310021491827408976','1395195029747929089','1032794430232592394',
  '1217206517443461151','924496259530756117','704379432348942549','1233393359578468376',
  '1176005329524379779','934932063977607241','761145782728261643','1171541693569454080',
  '1105956450414633020','914490855459532861','517422162647449602','752975491228500019',
  '740030258740330576','426166856118697997','1479936578368438283','845589598016765952',
  '979514530721845328',
]);

function canSeeReportes(user) {
  if (!user) return false;
  if (ILEGALES_ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ILEGALES_ALLOWED_ROLE);
}

function canSeeGiveItemMonitor(user) {
  if (!user) return false;
  if (SUPERVISOR_ALLOWED_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(SUPERVISOR_ALLOWED_ROLE);
}

function canSeeReporteJugador(user) {
  return !!user && COORD_IDS.has(user.id);
}

function canSeeDashboardAdmin(user) {
  if (!user) return false;
  if (ILEGALES_ADMIN_IDS.has(user.id)) return true;
  return Array.isArray(user.roles) && user.roles.includes(ILEGALES_ALLOWED_ROLE);
}

const BASE_GROUPS = [
  { title: 'Inteligencia', items: [{ i: 0,  icon: Sparkles,    label: 'Consultor IA' }] },
  { title: 'Comandos',     items: [
    { i: 1,  icon: Terminal,    label: 'In-Game' },
    { i: 2,  icon: Bot,         label: 'Bot & Tickets' },
    { i: 3,  icon: PackageOpen, label: 'Items & Armas' }
  ] },
  { title: 'Normativa',    items: [
    { i: 4,  icon: Scale,       label: 'Sanciones' },
    { i: 5,  icon: Building2,   label: 'Ilegales' },
    { i: 14, icon: Gavel,       label: 'Sanciones Ilegales' },
    { i: 20, icon: Flame,       label: 'Puntos Calientes' },
    { i: 6,  icon: Landmark,    label: 'Robos' },
    { i: 7,  icon: Shield,      label: 'Norma Staff' },
    { i: 11, icon: FileText,    label: 'Normativa Completa' }
  ] },
  { title: 'Estudio',      items: [
    { i: 8,  icon: BookOpen,    label: 'Conceptos RP' },
    { i: 9,  icon: Target,      label: 'Casos Prácticos' },
    { i: 10, icon: Layers,      label: 'Flashcards' }
  ] },
  { title: 'Servidor',     items: [
    { i: 12, icon: Activity,    label: 'Logs' },
    { i: 13, icon: Cctv,        label: 'Monitor' },
  ] }
];

export default function Sidebar({ page, onPick, open, user }) {
  const ilegalesItems = [];
  if (canSeeDashboardAdmin(user))  ilegalesItems.push({ i: 17, icon: LayoutDashboard, label: 'Mi Dashboard'       });
  if (canSeeReportes(user))        ilegalesItems.push({ i: 15, icon: BarChart2,       label: 'Reportes Ilegales' });
  if (canSeeReportes(user))        ilegalesItems.push({ i: 21, icon: ClipboardList,   label: 'Reportes Generales' });
  if (canSeeReporteJugador(user))  ilegalesItems.push({ i: 16, icon: Search,          label: 'Reporte Jugador'   });
  if (canSeeGiveItemMonitor(user)) ilegalesItems.push({ i: 18, icon: Gift,            label: 'GiveItem Monitor'  });
  if (canSeeGiveItemMonitor(user)) ilegalesItems.push({ i: 19, icon: Swords,          label: 'Organizaciones'    });

  const navGroups = ilegalesItems.length > 0
    ? [...BASE_GROUPS, { title: 'Ilegales', items: ilegalesItems }]
    : BASE_GROUPS;
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sb-head">
        <div className="sb-logo-row">
          <div className="sb-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${SERVER_ICON}?size=80`} alt="OrigenRP" />
          </div>
          <div>
            <div className="sb-title">OrigenRP</div>
            <div className="sb-sub">Panel de Staff</div>
          </div>
        </div>
        <div className="sb-status">
          <div className="sb-dot" />
          Staff activo
        </div>
      </div>
      <nav className="nav">
        {navGroups.map((g, gi) => (
          <div key={gi}>
            <div className="nav-section">{g.title}</div>
            {g.items.map(it => {
              const Icon = it.icon;
              return (
                <button
                  key={it.i}
                  className={`nav-btn${page === it.i ? ' active' : ''}`}
                  onClick={() => onPick(it.i)}
                >
                  <Icon size={14} />
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
