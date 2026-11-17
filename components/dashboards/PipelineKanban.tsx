'use client';

import { useState, type DragEvent } from 'react';
import Link from 'next/link';
import type { EtapaOportunidad } from '@prisma/client';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, ApiError } from '@/lib/api-client';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ETAPA_LABEL, formatCOP, formatDate } from '@/lib/formatters';
import { PROBABILIDAD_POR_ETAPA } from '@/lib/kpis';
import type { OportunidadListItem } from '@/lib/services/oportunidades';

const COLUMNAS: { etapa: EtapaOportunidad; color: string }[] = [
  { etapa: 'PROSPECTO', color: 'border-t-slate-400' },
  { etapa: 'COTIZACION', color: 'border-t-brand' },
  { etapa: 'CIERRE', color: 'border-t-accent' },
  { etapa: 'GANADO', color: 'border-t-green-600' },
  { etapa: 'PERDIDO', color: 'border-t-red-600' },
];

/** Tablero Kanban con drag & drop nativo y actualización optimista de la etapa. */
export function PipelineKanban({ showOwner }: { showOwner: boolean }) {
  const { data, loading, error } = useFetch<{ data: OportunidadListItem[] }>('/api/oportunidades?vista=pipeline');
  const [local, setLocal] = useState<OportunidadListItem[] | null>(null);
  const [dragOver, setDragOver] = useState<EtapaOportunidad | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const items = local ?? data?.data ?? [];

  async function mover(id: string, etapa: EtapaOportunidad) {
    const previo = items;
    const actual = previo.find((o) => o.id === id);
    if (!actual || actual.etapa === etapa) return;
    setMoveError(null);
    setLocal(previo.map((o) => (o.id === id ? { ...o, etapa, probabilidad: PROBABILIDAD_POR_ETAPA[etapa] } : o)));
    try {
      await apiFetch(`/api/oportunidades/${id}`, { method: 'PATCH', json: { etapa } });
    } catch (err) {
      setLocal(previo);
      setMoveError(err instanceof ApiError ? err.message : 'No se pudo mover la oportunidad');
    }
  }

  function onDrop(e: DragEvent, etapa: EtapaOportunidad) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) mover(id, etapa);
  }

  if (loading && !data) return <LoadingBlock />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-3">
      <Alert>{moveError}</Alert>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNAS.map(({ etapa, color }) => {
          const col = items.filter((o) => o.etapa === etapa);
          const total = col.reduce((s, o) => s + o.valorEstimado, 0);
          return (
            <section
              key={etapa}
              aria-label={ETAPA_LABEL[etapa]}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(etapa);
              }}
              onDragLeave={() => setDragOver((d) => (d === etapa ? null : d))}
              onDrop={(e) => onDrop(e, etapa)}
              className={`flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-slate-100 ${color} ${dragOver === etapa ? 'ring-2 ring-accent' : ''}`}
            >
              <header className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{ETAPA_LABEL[etapa]}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">{col.length}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatCOP(total)}</p>
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-3">
                {col.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', o.id)}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <Link href={`/oportunidades/${o.id}`} className="text-sm font-medium text-slate-900 hover:text-brand-ink">
                      {o.titulo}
                    </Link>
                    <p className="text-xs text-slate-500">{o.cliente.nombre}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-ink">{formatCOP(o.valorEstimado)}</span>
                      <span className="text-slate-500">{o.probabilidad}%</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatDate(o.fechaCierreEstimada)}</span>
                      {showOwner && <span>{o.owner.nombre}</span>}
                    </div>
                    {/* Alternativa accesible al drag & drop (teclado y móviles) */}
                    <label className="sr-only" htmlFor={`etapa-${o.id}`}>Mover a etapa</label>
                    <select
                      id={`etapa-${o.id}`}
                      value={o.etapa}
                      onChange={(e) => mover(o.id, e.target.value as EtapaOportunidad)}
                      className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 lg:hidden"
                    >
                      {COLUMNAS.map((c) => (
                        <option key={c.etapa} value={c.etapa}>{ETAPA_LABEL[c.etapa]}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
