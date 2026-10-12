import { describe, expect, it } from 'vitest';
import { PASSERELLE_DATA, PASSERELLE_ROUTES, PASSERELLE_TOTAL_METERS } from './passerelleData';
import { PASSERELLE_MIN_THRESHOLD_CM, expectedPasserelle, isPasserellaExpected } from './passerelle';
import { LAYER_CATALOG } from './layerCatalog';

describe('dataset ufficiale passerelle CPSM & Veritas', () => {
  it('contiene i 72 percorsi della tabella (più la variante di T 9.1 A)', () => {
    expect(PASSERELLE_ROUTES).toHaveLength(72);
    expect(PASSERELLE_DATA.filter((p) => p.variantOf)).toHaveLength(1);
    // le due righe in rosso, senza lunghezza né quota, non sono percorsi
    expect(PASSERELLE_DATA.every((p) => p.lengthMeters > 0)).toBe(true);
  });

  it('ha id univoci per ogni tratta', () => {
    const ids = PASSERELLE_DATA.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('somma le lunghezze della tabella senza contare due volte la variante (3.715 m)', () => {
    expect(PASSERELLE_TOTAL_METERS).toBeCloseTo(3715, 0);
  });

  it('un percorso è previsto quando la marea raggiunge la sua quota', () => {
    expect(Math.min(...PASSERELLE_ROUTES.map((p) => p.activationThresholdCm))).toBe(PASSERELLE_MIN_THRESHOLD_CM);
    const ferrovia = PASSERELLE_ROUTES.find((p) => p.id === 'PASS-T3.2A')!;
    expect(isPasserellaExpected(ferrovia, 139)).toBe(false);
    expect(isPasserellaExpected(ferrovia, 140)).toBe(true);
    expect(expectedPasserelle(PASSERELLE_ROUTES, 79)).toHaveLength(0);
    expect(expectedPasserelle(PASSERELLE_ROUTES, null)).toHaveLength(0);
    expect(expectedPasserelle(PASSERELLE_ROUTES, 140)).toHaveLength(72);
  });

  it('include tutti i sestieri storici e le isole previste', () => {
    const districts = new Set(PASSERELLE_DATA.map((p) => p.district));
    expect(districts).toContain('San Marco');
    expect(districts).toContain('Castello');
    expect(districts).toContain('Cannaregio');
    expect(districts).toContain('San Polo');
    expect(districts).toContain('Santa Croce');
    expect(districts).toContain('Dorsoduro');
    expect(districts).toContain('Giudecca');
    expect(districts).toContain('Murano');
    expect(districts).toContain('Burano');
    expect(districts).toContain('San Michele');
  });

  it('ha quote operative ZMPS comprese tra 80 cm (San Marco) e 140 cm (Ferrovia)', () => {
    for (const p of PASSERELLE_DATA) {
      expect(p.activationThresholdCm).toBeGreaterThanOrEqual(80);
      expect(p.activationThresholdCm).toBeLessThanOrEqual(140);
    }
  });

  it('ha coordinate geografiche valide all interno della laguna di Venezia', () => {
    for (const p of PASSERELLE_DATA) {
      expect(p.path.length).toBeGreaterThanOrEqual(2);
      for (const [lon, lat] of p.path) {
        expect(lon).toBeGreaterThanOrEqual(12.30);
        expect(lon).toBeLessThanOrEqual(12.45);
        expect(lat).toBeGreaterThanOrEqual(45.41);
        expect(lat).toBeLessThanOrEqual(45.50);
      }
    }
  });

  it('ha promosso il layer passerelle a regime static nel catalogo ufficiale', () => {
    const layer = LAYER_CATALOG.find((l) => l.id === 'passerelle');
    expect(layer).toBeDefined();
    expect(layer?.regime).toBe('static');
    expect(layer?.institution).toContain('CPSM');
    expect(layer?.institution).toContain('Veritas');
  });
});
