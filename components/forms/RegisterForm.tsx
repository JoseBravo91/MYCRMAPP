'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function RegisterForm() {
  const router = useRouter();
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [localError, setLocalError] = useState<string | undefined>();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmar) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    setLocalError(undefined);
    run(async () => {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        json: { nombre: form.nombre, email: form.email, password: form.password },
      });
      router.replace('/dashboard');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <Input label="Nombre completo" name="nombre" required autoComplete="name" value={form.nombre} error={fieldErrors.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <Input label="Correo electrónico" name="email" type="email" required autoComplete="email" value={form.email} error={fieldErrors.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input label="Contraseña" name="password" type="password" required autoComplete="new-password" value={form.password}
        error={fieldErrors.password} hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <Input label="Confirmar contraseña" name="confirmar" type="password" required autoComplete="new-password" value={form.confirmar}
        error={localError} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} />
      <Button type="submit" loading={submitting} className="w-full">
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
