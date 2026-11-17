import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function LoginPage() {
  // Se evalúa en cada petición para que ALLOW_REGISTRATION no quede fijado en el build.
  await connection();
  return (
    <>
      <div className="mb-8">
        <BrandLogo size="md" className="mb-8 text-brand-ink lg:hidden" />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Bienvenido</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
      </div>
      <Suspense>
        <LoginForm allowRegistration={process.env.ALLOW_REGISTRATION === 'true'} />
      </Suspense>
    </>
  );
}
