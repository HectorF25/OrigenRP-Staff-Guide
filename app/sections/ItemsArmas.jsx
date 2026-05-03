'use client';

import { useState } from 'react';
import { ITEMS_GROUPS, ITEM_FILTERS } from '@/lib/sections-data';
import Lucide from '@/app/components/Lucide';

export default function ItemsArmas() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Items & Armas</div>
        <div className="pg-sub">Nombres exactos para usar con /giveitem</div>
      </div>
      <div className="filters">
        {ITEM_FILTERS.map(f => (
          <button
            key={f.key}
            className={`fbtn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {ITEMS_GROUPS.map((g, gi) => {
        if (filter !== 'all' && filter !== g.cat) return null;
        return (
          <div key={gi} className="card" style={gi > 0 ? { marginTop: 8 } : {}}>
            <div className="sec-lbl" style={{ color: `var(--${g.color})` }}>
              <Lucide name={g.icon} />{g.title}
            </div>
            <table className="itbl"><tbody>
              {g.items.map((it, ii) => (
                <tr key={ii}>
                  <td>{it.id}</td>
                  <td>
                    {it.name}
                    {it.ammo && <span className="pill pc" style={{ marginLeft: 5 }}>{it.ammo}</span>}
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        );
      })}
    </div>
  );
}
