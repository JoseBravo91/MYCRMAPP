import { describe, expect, it } from 'vitest';
import { contraste, hojaDeEstilos, paleta, PRESETS, textoSobre, tintaLegible, TEMA_POR_DEFECTO } from '@/lib/theme';

describe('tema', () => {
  it('calcula el contraste WCAG', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('elige texto blanco u oscuro según el fondo', () => {
    expect(textoSobre('#0033A0').toUpperCase()).toBe('#FFFFFF');
    expect(textoSobre('#FDE047').toUpperCase()).not.toBe('#FFFFFF');
  });

  it('oscurece colores claros hasta que sean legibles sobre blanco', () => {
    const tinta = tintaLegible('#FFD54F');
    expect(contraste(tinta, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(tintaLegible('#0033A0')).toBe('#0033A0');
  });

  it('todas las combinaciones sugeridas mantienen texto legible', () => {
    for (const { tema } of PRESETS) {
      for (const hex of [tema.primario, tema.acento]) {
        const p = paleta(hex);
        expect(contraste(p.base, p.texto)).toBeGreaterThanOrEqual(3);
        expect(contraste(p.tinta, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('genera variables CSS como tripletas RGB', () => {
    expect(hojaDeEstilos(TEMA_POR_DEFECTO)).toMatch(/--brand:\s*0 51 160/);
  });
});
