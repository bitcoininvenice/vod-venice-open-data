import { z } from 'zod';
import type { AirportMetarData } from '@/lib/types';

/** NOAA Aviation Weather Center: METAR ufficiali ICAO, dominio pubblico. */
export const LIPZ_METAR_URL = 'https://aviationweather.gov/api/data/metar?ids=LIPZ&format=json';

/** Prua geografica approssimata delle piste 04/22 di Venezia Tessera. */
const RUNWAY_04_HEADING_DEG = 40;

const RawMetar = z
  .array(
    z.object({
      rawOb: z.string(),
      reportTime: z.string(),
      temp: z.number().nullable().optional(),
      dewp: z.number().nullable().optional(),
      wdir: z.union([z.number(), z.string()]).nullable().optional(),
      wspd: z.number().nullable().optional(),
      wgst: z.number().nullable().optional(),
      visib: z.union([z.number(), z.string()]).nullable().optional(),
      altim: z.number().nullable().optional(),
      clouds: z.array(z.object({ cover: z.string(), base: z.number().nullable().optional() })).optional(),
      fltCat: z.string().nullable().optional(),
    }),
  )
  .min(1);

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];

export function compassPoint(deg: number): string {
  return COMPASS_16[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/** Umidità relativa con formula di Magnus. */
export function relativeHumidity(tempC: number, dewC: number): number {
  const a = 17.625;
  const b = 243.04;
  const rh = 100 * Math.exp((a * dewC) / (b + dewC) - (a * tempC) / (b + tempC));
  return Math.round(Math.min(100, Math.max(0, rh)));
}

/** Visibilità in metri letta dal gruppo METAR (es. "6000", "9999", "CAVOK"). */
export function visibilityFromRaw(raw: string): number | null {
  if (/\bCAVOK\b/.test(raw)) return 10000;
  const tokens = raw.split(/\s+/);
  const windIdx = tokens.findIndex((t) => /^(\d{3}|VRB)\d{2,3}(G\d{2,3})?KT$/.test(t));
  const candidate = windIdx >= 0 ? tokens.slice(windIdx + 1).find((t) => /^\d{4}$/.test(t)) : undefined;
  if (!candidate) return null;
  return Math.min(Number(candidate), 10000);
}

const COVER_IT: Record<string, string> = {
  FEW: 'Poche nubi',
  SCT: 'Nubi sparse',
  BKN: 'Nubi frammentate',
  OVC: 'Cielo coperto',
  CAVOK: 'CAVOK',
  NSC: 'Nessuna nube significativa',
  SKC: 'Cielo sereno',
  CLR: 'Cielo sereno',
};

function describeClouds(clouds: { cover: string; base?: number | null }[] | undefined): string {
  if (!clouds || clouds.length === 0) return 'Nessuna nube riportata';
  return clouds
    .map((c) => `${COVER_IT[c.cover] ?? c.cover}${c.base ? ` a ${c.base.toLocaleString('it-IT')} ft` : ''}`)
    .join(', ');
}

function flightCategory(
  reported: string | null | undefined,
  visibilityM: number | null,
  clouds: { cover: string; base?: number | null }[] | undefined,
): AirportMetarData['flightCategory'] {
  if (reported === 'VFR' || reported === 'MVFR' || reported === 'IFR' || reported === 'LIFR') return reported;
  const ceiling = clouds?.find((c) => c.cover === 'BKN' || c.cover === 'OVC')?.base ?? Infinity;
  const vis = visibilityM ?? Infinity;
  if (ceiling < 500 || vis < 1600) return 'LIFR';
  if (ceiling < 1000 || vis < 4800) return 'IFR';
  if (ceiling <= 3000 || vis <= 8000) return 'MVFR';
  return 'VFR';
}

/**
 * Normalizza il METAR NOAA nel formato usato dall'interfaccia.
 * Pista, vento al traverso e componente frontale sono stime calcolate dal vento riportato:
 * il METAR non indica la pista in uso né lo stato della pavimentazione.
 */
export function parseLipzMetar(raw: unknown): AirportMetarData {
  const m = RawMetar.parse(raw)[0];
  const windDeg = typeof m.wdir === 'number' ? m.wdir : null;
  const windKt = m.wspd ?? 0;
  const visibilityMeters = visibilityFromRaw(m.rawOb) ?? (typeof m.visib === 'number' ? Math.round(m.visib * 1609) : 10000);

  const runwayHeading = windDeg === null || Math.abs(((windDeg - RUNWAY_04_HEADING_DEG + 540) % 360) - 180) <= 90
    ? RUNWAY_04_HEADING_DEG
    : RUNWAY_04_HEADING_DEG + 180;
  const angle = windDeg === null ? 0 : ((windDeg - runwayHeading) * Math.PI) / 180;

  const temp = m.temp ?? null;
  const dew = m.dewp ?? null;

  return {
    icao: 'LIPZ',
    iata: 'VCE',
    stationName: 'Aeroporto di Venezia Marco Polo (LIPZ)',
    rawMetar: m.rawOb,
    observationTime: m.reportTime,
    windDirectionDeg: windDeg ?? 0,
    windCompass: windDeg === null ? 'Variabile' : compassPoint(windDeg),
    windSpeedKnots: windKt,
    windSpeedKmh: Math.round(windKt * 1.852 * 10) / 10,
    gustSpeedKnots: m.wgst ?? undefined,
    visibilityMeters,
    temperatureCelsius: temp ?? 0,
    dewPointCelsius: dew ?? 0,
    relativeHumidityPercent: temp !== null && dew !== null ? relativeHumidity(temp, dew) : 0,
    qnhHpa: Math.round(m.altim ?? 0),
    flightCategory: flightCategory(m.fltCat, visibilityMeters, m.clouds),
    cloudsDescription: describeClouds(m.clouds),
    activeRunway: `RWY ${runwayHeading === RUNWAY_04_HEADING_DEG ? '04' : '22'} (stima dal vento)`,
    crosswindKnots: Math.abs(Math.round(windKt * Math.sin(angle) * 10) / 10),
    headwindKnots: Math.round(windKt * Math.cos(angle) * 10) / 10,
    runwayCondition: 'Non riportato nel METAR',
    officialSource: 'METAR ICAO LIPZ via NOAA Aviation Weather Center (aviationweather.gov)',
  };
}
