// Endpoint de diagnóstico — solo dice si las env vars están definidas, NUNCA su valor.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const env = process.env;
  const status = {
    DISCORD_CLIENT_ID:     bool(env.DISCORD_CLIENT_ID),
    DISCORD_CLIENT_SECRET: bool(env.DISCORD_CLIENT_SECRET),
    DISCORD_REDIRECT_URI:  bool(env.DISCORD_REDIRECT_URI),
    DISCORD_GUILD_ID:      bool(env.DISCORD_GUILD_ID),
    DISCORD_ALLOWED_ROLES: bool(env.DISCORD_ALLOWED_ROLES),
    JWT_SECRET:            bool(env.JWT_SECRET),
    GOOGLE_API_KEY:        bool(env.GOOGLE_API_KEY),
    DISCORD_ROLE_LABEL:    bool(env.DISCORD_ROLE_LABEL)
  };
  const hints = {
    redirect_uri_length: (env.DISCORD_REDIRECT_URI || '').length,
    allowed_roles_count: (env.DISCORD_ALLOWED_ROLES || '').split(',').filter(s => s.trim()).length,
    client_id_length:    (env.DISCORD_CLIENT_ID || '').length,
    guild_id_length:     (env.DISCORD_GUILD_ID || '').length
  };
  return NextResponse.json({ status, hints });
}

function bool(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
