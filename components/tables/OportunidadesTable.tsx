'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { EtapaOportunidad } from '@prisma/client';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { EtapaBadge } from '@/components/ui/Badge';
import { ETAPA_LABEL, formatCOP, formatDate } from '@/lib/formatters';
import type { OportunidadListItem } from '@/lib/services/oportunidades';

interface Page {
  data: OportunidadListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function OportunidadesTable({ showOwner }: { showOwner: boolean }) {
  const [q, setQ] = useState('');
  const [etapa, setEtapa] = useState<EtapaOportunidad | ''>('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q);
  const { data, loading, error } = useFetch<Page>(
    `/api/oportunidades?page=${page}&pageSize=10&q=${encodeURIComponent(debouncedQ)}${etapa ? `&etapa=${etapa}` : ''}`,
  );

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
        <SearchInput value={q} placeholder="Buscar por título o cliente" onChange={(v) => { setQ(v); setPage(1); }} />
        <select
          value={etapa}
          onChange={(e) => { setEtapa(e.target.value as EtapaOportunidad | ''); setPage(1); }}
          aria-label="Filtrar por etapa"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Todas las etapas</option>
          {Object.entries(ETAPA_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      {error && <div className="p-4"><Alert>{error}</Alert></div>}
      {loading && !data ? (
        <LoadingBlock />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No hay oportunidades" description="Ajusta los filtros o crea una nueva oportunidad." />
      ) : (
        data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Oportunidad</th>
                    <th scope="col" className="px-4 py-3">Etapa</th>
                    <th scope="col" className="px-4 py-3 text-right">Valor</th>
                    <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">Prob.</th>
                    <th scope="col" className="hidden px-4 py-3 md:table-cell">Cierre est.</th>
                    {showOwner && <th scope="col" className="hidden px-4 py-3 lg:table-cell">Responsable</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
                  {data.data.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/oportunidades/${o.id}`} className="font-medium text-brand-ink hover:underline">{o.titulo}</Link>
                        <p className="text-xs text-slate-500">{o.cliente.nombre}</p>
                      </td>
                      <td className="px-4 py-3"><EtapaBadge etapa={o.etapa} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">{formatCOP(o.valorEstimado)}</td>
                      <td className="hidden px-4 py-3 text-right text-slate-600 sm:table-cell">{o.probabilidad}%</td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{formatDate(o.fechaCierreEstimada)}</td>
                      {showOwner && <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{o.owner.nombre}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
          </>
        )
      )}
    </Card>
  );
}
