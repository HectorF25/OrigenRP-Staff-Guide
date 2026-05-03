// Cierra sesión limpiando la cookie y vuelve al panel.
import { clearCookie } from '../_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearCookie('session'));
  res.writeHead(302, { Location: '/' });
  res.end();
}
