/**
 * Ritardi dei mezzi ACTV dal feed GTFS-Realtime TripUpdates.
 * Il ritardo "attuale" (alla prossima fermata) è quasi una misura: ACTV lo ricava dalla posizione GPS.
 * Gli orari alle fermate successive sono stime: a volte ACTV ripete lo stesso ritardo su tutto il percorso
 * ("constant"), altre lo fa variare con i tempi di percorrenza ("predicted").
 */

export type DelayStatus = 'early' | 'onTime' | 'late' | 'veryLate';

/** In anticipo oltre 1 min, in orario fino a +3 min, in ritardo fino a +5 min, poi molto in ritardo. */
export function delayStatus(seconds: number): DelayStatus {
  if (seconds < -60) return 'early';
  if (seconds < 180) return 'onTime';
  if (seconds <= 300) return 'late';
  return 'veryLate';
}

/** Oltre questa età un ritardo non viene mostrato: non si spaccia per attuale un dato scaduto. */
export const MAX_DELAY_AGE_SECONDS = 120;

export function isFresh(updatedAt: number | null, nowSec: number = Date.now() / 1000): boolean {
  return updatedAt !== null && nowSec - updatedAt <= MAX_DELAY_AGE_SECONDS;
}

export function estimateKind(delays: number[]): 'constant' | 'predicted' {
  return new Set(delays).size <= 1 ? 'constant' : 'predicted';
}

/** Ritardo di un mezzo da mostrare in mappa e nella scheda. */
export interface VehicleDelay {
  seconds: number;
  status: DelayStatus;
  /** epoch seconds dell'aggiornamento della corsa */
  updatedAt: number;
  nextStopId: string | null;
  nextStopName: string | null;
  /** orario previsto alla prossima fermata (epoch seconds) */
  nextStopTime: number | null;
  estimate: 'constant' | 'predicted';
  /** da dove viene il valore: calcolato dalla posizione GPS sull'orario, oppure dichiarato da ACTV */
  source: 'position' | 'actv';
  /** ritardo dichiarato da ACTV (s), se presente: con source=position è la verifica */
  actvSeconds: number | null;
}

/** Arrivo previsto a una fermata (scheda della fermata). */
export interface StopArrival {
  line: string | null;
  routeLongName: string | null;
  color: string | null;
  stopName: string | null;
  /** orario previsto (epoch seconds) */
  time: number;
  delaySeconds: number;
  status: DelayStatus;
  estimate: 'constant' | 'predicted';
  updatedAt: number | null;
}

export const DELAY_COLORS: Record<DelayStatus, string> = {
  early: '#38bdf8',
  onTime: '#22c55e',
  late: '#f59e0b',
  veryLate: '#ef4444',
};

/** "+3 min", "−1 min", "in orario" (minuti arrotondati) */
export function delayMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}
