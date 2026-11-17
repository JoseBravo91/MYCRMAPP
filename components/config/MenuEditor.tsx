'use client';

import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Rol } from '@prisma/client';
import { apiFetch, ApiError } from '@/lib/api-client';
import { MODULOS, esExterno, type MenuNodo } from '@/lib/modules';
import { ROLES, ROL_LABEL } from '@/lib/auth/rbac';
import { assetUrl } from '@/lib/assets';
import { Card } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { AssetImage } from '@/components/ui/AssetImage';
import { SidebarNav } from '@/components/ui/Sidebar';
import { useToast } from '@/components/ui/Toast';
import { IconPicker } from './IconPicker';

type Tipo = 'modulo' | 'grupo' | 'enlace';

// ---------- Operaciones inmutables sobre el árbol (dos niveles) ----------

let tmp = 0;
const nuevoId = () => `nuevo-${Date.now()}-${++tmp}`;

function ubicar(menu: MenuNodo[], id: string): { padreId: string | null; index: number } | null {
  const i = menu.findIndex((n) => n.id === id);
  if (i >= 0) return { padreId: null, index: i };
  for (const p of menu) {
    const j = p.hijos.findIndex((h) => h.id === id);
    if (j >= 0) return { padreId: p.id, index: j };
  }
  return null;
}

function hermanos(menu: MenuNodo[], padreId: string | null) {
  return padreId ? (menu.find((n) => n.id === padreId)?.hijos ?? []) : menu;
}

function conHermanos(menu: MenuNodo[], padreId: string | null, lista: MenuNodo[]): MenuNodo[] {
  return padreId ? menu.map((n) => (n.id === padreId ? { ...n, hijos: lista } : n)) : lista;
}

function quitar(menu: MenuNodo[], id: string): { menu: MenuNodo[]; nodo: MenuNodo | null } {
  const loc = ubicar(menu, id);
  if (!loc) return { menu, nodo: null };
  const lista = [...hermanos(menu, loc.padreId)];
  const [nodo] = lista.splice(loc.index, 1);
  return { menu: conHermanos(menu, loc.padreId, lista), nodo };
}

function insertar(menu: MenuNodo[], nodo: MenuNodo, padreId: string | null, index?: number): MenuNodo[] {
  const lista = [...hermanos(menu, padreId)];
  lista.splice(index ?? lista.length, 0, nodo);
  return conHermanos(menu, padreId, lista);
}

function mover(menu: MenuNodo[], id: string, delta: -1 | 1): MenuNodo[] {
  const loc = ubicar(menu, id);
  if (!loc) return menu;
  const lista = [...hermanos(menu, loc.padreId)];
  const destino = loc.index + delta;
  if (destino < 0 || destino >= lista.length) return menu;
  [lista[loc.index], lista[destino]] = [lista[destino], lista[loc.index]];
  return conHermanos(menu, loc.padreId, lista);
}

const serializar = (menu: MenuNodo[]) =>
  JSON.stringify(
    menu.map(({ etiqueta, href, iconoId, visible, roles, hijos }) => ({
      etiqueta,
      href,
      iconoId,
      visible,
      roles,
      hijos: hijos.map(({ etiqueta, href, iconoId, visible, roles }) => ({ etiqueta, href, iconoId, visible, roles })),
    })),
  );

const esGrupo = (n: MenuNodo) => n.href === null;

// ---------- Formulario de elemento ----------

interface FormState {
  tipo: Tipo;
  etiqueta: string;
  modulo: string;
  enlace: string;
  iconoId: string | null;
  padreId: string;
  visible: boolean;
  roles: Rol[];
}

function aForm(n: MenuNodo | null, padreId: string | null): FormState {
  const tipo: Tipo = !n ? 'modulo' : esGrupo(n) ? 'grupo' : MODULOS.some((m) => m.href === n.href) ? 'modulo' : 'enlace';
  return {
    tipo,
    etiqueta: n?.etiqueta ?? '',
    modulo: tipo === 'modulo' ? (n?.href ?? MODULOS[0].href) : MODULOS[0].href,
    enlace: tipo === 'enlace' ? (n?.href ?? '') : '',
    iconoId: n?.iconoId ?? null,
    padreId: padreId ?? '',
    visible: n?.visible ?? true,
    roles: n?.roles ?? [],
  };
}

function ItemForm({
  nodo,
  padreId,
  grupos,
  onSave,
  onCancel,
}: {
  nodo: MenuNodo | null;
  padreId: string | null;
  grupos: MenuNodo[];
  onSave: (f: FormState) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<FormState>(() => aForm(nodo, padreId));
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tieneHijos = (nodo?.hijos.length ?? 0) > 0;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const etiqueta = f.etiqueta.trim() || (f.tipo === 'modulo' ? (MODULOS.find((m) => m.href === f.modulo)?.nombre ?? '') : '');
    if (!etiqueta) return setError('Escribe una etiqueta.');
    if (f.tipo === 'enlace' && !/^\/[a-zA-Z0-9\-_/]*$/.test(f.enlace) && !/^https:\/\/\S+$/i.test(f.enlace)) {
      return setError('El enlace debe ser una ruta interna (/ruta) o una URL que empiece por https://');
    }
    onSave({ ...f, etiqueta });
  }

  const urlIcono = assetUrl(f.iconoId);

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Alert>{error}</Alert>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Tipo de elemento</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['modulo', 'Módulo del CRM', 'Una sección existente'],
              ['grupo', 'Grupo', 'Agrupa otros elementos'],
              ['enlace', 'Enlace', 'Ruta o sitio externo'],
            ] as const
          ).map(([value, label, desc]) => {
            const disabled = (tieneHijos && value !== 'grupo') || (value === 'grupo' && !!f.padreId);
            return (
              <label
                key={value}
                className={`rounded-xl border p-3 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                  f.tipo === value ? 'border-brand bg-brand-light ring-1 ring-brand' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="tipo" value={value} checked={f.tipo === value} disabled={disabled} onChange={() => set('tipo', value)} className="sr-only" />
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                <span className="block text-xs text-slate-500">{desc}</span>
              </label>
            );
          })}
        </div>
        {tieneHijos && <p className="mt-2 text-xs text-slate-500">Este grupo tiene elementos dentro; sácalos primero para cambiar su tipo.</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {f.tipo === 'modulo' && (
          <Select label="Módulo" name="modulo" value={f.modulo} onChange={(e) => set('modulo', e.target.value)}>
            {MODULOS.map((m) => (
              <option key={m.href} value={m.href}>
                {m.nombre} ({m.href})
              </option>
            ))}
          </Select>
        )}
        {f.tipo === 'enlace' && (
          <Input label="Dirección" name="enlace" value={f.enlace} placeholder="/clientes o https://…" hint="Los enlaces https se abren en otra pestaña"
            onChange={(e) => set('enlace', e.target.value.trim())} />
        )}
        <Input label="Etiqueta" name="etiqueta" maxLength={40} value={f.etiqueta}
          placeholder={f.tipo === 'modulo' ? MODULOS.find((m) => m.href === f.modulo)?.nombre : 'Nombre visible en el menú'}
          onChange={(e) => set('etiqueta', e.target.value)} />
        {f.tipo !== 'grupo' && (
          <Select label="Ubicación" name="padreId" value={f.padreId} onChange={(e) => set('padreId', e.target.value)}>
            <option value="">Nivel principal</option>
            {grupos
              .filter((g) => g.id !== nodo?.id)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  Dentro de “{g.etiqueta}”
                </option>
              ))}
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${urlIcono ? 'bg-checker' : 'border border-dashed border-slate-300'}`}>
          <AssetImage src={urlIcono} size="lg" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Icono</p>
          <p className="text-xs text-slate-500">Opcional. Se muestra en un marco de 20 px.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>{urlIcono ? 'Cambiar' : 'Elegir'}</Button>
          {urlIcono && <Button size="sm" variant="ghost" onClick={() => set('iconoId', null)}>Quitar</Button>}
        </div>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Quién lo ve</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={f.roles.length === 0}
            onClick={() => set('roles', [])}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${f.roles.length === 0 ? 'bg-brand text-brand-fg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Todos los roles
          </button>
          {ROLES.map((r) => {
            const sel = f.roles.includes(r);
            return (
              <button
                key={r}
                type="button"
                aria-pressed={sel}
                onClick={() => set('roles', sel ? f.roles.filter((x) => x !== r) : [...f.roles, r])}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${sel ? 'bg-brand text-brand-fg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {ROL_LABEL[r]}
              </button>
            );
          })}
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={f.visible} onChange={(e) => set('visible', e.target.checked)} className="h-4 w-4 rounded accent-[rgb(var(--brand))]" />
          Mostrar en el menú
        </label>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{nodo ? 'Aplicar cambios' : 'Agregar al menú'}</Button>
      </div>
      <IconPicker open={picker} onClose={() => setPicker(false)} selectedId={f.iconoId} onSelect={(i) => set('iconoId', i?.id ?? null)} />
    </form>
  );
}

// ---------- Editor ----------

export function MenuEditor({ inicial }: { inicial: MenuNodo[] }) {
  const router = useRouter();
  const toast = useToast();
  const [menu, setMenu] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [editando, setEditando] = useState<{ nodo: MenuNodo | null; padreId: string | null } | null>(null);
  const [borrando, setBorrando] = useState<MenuNodo | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [rolVista, setRolVista] = useState<Rol>('ADMIN');
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => serializar(menu) !== serializar(guardado), [menu, guardado]);
  const grupos = menu.filter(esGrupo);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const vistaPrevia = useMemo(
    () =>
      menu
        .filter((n) => n.visible && (n.roles.length === 0 || n.roles.includes(rolVista)))
        .map((n) => ({ ...n, hijos: n.hijos.filter((h) => h.visible && (h.roles.length === 0 || h.roles.includes(rolVista))) }))
        .filter((n) => n.href || n.hijos.length),
    [menu, rolVista],
  );

  function aplicarForm(f: FormState) {
    const href = f.tipo === 'grupo' ? null : f.tipo === 'modulo' ? f.modulo : f.enlace;
    const destino = f.tipo === 'grupo' ? null : f.padreId || null;
    setMenu((m) => {
      const original = editando?.nodo;
      const base: MenuNodo = {
        id: original?.id ?? nuevoId(),
        etiqueta: f.etiqueta,
        href,
        iconoId: f.iconoId,
        visible: f.visible,
        roles: f.roles,
        hijos: original?.hijos ?? [],
      };
      if (!original) return insertar(m, base, destino);
      const loc = ubicar(m, original.id);
      if (loc && loc.padreId === destino) return conHermanos(m, destino, hermanos(m, destino).map((n) => (n.id === base.id ? base : n)));
      return insertar(quitar(m, original.id).menu, base, destino);
    });
    setEditando(null);
  }

  /** Al eliminar un grupo sus elementos pasan al nivel principal. */
  function eliminar(n: MenuNodo) {
    setMenu((m) => {
      const loc = ubicar(m, n.id);
      let next = quitar(m, n.id).menu;
      if (loc && n.hijos.length) n.hijos.forEach((h, i) => (next = insertar(next, h, null, loc.index + i)));
      return next;
    });
    setBorrando(null);
  }

  // Arrastrar y soltar: entre hermanos reordena; sobre un grupo lo mete dentro.
  function onDrop(e: DragEvent, objetivo: MenuNodo) {
    e.preventDefault();
    setSobre(null);
    const id = arrastrando;
    setArrastrando(null);
    if (!id || id === objetivo.id) return;
    setMenu((m) => {
      const origen = ubicar(m, id);
      const dest = ubicar(m, objetivo.id);
      const { menu: sin, nodo } = quitar(m, id);
      if (!origen || !dest || !nodo) return m;
      if (esGrupo(objetivo) && !esGrupo(nodo) && origen.padreId !== objetivo.id && nodo.hijos.length === 0) {
        return insertar(sin, nodo, objetivo.id);
      }
      if (esGrupo(nodo) && dest.padreId) return m; // los grupos no se anidan
      const idx = ubicar(sin, objetivo.id)!.index;
      return insertar(sin, nodo, dest.padreId, idx);
    });
  }

  async function guardar() {
    setSaving(true);
    try {
      const { data } = await apiFetch<{ data: MenuNodo[] }>('/api/configuracion/menu', { method: 'PUT', json: JSON.parse(serializar(menu)) });
      setMenu(data);
      setGuardado(data);
      toast('Menú actualizado');
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No se pudo guardar el menú', 'error');
    } finally {
      setSaving(false);
    }
  }

  function fila(n: MenuNodo, padreId: string | null, index: number, total: number) {
    const grupo = esGrupo(n);
    const url = assetUrl(n.iconoId);
    return (
      <div
        draggable
        onDragStart={(e) => {
          setArrastrando(n.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setArrastrando(null);
          setSobre(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(n.id);
        }}
        onDrop={(e) => onDrop(e, n)}
        className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition-all duration-150 ${
          arrastrando === n.id ? 'opacity-40' : ''
        } ${sobre === n.id && arrastrando !== n.id ? (grupo ? 'border-brand ring-2 ring-brand/30' : 'border-brand border-t-4') : 'border-slate-200'} ${
          !n.visible ? 'bg-slate-50' : ''
        }`}
      >
        <span className="cursor-grab select-none px-1 text-lg leading-none text-slate-300 active:cursor-grabbing" aria-hidden="true" title="Arrastrar">
          ⋮⋮
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${url ? 'bg-checker' : 'border border-dashed border-slate-200'}`}>
          <AssetImage src={url} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${n.visible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{n.etiqueta}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className={`rounded px-1.5 py-0.5 font-medium ${grupo ? 'bg-brand-light text-brand-ink' : 'bg-slate-100'}`}>
              {grupo ? `Grupo · ${n.hijos.length}` : esExterno(n.href) ? 'Externo' : n.href}
            </span>
            {n.roles.length > 0 && <span>{n.roles.map((r) => ROL_LABEL[r]).join(', ')}</span>}
            {!n.visible && <span className="font-medium text-amber-700">Oculto</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => setMenu((m) => mover(m, n.id, -1))} aria-label={`Subir ${n.etiqueta}`}
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30">↑</button>
          <button type="button" disabled={index === total - 1} onClick={() => setMenu((m) => mover(m, n.id, 1))} aria-label={`Bajar ${n.etiqueta}`}
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30">↓</button>
          <Button size="sm" variant="ghost" onClick={() => setEditando({ nodo: n, padreId })}>Editar</Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setBorrando(n)}>Eliminar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Estructura del menú</h2>
            <p className="text-sm text-slate-500">Arrastra para ordenar o suelta sobre un grupo para meter el elemento. También puedes usar las flechas.</p>
          </div>
          <Button icon="accion.nuevo" onClick={() => setEditando({ nodo: null, padreId: null })}>Agregar elemento</Button>
        </div>
        <ol className="space-y-2 p-5">
          {menu.map((n, i) => (
            <li key={n.id}>
              {fila(n, null, i, menu.length)}
              {esGrupo(n) && (
                <ol className="ml-6 mt-2 space-y-2 border-l-2 border-dashed border-slate-200 pl-4">
                  {n.hijos.map((h, j) => (
                    <li key={h.id}>
                      {fila(h, n.id, j, n.hijos.length)}
                    </li>
                  ))}
                  {n.hijos.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500">Arrastra elementos aquí o elige este grupo en “Ubicación”.</li>}
                </ol>
              )}
            </li>
          ))}
        </ol>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <p className={`text-sm ${dirty ? 'font-medium text-amber-700' : 'text-slate-500'}`}>{dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}</p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!dirty || saving} onClick={() => setMenu(guardado)}>Descartar</Button>
            <Button disabled={!dirty} loading={saving} onClick={guardar}>Guardar menú</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3 self-start xl:sticky xl:top-24">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Vista previa</p>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Ver como
            <select value={rolVista} onChange={(e) => setRolVista(e.target.value as Rol)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 focus:border-brand focus:outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
            </select>
          </label>
        </div>
        <div className="rounded-2xl bg-brand p-3 text-brand-fg shadow-card">
          {vistaPrevia.length ? <SidebarNav menu={vistaPrevia} pathname="/clientes" preview /> : <p className="p-3 text-xs opacity-75">Este rol no verá ningún elemento.</p>}
        </div>
        <p className="text-xs text-slate-500">Ocultar un módulo del menú no bloquea su acceso; los permisos de cada rol se siguen aplicando en el servidor.</p>
      </div>

      <Modal open={!!editando} onClose={() => setEditando(null)} title={editando?.nodo ? `Editar “${editando.nodo.etiqueta}”` : 'Nuevo elemento del menú'} size="lg">
        {editando && <ItemForm key={editando.nodo?.id ?? 'nuevo'} nodo={editando.nodo} padreId={editando.padreId} grupos={grupos} onSave={aplicarForm} onCancel={() => setEditando(null)} />}
      </Modal>

      <Modal open={!!borrando} onClose={() => setBorrando(null)} title="Quitar del menú">
        {borrando && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Se quitará <strong>{borrando.etiqueta}</strong> del menú
              {borrando.hijos.length > 0 && <> y sus {borrando.hijos.length} elementos pasarán al nivel principal</>}. El cambio se aplica al guardar.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBorrando(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => eliminar(borrando)}>Quitar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
