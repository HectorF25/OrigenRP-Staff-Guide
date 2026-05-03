'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Zap, Search, Key, BookOpen } from 'lucide-react';
import { FIVEMONITOR_URL } from '@/lib/constants';

const PROXY_PATH = '/mis-logs/origen';
const TIMEOUT_MS = 8000;

export default function Logs() {
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode(prev => (prev === 'loading' ? 'card' : prev));
    }, TIMEOUT_MS);

    function onMessage(e) {
      if (e.data === 'fm-ready') {
        clearTimeout(timer);
        setMode('iframe');
      }
    }

    window.addEventListener('message', onMessage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Logs del Servidor</div>
        <div className="pg-sub">FiveMonitor — historial de acciones, sanciones y eventos</div>
      </div>

      {mode === 'card' && (
        <>
          <div className="logs-card">
            <div className="logs-card-icon">
              <Zap size={28} />
            </div>
            <div className="logs-card-title">Acceso al Panel de FiveMonitor</div>
            <div className="logs-card-sub">
              Por seguridad, FiveMonitor no permite embedirse.<br />
              Se abre en pestaña aparte.
            </div>
            <a
              className="logs-card-btn"
              href={FIVEMONITOR_URL}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              Abrir FiveMonitor
            </a>
            <div className="logs-meta">
              <span className="logs-meta-dot">●</span>
              <span>logs.fivemonitor.com/origen</span>
            </div>
          </div>

          <div className="logs-tips">
            <div className="logs-tip">
              <div className="logs-tip-icon">
                <Search size={16} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div className="logs-tip-title">¿Qué consultar?</div>
                <div className="logs-tip-text">
                  Historial de sanciones, accesos al servidor, eventos de jugadores
                  y acciones de staff.
                </div>
              </div>
            </div>

            <div className="logs-tip">
              <div className="logs-tip-icon">
                <Key size={16} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div className="logs-tip-title">¿Cómo pedir acceso?</div>
                <div className="logs-tip-text">
                  Solicita tus credenciales a un 💻 Director si aún no tienes
                  usuario en FiveMonitor.
                </div>
              </div>
            </div>

            <div className="logs-tip">
              <div className="logs-tip-icon">
                <BookOpen size={16} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div className="logs-tip-title">Manejo responsable</div>
                <div className="logs-tip-text">
                  La información de logs es sensible. No compartas capturas
                  fuera del equipo de staff.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {mode !== 'card' && (
        <div className="logs-frame-wrap">
          <div className="logs-bar">
            <span>logs.fivemonitor.com (vía proxy)</span>
            <a href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">
              Abrir externo ↗
            </a>
          </div>

          <iframe
            className="logs-frame"
            src={PROXY_PATH}
            title="FiveMonitor Logs"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {mode === 'loading' && (
            <div className="logs-loading">
              <div className="spinner" />
              <p>Intentando embeber FiveMonitor…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
