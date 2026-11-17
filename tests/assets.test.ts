import { describe, expect, it } from 'vitest';
import { detectarFormato } from '@/lib/assets';

function png(w: number, h: number) {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const dv = new DataView(b.buffer);
  dv.setUint32(16, w);
  dv.setUint32(20, h);
  return b;
}

describe('detectarFormato', () => {
  it('reconoce PNG y lee sus dimensiones', () => {
    expect(detectarFormato(png(128, 64))).toEqual({ mime: 'image/png', ancho: 128, alto: 64 });
  });

  it('reconoce JPEG por su firma', () => {
    expect(detectarFormato(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime).toBe('image/jpeg');
  });

  it('rechaza SVG, HTML y archivos renombrados', () => {
    const enc = new TextEncoder();
    expect(detectarFormato(enc.encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectarFormato(enc.encode('<!doctype html><html></html>'))).toBeNull();
    expect(detectarFormato(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBeNull();
  });
});
