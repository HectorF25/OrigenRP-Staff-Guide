// Callback OAuth2 de Discord: intercambia el code, valida el rol y emite cookie de sesión.
import { NextResponse } from 'next/server';
import { sign } from '@/lib/jwt';
import { parseCookieHeader, sessionCookie, clearCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookies = parseCookieHeader(request.headers.get('cookie'));

  if (!code) return redirectErr(origin, 'missing_code');
  if (!state || state !== cookies.oauth_state) return redirectErr(origin, 'csrf');

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const guildId = process.env.DISCORD_GUILD_ID;
  const allowedRoles = (process.env.DISCORD_ALLOWED_ROLES || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const roleLabel = process.env.DISCORD_ROLE_LABEL || 'Staff';

  const missing = [];
  if (!clientId)     missing.push('DISCORD_CLIENT_ID');
  if (!clientSecret) missing.push('DISCORD_CLIENT_SECRET');
  if (!redirectUri)  missing.push('DISCORD_REDIRECT_URI');
  if (!guildId)      missing.push('DISCORD_GUILD_ID');
  if (allowedRoles.length === 0) missing.push('DISCORD_ALLOWED_ROLES');
  if (missing.length) {
    console.error('Env vars faltan:', missing.join(', '));
    return redirectErr(origin, 'server_config', missing.join(','));
  }

  try {
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
      return redirectErr(origin, 'token');
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return redirectErr(origin, 'token');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) return redirectErr(origin, 'user');
    const user = await userRes.json();

    const memberRes = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (memberRes.status === 404) return redirectErr(origin, 'no_member');
    if (!memberRes.ok) {
      console.error('Discord member error:', await memberRes.text());
      return redirectErr(origin, 'member');
    }
    const member = await memberRes.json();
    const userRoleIds = Array.isArray(member.roles) ? member.roles : [];

    const matched = userRoleIds.filter(r => allowedRoles.includes(r));
    if (matched.length === 0) return redirectErr(origin, 'no_role');

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
    const res = NextResponse.redirect(`${origin}/`, 302);
    res.headers.append('Set-Cookie', sessionCookie(token));
    res.headers.append('Set-Cookie', clearCookie('oauth_state'));
    return res;
  } catch (e) {
    console.error('Callback error:', e);
    return redirectErr(origin, 'server');
  }
}

function redirectErr(origin, code, missing) {
  const url = new URL('/', origin);
  url.searchParams.set('error', code);
  if (missing) url.searchParams.set('missing', missing);
  const res = NextResponse.redirect(url.toString(), 302);
  res.headers.append('Set-Cookie', clearCookie('oauth_state'));
  return res;
}
