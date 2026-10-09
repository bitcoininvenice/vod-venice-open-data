import type { CityAssetItem, CivicPoiItem, EvChargingItem, ParkingItem, UrbanTreeItem, VeniceWellItem, WifiVenue } from './types';
import osmPoi from '@/data/osm-poi.json';
import fountainsDataset from '@/data/fountains.json';
import { calculateDistanceMeters } from './geo';
import { EV_CHARGING_DATA, URBAN_TREES_DATA } from './urbanAssetsVeniceData';
import { OPEN_VENICE_WELLS } from './open-data-catalog';
import { CURATED_CITY_ASSETS, CURATED_PARKINGS } from './curatedCityAssets';

/**
 * Punti di interesse da OpenStreetMap (pipeline/import_osm_poi.py, ODbL) uniti agli elenchi
 * compilati a mano: una voce curata resta visibile, come "da verificare", solo se non coincide
 * con un punto OSM vicino.
 */
export const OSM_POI_META = {
  generatedAt: osmPoi.generatedAt,
  license: osmPoi.license,
  attribution: osmPoi.attribution,
  counts: osmPoi.counts,
} as const;

type Located = { lat: number; lon: number };

/** Voci curate che non hanno un corrispondente OSM entro `radiusM`. */
export function curatedNotInOsm<T extends Located>(curated: readonly T[], osm: readonly Located[], radiusM: number): T[] {
  return curated.filter((c) => !osm.some((o) => calculateDistanceMeters(c.lat, c.lon, o.lat, o.lon) <= radiusM));
}

const OSM_EV: EvChargingItem[] = osmPoi.evCharging.map((e) => ({
  id: e.id,
  name: e.name,
  operator: e.operator,
  location: e.location,
  lat: e.lat,
  lon: e.lon,
  totalSockets: e.totalSockets ?? null,
  availableSockets: null,
  powerKw: e.powerKw ?? null,
  socketTypes: e.socketTypes,
  openingHours: e.openingHours ?? null,
  source: 'OPENSTREETMAP',
  sourceUrl: e.sourceUrl,
}));

const OSM_PARKINGS: ParkingItem[] = osmPoi.parkings.map((p) => ({
  id: p.id,
  name: p.name,
  location: p.location,
  totalSpots: p.totalSpots ?? null,
  lat: p.lat,
  lon: p.lon,
  operator: p.operator,
  source: 'OPENSTREETMAP',
  sourceUrl: p.sourceUrl,
}));

const OSM_WELLS: VeniceWellItem[] = osmPoi.wells.map((w) => ({
  id: w.id,
  name: w.name,
  lat: w.lat,
  lon: w.lon,
  source: 'OPENSTREETMAP',
  sourceUrl: w.sourceUrl,
}));

const OSM_TREES: UrbanTreeItem[] = osmPoi.monumentalTrees.map((t) => ({
  id: t.id,
  species: t.species,
  commonName: t.commonName,
  location: t.location,
  lat: t.lat,
  lon: t.lon,
  heightMeters: t.heightMeters ?? null,
  circumferenceMeters: t.circumferenceMeters ?? null,
  masafRef: t.masafRef ?? null,
  source: 'OPENSTREETMAP',
  sourceUrl: t.sourceUrl,
}));

export const OPEN_EV_CHARGING: EvChargingItem[] = [...OSM_EV, ...curatedNotInOsm(EV_CHARGING_DATA, OSM_EV, 80)];

// Le grandi autorimesse sono spesso mappate in OSM senza capienza: confronto su 150 m
export const OPEN_PARKINGS: ParkingItem[] = [...OSM_PARKINGS, ...curatedNotInOsm(CURATED_PARKINGS, OSM_PARKINGS, 150)];

export const OPEN_MONUMENTAL_TREES: UrbanTreeItem[] = [...OSM_TREES, ...curatedNotInOsm(URBAN_TREES_DATA, OSM_TREES, 40)];

/**
 * Vere da pozzo: i punti OSM danno la posizione; le voci curate (con secolo, materiale e stile,
 * da verificare) restano tutte, segnando se la posizione coincide con un pozzo OSM entro 25 m.
 */
const curatedWells: VeniceWellItem[] = OPEN_VENICE_WELLS.map((w) => ({
  ...w,
  positionConfirmed: OSM_WELLS.some((o) => calculateDistanceMeters(w.lat, w.lon, o.lat, o.lon) <= 25),
}));
export const OPEN_WELLS: VeniceWellItem[] = [
  ...curatedWells,
  ...curatedNotInOsm(OSM_WELLS, OPEN_VENICE_WELLS, 25),
];

/** Fontanelle (OpenStreetMap) e altri punti cittadini dell'elenco curato. */
export const OPEN_FOUNTAINS: CityAssetItem[] = (fountainsDataset.data as CityAssetItem[]).map((f) => ({
  ...f,
  source: 'OPENSTREETMAP' as const,
  sourceUrl: 'osmId' in f ? `https://www.openstreetmap.org/node/${(f as { osmId: number }).osmId}` : undefined,
}));
export const OPEN_CITY_ASSETS: CityAssetItem[] = [...OPEN_FOUNTAINS, ...CURATED_CITY_ASSETS];

type RawCivic = {
  id: string; sourceUrl: string; lat: number; lon: number; name: string;
  operator?: string | null; openingHours?: string | null; website?: string | null; address?: string | null; zone: string;
};
const toCivic = (kind: CivicPoiItem['kind']) => (c: RawCivic): CivicPoiItem => ({
  id: c.id,
  kind,
  name: c.name,
  lat: c.lat,
  lon: c.lon,
  operator: c.operator ?? null,
  openingHours: c.openingHours ?? null,
  website: c.website ?? null,
  address: c.address ?? null,
  zone: c.zone,
  source: 'OPENSTREETMAP',
  sourceUrl: c.sourceUrl,
});

/** Ecocentri per ingombranti e differenziata (amenity=recycling, recycling_type=centre). */
export const OPEN_RECYCLING_CENTRES: CivicPoiItem[] = (osmPoi.recyclingCentres as RawCivic[]).map(toCivic('recycling'));

/** Biblioteche (amenity=library). */
export const OPEN_LIBRARIES: CivicPoiItem[] = (osmPoi.libraries as RawCivic[]).map(toCivic('library'));

/** Luoghi con Wi-Fi (internet_access=wlan o wifi=yes/free), con tipo di accesso dichiarato. */
export const OPEN_WIFI_VENUES: WifiVenue[] = (osmPoi.wifiVenues as Omit<WifiVenue, 'source'>[]).map((w) => ({
  ...w,
  name: w.name ?? null,
  ssid: w.ssid ?? null,
  address: w.address ?? null,
  website: w.website ?? null,
  source: 'OPENSTREETMAP',
}));
