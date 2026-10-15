import { z } from 'zod';
import type { MeteoMarineWindItem } from '@/lib/types';
import { romeLocalToDate } from '@/lib/time';
import type { CityAirTemperature } from '@/lib/types';

/** Feed meteo-marini in tempo reale del Centro Maree (dati.venezia.it, CC BY). Aggiornamento ogni 5 minuti. */
const BASE = 'https://dati.venezia.it/sites/default/files/dataset/opendata';
export const CPSM_METEO_URLS = {
  vento: `${BASE}/vento.json`,
  ondeMare: `${BASE}/onde_mare.json`,
  ondeLaguna: `${BASE}/onde_laguna.json`,
  tempAcqua: `${BASE}/tempacqua.json`,
  tempAria: `${BASE}/temparia.json`,
  pressione: `${BASE}/pressione.json`,
  umidita: `${BASE}/umidita.json`,
  livello: `${BASE}/livello.json`,
} as const;

export type CpsmFeedName = keyof typeof CPSM_METEO_URLS;

const RawRow = z.object({
  ID_stazione: z.string(),
  stazione: z.string(),
  latDDN: z.coerce.number().optional(),
  lonDDE: z.coerce.number().optional(),
  data: z.string().optional(),
  valore: z.string().optional(),
});

export interface CpsmReading {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  observedAt?: string;
  value?: string;
}

/** Normalizza un feed CPSM (array di stazioni) scartando le righe malformate. */
export function parseCpsmFeed(raw: unknown): CpsmReading[] {
  if (!Array.isArray(raw)) throw new Error('feed CPSM non è un array');
  return raw.flatMap((r) => {
    const p = RawRow.safeParse(r);
    if (!p.success) return [];
    const { ID_stazione, stazione, latDDN, lonDDE, data, valore } = p.data;
    return [{
      id: ID_stazione,
      name: stazione,
      lat: Number.isFinite(latDDN) ? latDDN : undefined,
      lon: Number.isFinite(lonDDE) ? lonDDE : undefined,
      observedAt: data,
      value: valore,
    }];
  });
}

/** "172 gradi, 1.4 m/s, 1.8 m/s" -> direzione, velocità media e raffica (m/s). */
export function parseWind(value: string | undefined): { deg: number; speedMs: number; gustMs: number } | null {
  const m = value?.match(/(-?[\d.]+)\s*gradi\s*,\s*([\d.]+)\s*m\/s\s*,\s*([\d.]+)\s*m\/s/i);
  if (!m) return null;
  return { deg: Number(m[1]) % 360, speedMs: Number(m[2]), gustMs: Number(m[3]) };
}

/** "1.26 m, 2.01 m" -> altezza significativa e massima. */
export function parseWaves(value: string | undefined): { hs: number; hmax: number | null } | null {
  const nums = value?.match(/-?[\d.]+/g)?.map(Number) ?? [];
  if (nums.length === 0 || !Number.isFinite(nums[0])) return null;
  return { hs: nums[0], hmax: Number.isFinite(nums[1]) ? nums[1] : null };
}

/** Primo numero di una lettura ("19.7 °C", "1009.9 hPa", "86 %"). */
export function parseNumber(value: string | undefined): number | null {
  const m = value?.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Nome tradizionale del vento a Venezia dalla direzione di provenienza. */
export function windName(deg: number): MeteoMarineWindItem['windDirection'] {
  const d = ((deg % 360) + 360) % 360;
  if (d < 22.5 || d >= 337.5) return 'TRAMONTANA';
  if (d < 45) return 'GRECALE';
  if (d < 75) return 'BORA';
  if (d < 112.5) return 'LEVANTE';
  if (d < 157.5) return 'SCIROCCO';
  if (d < 202.5) return 'OSTRO';
  if (d < 247.5) return 'LIBECCIO';
  if (d < 292.5) return 'PONENTE';
  return 'MAESTRALE';
}

/**
 * Indicatore semplificato della spinta del vento sulla marea: lo Scirocco (e l'Ostro) spinge acqua
 * in laguna. Non è una previsione: per quella vale la previsione ufficiale CPSM.
 */
export function tidePushRisk(deg: number, speedMs: number): MeteoMarineWindItem['tidePushRisk'] {
  const name = windName(deg);
  if (name !== 'SCIROCCO' && name !== 'OSTRO') return 'BASSO';
  if (speedMs >= 14) return 'CRITICO';
  if (speedMs >= 10) return 'ALTO';
  if (speedMs >= 6) return 'MODERATO';
  return 'BASSO';
}

function stationType(name: string): MeteoMarineWindItem['stationType'] {
  if (/piattaforma|meda/i.test(name)) return 'PIATTAFORMA_OFFSHORE';
  if (/diga|porto|bocca|malamocco|chioggia/i.test(name)) return 'BOCCA_DI_PORTO';
  if (/misericordia|san giorgio|salute|cavalli|portuale/i.test(name)) return 'CENTRO_STORICO';
  return 'TERRAFERMA';
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Stazioni CPSM del centro storico per la temperatura "di Venezia", in ordine di preferenza. */
const CITY_AIR_TEMP_STATIONS = ['1026', '1039', '1029'] as const; // Palazzo Cavalli, San Giorgio, Misericordia
/** Oltre questa età la misura non viene mostrata come temperatura attuale. */
const CITY_AIR_TEMP_MAX_AGE_MS = 2 * 60 * 60_000;


/**
 * Temperatura dell'aria nel centro storico: la prima stazione dell'elenco con una misura recente,
 * con l'umidità della stessa stazione (mai di un'altra, per non mescolare luoghi diversi).
 * null se nessuna stazione del centro ha trasmesso nelle ultime 2 ore (niente ripieghi su altre zone).
 */
export function cityAirTemperature(readings: CpsmReading[], humidity: CpsmReading[] = [], now: Date = new Date()): CityAirTemperature | null {
  const recent = (r: CpsmReading | undefined) =>
    Boolean(r?.observedAt) && now.getTime() - romeLocalToDate(r!.observedAt!).getTime() <= CITY_AIR_TEMP_MAX_AGE_MS;
  for (const id of CITY_AIR_TEMP_STATIONS) {
    const r = readings.find((x) => x.id === id);
    const celsius = parseNumber(r?.value);
    if (!r || celsius === null || !recent(r)) continue;
    const h = humidity.find((x) => x.id === id);
    const humidityPercent = recent(h) ? parseNumber(h?.value) : null;
    return {
      celsius: round1(celsius),
      humidityPercent: humidityPercent !== null && humidityPercent >= 0 && humidityPercent <= 100 ? Math.round(humidityPercent) : null,
      stationId: r.id,
      stationName: r.name.replace(/_/g, ' '),
      observedAt: r.observedAt!,
    };
  }
  return null;
}

/**
 * Stazioni vento CPSM con misure reali, arricchite (stessa stazione) con onde, temperatura,
 * pressione e umidità quando disponibili. Le coordinate vengono dalle altre serie CPSM:
 * le stazioni senza coordinate pubblicate non sono incluse sulla mappa.
 */
export function buildWindStations(feeds: Partial<Record<CpsmFeedName, CpsmReading[]>>): MeteoMarineWindItem[] {
  const coords = new Map<string, { lat: number; lon: number }>();
  for (const list of Object.values(feeds)) {
    for (const r of list ?? []) {
      if (r.lat !== undefined && r.lon !== undefined && !coords.has(r.id)) coords.set(r.id, { lat: r.lat, lon: r.lon });
    }
  }
  const byId = (name: CpsmFeedName) => new Map((feeds[name] ?? []).map((r) => [r.id, r]));
  const waves = new Map([...byId('ondeLaguna'), ...byId('ondeMare')]);
  const airTemp = byId('tempAria');
  const pressure = byId('pressione');
  const humidity = byId('umidita');

  return (feeds.vento ?? []).flatMap((r) => {
    const wind = parseWind(r.value);
    const pos = coords.get(r.id);
    if (!wind || !pos) return [];
    const wave = parseWaves(waves.get(r.id)?.value);
    const speedKmh = round1(wind.speedMs * 3.6);
    const gustKmh = round1(wind.gustMs * 3.6);
    return [{
      id: `CPSM_${r.id}`,
      stationName: r.name.replace(/_/g, ' '),
      lat: pos.lat,
      lon: pos.lon,
      windDirection: windName(wind.deg),
      windDirectionDeg: Math.round(wind.deg),
      windSpeedKmh: speedKmh,
      windSpeedKnots: round1(wind.speedMs * 1.94384),
      gustSpeedKmh: gustKmh,
      gustSpeedKnots: round1(wind.gustMs * 1.94384),
      waveHeightMeters: wave ? wave.hs : null,
      airTempCelsius: parseNumber(airTemp.get(r.id)?.value) ?? undefined,
      pressureHpa: parseNumber(pressure.get(r.id)?.value) ?? undefined,
      humidityPercent: parseNumber(humidity.get(r.id)?.value) ?? undefined,
      tidePushRisk: tidePushRisk(wind.deg, wind.speedMs),
      windTypeDescription: `Misura CPSM delle ${r.observedAt?.slice(11, 16) ?? 'n.d.'} (ora locale). Indicatore di spinta sulla marea semplificato, basato su direzione e intensità del vento.`,
      stationType: stationType(r.name),
      officialSource: 'Comune di Venezia – Centro Previsioni e Segnalazioni Maree (dati.venezia.it)',
      observedAt: r.observedAt,
    }];
  });
}

/** ID CPSM della piattaforma oceanografica "Acqua Alta" (CNR-ISMAR). */
const PLATFORM_STATION_ID = '1021';

export interface PlatformReadings {
  waveHeightMeters: number | null;
  waveMaxMeters: number | null;
  waterTempC: number | null;
  windSpeedKnots: number | null;
  windDirectionDeg: number | null;
  observedAt: string | null;
}

/** Misure correnti della piattaforma "Acqua Alta" dai feed CPSM. */
export function platformReadings(feeds: Partial<Record<CpsmFeedName, CpsmReading[]>>): PlatformReadings {
  const find = (name: CpsmFeedName) => feeds[name]?.find((r) => r.id === PLATFORM_STATION_ID);
  const waves = parseWaves(find('ondeMare')?.value);
  const wind = parseWind(find('vento')?.value);
  return {
    waveHeightMeters: waves?.hs ?? null,
    waveMaxMeters: waves?.hmax ?? null,
    waterTempC: parseNumber(find('tempAcqua')?.value),
    windSpeedKnots: wind ? Math.round(wind.speedMs * 1.94384 * 10) / 10 : null,
    windDirectionDeg: wind ? Math.round(wind.deg) : null,
    observedAt: find('ondeMare')?.observedAt ?? find('vento')?.observedAt ?? null,
  };
}
