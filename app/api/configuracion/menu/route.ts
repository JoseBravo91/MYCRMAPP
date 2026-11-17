import { NextResponse } from 'next/server';
import { readJson, withAuth } from '@/lib/api/handler';
import { getMenuCompleto, guardarMenu } from '@/lib/services/menu';
import { audit } from '@/lib/audit';

export const GET = withAuth(async () => NextResponse.json({ data: await getMenuCompleto() }), { roles: ['ADMIN'] });

export const PUT = withAuth(
  async ({ req, user }) => {
    const menu = await guardarMenu(await readJson(req));
    await audit({ usuarioId: user.id, accion: 'CONFIG_MENU', metadata: { elementos: menu.length } });
    return NextResponse.json({ data: menu });
  },
  { roles: ['ADMIN'] },
);
