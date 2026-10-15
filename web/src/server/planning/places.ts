import 'server-only';
import toponyms from '@/data/osm-toponyms.json';
import civiciDataset from '@/data/osm-civici.json';
import busStops from '@/data/actv-bus-stops.json';
import { addressLabel, buildAddressIndex, normalize, searchAddresses } from '@/lib/addresses';
import { findCivic, civicLabel, parseCivicQuery, type CivicRow, type SestiereCivico } from '@/lib/civici';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { ALILAGUNA_STOPS } from '@/lib/alilaguna-schedule';
import { AIRPORT, matchesAirport } from '@/lib/airportPlanner';

const CIVICI = civiciDataset.civici as unknown as Record<SestiereCivico, CivicRow[]>;

let index: ReturnType<typeof buildAddressIndex> | null = null;
/** Gazzettiere degli indirizzi OSM, costruito alla prima richiesta e tenuto in memoria */
export const addressIndex = () => (index ??= buildAddressIndex(toponyms.names as unknown as Record<string, [number, number][]>, CIVICI));

export type PlaceKind = 'coordinates' | 'airport' | 'civic' | 'stop' | 'address';

export interface ResolvedPlace {
  lat: number;
  lon: number;
  label: string;
  kind: PlaceKind;
  /** posizione approssimata (civico più vicino, centro della calle) */
  approximate: boolean;
  /** da dove viene la posizione */
  source: string;
}

interface StopEntry {
  name: string;
  lat: number;
  lon: number;
  operator: 'ACTV' | 'Alilaguna';
}

const STOPS: StopEntry[] = [
  ...ACTV_STOPS_REFERENCE.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon, operator: 'ACTV' as const })),
  ...(busStops as { stops: { name: string; lat: number; lon: number }[] }).stops.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon, operator: 'ACTV' as const })),
  ...ALILAGUNA_STOPS.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon, operator: 'Alilaguna' as const })),
];

/** Fermate ACTV e Alilaguna che corrispondono al nome (uguale, poi che inizia, poi che contiene) */
export function findStops(query: string, limit = 5): StopEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = STOPS.map((s) => {
    const n = normalize(s.name);
    return { s, score: n === q ? 3 : n.startsWith(q) ? 2 : n.includes(q) ? 1 : 0 };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || a.s.name.length - b.s.name.length);
  return scored.slice(0, limit).map((x) => x.s);
}

/** Fermate ACTV (pontili, tram, bus) e Alilaguna entro `radius` metri */
export function stopsNear(lat: number, lon: number, radius = 150): StopEntry[] {
  const k = Math.cos((lat * Math.PI) / 180) * 111320;
  return STOPS.filter((s) => Math.hypot((s.lon - lon) * k, (s.lat - lat) * 110540) <= radius);
}

const COORDS = /^\s*(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/;

/**
 * Luogo da un testo: coordinate «lat,lon», aeroporto, numero civico («Cannaregio 3450»), fermata ACTV o
 * Alilaguna, indirizzo (calle, campo, fondamenta…). null se non si trova nulla.
 */
export function resolvePlace(text: string): ResolvedPlace | null {
  const t = text.trim().slice(0, 100);
  if (!t) return null;
  const c = t.match(COORDS);
  if (c) {
    const lat = Number(c[1]);
    const lon = Number(c[2]);
    if (lat < 45 || lat > 45.8 || lon < 11.9 || lon > 12.8) return null;
    return { lat, lon, label: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, kind: 'coordinates', approximate: false, source: 'coordinate indicate' };
  }
  if (matchesAirport(t)) return { lat: AIRPORT.lat, lon: AIRPORT.lon, label: AIRPORT.label, kind: 'airport', approximate: false, source: 'terminal dell\'aeroporto' };
  const civic = parseCivicQuery(t);
  if (civic) {
    const m = findCivic(CIVICI[civic.sestiere] ?? [], civic);
    if (!m) return null;
    const label = civicLabel(civic.sestiere, civic.number, civic.letter);
    return {
      lat: m.lat,
      lon: m.lon,
      label: m.match === 'exact' ? label : `${label} (≈ ${civicLabel(m.sestiere, m.number, m.letter)})`,
      kind: 'civic',
      approximate: m.match !== 'exact',
      source: 'numeri civici OpenStreetMap (ODbL)',
    };
  }
  const stop = findStops(t, 1)[0];
  if (stop && normalize(stop.name).startsWith(normalize(t))) {
    return { lat: stop.lat, lon: stop.lon, label: stop.name, kind: 'stop', approximate: false, source: stop.operator === 'ACTV' ? 'fermate ACTV (GTFS)' : 'fermate Alilaguna (GTFS)' };
  }
  const addr = searchAddresses(addressIndex(), t, 1)[0];
  if (addr) return { lat: addr.lat, lon: addr.lon, label: addressLabel(addr), kind: 'address', approximate: true, source: 'gazzettiere OpenStreetMap di VOD (ODbL)' };
  if (stop) return { lat: stop.lat, lon: stop.lon, label: stop.name, kind: 'stop', approximate: false, source: stop.operator === 'ACTV' ? 'fermate ACTV (GTFS)' : 'fermate Alilaguna (GTFS)' };
  return null;
}
