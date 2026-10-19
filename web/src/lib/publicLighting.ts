import rawData from '@/data/public-lighting-venezia.json';
import { metersBetween } from './walkGraph';
import { formatTime, sunHoursFor, type SunHours } from './solar';

/**
 * Lampioni mappati su OpenStreetMap (pipeline/import_osm_street_lamps.py, ODbL). La copertura è parziale e non è
 * il censimento dei punti luce del Comune: nessun dato aperto ufficiale li elenca. Niente potenze, lumen o
 * temperature di colore stimate: solo supporto e tecnologia quando sono mappati.
 */
export type LampSupport = 'wall' | 'pole' | 'suspended';
export type LampMethod = 'led' | 'sodium' | 'metal_halide' | 'mercury' | 'fluorescent' | 'gas' | 'incandescent';

export interface PublicLightingPoint {
  id: number;
  lat: number;
  lon: number;
  support: LampSupport | null;
  method: LampMethod | null;
  osmUrl: string;
}

interface LightingDataset {
  generatedAt: string;
  source: string;
  attribution: string;
  note: string;
  count: number;
  /** [lon, lat, supporto (0-3), tecnologia (0-7), id del nodo OSM] */
  lamps: [number, number, number, number, number][];
}

const SUPPORTS: (LampSupport | null)[] = [null, 'wall', 'pole', 'suspended'];
const METHODS: (LampMethod | null)[] = [null, 'led', 'sodium', 'metal_halide', 'mercury', 'fluorescent', 'gas', 'incandescent'];

export const LIGHTING_DATA = rawData as unknown as LightingDataset;

export const OPEN_PUBLIC_LIGHTING: PublicLightingPoint[] = (LIGHTING_DATA.lamps ?? []).map(([lon, lat, s, m, id]) => ({
  id,
  lat,
  lon,
  support: SUPPORTS[s] ?? null,
  method: METHODS[m] ?? null,
  osmUrl: `https://www.openstreetmap.org/node/${id}`,
}));

export type LightingOperationalState = 'day_off' | 'dusk_igniting' | 'night_active' | 'dawn_dimming';

export interface PublicLightingStatus {
  state: LightingOperationalState;
  /** 0 di giorno, 1 di notte: solo per l'effetto sulla mappa */
  intensityFactor: number;
  /** tramonto e alba calcolati: l'orario reale di accensione dipende dai sensori crepuscolari */
  ignitionTime: string;
  extinctionTime: string;
  mappedCount: number;
}

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Luci accese o spente secondo il sole: si accendono fra tramonto e crepuscolo civile e si spengono fra alba
 * civile e alba. È una stima astronomica per la mappa, non lo stato reale degli impianti.
 */
export function getPublicLightingStatus(timeSeconds: number, date: Date = new Date()): PublicLightingStatus {
  const sun: SunHours = sunHoursFor(date);
  const s = ((timeSeconds % 86400) + 86400) % 86400;
  let state: LightingOperationalState = 'day_off';
  let intensityFactor = 0;
  if (s >= sun.set && s < sun.cDusk) {
    state = 'dusk_igniting';
    intensityFactor = smoothstep(sun.set, sun.cDusk, s);
  } else if (s >= sun.cDusk || s < sun.cDawn) {
    state = 'night_active';
    intensityFactor = 1;
  } else if (s >= sun.cDawn && s < sun.rise) {
    state = 'dawn_dimming';
    intensityFactor = 1 - smoothstep(sun.cDawn, sun.rise, s);
  }
  return { state, intensityFactor, ignitionTime: formatTime(sun.set), extinctionTime: formatTime(sun.rise), mappedCount: OPEN_PUBLIC_LIGHTING.length };
}

/** Lampione mappato più vicino a un punto, con la distanza */
export function nearestLightingPoint(points: PublicLightingPoint[], lat: number, lon: number): (PublicLightingPoint & { distanceMeters: number }) | null {
  let best: (PublicLightingPoint & { distanceMeters: number }) | null = null;
  for (const p of points) {
    const d = metersBetween(lon, lat, p.lon, p.lat);
    if (!best || d < best.distanceMeters) best = { ...p, distanceMeters: Math.round(d) };
  }
  return best;
}
