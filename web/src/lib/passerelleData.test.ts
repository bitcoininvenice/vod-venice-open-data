import { describe, expect, it } from 'vitest';
import { PASSERELLE_DATA } from './passerelleData';
import { LAYER_CATALOG } from './layerCatalog';

describe('dataset ufficiale passerelle CPSM & Veritas', () => {
  it('contiene tutte le 75 tratte censite nel piano ufficiale', () => {
    expect(PASSERELLE_DATA).toHaveLength(75);
  });

  it('ha id univoci per ogni tratta', () => {
    const ids = PASSERELLE_DATA.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ha uno sviluppo metrico complessivo coerente con il piano (3.743 m)', () => {
    const totalMeters = PASSERELLE_DATA.reduce((sum, p) => sum + p.lengthMeters, 0);
    expect(totalMeters).toBeCloseTo(3743, 0);
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
      expect(p.groundElevationCm).toBe(p.activationThresholdCm);
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
