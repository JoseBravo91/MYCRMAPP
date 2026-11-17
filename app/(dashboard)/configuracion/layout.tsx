import { requirePageUser } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigTabs } from '@/components/config/ConfigTabs';

export default async function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(['ADMIN']);
  return (
    <>
      <PageHeader title="Configuración" subtitle="Personaliza la apariencia, el menú, los iconos y el acceso de tu equipo" />
      <ConfigTabs />
      {children}
    </>
  );
}
