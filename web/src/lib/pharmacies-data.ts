import type { PharmacyItem } from './types';
import osmPharmacies from '@/data/osm-pharmacies.json';
import { CURATED_PHARMACIES } from './open-data-catalog';
import { calculateDistanceMeters } from './geo';

/**
 * Farmacie. Fonte principale: OpenStreetMap (amenity=pharmacy, ODbL), aggiornata da
 * pipeline/import_osm_pharmacies.py; le parafarmacie (dispensing=no) sono escluse.
 * I turni non sono open data: per la farmacia di turno si rimanda a PHARMACY_DUTY_URL.
 */
export const PHARMACY_DUTY_URL = 'https://www.aulss3.veneto.it/Farmacie-di-turno';

export const OSM_PHARMACIES_META = {
  generatedAt: osmPharmacies.generatedAt,
  license: osmPharmacies.license,
  attribution: osmPharmacies.attribution,
} as const;

type OsmPharmacy = PharmacyItem & { dispensing?: boolean };

const OSM_PHARMACIES: PharmacyItem[] = (osmPharmacies.pharmacies as OsmPharmacy[]).filter((p) => p.dispensing !== false);

const DUPLICATE_RADIUS_M = 60;

export const CURATED_PHARMACIES_TO_VERIFY: PharmacyItem[] = CURATED_PHARMACIES.filter(
  (c) => !OSM_PHARMACIES.some((o) => calculateDistanceMeters(c.lat, c.lon, o.lat, o.lon) <= DUPLICATE_RADIUS_M),
);

export const OPEN_PHARMACIES: PharmacyItem[] = [...OSM_PHARMACIES, ...CURATED_PHARMACIES_TO_VERIFY];

/** Solo le farmacie confermate da una fonte aperta: da usare per statistiche e indicatori. */
export const VERIFIED_PHARMACIES: PharmacyItem[] = OSM_PHARMACIES;
