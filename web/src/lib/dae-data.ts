import type { PublicDaeItem } from './types';
import osmDefibrillators from '@/data/osm-defibrillators.json';
import { CURATED_PUBLIC_DAE } from './open-data-catalog';
import { calculateDistanceMeters } from './geo';

/**
 * Defibrillatori (DAE).
 * Fonte principale: OpenStreetMap (emergency=defibrillator, ODbL), aggiornata da
 * pipeline/import_osm_defibrillators.py. Non esiste un dataset aperto ufficiale per Venezia.
 * Le voci dell'elenco curato restano visibili come "da verificare" solo se non coincidono
 * con un DAE già presente in OSM.
 */
export const OSM_DAE_META = {
  generatedAt: osmDefibrillators.generatedAt,
  license: osmDefibrillators.license,
  attribution: osmDefibrillators.attribution,
  count: osmDefibrillators.count,
} as const;

const OSM_DAE = osmDefibrillators.defibrillators as PublicDaeItem[];

/** Distanza sotto la quale una voce curata è considerata lo stesso DAE già mappato in OSM. */
const DUPLICATE_RADIUS_M = 60;

export const CURATED_DAE_TO_VERIFY: PublicDaeItem[] = CURATED_PUBLIC_DAE.filter(
  (c) => !OSM_DAE.some((o) => calculateDistanceMeters(c.lat, c.lon, o.lat, o.lon) <= DUPLICATE_RADIUS_M),
);

export const OPEN_PUBLIC_DAE: PublicDaeItem[] = [...OSM_DAE, ...CURATED_DAE_TO_VERIFY];

/** Solo i DAE confermati da una fonte aperta: da usare per statistiche e indicatori. */
export const VERIFIED_PUBLIC_DAE: PublicDaeItem[] = OSM_DAE;
