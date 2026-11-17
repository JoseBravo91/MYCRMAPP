/**
 * Catálogo de lugares de la interfaz donde se puede mostrar un icono.
 * Ningún icono viene incluido: el administrador sube y asigna los suyos en Configuración → Iconos.
 */
export interface IconSlot {
  clave: string;
  nombre: string;
  descripcion: string;
  grupo: 'Indicadores' | 'Acciones' | 'Navegación' | 'Estados';
}

export const ICON_SLOTS: IconSlot[] = [
  { clave: 'kpi.clientes', nombre: 'Total clientes', descripcion: 'Tarjeta del dashboard', grupo: 'Indicadores' },
  { clave: 'kpi.pipeline', nombre: 'Valor del pipeline', descripcion: 'Tarjeta del dashboard', grupo: 'Indicadores' },
  { clave: 'kpi.abiertas', nombre: 'Oportunidades abiertas', descripcion: 'Tarjeta del dashboard', grupo: 'Indicadores' },
  { clave: 'kpi.conversion', nombre: 'Tasa de conversión', descripcion: 'Tarjeta del dashboard', grupo: 'Indicadores' },
  { clave: 'kpi.seguimientos', nombre: 'Seguimientos pendientes', descripcion: 'Tarjeta del dashboard', grupo: 'Indicadores' },
  { clave: 'accion.nuevo', nombre: 'Crear / Nuevo', descripcion: 'Botones "Nuevo cliente", "Nueva oportunidad"…', grupo: 'Acciones' },
  { clave: 'accion.editar', nombre: 'Editar', descripcion: 'Botones de edición', grupo: 'Acciones' },
  { clave: 'accion.eliminar', nombre: 'Eliminar', descripcion: 'Botones de eliminación', grupo: 'Acciones' },
  { clave: 'accion.ia', nombre: 'Analizar con IA', descripcion: 'Botón del detalle de cliente', grupo: 'Acciones' },
  { clave: 'accion.buscar', nombre: 'Buscar', descripcion: 'Campos de búsqueda', grupo: 'Acciones' },
  { clave: 'accion.salir', nombre: 'Cerrar sesión', descripcion: 'Menú del usuario', grupo: 'Acciones' },
  { clave: 'nav.menu', nombre: 'Abrir menú', descripcion: 'Botón del menú en móviles', grupo: 'Navegación' },
  { clave: 'nav.cerrar', nombre: 'Cerrar', descripcion: 'Botón de cerrar ventanas', grupo: 'Navegación' },
  { clave: 'nav.perfil', nombre: 'Mi perfil', descripcion: 'Menú del usuario', grupo: 'Navegación' },
  { clave: 'nav.configuracion', nombre: 'Configuración', descripcion: 'Menú del usuario', grupo: 'Navegación' },
  { clave: 'estado.vacio', nombre: 'Lista vacía', descripcion: 'Ilustración cuando no hay registros', grupo: 'Estados' },
];

export const SLOT_KEYS = new Set(ICON_SLOTS.map((s) => s.clave));
