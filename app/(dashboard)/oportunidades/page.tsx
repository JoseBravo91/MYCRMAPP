import type { Metadata } from 'next';
import { LinkButton } from '@/components/ui/Button';
import { requirePageUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/ui/PageHeader';
import { OportunidadesView } from '@/components/dashboards/OportunidadesView';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function OportunidadesPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader
        title="Oportunidades"
        subtitle="Arrastra las tarjetas para cambiar de etapa"
        actions={
          <LinkButton href="/oportunidades/nuevo" icon="accion.nuevo">Nueva oportunidad</LinkButton>
        }
      />
      <OportunidadesView showOwner={can(user.rol, 'registros:ver_todos')} />
    </>
  );
}
