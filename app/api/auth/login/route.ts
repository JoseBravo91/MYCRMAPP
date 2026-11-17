import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';
import { verifyPassword } from '@/lib/auth/password';
import { issueTokens } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import { LOCKOUT_MINUTES, MAX_LOGIN_ATTEMPTS } from '@/lib/auth/constants';
import { loginLimiter } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import { getClientIp, jsonError, readJson, withErrors } from '@/lib/api/handler';

const INVALID = 'Correo o contraseña incorrectos';

export const POST = withErrors(async (req) => {
  const ip = getClientIp(req);
  const { email, password } = loginSchema.parse(await readJson(req));

  const limit = loginLimiter.check(`${ip}:${email}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const user = await prisma.usuario.findUnique({ where: { email } });

  if (user?.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
    await verifyPassword(password, null);
    await audit({ usuarioId: user.id, accion: 'LOGIN_BLOQUEADO', ip });
    return jsonError(423, `Cuenta bloqueada temporalmente por intentos fallidos. Intenta en ${LOCKOUT_MINUTES} minutos.`);
  }

  // Siempre se ejecuta bcrypt para que el tiempo de respuesta no revele si el correo existe.
  const valid = await verifyPassword(password, user?.passwordHash);

  if (!user || !valid || !user.activo) {
    if (user) {
      const intentos = user.intentosFallidos + 1;
      const bloquear = intentos >= MAX_LOGIN_ATTEMPTS;
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          intentosFallidos: bloquear ? 0 : intentos,
          bloqueadoHasta: bloquear ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
        },
      });
      await audit({ usuarioId: user.id, accion: bloquear ? 'CUENTA_BLOQUEADA' : 'LOGIN_FALLIDO', ip });
    }
    return jsonError(401, INVALID);
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
  });
  loginLimiter.reset(`${ip}:${email}`);

  const tokens = await issueTokens(user, { ip, userAgent: req.headers.get('user-agent') });
  await audit({ usuarioId: user.id, accion: 'LOGIN_EXITOSO', ip });

  const res = NextResponse.json({
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    // Se expone para clientes que no usan cookies (p. ej. Postman); el navegador usa la cookie httpOnly.
    accessToken: tokens.accessToken,
  });
  setAuthCookies(res, tokens);
  return res;
});
