import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth/constants';
import { rotateRefreshToken } from '@/lib/auth/tokens';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies';
import { audit } from '@/lib/audit';
import { getClientIp } from '@/lib/api/handler';

/** Solo se aceptan rutas internas para evitar open redirects. */
function safeRedirect(target: string | null): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return '/dashboard';
  return target;
}

async function rotate(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!raw) return null;
  const ip = getClientIp(req);
  const result = await rotateRefreshToken(raw, { ip, userAgent: req.headers.get('user-agent') });
  if (!result.ok && result.reason === 'reused') {
    await audit({ accion: 'REFRESH_TOKEN_REUTILIZADO', ip, metadata: { motivo: 'posible robo de sesión' } });
  }
  return result.ok ? result.tokens : null;
}

/** Usado por fetch del cliente cuando recibe 401. */
export async function POST(req: NextRequest) {
  const tokens = await rotate(req);
  if (!tokens) {
    const res = NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }
  const res = NextResponse.json({ ok: true, accessToken: tokens.accessToken });
  setAuthCookies(res, tokens);
  return res;
}

/** Usado por el proxy al navegar a una página protegida con el access token vencido. */
export async function GET(req: NextRequest) {
  const redirectTo = safeRedirect(req.nextUrl.searchParams.get('redirect'));
  const tokens = await rotate(req);
  if (!tokens) {
    const login = new URL('/login', req.url);
    if (redirectTo !== '/dashboard') login.searchParams.set('redirect', redirectTo);
    const res = NextResponse.redirect(login);
    clearAuthCookies(res);
    return res;
  }
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  setAuthCookies(res, tokens);
  return res;
}
