import rawData from '@/data/luggage-storage-venezia.json';
import { metersBetween } from './walkGraph';

/**
 * Depositi bagagli mappati su OpenStreetMap (pipeline/import_osm_luggage.py, ODbL): depositi custoditi e
 * armadietti, con nome, orari e pagamenti se mappati. Niente prezzi né valutazioni: non sono dati aperti.
 */
export type LuggageStorageType = 'locker' | 'staffed';

export interface LuggageStorageSpot {
  id: string;
  osmUrl: string;
  lat: number;
  lon: number;
  type: LuggageStorageType;
  name: string | null;
  address: string | null;
  openingHours: string | null;
  /** «cash», «cards» se mappati */
  payment: string[];
  indoor: boolean | null;
  website: string | null;
  /** chi l'ha mappato segnala che la posizione va verificata */
  positionToCheck: boolean;
}

interface LuggageDataset {
  generatedAt: string;
  source: string;
  attribution: string;
  count: number;
  spots: LuggageStorageSpot[];
}

export const LUGGAGE_DATA = rawData as unknown as LuggageDataset;
export const OPEN_LUGGAGE_STORAGE: LuggageStorageSpot[] = LUGGAGE_DATA.spots;

/** Depositi più vicini a un punto, con la distanza in metri */
export function nearestLuggageStorage(
  spots: LuggageStorageSpot[],
  lat: number,
  lon: number,
  limit = 5,
): (LuggageStorageSpot & { distanceMeters: number })[] {
  return spots
    .map((s) => ({ ...s, distanceMeters: Math.round(metersBetween(lon, lat, s.lon, s.lat)) }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
