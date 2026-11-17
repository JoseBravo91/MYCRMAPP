import { NextResponse } from 'next/server';
import { withAuth, readJson } from '@/lib/api/handler';
import { analizarSchema } from '@/lib/validators';
import { getCliente } from '@/lib/services/clientes';
import { analizarCliente, RateLimitError } from '@/lib/gemini';

export const POST = withAuth(async ({ req, user }) => {
  const { clienteId } = analizarSchema.parse(await readJson(req));
  const cliente = await getCliente(user, clienteId);

  try {
    const resultado = await analizarCliente(
      {
        id: cliente.id,
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        industria: cliente.industria,
        ciudad: cliente.ciudad,
        estado: cliente.estado,
        notas: cliente.notas,
        oportunidades: cliente.oportunidades.map((o) => ({
          titulo: o.titulo,
          etapa: o.etapa,
          probabilidad: o.probabilidad,
          valorEstimado: Number(o.valorEstimado),
        })),
        seguimientos: cliente.seguimientos.map((s) => ({ tipo: s.tipo, asunto: s.asunto, completado: s.completado })),
      },
      user.id,
    );
    return NextResponse.json(resultado);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de análisis por minuto. Intenta de nuevo en un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(err.retryAfterMs / 1000)) } },
      );
    }
    throw err;
  }
});
