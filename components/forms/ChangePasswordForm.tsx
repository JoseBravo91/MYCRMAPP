'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ChangePasswordForm() {
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [ok, setOk] = useState(false);
  const [mismatch, setMismatch] = useState<string>();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setOk(false);
    if (form.nueva !== form.confirmar) {
      setMismatch('Las contraseñas no coinciden');
      return;
    }
    setMismatch(undefined);
    run(async () => {
      await apiFetch('/api/auth/password', { method: 'PUT', json: { actual: form.actual, nueva: form.nueva } });
      setForm({ actual: '', nueva: '', confirmar: '' });
      setOk(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      {ok && <Alert type="success">Contraseña actualizada. Se cerraron las sesiones en otros dispositivos.</Alert>}
      <Input label="Contraseña actual" name="actual" type="password" autoComplete="current-password" required value={form.actual}
        error={fieldErrors.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
      <Input label="Nueva contraseña" name="nueva" type="password" autoComplete="new-password" required value={form.nueva}
        error={fieldErrors.nueva} hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
        onChange={(e) => setForm({ ...form, nueva: e.target.value })} />
      <Input label="Confirmar nueva contraseña" name="confirmar" type="password" autoComplete="new-password" required value={form.confirmar}
        error={mismatch} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} />
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>Cambiar contraseña</Button>
      </div>
    </form>
  );
}
