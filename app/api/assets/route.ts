import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonError, withAuth } from '@/lib/api/handler';
import { leerImagen, assetUrl } from '@/lib/assets';
import { uploadLimiter } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

const tipoSchema = z.enum(['ICON', 'LOGO']);

/** Biblioteca de iconos/logos (solo administradores). */
export const GET = withAuth(
  async ({ req }) => {
    const tipo = tipoSchema.parse(req.nextUrl.searchParams.get('tipo') ?? 'ICON');
    const assets = await prisma.asset.findMany({
      where: { tipo },
      orderBy: { createdAt: 'desc' },
      select: { id: true, nombre: true, bytes: true, ancho: true, alto: true, createdAt: true, _count: { select: { itemsDeMenu: true } } },
    });
    return NextResponse.json({ data: assets.map((a) => ({ ...a, url: assetUrl(a.id) })) });
  },
  { roles: ['ADMIN'] },
);

export const POST = withAuth(
  async ({ req, user }) => {
    if (!uploadLimiter.check(user.id).allowed) return jsonError(429, 'Demasiadas subidas seguidas, espera un momento');
    const form = await req.formData();
    const tipo = tipoSchema.parse(form.get('tipo'));
    const nombre = z.string().trim().min(1).max(80).parse(form.get('nombre') ?? 'Sin nombre');
    const img = await leerImagen(form.get('archivo'), tipo);

    const asset = await prisma.asset.create({
      data: { tipo, nombre, mimeType: img.mime, data: img.data, bytes: img.bytes, ancho: img.ancho, alto: img.alto, autorId: user.id },
      select: { id: true, nombre: true },
    });
    await audit({ usuarioId: user.id, accion: 'ASSET_SUBIDO', entidad: 'Asset', entidadId: asset.id, metadata: { tipo, bytes: img.bytes } });
    return NextResponse.json({ ...asset, url: assetUrl(asset.id) }, { status: 201 });
  },
  { roles: ['ADMIN'] },
);
