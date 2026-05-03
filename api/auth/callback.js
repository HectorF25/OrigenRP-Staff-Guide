// Callback OAuth2 de Discord: intercambia el code, valida el rol y emite cookie de sesión.
import { sign } from '../_lib/jwt.js';
import { parseCookies, clearCookie } from '../_lib/auth.js';

export default async function handler(req, res) {
  const { code, state } = req.query || {};
  const cookies = parseCookies(req);

  if (!code) return redirect(res, '/?error=missing_code');
  if (!state || state !== cookies.oauth_state) {
    return redirect(res, '/?error=csrf');
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const guildId = process.env.DISCORD_GUILD_ID;
  const allowedRoles = (process.env.DISCORD_ALLOWED_ROLES || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const roleLabel = process.env.DISCORD_ROLE_LABEL || 'Staff';

  if (!clientId || !clientSecret || !redirectUri || !guildId || allowedRoles.length === 0) {
    return redirect(res, '/?error=server_config');
  }

  try {
    // 1) Intercambio de code por access_token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });
    if (!tokenRes.ok) {
      console.error('Discord token error:', await tokenRes.text());
      return redirect(res, '/?error=token');
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return redirect(res, '/?error=token');

    // 2) Datos del usuario
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) return redirect(res, '/?error=user');
    const user = await userRes.json();

    // 3) Datos del miembro en el guild (incluye los roles)
    const memberRes = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (memberRes.status === 404) return redirect(res, '/?error=no_member');
    if (!memberRes.ok) {
      console.error('Discord member error:', await memberRes.text());
      return redirect(res, '/?error=member');
    }
    const member = await memberRes.json();
    const userRoleIds = Array.isArray(member.roles) ? member.roles : [];

    // 4) ¿Tiene alguno de los roles permitidos?
    const matched = userRoleIds.filter(r => allowedRoles.includes(r));
    if (matched.length === 0) return redirect(res, '/?error=no_role');

    // 5) Construir la sesión
    const displayName = member.nick || user.global_name || user.username || 'Staff';
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    const session = {
      sub: user.id,
      name: displayName,
      username: user.username,
      avatar: avatarUrl,
      role: roleLabel,
      roles: matched
    };

    const token = sign(session);
    res.setHeader('Set-Cookie', [
      `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      clearCookie('oauth_state')
    ]);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (e) {
    console.error('Callback error:', e);
    return redirect(res, '/?error=server');
  }
}

function redirect(res, location) {
  res.setHeader('Set-Cookie', clearCookie('oauth_state'));
  res.writeHead(302, { Location: location });
  res.end();
}
