import type { WindField } from '@/lib/types';

/**
 * Campo di vento a 10 m da Open-Meteo (CC BY 4.0), modello "best match" (per l'Italia nord-orientale
 * ICON-D2 / ICON-EU di DWD, poi ECMWF). È una previsione numerica, non una misura.
 */
export const WIND_GRID = { lon0: 12.1, lat0: 45.18, dLon: 0.05, dLat: 0.05, nx: 9, ny: 9 } as const;

export const OPEN_METEO_SOURCE = 'Open-Meteo – modelli DWD ICON / ECMWF (best match)';
export const OPEN_METEO_LICENSE = 'CC BY 4.0 – Weather data by Open-Meteo.com';

function gridCoordinates() {
  const lats: number[] = [];
  const lons: number[] = [];
  for (let j = 0; j < WIND_GRID.ny; j++) {
    for (let i = 0; i < WIND_GRID.nx; i++) {
      lats.push(+(WIND_GRID.lat0 + j * WIND_GRID.dLat).toFixed(3));
      lons.push(+(WIND_GRID.lon0 + i * WIND_GRID.dLon).toFixed(3));
    }
  }
  return { lats, lons };
}

export function openMeteoWindUrl(): string {
  const { lats, lons } = gridCoordinates();
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lons.join(','),
    current: 'wind_speed_10m,wind_direction_10m',
    wind_speed_unit: 'ms',
    timezone: 'Europe/Rome',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

/** Direzione meteorologica (da dove soffia, gradi) e velocità -> componenti u (est) e v (nord). */
export function toUV(speedMs: number, fromDeg: number): [number, number] {
  const rad = (fromDeg * Math.PI) / 180;
  return [-speedMs * Math.sin(rad), -speedMs * Math.cos(rad)];
}

interface OpenMeteoPoint {
  current?: { time?: string; wind_speed_10m?: number; wind_direction_10m?: number };
}

export function parseOpenMeteoWind(raw: unknown): Omit<WindField, 'fetchedAt'> {
  const points = (Array.isArray(raw) ? raw : [raw]) as OpenMeteoPoint[];
  const expected = WIND_GRID.nx * WIND_GRID.ny;
  if (points.length !== expected) throw new Error(`attesi ${expected} punti, ricevuti ${points.length}`);
  const u: number[] = [];
  const v: number[] = [];
  let maxSpeedMs = 0;
  for (const p of points) {
    const speed = p.current?.wind_speed_10m;
    const dir = p.current?.wind_direction_10m;
    if (typeof speed !== 'number' || typeof dir !== 'number') throw new Error('punto senza vento');
    const [pu, pv] = toUV(speed, dir);
    u.push(Math.round(pu * 100) / 100);
    v.push(Math.round(pv * 100) / 100);
    maxSpeedMs = Math.max(maxSpeedMs, speed);
  }
  const validTime = points[0].current?.time;
  if (!validTime) throw new Error('ora della previsione mancante');
  return {
    validTime,
    source: OPEN_METEO_SOURCE,
    sourceUrl: 'https://open-meteo.com',
    license: OPEN_METEO_LICENSE,
    ...WIND_GRID,
    u,
    v,
    maxSpeedMs: Math.round(maxSpeedMs * 10) / 10,
  };
}
