'use client';

import { useState } from 'react';
import { Sun, Moon, Search, Menu, LogOut } from 'lucide-react';
import { PAGES } from '@/lib/data';

export default function Topbar({ page, user, theme, onToggleTheme, onToggleSidebar, onJumpConcept }) {
  const p = PAGES[page] || { t: '', s: '' };
  const [q, setQ] = useState('');

  function onSearch(e) {
    const v = e.target.value;
    setQ(v);
    if (v.trim()) {
      onJumpConcept();
      window.dispatchEvent(new CustomEvent('orp-search', { detail: v }));
    }
  }

  return (
    <div className="topbar">
      <button className="hamburger" onClick={onToggleSidebar} aria-label="Menú">
        <Menu size={18} />
      </button>
      <div className="tb-label">
        <div className="tb-title">{p.t}</div>
        <div className="tb-sub">{p.s}</div>
      </div>
      <button className="theme-btn" onClick={onToggleTheme} title="Cambiar tema">
        {theme === 'light'
          ? <Moon className="lucide-moon" size={15} />
          : <Sun className="lucide-sun" size={15} />}
      </button>
      <div className="tb-srch-wrap">
        <Search />
        <input className="tb-search" type="text" placeholder="Buscar concepto..." value={q} onChange={onSearch} />
      </div>
      <div className="user-pill">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="user-avatar" alt="" src={user.avatar} />
        <div className="user-meta">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.role || 'Staff'}</span>
        </div>
      </div>
      <a className="logout-btn" href="/api/auth/logout" title="Cerrar sesión">
        <LogOut size={15} />
      </a>
    </div>
  );
}
