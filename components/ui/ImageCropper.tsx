'use client';

/* eslint-disable @next/next/no-img-element -- vistas previas locales (blob:) */
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Modal } from './Modal';
import { Button } from './Button';
import { Alert } from './Alert';
import { Input } from './FormField';

export interface AspectOption {
  label: string;
  value: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Proporciones permitidas; la primera es la predeterminada */
  aspects?: AspectOption[];
  /** Alto final en píxeles (el ancho sale de la proporción) */
  outputHeight: number;
  format?: 'image/png' | 'image/webp';
  round?: boolean;
  /** Permite alejar la imagen para dejar margen (útil en iconos y logos) */
  allowZoomOut?: boolean;
  /** Tamaños (px de alto) en los que se muestra la vista previa */
  previews?: number[];
  askName?: boolean;
  onConfirm: (blob: Blob, nombre: string) => Promise<void>;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

/**
 * Dibuja el área recortada en un canvas del tamaño final. Al re-codificar en el navegador,
 * los SVG quedan rasterizados y se descarta cualquier metadato o script del archivo original.
 */
async function recortar(src: string, area: Area, outW: number, outH: number, format: string): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.imageSmoothingQuality = 'high';
  const scale = outW / area.width;
  ctx.drawImage(img, -area.x * scale, -area.y * scale, (img.naturalWidth || 512) * scale, (img.naturalHeight || 512) * scale);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), format, 0.9),
  );
}

export function ImageCropper({
  open,
  onClose,
  title,
  aspects = [{ label: 'Cuadrado', value: 1 }],
  outputHeight,
  format = 'image/png',
  round = false,
  allowZoomOut = false,
  previews = [],
  askName = false,
  onConfirm,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [aspect, setAspect] = useState(aspects[0].value);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const outW = Math.round(outputHeight * aspect);

  const reset = useCallback(() => {
    setSrc((s) => {
      if (s) URL.revokeObjectURL(s);
      return null;
    });
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    setNombre('');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setArea(null);
    setError(null);
    setAspect(aspects[0].value);
  }, [aspects]);

  function cerrar() {
    reset();
    onClose();
  }

  function elegir(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) return setError('Formato no soportado. Usa PNG, JPG, WebP, SVG o GIF.');
    if (file.size > MAX_INPUT_BYTES) return setError('El archivo supera 8 MB.');
    setSrc(URL.createObjectURL(file));
    setNombre(file.name.replace(/\.[^.]+$/, '').slice(0, 80));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    elegir(e.dataTransfer.files?.[0]);
  }

  // Vista previa del resultado final, recalculada con un pequeño retardo mientras se ajusta.
  useEffect(() => {
    if (!src || !area) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const blob = await recortar(src, area, outW, outputHeight, format);
        if (cancelled) return;
        setPreview((p) => {
          if (p) URL.revokeObjectURL(p);
          return URL.createObjectURL(blob);
        });
      } catch {
        // la vista previa es opcional
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [src, area, outW, outputHeight, format]);

  async function confirmar() {
    if (!src || !area) return;
    if (askName && !nombre.trim()) return setError('Ponle un nombre para encontrarlo después.');
    setSaving(true);
    setError(null);
    try {
      await onConfirm(await recortar(src, area, outW, outputHeight, format), nombre.trim() || 'imagen');
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la imagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title={title} size="lg">
      {!src ? (
        <div className="space-y-4">
          <Alert>{error}</Alert>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
              dragging ? 'border-brand bg-brand-light' : 'border-slate-300 hover:border-brand hover:bg-slate-50'
            }`}
          >
            <span className="text-sm font-semibold text-slate-900">Arrastra una imagen aquí o haz clic para elegirla</span>
            <span className="text-xs text-slate-500">PNG, JPG, WebP, SVG o GIF · máximo 8 MB</span>
          </button>
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => elegir(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="relative h-72 overflow-hidden rounded-xl bg-checker sm:h-80">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                minZoom={allowZoomOut ? 0.3 : 1}
                maxZoom={5}
                zoomSpeed={0.15}
                restrictPosition={!allowZoomOut}
                cropShape={round ? 'round' : 'rect'}
                showGrid={!round}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)}
              />
            </div>
            <div>
              <label htmlFor="crop-zoom" className="mb-1 flex justify-between text-sm font-medium text-slate-700">
                <span>Zoom</span>
                <span className="tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span>
              </label>
              <input
                id="crop-zoom"
                type="range"
                min={allowZoomOut ? 0.3 : 1}
                max={5}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[rgb(var(--brand))]"
              />
              <p className="mt-1 text-xs text-slate-500">
                Arrastra la imagen para encuadrarla{allowZoomOut ? '. Aléjala para dejar margen alrededor.' : '.'}
              </p>
            </div>
            {aspects.length > 1 && (
              <div role="radiogroup" aria-label="Proporción" className="flex flex-wrap gap-2">
                {aspects.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    role="radio"
                    aria-checked={aspect === a.value}
                    onClick={() => setAspect(a.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      aspect === a.value ? 'bg-brand text-brand-fg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {askName && <Input label="Nombre" name="asset-nombre" required value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} />}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Vista previa</p>
              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-checker p-4">
                {preview ? (
                  (previews.length ? previews : [outputHeight / 2]).map((h) => (
                    <img
                      key={h}
                      src={preview}
                      alt=""
                      style={{ height: h, width: Math.round(h * aspect) }}
                      className={`object-contain ${round ? 'rounded-full' : ''}`}
                    />
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Generando…</span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Tamaño final: {outW}×{outputHeight}px
              </p>
            </div>
            <Alert>{error}</Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={confirmar} loading={saving} disabled={!area}>
                Guardar imagen
              </Button>
              <Button variant="secondary" onClick={reset} disabled={saving}>
                Elegir otra imagen
              </Button>
            </div>
          </aside>
        </div>
      )}
    </Modal>
  );
}
