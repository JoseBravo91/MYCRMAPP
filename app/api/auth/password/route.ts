import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validators';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { issueTokens, revokeAllForUser } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import { audit } from '@/lib/audit';
import { getClientIp, jsonError, readJson, withAuth } from '@/lib/api/handler';

export const PUT = withAuth(async ({ req, user }) => {
  const { actual, nueva } = changePasswordSchema.parse(await readJson(req));
  const db = await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(actual, db.passwordHash))) return jsonError(400, 'La contraseña actual es incorrecta');

  await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(nueva) } });

  // Cierra las demás sesiones y emite tokens nuevos para la actual.
  await revokeAllForUser(user.id);
  const ip = getClientIp(req);
  const tokens = await issueTokens(db, { ip, userAgent: req.headers.get('user-agent') });
  await audit({ usuarioId: user.id, accion: 'CAMBIO_PASSWORD', ip });

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, tokens);
  return res;
});
