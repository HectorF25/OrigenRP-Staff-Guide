'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Info, Shield } from 'lucide-react';
import { FIVEMONITOR_URL } from '@/lib/constants';

const PROXY_PATH = '/mis-logs/';

export default function Logs() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) setFailed(true);
    }, 12000);
    return () => clearTimeout(t);
  }, [loading]);

  function onLoad() {
    setLoading(false);
  }

  function onError() {
    setLoading(false);
    setFailed(true);
  }

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Logs del Servidor</div>
        <div className="pg-sub">FiveMonitor — historial de acciones, sanciones y eventos</div>
      </div>

      <div className="alert al-c">
        <span className="al-icon"><Info size={14} /></span>
        <span>
          Los logs viven en un servicio externo (FiveMonitor). El panel los embebe a través
          de un proxy interno. Si algo no carga bien, usa el botón para abrirlos en pestaña aparte.
        </span>
      </div>

      <div className="logs-frame-wrap">
        <div className="logs-bar">
          <span>logs.fivemonitor.com (vía proxy)</span>
          <a href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">Abrir externo ↗</a>
        </div>
        <iframe
          ref={iframeRef}
          className="logs-frame"
          src={PROXY_PATH}
          title="FiveMonitor Logs"
          onLoad={onLoad}
          onError={onError}
          referrerPolicy="no-referrer-when-downgrade"
        />
        {loading && !failed && (
          <div className="logs-loading">
            <div className="spinner" />
            <p>Cargando FiveMonitor...</p>
          </div>
        )}
        {failed && (
          <div className="logs-fallback">
            <Shield size={32} style={{ color: 'var(--red)' }} />
            <p>
              FiveMonitor no se pudo cargar dentro del panel. Esto puede pasar si el sitio
              hace peticiones a URLs absolutas o usa websockets.
            </p>
            <a className="logs-open-btn" href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Abrir FiveMonitor en pestaña aparte
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
