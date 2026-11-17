'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { ICON_SLOTS, type IconSlot } from '@/lib/icon-slots';
import { useIconLibrary, type IconAsset } from '@/hooks/useIconLibrary';
import { Card } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AssetImage } from '@/components/ui/AssetImage';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { useToast } from '@/components/ui/Toast';
import { IconPicker } from './IconPicker';

const GRUPOS: IconSlot['grupo'][] = ['Indicadores', 'Acciones', 'Navegación', 'Estados'];

export function IconsManager({ asignados: inicial }: { asignados: Record<string, string> }) {
  const router = useRouter();
  const toast = useToast();
  const { iconos, loading, refetch, subir } = useIconLibrary();
  const [asignados, setAsignados] = useState(inicial);
  const [slotEditando, setSlotEditando] = useState<IconSlot | null>(null);
  const [cropper, setCropper] = useState(false);
  const [borrando, setBorrando] = useState<IconAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const urlDe = (id?: string) => iconos.find((i) => i.id === id)?.url ?? (id ? `/api/assets/${id}` : null);
  const usosEnSlots = (id: string) => Object.values(asignados).filter((v) => v === id).length;

  async function asignar(slot: string, iconoId: string | null) {
    const next = { ...asignados };
    if (iconoId) next[slot] = iconoId;
    else delete next[slot];
    const prev = asignados;
    setAsignados(next);
    try {
      await apiFetch('/api/configuracion/iconos', { method: 'PUT', json: next });
      toast(iconoId ? 'Icono asignado' : 'Icono quitado');
      router.refresh();
    } catch (err) {
      setAsignados(prev);
      toast(err instanceof ApiError ? err.message : 'No se pudo guardar', 'error');
    }
  }

  async function eliminar() {
    if (!borrando) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/assets/${borrando.id}`, { method: 'DELETE' });
      setAsignados((a) => Object.fromEntries(Object.entries(a).filter(([, v]) => v !== borrando.id)));
      toast('Icono eliminado de la biblioteca');
      setBorrando(null);
      refetch();
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No se pudo eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const totalAsignados = Object.keys(asignados).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">Ubicaciones</h2>
          <p className="text-sm text-slate-500">
            {totalAsignados} de {ICON_SLOTS.length} con icono. Donde no asignes uno, la interfaz se muestra solo con texto.
          </p>
        </div>
        {GRUPOS.map((g) => (
          <section key={g} aria-labelledby={`grupo-${g}`}>
            <h3 id={`grupo-${g}`} className="bg-slate-50 px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">{g}</h3>
            <ul className="divide-y divide-slate-100">
              {ICON_SLOTS.filter((s) => s.grupo === g).map((s) => {
                const id = asignados[s.clave];
                return (
                  <li key={s.clave} className="flex items-center gap-4 px-5 py-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${id ? 'bg-checker' : 'border border-dashed border-slate-300'}`}>
                      <AssetImage src={urlDe(id)} size="lg" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{s.nombre}</p>
                      <p className="truncate text-xs text-slate-500">{s.descripcion}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setSlotEditando(s)}>{id ? 'Cambiar' : 'Elegir'}</Button>
                      {id && <Button size="sm" variant="ghost" onClick={() => asignar(s.clave, null)}>Quitar</Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </Card>

      <Card className="self-start xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Biblioteca</h2>
            <p className="text-sm text-slate-500">{iconos.length} iconos</p>
          </div>
          <Button size="sm" onClick={() => setCropper(true)}>Subir icono</Button>
        </div>
        {loading && iconos.length === 0 ? (
          <LoadingBlock />
        ) : iconos.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-800">Aún no hay iconos</p>
            <p className="mt-1 text-xs text-slate-500">Sube PNG, SVG, JPG o WebP. Podrás recortarlos y dejarles margen antes de guardar.</p>
          </div>
        ) : (
          <ul className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto p-4">
            {iconos.map((i) => {
              const usos = usosEnSlots(i.id) + i._count.itemsDeMenu;
              return (
                <li key={i.id} className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-2.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-checker">
                    <AssetImage src={i.url} size="xl" />
                  </span>
                  <span className="w-full truncate text-center text-xs font-medium text-slate-700" title={i.nombre}>{i.nombre}</span>
                  <span className="text-[10px] text-slate-400">{usos ? `En uso · ${usos}` : 'Sin usar'}</span>
                  <button
                    type="button"
                    onClick={() => setBorrando(i)}
                    className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 opacity-0 shadow-sm transition-opacity focus:opacity-100 group-hover:opacity-100"
                    aria-label={`Eliminar ${i.nombre}`}
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <IconPicker
        open={!!slotEditando}
        onClose={() => setSlotEditando(null)}
        title={slotEditando ? `Icono para "${slotEditando.nombre}"` : undefined}
        selectedId={slotEditando ? asignados[slotEditando.clave] : null}
        onSelect={(icono) => {
          if (slotEditando) asignar(slotEditando.clave, icono?.id ?? null);
          refetch();
        }}
      />
      <ImageCropper
        open={cropper}
        onClose={() => setCropper(false)}
        title="Nuevo icono"
        outputHeight={128}
        allowZoomOut
        askName
        previews={[16, 20, 24, 40]}
        onConfirm={async (blob, nombre) => {
          await subir(blob, nombre);
          toast('Icono agregado a la biblioteca');
        }}
      />
      <Modal open={!!borrando} onClose={() => setBorrando(null)} title="Eliminar icono">
        {borrando && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Se eliminará <strong>{borrando.nombre}</strong>
              {usosEnSlots(borrando.id) + borrando._count.itemsDeMenu > 0
                ? ` y se quitará de los ${usosEnSlots(borrando.id) + borrando._count.itemsDeMenu} lugares donde está en uso.`
                : '.'}{' '}
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBorrando(null)}>Cancelar</Button>
              <Button variant="danger" loading={deleting} onClick={eliminar}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
