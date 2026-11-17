import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validators';
import { jsonError, withAuth } from '@/lib/api/handler';
import { leerImagen, assetUrl } from '@/lib/assets';
import { uploadLimiter } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import type { SessionUser } from '@/lib/auth/session';

type P = { id: string };

/** Cada usuario gestiona su foto; el administrador puede gestionar la de cualquiera. */
function autorizado(user: SessionUser, id: string) {
  return user.id === id || user.rol === 'ADMIN';
}

export const POST = withAuth<P>(async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  if (!autorizado(user, id)) return jsonError(403, 'No tienes permisos para realizar esta acción');
  if (!uploadLimiter.check(user.id).allowed) return jsonError(429, 'Demasiadas subidas seguidas, espera un momento');

  const target = await prisma.usuario.findUnique({ where: { id }, select: { avatarId: true } });
  if (!target) return jsonError(404, 'Usuario no encontrado');

  const img = await leerImagen((await req.formData()).get('archivo'), 'AVATAR');
  const asset = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.asset.create({
      data: { tipo: 'AVATAR', nombre: 'avatar', mimeType: img.mime, data: img.data, bytes: img.bytes, ancho: img.ancho, alto: img.alto, autorId: user.id },
    });
    await tx.usuario.update({ where: { id }, data: { avatarId: nuevo.id } });
    if (target.avatarId) await tx.asset.delete({ where: { id: target.avatarId } });
    return nuevo;
  });

  await audit({ usuarioId: user.id, accion: 'AVATAR_ACTUALIZADO', entidad: 'Usuario', entidadId: id });
  return NextResponse.json({ avatarId: asset.id, url: assetUrl(asset.id) });
});

export const DELETE = withAuth<P>(async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  if (!autorizado(user, id)) return jsonError(403, 'No tienes permisos para realizar esta acción');
  const target = await prisma.usuario.findUnique({ where: { id }, select: { avatarId: true } });
  if (target?.avatarId) await prisma.asset.delete({ where: { id: target.avatarId } });
  return new NextResponse(null, { status: 204 });
});
