// Devuelve los datos del staff logueado a partir de la cookie de sesión.
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
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
