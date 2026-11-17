import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/auth/session';
import { getOportunidad } from '@/lib/services/oportunidades';
import { AppError } from '@/lib/errors';
import { idSchema } from '@/lib/validators';
import { formatCOP, formatDate, formatDateTime } from '@/lib/formatters';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { EtapaBadge } from '@/components/ui/Badge';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { SeguimientosTable } from '@/components/tables/SeguimientosTable';

export const metadata: Metadata = { title: 'Detalle de oportunidad' };

export default async function OportunidadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  if (!idSchema.safeParse(id).success) notFound();
  const op = await getOportunidad(user, id).catch((err) => {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  });

  const ponderado = (op.valorEstimado * op.probabilidad) / 100;

  return (
    <>
      <PageHeader
        title={op.titulo}
        subtitle={`Cliente: ${op.cliente.nombre}${op.cliente.empresa ? ` · ${op.cliente.empresa}` : ''}`}
        actions={
          <>
            <LinkButton href={`/oportunidades/${op.id}/editar`} variant="secondary" icon="accion.editar">Editar</LinkButton>
            <ConfirmDeleteButton endpoint={`/api/oportunidades/${op.id}`} redirectTo="/oportunidades" entidad="oportunidad" />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Resumen</h2>
            <EtapaBadge etapa={op.etapa} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Valor estimado</p>
            <p className="text-2xl font-bold text-brand-ink">{formatCOP(op.valorEstimado)}</p>
            <p className="text-xs text-slate-500">Ponderado: {formatCOP(ponderado)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Probabilidad · {op.probabilidad}%</p>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${op.probabilidad}%` }} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Cierre estimado</dt><dd>{formatDate(op.fechaCierreEstimada)}</dd></div>
            <div><dt className="text-xs text-slate-500">Responsable</dt><dd>{op.owner.nombre}</dd></div>
            <div><dt className="text-xs text-slate-500">Creada</dt><dd>{formatDate(op.createdAt)}</dd></div>
            <div><dt className="text-xs text-slate-500">Cerrada</dt><dd>{formatDateTime(op.cerradaEn)}</dd></div>
          </dl>
          <Link href={`/clientes/${op.cliente.id}`} className="block text-sm font-medium text-brand-ink hover:underline">Ver cliente →</Link>
          {op.descripcion && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Descripción</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{op.descripcion}</p>
            </div>
          )}
        </Card>
        <div className="lg:col-span-2">
          <SeguimientosTable clienteId={op.cliente.id} oportunidadId={op.id} title="Seguimientos de la oportunidad" />
        </div>
      </div>
    </>
  );
}
