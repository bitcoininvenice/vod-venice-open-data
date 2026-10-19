/**
 * Prossima corsa dei bus a orario (FlixBus, ATVO, Dolomiti Bus) per i planner. Tutti questi orari usano lo stesso
 * formato delle pipeline: secondi UTC dalla mezzanotte UTC di ogni data di servizio (YYYYMMDD) e fermate
 * [distanza sul percorso (m), arrivo, partenza, nome, fermata veneziana]. Il planner ragiona in secondi locali
 * della data di Venezia: la conversione tiene conto dell'ora legale.
 */
import type { Leg } from './tripPlanner';
import { romeLocalToDate, romeToday } from './time';

export type CoachStop = [number, number, number, string, boolean];

export interface CoachData {
  trips: { line: string; to: string; dates: string[]; shape: number; stops: CoachStop[] }[];
  shapes: [number, number, number][][];
}

export interface CoachMatch {
  from: RegExp;
  to: RegExp;
  /** solo questa linea (es. ATVO 35 o 35B) */
  line?: string;
}

export interface CoachLegStyle {
  label: (line: string) => string;
  color: string;
  operator: 'FlixBus' | 'ATVO' | 'Dolomiti Bus';
}

const utcDayStart = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));

/** Mezzanotte locale di Venezia (epoch ms) del giorno di `date` */
export function romeMidnightOf(date: Date): number {
  return romeLocalToDate(`${romeToday(date)} 00:00:00`).getTime();
}

/** Tratto del percorso fra due distanze (m) */
function shapeBetween(shape: [number, number, number][] | undefined, d0: number, d1: number): [number, number][] {
  if (!shape) return [];
  return shape.filter((p) => p[2] >= d0 && p[2] <= d1).map((p) => [p[0], p[1]]);
}

/**
 * Prima corsa che parte da una fermata `from` fra readySec e horizonSec (secondi locali del giorno di `date`)
 * e arriva poi a una fermata `to`. Le date di servizio sono quelle del file: nessuna corsa fuori orario.
 */
export function nextCoachLeg(
  data: CoachData,
  match: CoachMatch,
  readySec: number,
  horizonSec: number,
  date: Date,
  style: CoachLegStyle,
): Leg | null {
  const midnight = romeMidnightOf(date);
  let best: Leg | null = null;
  for (const t of data.trips) {
    if (match.line && t.line !== match.line) continue;
    const a = t.stops.findIndex((s) => match.from.test(s[3]));
    const b = t.stops.findIndex((s, i) => i > a && match.to.test(s[3]));
    if (a < 0 || b < 0) continue;
    for (const ymd of t.dates) {
      const base = utcDayStart(ymd);
      const dep = (base + t.stops[a][2] * 1000 - midnight) / 1000;
      if (dep < readySec || dep > horizonSec || (best && dep >= best.start)) continue;
      const arr = (base + t.stops[b][1] * 1000 - midnight) / 1000;
      best = {
        kind: 'ride',
        line: style.label(t.line),
        category: 'bus',
        headsign: t.to,
        from: t.stops[a][3],
        to: t.stops[b][3],
        start: dep,
        end: arr,
        stops: b - a,
        coords: shapeBetween(data.shapes[t.shape], t.stops[a][0], t.stops[b][0]),
        tripDeparture: dep,
        color: style.color,
        operator: style.operator,
      };
    }
  }
  return best;
}
