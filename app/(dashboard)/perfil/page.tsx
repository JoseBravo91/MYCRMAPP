import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { RolBadge } from '@/components/ui/Badge';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';

export const metadata: Metadata = { title: 'Mi perfil' };

export default async function PerfilPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Tu foto, datos de la cuenta y contraseña" />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <AvatarUploader usuarioId={user.id} nombre={user.nombre} avatarId={user.avatarId} />
          <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Nombre</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{user.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Rol</dt>
              <dd className="mt-1"><RolBadge rol={user.rol} /></dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Correo</dt>
              <dd className="mt-0.5 break-all font-semibold text-slate-900">{user.email}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </Card>
      </div>
    </>
  );
}
