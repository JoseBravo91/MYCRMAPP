import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function RegisterPage() {
  // Se evalúa en cada petición para que ALLOW_REGISTRATION no quede fijado en el build.
  await connection();
  const enabled = process.env.ALLOW_REGISTRATION === 'true';
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Las cuentas nuevas se crean con rol Vendedor</p>
      </div>
      {enabled ? (
        <RegisterForm />
      ) : (
        <div className="space-y-4">
          <Alert type="info">El registro público está deshabilitado. Solicita una cuenta al administrador.</Alert>
          <Link href="/login" className="text-sm font-medium text-brand-ink hover:underline">Volver al inicio de sesión</Link>
        </div>
      )}
    </>
  );
}
