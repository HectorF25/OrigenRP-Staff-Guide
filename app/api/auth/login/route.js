// Inicia el flujo OAuth2 de Discord redirigiendo al usuario a la pantalla de autorización.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { stateCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'OAuth no configurado en el servidor' }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state
  });

  const res = NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`,
    302
  );
  res.headers.append('Set-Cookie', stateCookie(state));
  return res;
}
