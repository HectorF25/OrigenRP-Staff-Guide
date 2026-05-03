'use client';

// Bot & Tickets — comandos de Discord/bot/Tebex con buscador.
import { useState } from 'react';
import { Search, Ticket } from 'lucide-react';
import { BOT_TICKETS, BOT_GROUPS, TEBEX_CMDS } from '@/lib/sections-data';
import Lucide from '@/app/components/Lucide';

export default function BotTickets() {
  const [q, setQ] = useState('');
  const ql = q.toLowerCase().trim();

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Bot & Tickets</div>
        <div className="pg-sub">Comandos de Discord, bot y Tebex</div>
      </div>

      <div className="sec-lbl" style={{ color: 'var(--blue)' }}>
        <Ticket size={13} />Tickets Discord
      </div>
      <div className="cmd-grid" style={{ marginBottom: 18 }}>
        {BOT_TICKETS.map((c, i) => (
          <div key={i} className={`cmd-card cl-${c.accent}`}>
            <div className="cmd-name">{c.name}</div>
            <div className="cmd-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="sec-divider"><span>Bot Discord</span></div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text3)', width: 13, height: 13, pointerEvents: 'none'
        }} />
        <input
          type="text"
          placeholder="Buscar comando..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
            padding: '8px 12px 8px 30px', color: 'var(--text)', fontFamily: 'Barlow, sans-serif',
            fontSize: 12.5, outline: 'none'
          }}
        />
      </div>

      {BOT_GROUPS.map((g, gi) => {
        const filtered = g.cmds.filter(cmd =>
          !ql || cmd.c.toLowerCase().includes(ql) || cmd.d.toLowerCase().includes(ql)
        );
        if (filtered.length === 0) return null;
        return (
          <div key={gi}>
            <div className="sec-lbl" style={{ color: `var(--${g.color})`, marginTop: 4 }}>
              <Lucide name={g.icon} />{g.title}
            </div>
            <div className="card" style={{ marginBottom: 10 }}>
              <table className="itbl"><tbody>
                {filtered.map((cmd, ci) => (
                  <tr key={ci}><td>{cmd.c}</td><td>{cmd.d}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        );
      })}

      <div className="sec-divider"><span>Exclusivo Tebex</span></div>
      <div className="cmd-grid">
        {TEBEX_CMDS.map((c, i) => (
          <div key={i} className="cmd-card cl-orange">
            <div className="cmd-name">{c.c}</div>
            <div className="cmd-desc">{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
