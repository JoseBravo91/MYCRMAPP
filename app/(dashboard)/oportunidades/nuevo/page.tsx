import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listClientesOptions } from '@/lib/services/clientes';
import { listUsuariosActivos } from '@/lib/services/usuarios';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { OportunidadForm } from '@/components/forms/OportunidadForm';

export const metadata: Metadata = { title: 'Nueva oportunidad' };

export default async function NuevaOportunidadPage({ searchParams }: { searchParams: Promise<{ clienteId?: string }> }) {
  const user = await requirePageUser();
  const { clienteId } = await searchParams;
  const [clientes, usuarios] = await Promise.all([
    listClientesOptions(user),
    can(user.rol, 'registros:reasignar') ? listUsuariosActivos() : Promise.resolve(undefined),
  ]);
  const preseleccionado = clientes.some((c) => c.id === clienteId) ? clienteId : '';

  return (
    <>
      <PageHeader title="Nueva oportunidad" />
      <Card className="max-w-3xl p-6">
        <OportunidadForm clientes={clientes} usuarios={usuarios} initial={{ clienteId: preseleccionado }} />
      </Card>
    </>
  );
}
