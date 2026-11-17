import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, readJson, withAuth } from '@/lib/api/handler';
import { getAppSettings, guardarConfiguracion, marcaSchema } from '@/lib/settings';
import { audit } from '@/lib/audit';

export const GET = withAuth(async () => NextResponse.json((await getAppSettings()).marca), { roles: ['ADMIN'] });

export const PUT = withAuth(
  async ({ req, user }) => {
    const marca = marcaSchema.parse(await readJson(req));
    if (marca.logoId && !(await prisma.asset.count({ where: { id: marca.logoId, tipo: 'LOGO' } }))) {
      return jsonError(400, 'El logo seleccionado no existe');
    }
    await guardarConfiguracion('marca', marca, user.id);
    await audit({ usuarioId: user.id, accion: 'CONFIG_MARCA', metadata: { nombre: marca.nombre } });
    return NextResponse.json(marca);
  },
  { roles: ['ADMIN'] },
);
