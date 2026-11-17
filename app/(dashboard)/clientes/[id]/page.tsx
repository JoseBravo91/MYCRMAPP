import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/auth/session';
import { getCliente } from '@/lib/services/clientes';
import { AppError } from '@/lib/errors';
import { idSchema } from '@/lib/validators';
import { formatCOP, formatDate } from '@/lib/formatters';
import { PageHeader, Card } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { EstadoBadge, EtapaBadge } from '@/components/ui/Badge';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { GeminiAnalysis } from '@/components/AIAssistant/GeminiAnalysis';
import { SeguimientosTable } from '@/components/tables/SeguimientosTable';

export const metadata: Metadata = { title: 'Detalle de cliente' };

async function load(id: string) {
  const user = await requirePageUser();
  if (!idSchema.safeParse(id).success) notFound();
  try {
    return await getCliente(user, id);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );
}

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await load(id);

  return (
    <>
      <PageHeader
        title={cliente.nombre}
        subtitle={cliente.empresa ?? undefined}
        actions={
          <>
            <GeminiAnalysis clienteId={cliente.id} clienteNombre={cliente.nombre} />
            <LinkButton href={`/clientes/${cliente.id}/editar`} variant="secondary" icon="accion.editar">Editar</LinkButton>
            <ConfirmDeleteButton endpoint={`/api/clientes/${cliente.id}`} redirectTo="/clientes" entidad="cliente"
              descripcion="El cliente y sus oportunidades dejarán de mostrarse. El histórico se conserva en la base de datos." />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-4 font-semibold text-slate-900">Información</h2>
          <dl className="grid grid-cols-1 gap-4">
            <Dato label="Estado" value={<EstadoBadge estado={cliente.estado} />} />
            <Dato label="Email" value={cliente.email && <a href={`mailto:${cliente.email}`} className="text-brand-ink hover:underline">{cliente.email}</a>} />
            <Dato label="Teléfono" value={cliente.telefono} />
            <Dato label="Industria" value={cliente.industria} />
            <Dato label="Ciudad" value={cliente.ciudad} />
            <Dato label="Responsable" value={cliente.owner.nombre} />
            <Dato label="Cliente desde" value={formatDate(cliente.createdAt)} />
            {cliente.etiquetas.length > 0 && (
              <Dato
                label="Etiquetas"
                value={
                  <div className="flex flex-wrap gap-1">
                    {cliente.etiquetas.map((e) => (
                      <span key={e.id} className="rounded px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: e.color }}>{e.nombre}</span>
                    ))}
                  </div>
                }
              />
            )}
            {cliente.notas && <Dato label="Notas" value={<span className="whitespace-pre-line">{cliente.notas}</span>} />}
          </dl>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900">Oportunidades</h2>
              <Link href={`/oportunidades/nuevo?clienteId=${cliente.id}`} className="text-sm font-medium text-brand-ink hover:underline">
                + Nueva oportunidad
              </Link>
            </div>
            {cliente.oportunidades.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Este cliente aún no tiene oportunidades.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cliente.oportunidades.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <Link href={`/oportunidades/${o.id}`} className="text-sm font-medium text-brand-ink hover:underline">{o.titulo}</Link>
                      <p className="text-xs text-slate-500">Cierre estimado: {formatDate(o.fechaCierreEstimada)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">{formatCOP(Number(o.valorEstimado))}</span>
                      <EtapaBadge etapa={o.etapa} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <SeguimientosTable
            clienteId={cliente.id}
            oportunidades={cliente.oportunidades.map((o) => ({ id: o.id, titulo: o.titulo }))}
            title="Histórico de seguimientos"
          />
        </div>
      </div>
    </>
  );
}
