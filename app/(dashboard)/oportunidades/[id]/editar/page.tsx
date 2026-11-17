import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { getOportunidad } from '@/lib/services/oportunidades';
import { listClientesOptions } from '@/lib/services/clientes';
import { listUsuariosActivos } from '@/lib/services/usuarios';
import { AppError } from '@/lib/errors';
import { idSchema } from '@/lib/validators';
import { toDateInput } from '@/lib/formatters';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { OportunidadForm } from '@/components/forms/OportunidadForm';

export const metadata: Metadata = { title: 'Editar oportunidad' };

export default async function EditarOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  if (!idSchema.safeParse(id).success) notFound();
  const op = await getOportunidad(user, id).catch((err) => {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  });
  const [clientes, usuarios] = await Promise.all([
    listClientesOptions(user),
    can(user.rol, 'registros:reasignar') ? listUsuariosActivos() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader title={`Editar ${op.titulo}`} />
      <Card className="max-w-3xl p-6">
        <OportunidadForm
          oportunidadId={op.id}
          clientes={clientes}
          usuarios={usuarios}
          initial={{
            titulo: op.titulo,
            descripcion: op.descripcion ?? '',
            valorEstimado: String(op.valorEstimado),
            probabilidad: String(op.probabilidad),
            etapa: op.etapa,
            fechaCierreEstimada: toDateInput(op.fechaCierreEstimada),
            clienteId: op.cliente.id,
            ownerId: op.owner.id,
          }}
        />
      </Card>
    </>
  );
}
