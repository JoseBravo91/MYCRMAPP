'use client';

import { useState } from 'react';
import { useIconLibrary } from '@/hooks/useIconLibrary';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AssetImage } from '@/components/ui/AssetImage';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ImageCropper } from '@/components/ui/ImageCropper';

export interface IconoElegido {
  id: string;
  url: string;
  nombre: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  selectedId?: string | null;
  onSelect: (icono: IconoElegido | null) => void;
}

/** Selector de iconos de la biblioteca, con opción de subir uno nuevo sin salir del flujo. */
export function IconPicker({ open, onClose, title = 'Elegir icono', selectedId, onSelect }: Props) {
  const { iconos, loading, subir } = useIconLibrary(open);
  const [filtro, setFiltro] = useState('');
  const [cropper, setCropper] = useState(false);
  const visibles = iconos.filter((i) => i.nombre.toLowerCase().includes(filtro.trim().toLowerCase()));

  function elegir(icono: IconoElegido | null) {
    onSelect(icono);
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={title} description="Los iconos se muestran siempre dentro de un marco de tamaño fijo." size="lg">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre"
              aria-label="Buscar icono por nombre"
              className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
            <Button onClick={() => setCropper(true)}>Subir icono nuevo</Button>
          </div>
          {loading && iconos.length === 0 ? (
            <LoadingBlock />
          ) : visibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              {iconos.length === 0 ? 'Tu biblioteca está vacía. Sube tu primer icono.' : 'Ningún icono coincide con la búsqueda.'}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="listbox" aria-label="Iconos disponibles">
              {visibles.map((i) => {
                const sel = i.id === selectedId;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={sel}
                      onClick={() => elegir(i)}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
                        sel ? 'border-brand bg-brand-light ring-2 ring-brand/30' : 'border-slate-200 hover:border-brand hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-checker">
                        <AssetImage src={i.url} size="xl" alt="" />
                      </span>
                      <span className="w-full truncate text-xs font-medium text-slate-700">{i.nombre}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {selectedId && (
            <div className="flex justify-end border-t border-slate-200 pt-4">
              <Button variant="ghost" onClick={() => elegir(null)}>Quitar icono</Button>
            </div>
          )}
        </div>
      </Modal>
      <ImageCropper
        open={cropper}
        onClose={() => setCropper(false)}
        title="Nuevo icono"
        outputHeight={128}
        allowZoomOut
        askName
        previews={[16, 20, 24, 40]}
        onConfirm={async (blob, nombre) => {
          const asset = await subir(blob, nombre);
          elegir(asset);
        }}
      />
    </>
  );
}
