'use client';

import { useEffect, useState } from 'react';
import { AUTH_ERRORS } from '@/lib/constants';

/**
 * Gestiona el estado de autenticación del staff.
 * - Llama a /api/auth/me al montar para detectar sesión existente.
 * - Lee ?error= de la URL si venimos de un callback fallido y limpia la URL.
 * - Expone setUser(null) + setGateError() para invalidar la sesión desde fuera (ej. 401 al consultar IA).
 */
export function useAuth() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [gateError, setGateError] = useState(null);

  useEffect(() => {
    function pickError() {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err && AUTH_ERRORS[err]) {
        setGateError(AUTH_ERRORS[err]);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async r => {
        if (!r.ok) { setUser(null); pickError(); return; }
        const data = await r.json();
        if (data.authenticated) setUser(data.user);
        else { setUser(null); pickError(); }
      })
      .catch(() => { setUser(null); pickError(); })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('gate-shown', !user);
  }, [user]);

  function expireSession(reason = 'Tu sesión ha caducado. Vuelve a iniciar sesión.') {
    setUser(null);
    setGateError(reason);
  }

  return { authReady, user, gateError, expireSession };
}
