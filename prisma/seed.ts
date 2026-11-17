import { PrismaClient, type EtapaOportunidad, type EstadoCliente, type TipoSeguimiento } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MENU_POR_DEFECTO } from '../lib/modules';
import { TEMA_POR_DEFECTO } from '../lib/theme';

const prisma = new PrismaClient();

// Credenciales de demostración solo para entornos locales; en producción se exigen por variable de entorno.
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'Demo1234*';

if (process.env.NODE_ENV === 'production' && !process.env.SEED_PASSWORD) {
  throw new Error('En producción define SEED_PASSWORD antes de ejecutar el seed');
}

const ETIQUETAS = [
  { nombre: 'VIP', color: '#FF6600' },
  { nombre: 'Referido', color: '#0033A0' },
  { nombre: 'Licitación', color: '#7C3AED' },
  { nombre: 'Recurrente', color: '#16A34A' },
];

const CLIENTES: {
  nombre: string;
  empresa: string;
  industria: string;
  ciudad: string;
  estado: EstadoCliente;
  etiquetas: string[];
  notas?: string;
}[] = [
  { nombre: 'Laura Restrepo', empresa: 'Café Andino SAS', industria: 'Alimentos y bebidas', ciudad: 'Medellín', estado: 'ACTIVO', etiquetas: ['VIP', 'Recurrente'], notas: 'Exporta café especial. Interesada en automatizar pedidos B2B.' },
  { nombre: 'Andrés Gómez', empresa: 'Textiles del Valle', industria: 'Manufactura textil', ciudad: 'Cali', estado: 'ACTIVO', etiquetas: ['Recurrente'] },
  { nombre: 'Paola Martínez', empresa: 'Clínica Dental Sonrisa', industria: 'Salud', ciudad: 'Bogotá', estado: 'PROSPECTO', etiquetas: ['Referido'], notas: 'Tres sedes. Quiere centralizar agenda de pacientes.' },
  { nombre: 'Jorge Castillo', empresa: 'Ferretería El Tornillo', industria: 'Comercio minorista', ciudad: 'Bucaramanga', estado: 'ACTIVO', etiquetas: [] },
  { nombre: 'Diana Rojas', empresa: 'AgroSoluciones Boyacá', industria: 'Agroindustria', ciudad: 'Tunja', estado: 'PROSPECTO', etiquetas: ['Licitación'] },
  { nombre: 'Carlos Ospina', empresa: 'Transportes Ospina', industria: 'Logística', ciudad: 'Barranquilla', estado: 'ACTIVO', etiquetas: ['VIP'] },
  { nombre: 'Natalia Vargas', empresa: 'Estudio Creativo NV', industria: 'Marketing', ciudad: 'Bogotá', estado: 'INACTIVO', etiquetas: [] },
  { nombre: 'Felipe Herrera', empresa: 'Constructora Herrera', industria: 'Construcción', ciudad: 'Pereira', estado: 'ACTIVO', etiquetas: ['Licitación', 'VIP'] },
  { nombre: 'Camila Torres', empresa: 'Moda Urbana CT', industria: 'Comercio electrónico', ciudad: 'Medellín', estado: 'PROSPECTO', etiquetas: ['Referido'] },
  { nombre: 'Ricardo Mejía', empresa: 'Hotel Mirador del Caribe', industria: 'Turismo', ciudad: 'Cartagena', estado: 'ACTIVO', etiquetas: ['Recurrente'] },
  { nombre: 'Sofía Cárdenas', empresa: 'Colegio Nuevo Horizonte', industria: 'Educación', ciudad: 'Manizales', estado: 'PROSPECTO', etiquetas: [] },
  { nombre: 'Mauricio Pineda', empresa: 'Lácteos La Pradera', industria: 'Alimentos y bebidas', ciudad: 'Villavicencio', estado: 'ACTIVO', etiquetas: ['Recurrente'] },
];

const OPORTUNIDADES: { cliente: number; titulo: string; valor: number; etapa: EtapaOportunidad; mesesAtras?: number }[] = [
  { cliente: 0, titulo: 'Portal de pedidos B2B', valor: 18_500_000, etapa: 'COTIZACION' },
  { cliente: 0, titulo: 'Soporte anual', valor: 6_000_000, etapa: 'GANADO', mesesAtras: 1 },
  { cliente: 1, titulo: 'Licencias CRM 15 usuarios', valor: 9_800_000, etapa: 'CIERRE' },
  { cliente: 1, titulo: 'Capacitación equipo comercial', valor: 2_400_000, etapa: 'GANADO', mesesAtras: 3 },
  { cliente: 2, titulo: 'Agenda centralizada multisede', valor: 14_000_000, etapa: 'PROSPECTO' },
  { cliente: 3, titulo: 'Inventario + facturación', valor: 7_200_000, etapa: 'PERDIDO', mesesAtras: 2 },
  { cliente: 4, titulo: 'Trazabilidad de cosechas', valor: 22_000_000, etapa: 'COTIZACION' },
  { cliente: 5, titulo: 'Gestión de flota', valor: 31_000_000, etapa: 'CIERRE' },
  { cliente: 5, titulo: 'Integración GPS', valor: 8_500_000, etapa: 'GANADO', mesesAtras: 0 },
  { cliente: 7, titulo: 'CRM para licitaciones públicas', valor: 27_500_000, etapa: 'PROSPECTO' },
  { cliente: 7, titulo: 'Tablero de obras', valor: 12_000_000, etapa: 'GANADO', mesesAtras: 4 },
  { cliente: 8, titulo: 'Tienda en línea + CRM', valor: 11_300_000, etapa: 'COTIZACION' },
  { cliente: 9, titulo: 'Fidelización de huéspedes', valor: 16_800_000, etapa: 'CIERRE' },
  { cliente: 9, titulo: 'Motor de reservas', valor: 9_900_000, etapa: 'PERDIDO', mesesAtras: 1 },
  { cliente: 10, titulo: 'Gestión de matrículas', valor: 8_000_000, etapa: 'PROSPECTO' },
  { cliente: 11, titulo: 'Ruteo de distribución', valor: 13_400_000, etapa: 'GANADO', mesesAtras: 2 },
];

const PROBABILIDAD: Record<EtapaOportunidad, number> = { PROSPECTO: 10, COTIZACION: 40, CIERRE: 75, GANADO: 100, PERDIDO: 0 };

const SEGUIMIENTOS: { cliente: number; tipo: TipoSeguimiento; asunto: string; dias: number; completado: boolean }[] = [
  { cliente: 0, tipo: 'REUNION', asunto: 'Presentar demo del portal B2B', dias: 2, completado: false },
  { cliente: 0, tipo: 'EMAIL', asunto: 'Enviar cotización actualizada', dias: -3, completado: true },
  { cliente: 1, tipo: 'LLAMADA', asunto: 'Confirmar número de licencias', dias: 1, completado: false },
  { cliente: 2, tipo: 'REUNION', asunto: 'Visita a sede principal', dias: 5, completado: false },
  { cliente: 4, tipo: 'TAREA', asunto: 'Preparar documentos de licitación', dias: -1, completado: false },
  { cliente: 5, tipo: 'LLAMADA', asunto: 'Negociar condiciones de pago', dias: 0, completado: false },
  { cliente: 7, tipo: 'EMAIL', asunto: 'Compartir caso de éxito del sector', dias: -7, completado: true },
  { cliente: 9, tipo: 'TAREA', asunto: 'Ajustar propuesta de fidelización', dias: 3, completado: false },
];

function hace(meses: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  d.setDate(Math.min(d.getDate(), 20));
  return d;
}

function enDias(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Limpiando datos previos…');
  await prisma.$transaction([
    prisma.menuItem.deleteMany(),
    prisma.configuracion.deleteMany(),
    prisma.usuario.updateMany({ data: { avatarId: null } }),
    prisma.asset.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.seguimiento.deleteMany(),
    prisma.oportunidad.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.etiqueta.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [admin, gerente, vendedor1, vendedor2] = await Promise.all([
    prisma.usuario.create({ data: { nombre: 'Administrador General', email: 'admin@mycrmapp.co', rol: 'ADMIN', passwordHash } }),
    prisma.usuario.create({ data: { nombre: 'Gloria Gerente', email: 'gerente@mycrmapp.co', rol: 'GERENTE', passwordHash } }),
    prisma.usuario.create({ data: { nombre: 'Valentina Ventas', email: 'vendedor@mycrmapp.co', rol: 'VENDEDOR', passwordHash } }),
    prisma.usuario.create({ data: { nombre: 'Santiago Comercial', email: 'vendedor2@mycrmapp.co', rol: 'VENDEDOR', passwordHash } }),
  ]);
  const vendedores = [vendedor1, vendedor2];

  const etiquetas = await Promise.all(ETIQUETAS.map((e) => prisma.etiqueta.create({ data: e })));
  const etiquetaId = (nombre: string) => etiquetas.find((e) => e.nombre === nombre)!.id;

  const clientes = [];
  for (const [i, c] of CLIENTES.entries()) {
    const owner = vendedores[i % 2];
    clientes.push(
      await prisma.cliente.create({
        data: {
          nombre: c.nombre,
          empresa: c.empresa,
          industria: c.industria,
          ciudad: c.ciudad,
          estado: c.estado,
          notas: c.notas,
          email: `${c.nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@${c.empresa
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z]/g, '')
            .slice(0, 14)}.co`,
          telefono: `+57 3${String(10 + i).padStart(2, '0')} ${String(1000000 + i * 7919).slice(0, 7)}`,
          ownerId: owner.id,
          etiquetas: { connect: c.etiquetas.map((n) => ({ id: etiquetaId(n) })) },
          createdAt: hace(i % 5),
        },
      }),
    );
  }

  for (const o of OPORTUNIDADES) {
    const cliente = clientes[o.cliente];
    const cerrada = o.etapa === 'GANADO' || o.etapa === 'PERDIDO';
    await prisma.oportunidad.create({
      data: {
        titulo: o.titulo,
        valorEstimado: o.valor,
        etapa: o.etapa,
        probabilidad: PROBABILIDAD[o.etapa],
        clienteId: cliente.id,
        ownerId: cliente.ownerId,
        fechaCierreEstimada: cerrada ? hace(o.mesesAtras ?? 0) : enDias(15 + o.valor / 1_000_000),
        cerradaEn: cerrada ? hace(o.mesesAtras ?? 0) : null,
        descripcion: `Propuesta de ${o.titulo.toLowerCase()} para ${cliente.empresa}.`,
      },
    });
  }

  for (const s of SEGUIMIENTOS) {
    const cliente = clientes[s.cliente];
    await prisma.seguimiento.create({
      data: {
        tipo: s.tipo,
        asunto: s.asunto,
        fechaProgramada: enDias(s.dias),
        completado: s.completado,
        completadoEn: s.completado ? enDias(s.dias) : null,
        clienteId: cliente.id,
        ownerId: cliente.ownerId,
      },
    });
  }

  // Menú y apariencia por defecto (sin iconos: se cargan desde Configuración)
  for (const [orden, n] of MENU_POR_DEFECTO.entries()) {
    const padre = await prisma.menuItem.create({ data: { etiqueta: n.etiqueta, href: n.href, orden, visible: n.visible, roles: n.roles } });
    for (const [o, h] of n.hijos.entries()) {
      await prisma.menuItem.create({ data: { etiqueta: h.etiqueta, href: h.href, orden: o, visible: h.visible, roles: h.roles, padreId: padre.id } });
    }
  }
  await prisma.configuracion.createMany({
    data: [
      { clave: 'tema', valor: { ...TEMA_POR_DEFECTO }, actualizadoPor: admin.id },
      { clave: 'marca', valor: { nombre: 'MyCrmApp', logoId: null, mostrarNombre: true }, actualizadoPor: admin.id },
      { clave: 'iconos', valor: {}, actualizadoPor: admin.id },
    ],
  });

  await prisma.auditLog.create({ data: { usuarioId: admin.id, accion: 'SEED', metadata: { gerente: gerente.email } } });

  console.log('Seed completado:');
  console.log(`  Usuarios: admin@, gerente@, vendedor@, vendedor2@mycrmapp.co (contraseña: ${process.env.SEED_PASSWORD ? '[SEED_PASSWORD]' : DEMO_PASSWORD})`);
  console.log(`  ${clientes.length} clientes, ${OPORTUNIDADES.length} oportunidades, ${SEGUIMIENTOS.length} seguimientos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
