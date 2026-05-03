// Devuelve los datos del staff logueado a partir de la cookie de sesión.
import { getSession } from '../_lib/auth.js';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  return res.status(200).json({
    authenticated: true,
    user: {
      id: session.sub,
      name: session.name,
      username: session.username,
      avatar: session.avatar,
      role: session.role,
      roles: session.roles
    }
  });
}
