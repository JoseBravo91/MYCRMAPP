import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/auth/password';
import { issueTokens } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import { registerLimiter } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import { getClientIp, jsonError, readJson, withErrors } from '@/lib/api/handler';

export const POST = withErrors(async (req) => {
  if (process.env.ALLOW_REGISTRATION !== 'true') {
    return jsonError(403, 'El registro público está deshabilitado. Solicita una cuenta al administrador.');
  }

  const ip = getClientIp(req);
  const limit = registerLimiter.check(ip);
  if (!limit.allowed) return jsonError(429, 'Demasiados registros desde esta red. Intenta más tarde.');

  const data = registerSchema.parse(await readJson(req));
  const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (exists) return jsonError(409, 'Ya existe una cuenta con ese correo');

  // El auto-registro siempre crea vendedores; los roles elevados solo los asigna un administrador.
  const user = await prisma.usuario.create({
    data: { nombre: data.nombre, email: data.email, passwordHash: await hashPassword(data.password), rol: 'VENDEDOR' },
  });
  await audit({ usuarioId: user.id, accion: 'REGISTRO', ip });

  const tokens = await issueTokens(user, { ip, userAgent: req.headers.get('user-agent') });
  const res = NextResponse.json(
    { user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } },
    { status: 201 },
  );
  setAuthCookies(res, tokens);
  return res;
});
