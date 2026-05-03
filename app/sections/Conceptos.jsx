'use client';

// Conceptos RP — términos clave que todo staff debe dominar. Buscador local + global.
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CONCEPTOS } from '@/lib/data';

export default function Conceptos() {
  const [q, setQ] = useState('');

  // Sincroniza con el buscador global de la topbar (orp-search custom event).
  useEffect(() => {
    function onSearch(e) { setQ(e.detail || ''); }
    window.addEventListener('orp-search', onSearch);
    return () => window.removeEventListener('orp-search', onSearch);
  }, []);

  const ql = q.toLowerCase();
  const list = useMemo(
    () => CONCEPTOS.filter(c => c.term.toLowerCase().includes(ql) || c.def.toLowerCase().includes(ql)),
    [ql]
  );

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Conceptos de Roleplay</div>
        <div className="pg-sub">Términos clave que todo staff debe dominar</div>
      </div>
      <div className="concept-search-wrap">
        <Search />
        <input
          className="concept-search"
          type="text"
          placeholder="Buscar término..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div>
        {list.map((c, i) => (
          <div key={i} className="con-card">
            <div className="con-top">
              <span className="con-term">{c.term}</span>
              {c.sancion !== 'N/A' && <span className="pill pr">{c.sancion}</span>}
            </div>
            <div className="con-def">{c.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
