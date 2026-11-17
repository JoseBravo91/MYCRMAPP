import { NextResponse } from 'next/server';
import { readJson, withAuth } from '@/lib/api/handler';
import { getAppSettings, guardarConfiguracion, temaSchema } from '@/lib/settings';
import { audit } from '@/lib/audit';

export const GET = withAuth(async () => NextResponse.json((await getAppSettings()).tema), { roles: ['ADMIN'] });

export const PUT = withAuth(
  async ({ req, user }) => {
    const tema = temaSchema.parse(await readJson(req));
    await guardarConfiguracion('tema', tema, user.id);
    await audit({ usuarioId: user.id, accion: 'CONFIG_TEMA', metadata: tema });
    return NextResponse.json(tema);
  },
  { roles: ['ADMIN'] },
);
