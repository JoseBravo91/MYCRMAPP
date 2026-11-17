import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth/constants';
import { revokeRefreshToken } from '@/lib/auth/tokens';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { getSessionUser } from '@/lib/auth/session';

/**
 * Destino cuando el token es válido pero el usuario ya no existe o fue desactivado.
 * Limpia las cookies para evitar un bucle login ⇄ dashboard. Si la sesión sigue
 * siendo válida no hace nada, así un enlace externo no puede cerrar sesiones ajenas.
 */
export async function GET(req: NextRequest) {
  if (await getSessionUser()) return NextResponse.redirect(new URL('/dashboard', req.url));
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) await revokeRefreshToken(refresh);
  const res = NextResponse.redirect(new URL('/login', req.url));
  clearAuthCookies(res);
  return res;
}
