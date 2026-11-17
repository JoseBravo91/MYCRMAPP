import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { getCliente } from '@/lib/services/clientes';
import { listUsuariosActivos } from '@/lib/services/usuarios';
import { AppError } from '@/lib/errors';
import { idSchema } from '@/lib/validators';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { ClienteForm } from '@/components/forms/ClienteForm';

export const metadata: Metadata = { title: 'Editar cliente' };

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  if (!idSchema.safeParse(id).success) notFound();

  const cliente = await getCliente(user, id).catch((err) => {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  });
  const [etiquetas, usuarios] = await Promise.all([
    prisma.etiqueta.findMany({ orderBy: { nombre: 'asc' } }),
    can(user.rol, 'registros:reasignar') ? listUsuariosActivos() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader title={`Editar ${cliente.nombre}`} />
      <Card className="max-w-3xl p-6">
        <ClienteForm
          clienteId={cliente.id}
          etiquetas={etiquetas}
          usuarios={usuarios}
          initial={{
            nombre: cliente.nombre,
            email: cliente.email ?? '',
            telefono: cliente.telefono ?? '',
            empresa: cliente.empresa ?? '',
            industria: cliente.industria ?? '',
            ciudad: cliente.ciudad ?? '',
            notas: cliente.notas ?? '',
            estado: cliente.estado,
            etiquetaIds: cliente.etiquetas.map((e) => e.id),
            ownerId: cliente.ownerId,
          }}
        />
      </Card>
    </>
  );
}
