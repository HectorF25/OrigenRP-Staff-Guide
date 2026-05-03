// Comandos In-Game — referencia rápida del staff.
import { Info, AlertTriangle } from 'lucide-react';
import { COMMANDS_INGAME } from '@/lib/sections-data';

export default function Comandos() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Comandos In-Game</div>
        <div className="pg-sub">Referencia rápida para uso en el servidor</div>
      </div>
      <div className="alert al-c">
        <span className="al-icon"><Info size={14} /></span>
        <span>
          Usa{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", background: 'var(--code-bg)', padding: '1px 5px' }}>
            /administrar
          </code>{' '}
          antes de atender reportes. Registrar jails en TX:{' '}
          <strong>Motivo · Tiempo · Staff · Fecha</strong>.
        </span>
      </div>
      <div className="sec-divider"><span>Tener en cuenta</span></div>
      <div className="alert al-y">
        <span className="al-icon"><AlertTriangle size={14} /></span>
        <span>
          Evitar usar comandos de forma innecesaria o sin contexto claro.
          Siempre explicar al usuario por qué se le aplica un comando, especialmente en sanciones.
        </span>
      </div>
      <div className="cmd-grid">
        {COMMANDS_INGAME.map((c, i) => (
          <div key={i} className={`cmd-card${c.accent ? ` cl-${c.accent}` : ''}`}>
            <div className="cmd-name">{c.name}</div>
            <div className="cmd-desc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
