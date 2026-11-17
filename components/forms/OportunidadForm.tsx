'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { EtapaOportunidad } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ETAPA_LABEL } from '@/lib/formatters';
import { PROBABILIDAD_POR_ETAPA } from '@/lib/kpis';

export interface OportunidadFormValues {
  titulo: string;
  descripcion: string;
  valorEstimado: string;
  probabilidad: string;
  etapa: EtapaOportunidad;
  fechaCierreEstimada: string;
  clienteId: string;
  ownerId: string;
}

interface Props {
  oportunidadId?: string;
  initial?: Partial<OportunidadFormValues>;
  clientes: { id: string; nombre: string; empresa: string | null }[];
  usuarios?: { id: string; nombre: string }[];
}

export function OportunidadForm({ oportunidadId, initial, clientes, usuarios }: Props) {
  const router = useRouter();
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState<OportunidadFormValues>({
    titulo: '', descripcion: '', valorEstimado: '', probabilidad: '10', etapa: 'PROSPECTO',
    fechaCierreEstimada: '', clienteId: '', ownerId: '',
    ...initial,
  });

  const set = <K extends keyof OportunidadFormValues>(key: K, value: OportunidadFormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  function onEtapa(etapa: EtapaOportunidad) {
    setForm((f) => ({ ...f, etapa, probabilidad: String(PROBABILIDAD_POR_ETAPA[etapa]) }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const saved = await apiFetch<{ id: string }>(oportunidadId ? `/api/oportunidades/${oportunidadId}` : '/api/oportunidades', {
        method: oportunidadId ? 'PUT' : 'POST',
        json: { ...form, ownerId: form.ownerId || undefined },
      });
      router.push(`/oportunidades/${saved.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Alert>{error}</Alert>
      {clientes.length === 0 && <Alert type="warning">Primero debes crear un cliente para asociarle oportunidades.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Título" name="titulo" required value={form.titulo} error={fieldErrors.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </div>
        <Select label="Cliente" name="clienteId" required value={form.clienteId} error={fieldErrors.clienteId} onChange={(e) => set('clienteId', e.target.value)}>
          <option value="">Selecciona un cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>
          ))}
        </Select>
        <Select label="Etapa" name="etapa" value={form.etapa} onChange={(e) => onEtapa(e.target.value as EtapaOportunidad)}>
          {Object.entries(ETAPA_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <Input label="Valor estimado (COP)" name="valorEstimado" type="number" min={0} step={1000} required value={form.valorEstimado}
          error={fieldErrors.valorEstimado} onChange={(e) => set('valorEstimado', e.target.value)} />
        <Input label="Probabilidad (%)" name="probabilidad" type="number" min={0} max={100} required value={form.probabilidad}
          error={fieldErrors.probabilidad} onChange={(e) => set('probabilidad', e.target.value)} />
        <Input label="Fecha estimada de cierre" name="fechaCierreEstimada" type="date" value={form.fechaCierreEstimada}
          error={fieldErrors.fechaCierreEstimada} onChange={(e) => set('fechaCierreEstimada', e.target.value)} />
        {usuarios && (
          <Select label="Responsable" name="ownerId" value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
            <option value="">Yo mismo</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        )}
      </div>
      <Textarea label="Descripción" name="descripcion" rows={4} value={form.descripcion} error={fieldErrors.descripcion}
        onChange={(e) => set('descripcion', e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={submitting} disabled={clientes.length === 0}>
          {oportunidadId ? 'Guardar cambios' : 'Crear oportunidad'}
        </Button>
      </div>
    </form>
  );
}
