'use client';

import { useState, type FormEvent } from 'react';
import type { TipoSeguimiento } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { TIPO_SEGUIMIENTO_LABEL } from '@/lib/formatters';

interface Props {
  clienteId: string;
  oportunidades?: { id: string; titulo: string }[];
  oportunidadId?: string;
  onCreated: () => void;
}

export function SeguimientoForm({ clienteId, oportunidades = [], oportunidadId, onCreated }: Props) {
  const { submitting, error, fieldErrors, run } = useFormSubmit();
  const [form, setForm] = useState({
    tipo: 'TAREA' as TipoSeguimiento,
    asunto: '',
    descripcion: '',
    fechaProgramada: '',
    oportunidadId: oportunidadId ?? '',
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await apiFetch('/api/seguimientos', {
        method: 'POST',
        // datetime-local no incluye zona horaria: se envía en ISO para conservar la hora local del usuario
        json: { ...form, clienteId, fechaProgramada: form.fechaProgramada ? new Date(form.fechaProgramada).toISOString() : '' },
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Tipo" name="tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoSeguimiento })}>
          {Object.entries(TIPO_SEGUIMIENTO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <Input label="Fecha programada" name="fechaProgramada" type="datetime-local" value={form.fechaProgramada}
          error={fieldErrors.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} />
      </div>
      <Input label="Asunto" name="asunto" required value={form.asunto} error={fieldErrors.asunto}
        onChange={(e) => setForm({ ...form, asunto: e.target.value })} />
      {!oportunidadId && oportunidades.length > 0 && (
        <Select label="Oportunidad (opcional)" name="oportunidadId" value={form.oportunidadId}
          onChange={(e) => setForm({ ...form, oportunidadId: e.target.value })}>
          <option value="">Ninguna</option>
          {oportunidades.map((o) => (
            <option key={o.id} value={o.id}>{o.titulo}</option>
          ))}
        </Select>
      )}
      <Textarea label="Descripción" name="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>Guardar seguimiento</Button>
      </div>
    </form>
  );
}
