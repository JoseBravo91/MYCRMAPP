'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { EstadoCliente } from '@prisma/client';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { EstadoBadge } from '@/components/ui/Badge';

interface ClienteRow {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  ciudad: string | null;
  estado: EstadoCliente;
  owner: { nombre: string };
  etiquetas: { id: string; nombre: string; color: string }[];
  _count: { oportunidades: number };
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export function ClientesTable({ showOwner }: { showOwner: boolean }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q);
  const { data, loading, error } = useFetch<Page<ClienteRow>>(
    `/api/clientes?page=${page}&pageSize=10&q=${encodeURIComponent(debouncedQ)}`,
  );

  return (
    <Card>
      <div className="border-b border-slate-200 p-4">
        <SearchInput
          value={q}
          placeholder="Buscar por nombre, email o empresa"
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
      </div>
      {error && <div className="p-4"><Alert>{error}</Alert></div>}
      {loading && !data ? (
        <LoadingBlock />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No hay clientes" description={debouncedQ ? 'Prueba con otra búsqueda.' : 'Crea tu primer cliente para empezar.'} />
      ) : (
        data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="hidden px-4 py-3 md:table-cell">Contacto</th>
                    <th scope="col" className="hidden px-4 py-3 lg:table-cell">Ciudad</th>
                    <th scope="col" className="px-4 py-3">Estado</th>
                    <th scope="col" className="hidden px-4 py-3 text-center sm:table-cell">Oport.</th>
                    {showOwner && <th scope="col" className="hidden px-4 py-3 lg:table-cell">Responsable</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
                  {data.data.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/clientes/${c.id}`} className="font-medium text-brand-ink hover:underline">
                          {c.nombre}
                        </Link>
                        {c.empresa && <p className="text-xs text-slate-500">{c.empresa}</p>}
                        {c.etiquetas.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.etiquetas.map((e) => (
                              <span key={e.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: e.color }}>
                                {e.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                        <p>{c.email ?? '—'}</p>
                        <p className="text-xs text-slate-400">{c.telefono ?? ''}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{c.ciudad ?? '—'}</td>
                      <td className="px-4 py-3"><EstadoBadge estado={c.estado} /></td>
                      <td className="hidden px-4 py-3 text-center text-slate-600 sm:table-cell">{c._count.oportunidades}</td>
                      {showOwner && <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{c.owner.nombre}</td>}
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
