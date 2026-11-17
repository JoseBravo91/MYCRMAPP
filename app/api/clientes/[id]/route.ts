import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { clienteSchema, idSchema } from '@/lib/validators';
import { deleteCliente, getCliente, updateCliente } from '@/lib/services/clientes';
import { audit } from '@/lib/audit';

type P = { id: string };

export const GET = withAuth<P>(async ({ user, params }) => {
  const cliente = await getCliente(user, idSchema.parse(params.id));
  return NextResponse.json({
    ...cliente,
    oportunidades: cliente.oportunidades.map((o) => ({ ...o, valorEstimado: Number(o.valorEstimado) })),
  });
});

export const PUT = withAuth<P>(async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const cliente = await updateCliente(user, id, clienteSchema.parse(await readJson(req)));
  await audit({ usuarioId: user.id, accion: 'CLIENTE_ACTUALIZADO', entidad: 'Cliente', entidadId: id });
  return NextResponse.json(cliente);
});

export const DELETE = withAuth<P>(async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  await deleteCliente(user, id);
  await audit({ usuarioId: user.id, accion: 'CLIENTE_ELIMINADO', entidad: 'Cliente', entidadId: id });
  return new NextResponse(null, { status: 204 });
});
