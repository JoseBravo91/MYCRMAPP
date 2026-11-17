import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, readJson, withAuth } from '@/lib/api/handler';
import { getAppSettings, guardarConfiguracion, iconosSchema } from '@/lib/settings';
import { audit } from '@/lib/audit';

export const GET = withAuth(async () => NextResponse.json((await getAppSettings()).iconos), { roles: ['ADMIN'] });

/** Reemplaza el mapa completo ubicación → icono. */
export const PUT = withAuth(
  async ({ req, user }) => {
    const iconos = iconosSchema.parse(await readJson(req));
    const ids = [...new Set(Object.values(iconos))];
    if (ids.length && (await prisma.asset.count({ where: { id: { in: ids }, tipo: 'ICON' } })) !== ids.length) {
      return jsonError(400, 'Alguno de los iconos no existe');
    }
    await guardarConfiguracion('iconos', iconos, user.id);
    await audit({ usuarioId: user.id, accion: 'CONFIG_ICONOS', metadata: { asignados: Object.keys(iconos).length } });
    return NextResponse.json(iconos);
  },
  { roles: ['ADMIN'] },
);
