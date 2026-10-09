import type { MarineForecast } from '@/lib/types';

/** Previsione del moto ondoso e della temperatura del mare (Open-Meteo Marine, CC BY 4.0). */
export const MARINE_SOURCE = 'Open-Meteo Marine (modelli ECMWF WAM / MeteoFrance MFWAM, Copernicus Marine)';

export function marineUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'wave_height,wave_direction,wave_period,sea_surface_temperature',
    hourly: 'wave_height',
    forecast_days: '3',
    timezone: 'Europe/Rome',
  });
  return `https://marine-api.open-meteo.com/v1/marine?${params}`;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

export function parseMarine(raw: unknown): MarineForecast {
  const p = raw as { current?: Record<string, unknown>; hourly?: { time?: string[]; wave_height?: unknown[] } };
  const c = p.current;
  if (!c || typeof c.time !== 'string') throw new Error('previsione marina senza valori correnti');
  const times = p.hourly?.time ?? [];
  const waves = (p.hourly?.wave_height ?? []).map(num);
  let maxIdx = -1;
  waves.forEach((w, i) => {
    if (w !== null && (maxIdx < 0 || w > (waves[maxIdx] as number))) maxIdx = i;
  });
  return {
    validTime: c.time,
    waveHeightM: num(c.wave_height),
    waveDirectionDeg: num(c.wave_direction),
    wavePeriodS: num(c.wave_period),
    seaTempC: num(c.sea_surface_temperature),
    waveMax72hM: maxIdx >= 0 ? waves[maxIdx] : null,
    waveMax72hAt: maxIdx >= 0 ? times[maxIdx] ?? null : null,
  };
}
