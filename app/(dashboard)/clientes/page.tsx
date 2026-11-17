import type { Metadata } from 'next';
import { LinkButton } from '@/components/ui/Button';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientesTable } from '@/components/tables/ClientesTable';

export const metadata: Metadata = { title: 'Clientes' };

export default async function ClientesPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Gestiona tu cartera de clientes"
        actions={
          <LinkButton href="/clientes/nuevo" icon="accion.nuevo">Nuevo cliente</LinkButton>
        }
      />
      <ClientesTable showOwner={can(user.rol, 'registros:ver_todos')} />
    </>
  );
}
