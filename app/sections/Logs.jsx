'use client';

// Logs — embed de FiveMonitor con fallback si bloquea X-Frame.
import { useEffect, useRef, useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { FIVEMONITOR_URL } from '@/lib/constants';

export default function Logs() {
  const [iframeFailed, setIframeFailed] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Heurística cross-origin para detectar X-Frame-Options bloqueando el embed.
    const t = setTimeout(() => {
      try {
        if (iframeRef.current && iframeRef.current.contentWindow == null) {
          setIframeFailed(true);
        }
      } catch { /* cross-origin OK = silencio */ }
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Logs del Servidor</div>
        <div className="pg-sub">FiveMonitor — historial de acciones, sanciones y eventos</div>
      </div>
      <div className="alert al-c">
        <span className="al-icon"><Info size={14} /></span>
        <span>
          Los logs viven en un servicio externo (FiveMonitor). Si el embed no carga por restricciones del sitio,
          usa el botón para abrirlo en pestaña aparte.
        </span>
      </div>
      <div className="logs-frame-wrap">
        <div className="logs-bar">
          <span>logs.fivemonitor.com</span>
          <a href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">Abrir en pestaña aparte ↗</a>
        </div>
        <iframe
          ref={iframeRef}
          className="logs-frame"
          src={FIVEMONITOR_URL}
          title="FiveMonitor Logs"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {iframeFailed && (
          <div className="logs-fallback">
            <p>FiveMonitor no permite embed con iframe. Ábrelo en una pestaña nueva:</p>
            <a className="logs-open-btn" href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Abrir FiveMonitor
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
