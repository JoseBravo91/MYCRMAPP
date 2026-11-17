import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { usuarioCreateSchema } from '@/lib/validators';
import { createUsuario, listUsuarios, listUsuariosActivos } from '@/lib/services/usuarios';
import { audit } from '@/lib/audit';

/** Admin: listado completo. Gerente: solo activos (para asignar responsables). */
export const GET = withAuth(
  async ({ user }) =>
    NextResponse.json({ data: user.rol === 'ADMIN' ? await listUsuarios() : await listUsuariosActivos() }),
  { roles: ['ADMIN', 'GERENTE'] },
);

export const POST = withAuth(
  async ({ req, user }) => {
    const nuevo = await createUsuario(usuarioCreateSchema.parse(await readJson(req)));
    await audit({ usuarioId: user.id, accion: 'USUARIO_CREADO', entidad: 'Usuario', entidadId: nuevo.id, metadata: { rol: nuevo.rol } });
    return NextResponse.json(nuevo, { status: 201 });
  },
  { roles: ['ADMIN'] },
);
