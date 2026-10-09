import type { AirForecast, PollenFamilyItem, PollenKey, PollenLevel } from '@/lib/types';

/**
 * Qualità dell'aria, pollini e indice UV da Open-Meteo Air Quality (modello Copernicus CAMS,
 * CC BY 4.0). Sono previsioni di modello nel punto richiesto, non misure di una centralina.
 */
export const CAMS_SOURCE = 'Copernicus CAMS via Open-Meteo Air Quality';
export const CAMS_LICENSE = 'CC BY 4.0 – Copernicus Atmosphere Monitoring Service / Open-Meteo.com';

export const POLLEN_KEYS: PollenKey[] = ['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed'];

/** Soglie indicative (granuli/m³) per BASSO / MEDIO / ALTO, sul modello delle classi ARPAV per famiglia. */
const POLLEN_THRESHOLDS: Record<PollenKey, [number, number]> = {
  alder: [16, 50], // Betulaceae
  birch: [16, 50], // Betulaceae
  grass: [10, 30], // Graminaceae
  olive: [5, 25], // Oleaceae
  mugwort: [5, 25], // Compositae
  ragweed: [5, 25], // Compositae
};

const LEVEL_RANK: Record<PollenLevel, number> = { ASSENTE: 0, BASSO: 1, MEDIO: 2, ALTO: 3 };

export function pollenLevel(key: PollenKey, grains: number | null): PollenLevel {
  if (grains === null || grains < 0.5) return 'ASSENTE';
  const [medium, high] = POLLEN_THRESHOLDS[key];
  return grains >= high ? 'ALTO' : grains >= medium ? 'MEDIO' : 'BASSO';
}

export function overallPollenLevel(pollens: PollenFamilyItem[]): PollenLevel {
  return pollens.reduce<PollenLevel>((acc, p) => (LEVEL_RANK[p.level] > LEVEL_RANK[acc] ? p.level : acc), 'ASSENTE');
}

/** Indice europeo della qualità dell'aria -> classe (soglie EEA). */
export function europeanAqiBand(aqi: number | null): 'good' | 'fair' | 'moderate' | 'poor' | 'veryPoor' | 'extremelyPoor' | null {
  if (aqi === null) return null;
  if (aqi <= 20) return 'good';
  if (aqi <= 40) return 'fair';
  if (aqi <= 60) return 'moderate';
  if (aqi <= 80) return 'poor';
  if (aqi <= 100) return 'veryPoor';
  return 'extremelyPoor';
}

export function airQualityUrl(points: Array<{ lat: number; lon: number }>): string {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(4)).join(','),
    longitude: points.map((p) => p.lon.toFixed(4)).join(','),
    current: ['pm10', 'pm2_5', 'nitrogen_dioxide', 'ozone', 'european_aqi', 'uv_index', ...POLLEN_KEYS.map((k) => `${k}_pollen`)].join(','),
    hourly: 'european_aqi,uv_index',
    forecast_days: '2',
    timezone: 'Europe/Rome',
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
}

export interface CamsPoint {
  air: AirForecast;
  pollens: PollenFamilyItem[];
}

type Num = number | null | undefined;
interface RawPoint {
  current?: Record<string, Num | string>;
  hourly?: { time?: string[]; european_aqi?: Num[]; uv_index?: Num[] };
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

export function parseAirQuality(raw: unknown): CamsPoint[] {
  const points = (Array.isArray(raw) ? raw : [raw]) as RawPoint[];
  return points.map((p) => {
    const c = p.current;
    if (!c || typeof c.time !== 'string') throw new Error('punto senza valori correnti');
    const times = p.hourly?.time ?? [];
    const aqiHourly = p.hourly?.european_aqi ?? [];
    const uvHourly = p.hourly?.uv_index ?? [];
    const now = times.findIndex((t) => t >= (c.time as string).slice(0, 13));
    const start = now < 0 ? 0 : now;
    const today = (c.time as string).slice(0, 10);
    const uvToday = times.flatMap((t, i) => (t.startsWith(today) ? [num(uvHourly[i])] : [])).filter((v): v is number => v !== null);
    const pollens = POLLEN_KEYS.map((key) => {
      const grains = num(c[`${key}_pollen`]);
      return { key, grainsM3: grains, level: pollenLevel(key, grains) };
    });
    return {
      air: {
        validTime: c.time as string,
        pm10: num(c.pm10),
        pm25: num(c.pm2_5),
        no2: num(c.nitrogen_dioxide),
        o3: num(c.ozone),
        europeanAqi: num(c.european_aqi),
        uvIndex: num(c.uv_index),
        uvMaxToday: uvToday.length ? Math.max(...uvToday) : null,
        aqiNext24h: aqiHourly.slice(start, start + 24).map(num),
      },
      pollens,
    };
  });
}
