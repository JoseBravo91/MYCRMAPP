'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { EstadoCliente } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ESTADO_CLIENTE_LABEL } from '@/lib/formatters';

export interface ClienteFormValues {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  industria: string;
  ciudad: string;
  notas: string;
  estado: EstadoCliente;
  etiquetaIds: string[];
  ownerId: string;
}

interface Props {
  clienteId?: string;
  initial?: Partial<ClienteFormValues>;
  etiquetas: { id: string; nombre: string; color: string }[];
  usuarios?: { id: string; nombre: string }[];
}

const EMPTY: ClienteFormValues = {
  nombre: '', email: '', telefono: '', empresa: '', industria: '', ciudad: '', notas: '',
  estado: 'PROSPECTO', etiquetaIds: [], ownerId: '',
};

export function ClienteForm({ clienteId, initial, etiquetas, usuarios }: Props) {
  const router = useRouter();
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState<ClienteFormValues>({ ...EMPTY, ...initial });

  const set = <K extends keyof ClienteFormValues>(key: K, value: ClienteFormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  function toggleEtiqueta(id: string) {
    set('etiquetaIds', form.etiquetaIds.includes(id) ? form.etiquetaIds.filter((e) => e !== id) : [...form.etiquetaIds, id]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const payload = { ...form, ownerId: form.ownerId || undefined };
      const saved = await apiFetch<{ id: string }>(clienteId ? `/api/clientes/${clienteId}` : '/api/clientes', {
        method: clienteId ? 'PUT' : 'POST',
        json: payload,
      });
      router.push(`/clientes/${saved.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" name="nombre" required value={form.nombre} error={fieldErrors.nombre} onChange={(e) => set('nombre', e.target.value)} />
        <Input label="Empresa" name="empresa" value={form.empresa} error={fieldErrors.empresa} onChange={(e) => set('empresa', e.target.value)} />
        <Input label="Correo electrónico" name="email" type="email" value={form.email} error={fieldErrors.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="Teléfono" name="telefono" type="tel" value={form.telefono} error={fieldErrors.telefono} onChange={(e) => set('telefono', e.target.value)} />
        <Input label="Industria" name="industria" value={form.industria} error={fieldErrors.industria} onChange={(e) => set('industria', e.target.value)} />
        <Input label="Ciudad" name="ciudad" value={form.ciudad} error={fieldErrors.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
        <Select label="Estado" name="estado" value={form.estado} onChange={(e) => set('estado', e.target.value as EstadoCliente)}>
          {Object.entries(ESTADO_CLIENTE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        {usuarios && (
          <Select label="Responsable" name="ownerId" value={form.ownerId} error={fieldErrors.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
            <option value="">Yo mismo</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        )}
      </div>

      {etiquetas.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Etiquetas</legend>
          <div className="flex flex-wrap gap-2">
            {etiquetas.map((et) => {
              const selected = form.etiquetaIds.includes(et.id);
              return (
                <button
                  type="button"
                  key={et.id}
                  onClick={() => toggleEtiqueta(et.id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${selected ? 'border-transparent text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  style={selected ? { backgroundColor: et.color } : undefined}
                >
                  {et.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <Textarea label="Notas" name="notas" rows={4} value={form.notas} error={fieldErrors.notas} onChange={(e) => set('notas', e.target.value)} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={submitting}>{clienteId ? 'Guardar cambios' : 'Crear cliente'}</Button>
      </div>
    </form>
  );
}
