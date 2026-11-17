'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TipoSeguimiento } from '@prisma/client';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Card } from '@/components/ui/PageHeader';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SeguimientoForm } from '@/components/forms/SeguimientoForm';
import { TIPO_SEGUIMIENTO_LABEL, formatDateTime } from '@/lib/formatters';

interface SeguimientoRow {
  id: string;
  tipo: TipoSeguimiento;
  asunto: string;
  descripcion: string | null;
  fechaProgramada: string | null;
  completado: boolean;
  cliente: { id: string; nombre: string };
  oportunidad: { id: string; titulo: string } | null;
  owner: { nombre: string };
}

const TIPO_STYLE: Record<TipoSeguimiento, string> = {
  TAREA: 'bg-slate-100 text-slate-700',
  LLAMADA: 'bg-brand-light text-brand-ink',
  EMAIL: 'bg-purple-100 text-purple-700',
  REUNION: 'bg-accent-light text-accent-ink',
};

interface Props {
  clienteId?: string;
  oportunidadId?: string;
  oportunidades?: { id: string; titulo: string }[];
  title?: string;
}

/** Lista de seguimientos filtrable por cliente u oportunidad; permite crear y marcar completados. */
export function SeguimientosTable({ clienteId, oportunidadId, oportunidades, title = 'Seguimientos' }: Props) {
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [modal, setModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ahora] = useState(() => Date.now());
  const params = new URLSearchParams();
  if (clienteId) params.set('clienteId', clienteId);
  if (oportunidadId) params.set('oportunidadId', oportunidadId);
  if (soloPendientes) params.set('pendientes', 'true');
  const { data, loading, error, refetch } = useFetch<{ data: SeguimientoRow[] }>(`/api/seguimientos?${params}`);

  async function toggle(s: SeguimientoRow) {
    setActionError(null);
    try {
      await apiFetch(`/api/seguimientos/${s.id}`, { method: 'PATCH', json: { completado: !s.completado } });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo actualizar');
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} className="rounded border-slate-300 text-brand-ink focus:ring-brand" />
            Solo pendientes
          </label>
          {clienteId && <Button size="sm" onClick={() => setModal(true)}>Nuevo</Button>}
        </div>
      </div>
      {(error || actionError) && <div className="p-4"><Alert>{error ?? actionError}</Alert></div>}
      {loading && !data ? (
        <LoadingBlock />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="Sin seguimientos" description="Registra tareas, llamadas, correos o reuniones." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {data?.data.map((s) => {
            const vencido = !s.completado && s.fechaProgramada && new Date(s.fechaProgramada).getTime() < ahora;
            return (
              <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={s.completado}
                  onChange={() => toggle(s)}
                  aria-label={`Marcar "${s.asunto}" como ${s.completado ? 'pendiente' : 'completado'}`}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-ink focus:ring-brand"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={TIPO_STYLE[s.tipo]}>{TIPO_SEGUIMIENTO_LABEL[s.tipo]}</Badge>
                    <span className={`text-sm font-medium ${s.completado ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{s.asunto}</span>
                  </div>
                  {s.descripcion && <p className="mt-1 text-sm text-slate-500">{s.descripcion}</p>}
                  <p className={`mt-1 text-xs ${vencido ? 'font-medium text-red-600' : 'text-slate-400'}`}>
                    {s.fechaProgramada ? `${vencido ? 'Vencido · ' : ''}${formatDateTime(s.fechaProgramada)}` : 'Sin fecha'}
                    {!clienteId && (
                      <> · <Link href={`/clientes/${s.cliente.id}`} className="text-brand-ink hover:underline">{s.cliente.nombre}</Link></>
                    )}
                    {s.oportunidad && !oportunidadId && (
                      <> · <Link href={`/oportunidades/${s.oportunidad.id}`} className="text-brand-ink hover:underline">{s.oportunidad.titulo}</Link></>
                    )}
                    {' · '}{s.owner.nombre}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {clienteId && (
        <Modal open={modal} onClose={() => setModal(false)} title="Nuevo seguimiento">
          {modal && (
            <SeguimientoForm
              clienteId={clienteId}
              oportunidadId={oportunidadId}
              oportunidades={oportunidades}
              onCreated={() => {
                setModal(false);
                refetch();
              }}
            />
          )}
        </Modal>
      )}
    </Card>
  );
}
