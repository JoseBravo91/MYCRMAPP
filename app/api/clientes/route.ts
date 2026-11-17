import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { clienteSchema, paginationSchema } from '@/lib/validators';
import { createCliente, listClientes } from '@/lib/services/clientes';
import { audit } from '@/lib/audit';

export const GET = withAuth(async ({ req, user }) => {
  const opts = paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return NextResponse.json(await listClientes(user, opts));
});

export const POST = withAuth(async ({ req, user }) => {
  const data = clienteSchema.parse(await readJson(req));
  const cliente = await createCliente(user, data);
  await audit({ usuarioId: user.id, accion: 'CLIENTE_CREADO', entidad: 'Cliente', entidadId: cliente.id });
  return NextResponse.json(cliente, { status: 201 });
});
