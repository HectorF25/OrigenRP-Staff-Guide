'use client';

// Panel principal — orquesta auth, sidebar, topbar y sección activa.
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
import OcMafias from './sections/OcMafias';
import Ilegales from './sections/Ilegales';
import Robos from './sections/Robos';
import NormaStaff from './sections/NormaStaff';
import Conceptos from './sections/Conceptos';
import Casos from './sections/Casos';
import Flashcards from './sections/Flashcards';
import NormativaCompleta from './sections/NormativaCompleta';
import Logs from './sections/Logs';

// Mapa índice → componente. Si en el futuro reordenas el sidebar, ajustar aquí + en Sidebar.jsx.
const SECTIONS = [
  ConsultorIA,        // 0
  Comandos,           // 1
  BotTickets,         // 2
  ItemsArmas,         // 3
  Sanciones,          // 4
  OcMafias,           // 5
  Ilegales,           // 6
  Robos,              // 7
  NormaStaff,         // 8
  Conceptos,          // 9
  Casos,              // 10
  Flashcards,         // 11
  NormativaCompleta,  // 12
  Logs                // 13
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
  // ConsultorIA es la única sección que reacciona a 401 → expira sesión.
  const sectionProps = Active === ConsultorIA ? { onSessionExpired: expireSession } : {};

  return (
    <>
      <div className={`overlay${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        page={page}
        open={sidebarOpen}
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
