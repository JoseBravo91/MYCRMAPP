'use client';

import { useState, type FormEvent } from 'react';
import type { Rol } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input, Select } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROL_LABEL } from '@/lib/auth/rbac';

export interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

/** Crea un usuario (sin `usuario`) o edita nombre/rol/contraseña de uno existente. */
export function UsuarioForm({ usuario, onSaved }: { usuario?: UsuarioRow; onSaved: () => void }) {
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    rol: usuario?.rol ?? ('VENDEDOR' as Rol),
    password: '',
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      if (usuario) {
        await apiFetch(`/api/usuarios/${usuario.id}`, {
          method: 'PATCH',
          json: { nombre: form.nombre, rol: form.rol, ...(form.password ? { password: form.password } : {}) },
        });
      } else {
        await apiFetch('/api/usuarios', { method: 'POST', json: form });
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <Input label="Nombre" name="nombre" required value={form.nombre} error={fieldErrors.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <Input label="Correo electrónico" name="email" type="email" required disabled={!!usuario} value={form.email}
        error={fieldErrors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Select label="Rol" name="rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
        {Object.entries(ROL_LABEL).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>
      <Input
        label={usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        name="password"
        type="password"
        autoComplete="new-password"
        required={!usuario}
        value={form.password}
        error={fieldErrors.password}
        hint={usuario ? 'Déjalo vacío para conservar la actual. Restablecerla cierra sus sesiones.' : 'Mínimo 8 caracteres, con mayúscula, minúscula y número'}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>{usuario ? 'Guardar cambios' : 'Crear usuario'}</Button>
      </div>
    </form>
  );
}
