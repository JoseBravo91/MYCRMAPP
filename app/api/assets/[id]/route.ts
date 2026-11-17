import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validators';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, toErrorResponse, withAuth } from '@/lib/api/handler';
import { getAppSettings, guardarConfiguracion } from '@/lib/settings';
import { audit } from '@/lib/audit';

/**
 * Sirve una imagen. Iconos y logo son públicos (se ven en el login);
 * los avatares requieren sesión. El id cambia con cada subida, así que se cachea como inmutable.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = idSchema.safeParse((await params).id);
    if (!parsed.success) return jsonError(404, 'Imagen no encontrada');
    const asset = await prisma.asset.findUnique({ where: { id: parsed.data } });
    if (!asset) return jsonError(404, 'Imagen no encontrada');
    if (asset.tipo === 'AVATAR' && !(await getSessionUser())) return jsonError(401, 'No autenticado');

    return new NextResponse(new Uint8Array(asset.data), {
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Length': String(asset.bytes),
        'Cache-Control': `${asset.tipo === 'AVATAR' ? 'private' : 'public'}, max-age=31536000, immutable`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Content-Disposition': 'inline',
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** Elimina un icono o logo y lo desasigna de donde se use. */
export const DELETE = withAuth<{ id: string }>(
  async ({ user, params }) => {
    const id = idSchema.parse(params.id);
    const asset = await prisma.asset.findUnique({ where: { id }, select: { tipo: true } });
    if (!asset || asset.tipo === 'AVATAR') return jsonError(404, 'Imagen no encontrada');

    const { iconos, marca } = await getAppSettings();
    const restantes = Object.fromEntries(Object.entries(iconos).filter(([, v]) => v !== id));
    if (Object.keys(restantes).length !== Object.keys(iconos).length) await guardarConfiguracion('iconos', restantes, user.id);
    if (marca.logoId === id) await guardarConfiguracion('marca', { ...marca, logoId: null }, user.id);

    // Los ítems del menú quedan sin icono por la relación onDelete: SetNull
    await prisma.asset.delete({ where: { id } });
    await audit({ usuarioId: user.id, accion: 'ASSET_ELIMINADO', entidad: 'Asset', entidadId: id });
    return new NextResponse(null, { status: 204 });
  },
  { roles: ['ADMIN'] },
);
