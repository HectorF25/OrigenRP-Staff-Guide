import {
  Sparkles, Terminal, Bot, PackageOpen, Scale, Users, Building2,
  Landmark, Shield, BookOpen, Target, Layers, FileText, Activity
} from 'lucide-react';
import { SERVER_ICON } from '@/lib/constants';

const NAV_GROUPS = [
  { title: 'Inteligencia', items: [{ i: 0,  icon: Sparkles,    label: 'Consultor IA' }] },
  { title: 'Comandos',     items: [
    { i: 1,  icon: Terminal,    label: 'In-Game' },
    { i: 2,  icon: Bot,         label: 'Bot & Tickets' },
    { i: 3,  icon: PackageOpen, label: 'Items & Armas' }
  ] },
  { title: 'Normativa',    items: [
    { i: 4,  icon: Scale,       label: 'Sanciones' },
    { i: 5,  icon: Users,       label: 'OC / Mafias ×2' },
    { i: 6,  icon: Building2,   label: 'Ilegales' },
    { i: 7,  icon: Landmark,    label: 'Robos' },
    { i: 8,  icon: Shield,      label: 'Norma Staff' },
    { i: 12, icon: FileText,    label: 'Normativa Completa' }
  ] },
  { title: 'Estudio',      items: [
    { i: 9,  icon: BookOpen,    label: 'Conceptos RP' },
    { i: 10, icon: Target,      label: 'Casos Prácticos' },
    { i: 11, icon: Layers,      label: 'Flashcards' }
  ] },
  { title: 'Servidor',     items: [
    { i: 13, icon: Activity,    label: 'Logs' }
  ] }
];

export default function Sidebar({ page, onPick, open }) {
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
        {NAV_GROUPS.map((g, gi) => (
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
