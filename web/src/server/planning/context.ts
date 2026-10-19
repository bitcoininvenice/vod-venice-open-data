import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { WALK_URL } from '@/lib/walk-data';
import { BOAT_URL } from '@/lib/boat-data';
import { buildWalkGraph, type RawWalk, type WalkGraph } from '@/lib/walkGraph';
import { buildBoatGraph, type BoatGraph, type RawBoat } from '@/lib/boatRouting';
import { romeDayType, romeLocalToDate, romeSecondsOfDay } from '@/lib/time';
import { resolveTideState } from '@/lib/tideCurve';
import { GET as tideGET } from '@/app/api/tide/route';
import type { TideResponse } from '@/lib/contracts/tide';
import type { DayType } from '@/lib/types';
import { PROVIDERS, providerCitation } from '@/lib/provenance/providers';

/** File statico di public/data letto una volta per istanza del server (stesso file scaricato dal browser) */
function loader<T>(url: string, build: (raw: never) => T): () => Promise<T | null> {
  let loading: Promise<T | null> | null = null;
  return () =>
    (loading ??= readFile(path.join(process.cwd(), 'public', url), 'utf8')
      .then((text) => build(JSON.parse(text) as never))
      .catch((e) => {
        console.warn(`Rete ${url} non disponibile:`, e);
        loading = null;
        return null;
      }));
}

/** Rete pedonale OpenStreetMap (da Chioggia a Mestre e all'aeroporto) */
export const serverWalkGraph: () => Promise<WalkGraph | null> = loader(WALK_URL, (raw: RawWalk) => buildWalkGraph(raw));
/** Rete dei canali con le regole del Testo Unico (barca privata) */
export const serverBoatGraph: () => Promise<BoatGraph | null> = loader(BOAT_URL, (raw: RawBoat) => buildBoatGraph(raw));

export interface TripContext {
  /** secondi dalla mezzanotte a Venezia */
  seconds: number;
  day: DayType;
  nextDay: DayType;
  /** giorno del viaggio (calendario Alilaguna) e del giorno dopo */
  date: Date;
  nextDate: Date;
  /** «adesso»: si propongono le corse da prendere di corsa */
  isNow: boolean;
  /** YYYY-MM-DD e HH:MM usati */
  dateLabel: string;
  timeLabel: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Giorno e ora del viaggio: `date` YYYY-MM-DD e `time` HH:MM (ora di Venezia), adesso se mancano.
 * Errore se il formato non è valido.
 */
export function tripContext(date?: string | null, time?: string | null, now: Date = new Date()): TripContext | { error: string } {
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'data non valida: usa YYYY-MM-DD' };
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: 'ora non valida: usa HH:MM' };
  const romeToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const dateLabel = date ?? romeToday;
  const noon = romeLocalToDate(`${dateLabel} 12:00:00`);
  if (Number.isNaN(noon.getTime())) return { error: 'data non valida' };
  const seconds = time ? Number(time.slice(0, 2)) * 3600 + Number(time.slice(3)) * 60 : romeSecondsOfDay(now);
  const nextDate = new Date(noon.getTime() + 86400_000);
  return {
    seconds,
    day: romeDayType(noon),
    nextDay: romeDayType(nextDate),
    date: noon,
    nextDate,
    isNow: !date && !time,
    dateLabel,
    timeLabel: time ?? `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}`,
  };
}

export interface TideNow {
  /** livello in città all'ora indicata (s dalla mezzanotte di oggi), null se non noto */
  at: (seconds: number) => number | null;
  measuredCm: number | null;
  observedAt: string | null;
  forecast: TideResponse['data']['forecast'];
}

/** Marea di oggi (misura e previsione CPSM), per i tratti a piedi del planner. null se la fonte non risponde. */
export async function tideToday(): Promise<TideNow | null> {
  try {
    const body = (await (await tideGET()).json()) as TideResponse;
    const ref = body.data.reference;
    const forecast = body.data.forecast;
    if (!ref && !forecast) return null;
    return {
      measuredCm: ref?.levelCm ?? null,
      observedAt: ref?.observedAt ?? null,
      forecast,
      at: (seconds) =>
        resolveTideState({
          timelineSeconds: seconds,
          forecast,
          liveTideLevel: ref?.levelCm ?? null,
          liveObservedAt: ref?.observedAt ?? null,
          moseGates: body.data.moseGates,
        }).lagoonTideCm,
    };
  } catch {
    return null;
  }
}

export interface SourceRef {
  name: string;
  license: string;
  url: string;
}

/** Fonti da citare: ogni risposta elenca solo quelle usate davvero */
export const SOURCES = {
  actv: providerCitation('actvGtfs', 'navigazione e automobilistico'),
  alilaguna: providerCitation('alilaguna'),
  osm: providerCitation('osm', 'rete pedonale, calli e civici'),
  osmCanals: providerCitation('osm', 'canali'),
  cpsm: providerCitation('cpsm'),
  passerelle: providerCitation('passerelle'),
  testoUnico: providerCitation('testoUnico'),
  speedLimits: providerCitation('speedLimits'),
  actvFares: providerCitation('actvFares'),
  alilagunaFares: providerCitation('alilagunaFares'),
  vod: providerCitation('vod'),
  busone: providerCitation('busone'),
  atvo: providerCitation('atvo'),
  dolomitibus: providerCitation('dolomitibus'),
  flixbus: providerCitation('flixbus'),
} satisfies Record<string, SourceRef>;

export const VOD_BASE_URL = PROVIDERS.vod.url;

/** HH:MM da secondi dalla mezzanotte (oltre 24 h: dopo mezzanotte) */
export function hhmm(seconds: number): string {
  const s = ((Math.round(seconds) % 86400) + 86400) % 86400;
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`;
}
