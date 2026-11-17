import type { TipoAsset } from '@prisma/client';
import { AppError } from '@/lib/errors';

/** Límites por tipo. Las imágenes llegan ya recortadas desde el navegador. */
export const LIMITES: Record<TipoAsset, { maxBytes: number; maxLado: number }> = {
  ICON: { maxBytes: 256 * 1024, maxLado: 512 },
  LOGO: { maxBytes: 512 * 1024, maxLado: 1200 },
  AVATAR: { maxBytes: 512 * 1024, maxLado: 1024 },
};

type Formato = { mime: string; ancho: number | null; alto: number | null };

/**
 * Detecta el formato real por "magic bytes" (no se confía en el Content-Type ni en la extensión).
 * Solo se aceptan formatos raster: los SVG se rasterizan en el navegador antes de subirse,
 * lo que elimina cualquier script embebido.
 */
export function detectarFormato(buf: Uint8Array): Formato | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ancho: dv.getUint32(16), alto: dv.getUint32(20) };
  }
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ancho: null, alto: null };
  }
  const ascii = (o: number, n: number) => String.fromCharCode(...buf.subarray(o, o + n));
  if (buf.length > 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4);
    if (chunk === 'VP8X') {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { mime: 'image/webp', ancho: w, alto: h };
    }
    if (chunk === 'VP8L') {
      const bits = dv.getUint32(21, true);
      return { mime: 'image/webp', ancho: (bits & 0x3fff) + 1, alto: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8 ') {
      return { mime: 'image/webp', ancho: dv.getUint16(26, true) & 0x3fff, alto: dv.getUint16(28, true) & 0x3fff };
    }
    return { mime: 'image/webp', ancho: null, alto: null };
  }
  return null;
}

export async function leerImagen(file: FormDataEntryValue | null, tipo: TipoAsset) {
  if (!file || typeof file === 'string') throw new AppError(400, 'Debes adjuntar una imagen');
  const { maxBytes, maxLado } = LIMITES[tipo];
  if (file.size === 0) throw new AppError(400, 'La imagen está vacía');
  if (file.size > maxBytes) throw new AppError(413, `La imagen supera el máximo de ${Math.round(maxBytes / 1024)} KB`);

  const data = new Uint8Array(await file.arrayBuffer());
  const formato = detectarFormato(data);
  if (!formato) throw new AppError(415, 'Formato no soportado. Usa PNG, JPG o WebP');
  if ((formato.ancho ?? 0) > maxLado || (formato.alto ?? 0) > maxLado) {
    throw new AppError(400, `La imagen no puede superar ${maxLado}px por lado`);
  }
  return { data, ...formato, bytes: data.length };
}

export function assetUrl(id: string | null | undefined): string | null {
  return id ? `/api/assets/${id}` : null;
}
