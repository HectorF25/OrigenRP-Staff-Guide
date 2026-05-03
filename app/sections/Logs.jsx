// Logs — acceso a FiveMonitor (sin iframe porque el sitio bloquea X-Frame).
import { Activity, ExternalLink, Info, Shield, Eye } from 'lucide-react';
import { FIVEMONITOR_URL } from '@/lib/constants';

export default function Logs() {
  return (
    <div className="section active">
      <div className="pg-header">
        <div className="pg-title">Logs del Servidor</div>
        <div className="pg-sub">FiveMonitor — historial de acciones, sanciones y eventos</div>
      </div>

      <div className="logs-card">
        <div className="logs-card-icon">
          <Activity size={36} />
        </div>
        <div className="logs-card-title">Acceso al panel de FiveMonitor</div>
        <div className="logs-card-sub">
          Los logs viven en un servicio externo que requiere tu propia sesión.
          Por seguridad, FiveMonitor no permite cargarse dentro del panel —
          se abre en una pestaña aparte para que mantengas tu inicio de sesión activo.
        </div>

        <a className="logs-card-btn" href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Abrir FiveMonitor
        </a>

        <div className="logs-meta">
          <span>logs.fivemonitor.com</span>
          <span className="logs-meta-dot">·</span>
          <span>Se abre en una nueva pestaña</span>
        </div>
      </div>

      <div className="logs-tips">
        <div className="logs-tip">
          <div className="logs-tip-icon ci-blue"><Eye size={15} /></div>
          <div>
            <div className="logs-tip-title">¿Qué puedes consultar?</div>
            <div className="logs-tip-text">
              Logs de jails, bans, kicks, comandos administrativos, conexiones, dinero, inventarios y eventos del servidor.
              Útil para verificar reportes con pruebas objetivas antes de sancionar.
            </div>
          </div>
        </div>
        <div className="logs-tip">
          <div className="logs-tip-icon ci-yellow"><Info size={15} /></div>
          <div>
            <div className="logs-tip-title">Si no tienes acceso</div>
            <div className="logs-tip-text">
              Pide a un Admin Senior que te añada al equipo de FiveMonitor desde el panel admin del proveedor.
              El acceso se gestiona aparte de Discord.
            </div>
          </div>
        </div>
        <div className="logs-tip">
          <div className="logs-tip-icon ci-red"><Shield size={15} /></div>
          <div>
            <div className="logs-tip-title">Manejo responsable</div>
            <div className="logs-tip-text">
              Los logs son información sensible. No compartas capturas con jugadores ni los uses fuera de procesos administrativos.
              Filtrar logs internos es falta grave del staff.
            </div>
          </div>
        </div>
        <div className="alert al-c">
          <span className="al-icon"><Info size={14} /></span>
          <span>
            Los logs viven en un servicio externo (FiveMonitor). Si el embed no carga por restricciones del sitio,
            usa el botón para abrirlo en pestaña aparte.
          </span>
          <div className="logs-frame-wrap">
          <div className="logs-bar">
            <span>logs.fivemonitor.com</span>
            <a href={FIVEMONITOR_URL} target="_blank" rel="noreferrer">Abrir en pestaña aparte ↗</a>
          </div>
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
      </div>
    </div>
  );
}
