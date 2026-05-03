// Cierra sesión limpiando la cookie y vuelve al panel.
import { NextResponse } from 'next/server';
import { clearCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const { origin } = new URL(request.url);
  const res = NextResponse.redirect(`${origin}/`, 302);
  res.headers.append('Set-Cookie', clearCookie('session'));
  return res;
}
