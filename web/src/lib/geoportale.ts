/**
 * Logica e utilita condivise per i dati del Geoportale SIT del Comune di Venezia.
 * I dati completi (DBGT, confini, patti territoriali, catalogo) risiedono in web/src/data/geoportale-venezia.json.
 */

import type {
  GeoportaleCatalogData,
  GeoportaleMunicipality,
  GeoportaleService,
  GeoportaleSestiere,
  GeoportaleThemeKey,
  GeoportaleTutelaZone,
} from './types';
import rawData from '@/data/geoportale-venezia.json';

export const GEOPORTALE_DATA = rawData as unknown as GeoportaleCatalogData;

/** Restituisce l'elenco dei servizi filtrati per tema. */
export function getServicesByTheme(theme: GeoportaleThemeKey): GeoportaleService[] {
  return GEOPORTALE_DATA.services.filter((s) => s.theme === theme);
}

/** Cerca servizi o livelli per testo (nome, descrizione, layer). */
export function searchGeoportale(query: string): GeoportaleService[] {
  const q = query.trim().toLowerCase();
  if (!q) return GEOPORTALE_DATA.services;
  return GEOPORTALE_DATA.services.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true;
    if (s.description.toLowerCase().includes(q)) return true;
    if (s.themeLabelIt.toLowerCase().includes(q)) return true;
    return s.layers.some((l) => l.name.toLowerCase().includes(q));
  });
}

/** Restituisce le 6 municipalita con poligoni DBGT e statistiche. */
export function getMunicipalities(): GeoportaleMunicipality[] {
  return GEOPORTALE_DATA.municipalities;
}

/** Restituisce i sestieri storici. */
export function getSestieri(): GeoportaleSestiere[] {
  return GEOPORTALE_DATA.sestieri;
}

/** Restituisce le zone di tutela territoriale e patti territoriali. */
export function getTutelaZones(): GeoportaleTutelaZone[] {
  return GEOPORTALE_DATA.tutelaZones;
}

/** Verifica se un punto [lon, lat] cade all'interno di un anello poligonale (ray casting). */
export function isPointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Trova la municipalita che contiene un punto [lon, lat], oppure null se fuori comune. */
export function findMunicipalityAtPoint(lon: number, lat: number): GeoportaleMunicipality | null {
  for (const m of GEOPORTALE_DATA.municipalities) {
    const [minX, minY, maxX, maxY] = m.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
      continue;
    }
    for (const ring of m.rings) {
      if (isPointInPolygon([lon, lat], ring)) {
        return m;
      }
    }
  }
  return null;
}
