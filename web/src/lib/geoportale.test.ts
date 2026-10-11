import { describe, expect, it } from 'vitest';
import {
  findMunicipalityAtPoint,
  GEOPORTALE_DATA,
  getMunicipalities,
  getServicesByTheme,
  getSestieri,
  getTutelaZones,
  isPointInPolygon,
  searchGeoportale,
} from './geoportale';

describe('geoportale helpers', () => {
  it('GEOPORTALE_DATA contiene dati validi e completi', () => {
    expect(GEOPORTALE_DATA.source).toContain('Comune di Venezia');
    expect(GEOPORTALE_DATA.license).toContain('IODL 2.0');
    expect(GEOPORTALE_DATA.nature).toBe('measured');
    expect(GEOPORTALE_DATA.services).toHaveLength(28);
    expect(GEOPORTALE_DATA.municipalities).toHaveLength(6);
    expect(GEOPORTALE_DATA.sestieri.length).toBeGreaterThanOrEqual(6);
    expect(GEOPORTALE_DATA.tutelaZones.length).toBeGreaterThanOrEqual(4);
  });

  it('getServicesByTheme filtra correttamente i temi', () => {
    const planning = getServicesByTheme('urbanistica_piani');
    expect(planning.length).toBeGreaterThan(0);
    for (const s of planning) {
      expect(s.theme).toBe('urbanistica_piani');
    }

    const dbgt = getServicesByTheme('confini_toponomastica');
    expect(dbgt.some((s) => s.name.includes('DBGT'))).toBe(true);
  });

  it('searchGeoportale trova servizi e layer per testo', () => {
    const scuole = searchGeoportale('scuole');
    expect(scuole.length).toBeGreaterThan(0);
    expect(scuole.some((s) => s.name.toLowerCase().includes('scuole'))).toBe(true);

    const wc = searchGeoportale('WC');
    expect(wc.length).toBeGreaterThan(0);
    expect(wc.some((s) => s.name.includes('Decoro'))).toBe(true);
  });

  it('isPointInPolygon ray-casting identifica punti interni ed esterni', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    expect(isPointInPolygon([5, 5], square)).toBe(true);
    expect(isPointInPolygon([15, 5], square)).toBe(false);
    expect(isPointInPolygon([-1, 5], square)).toBe(false);
  });

  it('findMunicipalityAtPoint individua la municipalita corretta per coordinate', () => {
    // Piazza San Marco -> Venezia Insulare
    const sanMarco = findMunicipalityAtPoint(12.339, 45.434);
    expect(sanMarco).not.toBeNull();
    expect(sanMarco?.id).toBe(1);
    expect(sanMarco?.name).toContain('Venezia insulare');

    // Mestre centro -> Mestre Carpenedo
    const mestre = findMunicipalityAtPoint(12.245, 45.495);
    expect(mestre).not.toBeNull();
    expect(mestre?.id).toBe(4);
    expect(mestre?.name).toContain('Mestre centro');

    // Punto fuori comune (es. Roma o Padova lontana)
    const outside = findMunicipalityAtPoint(11.0, 44.0);
    expect(outside).toBeNull();
  });

  it('getMunicipalities e getSestieri restituiscono liste ordinate e complete', () => {
    const mun = getMunicipalities();
    expect(mun).toHaveLength(6);
    expect(mun.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);

    const sest = getSestieri();
    expect(sest.map((s) => s.name)).toContain('Cannaregio');
    expect(sest.map((s) => s.name)).toContain('San Marco');
    expect(sest.map((s) => s.name)).toContain('Dorsoduro');

    const tutela = getTutelaZones();
    expect(tutela.some((t) => t.id.includes('MICROZONE'))).toBe(true);
    expect(tutela.some((t) => t.id.includes('PATTO'))).toBe(true);
  });
});
