// Inicia el flujo OAuth2 de Discord redirigiendo al usuario a la pantalla de autorización.
import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'OAuth no configurado en el servidor' });
  }

  // CSRF token: cookie corta + parámetro state
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie',
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state
  });

  res.writeHead(302, {
    Location: `https://discord.com/api/oauth2/authorize?${params.toString()}`
  });
  res.end();
}
