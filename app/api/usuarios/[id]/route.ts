import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { idSchema, usuarioUpdateSchema } from '@/lib/validators';
import { updateUsuario } from '@/lib/services/usuarios';
import { audit } from '@/lib/audit';

type P = { id: string };

export const PATCH = withAuth<P>(
  async ({ req, user, params }) => {
    const id = idSchema.parse(params.id);
    const data = usuarioUpdateSchema.parse(await readJson(req));
    const updated = await updateUsuario(user, id, data);
    await audit({
      usuarioId: user.id,
      accion: 'USUARIO_ACTUALIZADO',
      entidad: 'Usuario',
      entidadId: id,
      metadata: { campos: Object.keys(data).map((k) => (k === 'password' ? 'password(reset)' : k)) },
    });
    return NextResponse.json(updated);
  },
  { roles: ['ADMIN'] },
);
