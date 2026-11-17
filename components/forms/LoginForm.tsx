'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

function safeRedirect(target: string | null) {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
}

export function LoginForm({ allowRegistration }: { allowRegistration: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState({ email: '', password: '' });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await apiFetch('/api/auth/login', { method: 'POST', json: form });
      router.replace(safeRedirect(searchParams.get('redirect')));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        error={fieldErrors.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={form.password}
        error={fieldErrors.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Iniciar sesión
      </Button>
      {allowRegistration && (
        <p className="text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-brand-ink hover:underline">
            Regístrate
          </Link>
        </p>
      )}
    </form>
  );
}
