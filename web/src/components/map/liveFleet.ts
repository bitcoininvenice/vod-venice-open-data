/**
 * Flotta "live": in modalità tempo reale ogni corsa dell'orario che ha un mezzo GPS con la stessa linea e
 * partenza viene disegnata una volta sola, spostata lungo il percorso del ritardo reale.
 *
 * Tra un aggiornamento GPS e l'altro l'icona avanza secondo l'orario (spostato del ritardo); quando arriva
 * un ritardo nuovo l'icona accelera lungo il percorso fino alla nuova posizione, senza salti né tagli
 * sopra la terraferma.
 */
import { distAt } from '@/lib/simulationCore';
import type { SimProfile } from '@/lib/simulationCore';
import { parseGtfsTime } from '@/lib/positionDelay';
import { isFresh } from '@/lib/realtimeDelay';
import type { RealtimeVehicleDto } from '@/lib/contracts/realtime';
import type { DayType } from '@/lib/types';
import { romeDayType, romeSecondsOfDay } from '@/lib/time';

/** Tempo di inseguimento: in circa 1,5 s l'icona copre gran parte della distanza dalla nuova posizione */
const CATCH_UP_S = 1.5;
/** Oltre questa distanza lungo il percorso l'icona si sposta subito (es. primo dato o corsa riassociata) */
const SNAP_M = 3000;
/** Il sim clock è considerato "adesso" entro questo scarto dall'ora reale (s) */
const LIVE_TOLERANCE_S = 120;
/** Ritardo massimo con cui una corsa già finita secondo l'orario resta in mappa (s) */
export const MAX_LATE_S = 2 * 60 * 60;
/** Anticipo massimo con cui una corsa con GPS compare prima della partenza programmata (s) */
export const MAX_EARLY_S = 30 * 60;

/** Mezzo GPS in servizio: il feed indica la corsa o almeno la linea (gli altri sono in deposito o fuori servizio). */
export const inService = (v: Pick<RealtimeVehicleDto, 'line' | 'tripId'>): boolean => Boolean(v.line || v.tripId);

/** Corsa: linea, rete (lo stesso numero può essere vaporetto e bus) e partenza */
export const tripKey = (line: string, departure: number, network: 'navigazione' | 'automobilistico') => `${line}|${network}|${departure}`;
const WATER_CATS = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry']);
export const networkOfSimCategory = (cat: string): 'navigazione' | 'automobilistico' => (WATER_CATS.has(cat) ? 'navigazione' : 'automobilistico');

/** Mezzi GPS con ritardo recente, per linea e partenza della corsa. */
const indexCache = new WeakMap<RealtimeVehicleDto[], Map<string, RealtimeVehicleDto>>();
export function realtimeByTrip(vehicles: RealtimeVehicleDto[]): Map<string, RealtimeVehicleDto> {
  let m = indexCache.get(vehicles);
  if (!m) {
    m = new Map();
    for (const v of vehicles) {
      const dep = parseGtfsTime(v.startTime);
      if (!v.line || dep === null || !v.delay) continue;
      m.set(tripKey(v.line, dep, v.network), v);
    }
    indexCache.set(vehicles, m);
  }
  return m;
}

/** La mappa mostra l'ora reale (non una simulazione in un altro momento). */
export function isLiveClock(simSeconds: number, nowSeconds: number): boolean {
  const d = Math.abs(simSeconds - nowSeconds);
  return Math.min(d, 86400 - d) <= LIVE_TOLERANCE_S;
}

let romeNow: { at: number; seconds: number; day: DayType } | null = null;
/** Ora e tipo di giorno reali a Venezia, ricalcolati al massimo una volta al secondo (si legge a ogni frame). */
export function isLiveView(simSeconds: number, simDay: DayType, nowMs: number): boolean {
  if (!romeNow || nowMs - romeNow.at > 1000) {
    const d = new Date(nowMs);
    romeNow = { at: nowMs, seconds: romeSecondsOfDay(d), day: romeDayType(d) };
  }
  return simDay === romeNow.day && isLiveClock(simSeconds, romeNow.seconds + (nowMs - romeNow.at) / 1000);
}

interface Shown {
  d: number;
  at: number;
}
const shown = new Map<string, Shown>();
/** id dei mezzi GPS già disegnati come corsa dell'orario in questo frame (il livello GPS li salta) */
export const mergedThisFrame = new Set<string>();

/**
 * Distanza lungo il percorso a cui disegnare la corsa: quella dell'orario spostata del ritardo, raggiunta
 * con un inseguimento morbido. `dt`: secondi dalla partenza programmata; `nowMs`: ora del frame.
 */
export function liveDistance(key: string, prof: SimProfile, dt: number, delaySeconds: number, nowMs: number): number {
  const target = distAt(prof, dt - delaySeconds);
  const prev = shown.get(key);
  if (!prev) {
    // primo dato: l'icona parte dalla posizione dell'orario e raggiunge quella reale
    const start = distAt(prof, dt);
    const d = Math.abs(start - target) > SNAP_M ? target : start;
    shown.set(key, { d, at: nowMs });
    return d;
  }
  const elapsed = Math.max(0, (nowMs - prev.at) / 1000);
  let d = prev.d;
  if (Math.abs(target - d) > SNAP_M) d = target;
  else d += (target - d) * (1 - Math.exp(-elapsed / (CATCH_UP_S / 2)));
  shown.set(key, { d, at: nowMs });
  return d;
}

/** Distanza mostrata nell'ultimo frame (per il clic sull'icona), se la corsa è live. */
export function shownDistance(key: string): number | null {
  return shown.get(key)?.d ?? null;
}

/** Dimentica le corse non più disegnate da un po' (evita che la mappa cresca all'infinito). */
export function pruneShown(nowMs: number): void {
  for (const [k, v] of shown) if (nowMs - v.at > 60_000) shown.delete(k);
}

/** Ritardo utilizzabile: recente secondo la soglia delle schede. */
export const freshDelay = (v: RealtimeVehicleDto): number | null => (v.delay && isFresh(v.delay.updatedAt) ? v.delay.seconds : null);
