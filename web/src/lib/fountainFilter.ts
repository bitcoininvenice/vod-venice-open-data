import type { CityAssetItem } from './types';
import { PROVIDERS } from './provenance/providers';

/** Fonte delle fontanelle mostrate: tutte (senza doppioni), solo Venice Tap Water, solo OpenStreetMap */
export type FountainFilter = 'all' | 'vtw' | 'osm';
export const FOUNTAIN_FILTERS: FountainFilter[] = ['all', 'vtw', 'osm'];

export const VENICE_TAP_WATER_URL = PROVIDERS.veniceTapWater.url;

/** Distanza entro cui una fontana OSM è considerata la stessa di Venice Tap Water (m) */
export const FOUNTAIN_MATCH_METERS = 25;

/**
 * Fontanelle da mostrare: con "tutte", dove le due fonti indicano la stessa fontana resta quella di
 * Venice Tap Water (fonte primaria, con lo stato aperta/chiusa).
 */
export function filterFountains(fountains: CityAssetItem[], filter: FountainFilter): CityAssetItem[] {
  if (filter === 'vtw') return fountains.filter((f) => f.source === 'VENICE_TAP_WATER');
  if (filter === 'osm') return fountains.filter((f) => f.source === 'OPENSTREETMAP');
  return fountains.filter((f) => !f.duplicateOf);
}
