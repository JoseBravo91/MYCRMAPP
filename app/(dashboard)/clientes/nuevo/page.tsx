import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { listUsuariosActivos } from '@/lib/services/usuarios';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { ClienteForm } from '@/components/forms/ClienteForm';

export const metadata: Metadata = { title: 'Nuevo cliente' };

export default async function NuevoClientePage() {
  const user = await requirePageUser();
  const [etiquetas, usuarios] = await Promise.all([
    prisma.etiqueta.findMany({ orderBy: { nombre: 'asc' } }),
    can(user.rol, 'registros:reasignar') ? listUsuariosActivos() : Promise.resolve(undefined),
  ]);
  return (
    <>
      <PageHeader title="Nuevo cliente" />
      <Card className="max-w-3xl p-6">
        <ClienteForm etiquetas={etiquetas} usuarios={usuarios} />
      </Card>
    </>
  );
}
