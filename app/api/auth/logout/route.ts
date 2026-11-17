import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth/constants';
import { revokeRefreshToken } from '@/lib/auth/tokens';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { getSessionUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { getClientIp } from '@/lib/api/handler';

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) await revokeRefreshToken(refresh);

  const user = await getSessionUser();
  if (user) await audit({ usuarioId: user.id, accion: 'LOGOUT', ip: getClientIp(req) });

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
