import arpavAir from '@/data/arpav-air.json';
import type { AirQualityItem } from '@/lib/types';

/**
 * Limiti UE per le medie annue (µg/m³). Vigenti: Direttiva 2008/50/CE.
 * Dal 2030: Direttiva (UE) 2024/2881.
 */
export const EU_LIMITS = {
  current: { pm10: 40, pm25: 25, no2: 40, pm10Exceedances: 35 },
  from2030: { pm10: 20, pm25: 10, no2: 20, pm10Exceedances: 18 },
} as const;

type Measures = Pick<AirQualityItem, 'pm10' | 'pm25' | 'no2' | 'pm10Exceedances'>;

const within = (m: Measures, limits: Measures) =>
  (['pm10', 'pm25', 'no2', 'pm10Exceedances'] as const).every((k) => m[k] === null || (m[k] as number) <= (limits[k] as number));

export function classifyAirQuality(m: Measures): AirQualityItem['aqi'] {
  if (within(m, EU_LIMITS.from2030)) return 'BUONA';
  if (within(m, EU_LIMITS.current)) return 'ACCETTABILE';
  return 'SCADENTE';
}

interface RawStation extends Measures {
  id: string;
  stationName: string;
  stationType: string;
  location: string;
  year: number;
  lat: number | null;
  lon: number | null;
}

export const ARPAV_AIR_META = {
  generatedAt: arpavAir.generatedAt,
  source: arpavAir.source,
  sourceUrl: arpavAir.sourceUrl,
  license: arpavAir.license,
};

/** Stazioni ARPAV del Comune di Venezia con posizione (dati da pipeline/import_arpav_air.py). */
export const ARPAV_AIR_STATIONS: AirQualityItem[] = (arpavAir.stations as RawStation[])
  .filter((s): s is RawStation & { lat: number; lon: number } => s.lat !== null && s.lon !== null)
  .map((s) => ({
    ...s,
    aqi: classifyAirQuality(s),
    lastUpdate: `Media annua ${s.year} (dati validati ARPAV)`,
  }));
