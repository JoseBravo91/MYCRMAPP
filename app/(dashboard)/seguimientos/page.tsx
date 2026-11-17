import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { SeguimientosTable } from '@/components/tables/SeguimientosTable';

export const metadata: Metadata = { title: 'Seguimientos' };

export default async function SeguimientosPage() {
  await requirePageUser();
  return (
    <>
      <PageHeader title="Seguimientos" subtitle="Tareas, llamadas, correos y reuniones. Créalos desde el detalle de un cliente u oportunidad." />
      <SeguimientosTable title="Todos los seguimientos" />
    </>
  );
}
