import type { TideForecast, TideForecastExtreme } from '@/lib/contracts/tide';
import type { MoseGateItem } from '@/lib/types';
import { dateAtRomeSeconds, romeLocalToDate } from '@/lib/time';

export type MoseStatus = 'ABBASSATO' | 'IN_SOLLEVAMENTO' | 'ATTIVATO' | 'IN_ABBASSAMENTO';

/** Origine del livello in città: misura CPSM, previsione CPSM, simulatore o nessun dato. */
export type TideSource = 'measured' | 'forecast' | 'simulated' | 'none';

/**
 * Su cosa si basa lo stato del MOSE (il Consorzio non pubblica lo stato delle paratie come open data):
 * - measured: dedotto dalle misure CPSM lato mare / lato laguna alle bocche di porto
 * - forecast: chiusura probabile secondo la previsione CPSM (picco >= 110 cm)
 * - simulated: scelto nel simulatore
 */
export type MoseBasis = 'measured' | 'forecast' | 'simulated' | 'none';

export interface DynamicTideState {
  /** Livello atteso senza MOSE (previsione CPSM, o misura lato mare). null se non disponibile. */
  seaTideCm: number | null;
  /** Livello in città: quello che allaga calli e attiva le passerelle. null se non disponibile. */
  lagoonTideCm: number | null;
  levelSource: TideSource;
  moseStatus: MoseStatus;
  /** Elevazione delle paratie da 0 (sul fondale) a 1 (erette) */
  moseLiftProgress: number;
  moseBasis: MoseBasis;
  trend: 'IN_AUMENTO' | 'IN_CALO' | 'STAZIONARIO';
  /** True se il MOSE è in sollevamento o alzato */
  isMoseRaised: boolean;
  /** True se il livello in città supera +80 cm (prime zone allagate) */
  isFlooded: boolean;
  /** true se la previsione CPSM c'è ma è troppo vecchia per essere usata */
  forecastStale: boolean;
  nextExtreme: TideForecastExtreme | null;
}

export interface ResolveTideOptions {
  simulatedTideLevel?: number | null;
  /** Solo per il simulatore: se false simula l'evento senza MOSE */
  isMoseProtected?: boolean;
  timelineSeconds?: number;
  forecast?: TideForecast | null;
  /** Misura di Punta della Salute (già comprensiva dell'effetto del MOSE) */
  liveTideLevel?: number | null;
  liveObservedAt?: string | null;
  /** Schiere MOSE con le misure lato mare / lato laguna */
  moseGates?: MoseGateItem[];
  referenceDate?: Date;
}

const MIN = 60 * 1000;
const LIFT_DURATION_MS = 30 * MIN;
const LOWER_DURATION_MS = 15 * MIN;
const ANTICIPATION_MS = 45 * MIN; // manovra avviata circa 45 min prima del picco
const CLOSURE_AFTER_PEAK_MS = 75 * MIN;
/** Una misura vale come "attuale" entro questa finestra */
const LIVE_WINDOW_MS = 20 * MIN;
/** Simulatore: protezione integrale (città asciutta) */
const MOSE_SIMULATOR_PROTECTED_LAGUNA_CM = 70;
/** Stima del livello mantenuto in laguna a paratie alzate */
const MOSE_PROTECTED_LAGUNA_MAX_CM = 85;
/** Soglia di attivazione del MOSE (previsione >= 110 cm) */
export const MOSE_THRESHOLD_CM = 110;
/** Chiusura rilevata: mare oltre questa quota... */
const CLOSURE_SEA_MIN_CM = 100;
/** ...e laguna più bassa di almeno tanti cm (lo sfasamento ordinario della marea resta sotto i 25 cm) */
const CLOSURE_GAP_CM = 30;

export interface CurvePoint { time: number; levelCm: number; type: 'max' | 'min' | 'live'; extreme?: TideForecastExtreme }

// La mappa calcola lo stato a ogni frame: gli orari della previsione si convertono una volta sola
const parsedForecasts = new WeakMap<TideForecast, CurvePoint[]>();
/** Estremi della previsione CPSM ordinati, con orari già convertiti (vuoto se assente o scaduta). */
export function parseForecastExtremes(forecast: TideForecast | null | undefined): CurvePoint[] {
  if (!forecast || forecast.stale) return [];
  let points = parsedForecasts.get(forecast);
  if (!points) {
    points = forecast.extremes
      .map((e) => ({ time: romeLocalToDate(e.at).getTime(), levelCm: e.levelCm, type: e.type, extreme: e }))
      .sort((a, b) => a.time - b.time);
    parsedForecasts.set(forecast, points);
  }
  return points;
}
let lastObserved: { local: string; time: number } | null = null;
function observedTime(local: string): number {
  if (lastObserved?.local !== local) lastObserved = { local, time: romeLocalToDate(local).getTime() };
  return lastObserved.time;
}

/** Una coppia di stazioni per bocca di porto (Lido Nord e Sud condividono le stesse). */
function inletReadings(gates: MoseGateItem[]): { sea: number; lagoon: number }[] {
  const seen = new Set<string>();
  const out: { sea: number; lagoon: number }[] = [];
  for (const g of gates) {
    if (g.tideSeaCm == null || g.tideLagoonCm == null) continue;
    const key = `${g.tideSeaCm}|${g.tideLagoonCm}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sea: g.tideSeaCm, lagoon: g.tideLagoonCm });
  }
  return out;
}

/** true/false se le misure alle bocche indicano paratie chiuse/aperte; null se mancano le misure. */
export function measuredMoseClosure(gates: MoseGateItem[] | undefined): boolean | null {
  const readings = inletReadings(gates ?? []);
  if (readings.length < 2) return null;
  const closed = readings.filter((r) => r.sea >= CLOSURE_SEA_MIN_CM && r.sea - r.lagoon >= CLOSURE_GAP_CM).length;
  return closed >= 2;
}

/** Interpolazione armonica (semi-coseno) tra punti consecutivi; null fuori dall'intervallo coperto. */
function interpolate(points: CurvePoint[], t: number): { levelCm: number; trend: DynamicTideState['trend'] } | null {
  if (points.length === 0) return null;
  if (points.length === 1) {
    return Math.abs(t - points[0].time) <= LIVE_WINDOW_MS ? { levelCm: points[0].levelCm, trend: 'STAZIONARIO' } : null;
  }
  if (t < points[0].time || t > points[points.length - 1].time) return null;
  let i = 0;
  while (i < points.length - 2 && points[i + 1].time <= t) i++;
  const a = points[i];
  const b = points[i + 1];
  const span = b.time - a.time;
  const alpha = span > 0 ? Math.max(0, Math.min(1, (t - a.time) / span)) : 0;
  const mid = (a.levelCm + b.levelCm) / 2;
  const half = (a.levelCm - b.levelCm) / 2;
  return {
    levelCm: Math.round(mid + half * Math.cos(Math.PI * alpha)),
    trend: b.levelCm > a.levelCm ? 'IN_AUMENTO' : b.levelCm < a.levelCm ? 'IN_CALO' : 'STAZIONARIO',
  };
}

/** Fase del MOSE dedotta dai picchi previsti >= 110 cm. */
function forecastMosePhase(extremes: CurvePoint[], t: number): { status: MoseStatus; progress: number } {
  for (const peak of extremes) {
    if (peak.type !== 'max' || peak.levelCm < MOSE_THRESHOLD_CM) continue;
    const start = peak.time - ANTICIPATION_MS;
    const raised = start + LIFT_DURATION_MS;
    const lowerStart = peak.time + CLOSURE_AFTER_PEAK_MS;
    const lowered = lowerStart + LOWER_DURATION_MS;
    if (t >= start && t < raised) return { status: 'IN_SOLLEVAMENTO', progress: (t - start) / LIFT_DURATION_MS };
    if (t >= raised && t < lowerStart) return { status: 'ATTIVATO', progress: 1 };
    if (t >= lowerStart && t < lowered) return { status: 'IN_ABBASSAMENTO', progress: 1 - (t - lowerStart) / LOWER_DURATION_MS };
  }
  return { status: 'ABBASSATO', progress: 0 };
}

/** Livello in laguna stimato dal livello senza MOSE e dalla fase delle paratie. */
function protectedLevel(seaCm: number, status: MoseStatus, progress: number): number {
  const excess = Math.max(0, seaCm - MOSE_PROTECTED_LAGUNA_MAX_CM);
  if (status === 'ATTIVATO') return Math.min(MOSE_PROTECTED_LAGUNA_MAX_CM, seaCm);
  if (status === 'IN_SOLLEVAMENTO' || status === 'IN_ABBASSAMENTO') return Math.round(seaCm - progress * excess);
  return seaCm;
}

function simulatedState(level: number, isMoseProtected: boolean): DynamicTideState {
  const seaTideCm = Math.round(level);
  const moseActive = isMoseProtected && seaTideCm >= MOSE_THRESHOLD_CM;
  const lagoonTideCm = moseActive ? MOSE_SIMULATOR_PROTECTED_LAGUNA_CM : seaTideCm;
  return {
    seaTideCm,
    lagoonTideCm,
    levelSource: 'simulated',
    moseStatus: moseActive ? 'ATTIVATO' : 'ABBASSATO',
    moseLiftProgress: moseActive ? 1 : 0,
    moseBasis: 'simulated',
    trend: 'STAZIONARIO',
    isMoseRaised: moseActive,
    isFlooded: lagoonTideCm >= 80,
    forecastStale: false,
    nextExtreme: null,
  };
}

/**
 * Stato della marea in città e del MOSE, reale o simulato.
 *
 * Modalità reale: la misura di Punta della Salute è già il livello in laguna (MOSE compreso), quindi
 * vicino all'ora attuale si usa quella; più avanti nel tempo la previsione CPSM (che è il livello atteso
 * senza MOSE), ridotta dalla stima della chiusura. Lo stato delle paratie viene dalle misure alle bocche
 * quando disponibili, altrimenti è una stima dalla previsione (moseBasis lo dichiara).
 */
export function resolveTideState(options: ResolveTideOptions): DynamicTideState {
  const {
    simulatedTideLevel,
    isMoseProtected = true,
    timelineSeconds,
    forecast,
    liveTideLevel,
    liveObservedAt,
    moseGates,
    referenceDate = new Date(),
  } = options;

  if (simulatedTideLevel != null) return simulatedState(simulatedTideLevel, isMoseProtected);

  const target = (timelineSeconds !== undefined ? dateAtRomeSeconds(timelineSeconds, referenceDate) : referenceDate).getTime();
  const now = referenceDate.getTime();
  const forecastStale = !!forecast?.stale;
  const extremes = parseForecastExtremes(forecast);

  const liveTime = liveObservedAt ? observedTime(liveObservedAt) : now;
  const live = liveTideLevel != null && Number.isFinite(liveTime) ? { time: liveTime, levelCm: liveTideLevel } : null;
  const nearLive = !!live && Math.abs(target - live.time) <= LIVE_WINDOW_MS;

  // Stato del MOSE: misure alle bocche (solo vicino all'ora attuale), altrimenti previsione
  const measuredClosed = Math.abs(target - now) <= LIVE_WINDOW_MS ? measuredMoseClosure(moseGates) : null;
  const predicted = forecastMosePhase(extremes, target);
  let mose: { status: MoseStatus; progress: number; basis: MoseBasis };
  if (measuredClosed) mose = { status: 'ATTIVATO', progress: 1, basis: 'measured' };
  else if (predicted.status !== 'ABBASSATO') mose = { ...predicted, basis: 'forecast' };
  else mose = { status: 'ABBASSATO', progress: 0, basis: measuredClosed === false ? 'measured' : extremes.length > 0 ? 'forecast' : 'none' };
  mose.progress = Math.max(0, Math.min(1, mose.progress));

  // Curva senza MOSE: estremi previsti, ancorata alla misura quando la misura non è "dietro" le paratie
  const anchorLive = live && !measuredClosed && predicted.status === 'ABBASSATO' ? live : null;
  const curve: CurvePoint[] = anchorLive
    ? [...extremes.filter((e) => Math.abs(e.time - anchorLive.time) > LIVE_WINDOW_MS), { ...anchorLive, type: 'live' as const }]
        .sort((a, b) => a.time - b.time)
    : extremes;
  const sea = interpolate(curve, target);

  // Livello in città: misura vicino all'ora attuale, altrimenti previsione ridotta dalla chiusura stimata
  let lagoonTideCm: number | null = null;
  let levelSource: TideSource = 'none';
  if (nearLive && live) {
    lagoonTideCm = Math.round(live.levelCm);
    levelSource = 'measured';
  } else if (sea) {
    lagoonTideCm = protectedLevel(sea.levelCm, mose.status, mose.progress);
    levelSource = 'forecast';
  }

  const measuredSea = inletReadings(moseGates ?? []).map((r) => r.sea);
  const seaTideCm = sea?.levelCm
    ?? (measuredClosed && measuredSea.length ? Math.round(measuredSea.reduce((a, b) => a + b, 0) / measuredSea.length) : null)
    ?? lagoonTideCm;

  const next = extremes.find((e) => e.time > target) ?? null;
  const nextExtreme = next?.extreme ?? null;

  return {
    seaTideCm,
    lagoonTideCm,
    levelSource,
    moseStatus: mose.status,
    moseLiftProgress: mose.progress,
    moseBasis: mose.basis,
    trend: sea?.trend ?? 'STAZIONARIO',
    isMoseRaised: mose.status === 'ATTIVATO' || mose.status === 'IN_SOLLEVAMENTO',
    isFlooded: (lagoonTideCm ?? 0) >= 80,
    forecastStale,
    nextExtreme,
  };
}
