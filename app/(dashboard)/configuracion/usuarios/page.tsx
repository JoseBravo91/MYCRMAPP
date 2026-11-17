import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { UsuariosTable } from '@/components/tables/UsuariosTable';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function UsuariosConfigPage() {
  const user = await requirePageUser(['ADMIN']);
  return (
    <div className="space-y-4">
      <Alert type="info">
        <strong>Administrador:</strong> acceso total y configuración. <strong>Gerente:</strong> ve y reasigna los registros de todo el equipo.{' '}
        <strong>Vendedor:</strong> solo gestiona sus propios clientes y oportunidades.
      </Alert>
      <UsuariosTable currentUserId={user.id} />
    </div>
  );
}
