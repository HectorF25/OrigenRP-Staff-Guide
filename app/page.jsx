'use client';

import { useEffect, useState } from 'react';

import { useAuth } from './hooks/useAuth';
import AuthGate from './components/AuthGate';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import ConsultorIA from './sections/ConsultorIA';
import Comandos from './sections/Comandos';
import BotTickets from './sections/BotTickets';
import ItemsArmas from './sections/ItemsArmas';
import Sanciones from './sections/Sanciones';
import Ilegales from './sections/Ilegales';
import Robos from './sections/Robos';
import NormaStaff from './sections/NormaStaff';
import Conceptos from './sections/Conceptos';
import Casos from './sections/Casos';
import Flashcards from './sections/Flashcards';
import NormativaCompleta from './sections/NormativaCompleta';
import LogsMonitor from './sections/LogsMonitor';
import Monitor from './sections/Monitor';
import SancionesIlegales from './sections/SancionesIlegales';
import ReportesIlegales from './sections/ReportesIlegales';
import ReporteJugador from './sections/ReporteJugador';
import DashboardAdmin from './sections/DashboardAdmin';
import GiveItemMonitor from './sections/GiveItemMonitor';
import Organizaciones from './sections/Organizaciones';
import PuntosCalientes from './sections/PuntosCalientes';
import ReportesGenerales from './sections/ReportesGenerales';
import MaleterosBug from './sections/MaleterosBug';

const SECTIONS = [
  ConsultorIA,
  Comandos,
  BotTickets,
  ItemsArmas,
  Sanciones,
  Ilegales,
  Robos,
  NormaStaff,
  Conceptos,
  Casos,
  Flashcards,
  NormativaCompleta,
  LogsMonitor,
  Monitor,
  SancionesIlegales,
  ReportesIlegales,
  ReporteJugador,
  DashboardAdmin,
  GiveItemMonitor,
  Organizaciones,
  PuntosCalientes,
  ReportesGenerales,
  MaleterosBug,
];

export default function Page() {
  const { authReady, user, gateError, expireSession } = useAuth();
  const [page, setPage] = useState(0);
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('theme') || 'light';
      setTheme(t);
      document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  }

  if (!authReady) return null;
  if (!user) return <AuthGate error={gateError} />;

  const Active = SECTIONS[page] || ConsultorIA;
  const sectionProps =
    Active === ConsultorIA      ? { onSessionExpired: expireSession } :
    Active === ReportesIlegales ? { user } :
    Active === ReporteJugador   ? { user } :
    Active === DashboardAdmin   ? { user } :
    Active === GiveItemMonitor   ? { user } :
    Active === Organizaciones    ? { user } :
    Active === ReportesGenerales ? { user } :
    Active === MaleterosBug      ? { user } :
    {};

  return (
    <>
      <div className={`overlay${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        page={page}
        open={sidebarOpen}
        user={user}
        onPick={(i) => { setPage(i); setSidebarOpen(false); window.scrollTo(0, 0); }}
      />
      <div className="main">
        <Topbar
          page={page}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onJumpConcept={() => setPage(9)}
        />
        <div className="content">
          <Active {...sectionProps} />
        </div>
      </div>
    </>
  );
}
