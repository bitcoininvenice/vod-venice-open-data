/**
 * Ritardo dei mezzi ACTV calcolato dalla posizione GPS sull'orario ufficiale (GTFS), verificato
 * con il ritardo dichiarato da ACTV (TripUpdates).
 *
 * Il mezzo viene proiettato sul percorso della sua corsa: dal punto raggiunto si ricava a che ora,
 * secondo l'orario, la corsa doveva trovarsi lì; il ritardo è la differenza con l'ora della posizione.
 * Il calcolo non si fa quando il mezzo è fermo a un pontile (la sosta lo falserebbe) o lontano dal
 * percorso; se il valore calcolato e quello di ACTV differiscono di oltre 15 minuti la corsa è
 * probabilmente associata male e nessun ritardo viene mostrato.
 */
import { GRID } from '@/lib/simulation-data';
import type { SimModel, SimProfile, SimShape } from '@/lib/simulationCore';
import type { DayType } from '@/lib/types';

/** Oltre questa distanza dal percorso la posizione non viene usata (m). */
export const MAX_OFFSET_M = 200;
/** Entro questa distanza da una fermata il mezzo può essere in sosta: niente calcolo (m). */
export const AT_STOP_M = 15;
/** Due passaggi più vicini di così lungo il percorso sono lo stesso passaggio (m). */
const PASS_GAP_M = 300;
/** Tra più passaggi plausibili si sceglie quello coerente con il ritardo atteso, se non più lontano di così (m). */
const PASS_SLACK_M = 50;
/** Disaccordo massimo tra ritardo calcolato e ritardo ACTV (s). */
export const DISAGREE_SECONDS = 15 * 60;
/** Ritardi oltre le due ore sono considerati errori di associazione (s). */
export const MAX_ABS_DELAY_SECONDS = 2 * 60 * 60;

const [LON0, LON1, LAT0, LAT1] = GRID.frame;
const KX = GRID.W / (LON1 - LON0);
const KY = GRID.H / (LAT1 - LAT0);

/** Longitudine/latitudine -> coordinate della griglia della simulazione (circa 1 unità = 1 m). */
export function toGrid(lon: number, lat: number): [number, number] {
  return [(lon - LON0) * KX, (LAT1 - lat) * KY];
}

/** Coordinate della griglia -> [longitudine, latitudine]. */
export function fromGrid(x: number, y: number): [number, number] {
  return [LON0 + x / KX, LAT1 - y / KY];
}

export interface Pass {
  /** distanza lungo il percorso (m) */
  d: number;
  /** distanza del mezzo dal percorso (m) */
  off: number;
}

/**
 * Punti del percorso vicini al mezzo: uno per ogni passaggio (un percorso circolare può passare due
 * volte dallo stesso punto). Senza passaggi vicini restituisce il punto più vicino in assoluto.
 */
export function passesNear(sh: SimShape, x: number, y: number): Pass[] {
  const out: Pass[] = [];
  let best: Pass = { d: 0, off: Infinity };
  for (let i = 0; i < sh.n - 1; i++) {
    const ax = sh.xy[2 * i] - x;
    const ay = sh.xy[2 * i + 1] - y;
    const dx = sh.xy[2 * i + 2] - sh.xy[2 * i];
    const dy = sh.xy[2 * i + 3] - sh.xy[2 * i + 1];
    const len2 = dx * dx + dy * dy;
    const u = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const off = Math.hypot(ax + u * dx, ay + u * dy);
    const d = sh.cum[i] + (sh.cum[i + 1] - sh.cum[i]) * u;
    if (off < best.off) best = { d, off };
    if (off >= MAX_OFFSET_M) continue;
    const same = out.find((p) => Math.abs(p.d - d) < PASS_GAP_M);
    if (!same) out.push({ d, off });
    else if (off < same.off) Object.assign(same, { d, off });
  }
  if (out.length === 0) out.push(best);
  return out.sort((a, b) => a.off - b.off);
}

/** Secondi dalla partenza in cui, secondo l'orario, la corsa si trova alla distanza `d` (null fuori percorso). */
export function scheduledOffsetAt(p: SimProfile, d: number): number | null {
  const { T, Dd } = p;
  for (let i = 0; i < T.length - 1; i++) {
    if (d >= Dd[i] && d <= Dd[i + 1] && Dd[i + 1] > Dd[i]) return T[i] + ((d - Dd[i]) / (Dd[i + 1] - Dd[i])) * (T[i + 1] - T[i]);
  }
  return null;
}

export function nearStop(p: SimProfile, d: number): boolean {
  for (let i = 0; i < p.Dd.length; i++) if (Math.abs(p.Dd[i] - d) < AT_STOP_M) return true;
  return false;
}

/** Tra i passaggi plausibili, quello il cui ritardo è più vicino a quello atteso (es. quello di ACTV). */
export function pickPass(passes: Pass[], lagAt: (d: number) => number | null, expected: number): Pass {
  let pick = passes[0];
  let gap = Infinity;
  for (const p of passes) {
    if (p.off > passes[0].off + PASS_SLACK_M) break;
    const lag = lagAt(p.d);
    if (lag !== null && Math.abs(lag - expected) < gap) {
      gap = Math.abs(lag - expected);
      pick = p;
    }
  }
  return pick;
}

/**
 * Ritardo dalla posizione: `elapsed` sono i secondi trascorsi dalla partenza programmata all'ora della
 * posizione. null se il mezzo è lontano dal percorso, a un pontile o fuori dal tratto della corsa.
 */
export function positionDelay(p: SimProfile, lon: number, lat: number, elapsed: number, expected = 0): number | null {
  const [x, y] = toGrid(lon, lat);
  const lagAt = (d: number) => {
    const tau = scheduledOffsetAt(p, d);
    return tau === null ? null : elapsed - tau;
  };
  const pass = pickPass(passesNear(p.sh, x, y), lagAt, expected);
  if (pass.off >= MAX_OFFSET_M || nearStop(p, pass.d)) return null;
  const lag = lagAt(pass.d);
  return lag === null ? null : Math.round(lag) || 0; // || 0: niente "-0"
}

export type DelaySource = 'position' | 'actv';

export interface TrustedDelay {
  seconds: number;
  source: DelaySource;
}

/**
 * Ritardo da mostrare: quello dalla posizione se c'è (verificato con ACTV), altrimenti quello di ACTV.
 * `conflict` quando i due differiscono troppo: in quel caso nessun ritardo.
 */
export function trustDelay(position: number | null, actv: number | null): TrustedDelay | 'conflict' | null {
  if (position !== null && actv !== null && Math.abs(position - actv) > DISAGREE_SECONDS) return 'conflict';
  const chosen: TrustedDelay | null = position !== null ? { seconds: position, source: 'position' } : actv !== null ? { seconds: actv, source: 'actv' } : null;
  if (chosen && Math.abs(chosen.seconds) > MAX_ABS_DELAY_SECONDS) return 'conflict';
  return chosen;
}

/** "HH:MM:SS" (anche oltre le 24 per le corse dopo mezzanotte) -> secondi. */
export function parseGtfsTime(value: string | null | undefined): number | null {
  const m = value?.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

export interface ScheduledTrip {
  profile: SimProfile;
  /** partenza programmata, secondi dalla mezzanotte del giorno di servizio */
  departure: number;
}

/** Indice delle corse dell'orario per linea e partenza (più corse se lo stesso numero è vaporetto e bus), per tipo di giorno. */
export type TripIndex = Record<DayType, Map<string, ScheduledTrip[]>>;

const WATER = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry']);
/** Rete di una corsa dell'orario: navigazione o automobilistico (bus, tram, bus delle isole, People Mover) */
export const tripNetwork = (p: SimProfile): 'navigazione' | 'automobilistico' => (WATER.has(p.route.cat) ? 'navigazione' : 'automobilistico');

export function indexTrips(model: SimModel): TripIndex {
  const out = {} as TripIndex;
  for (const day of ['weekday', 'saturday', 'sunday'] as DayType[]) {
    const m = new Map<string, ScheduledTrip[]>();
    const trips = model.daysTrips[day];
    for (let i = 0; i < trips.count; i++) {
      const profile = model.profs[trips.tP[i]];
      const departure = trips.t0[i];
      if (departure < 0) continue; // corsa del giorno prima, già indicizzata nel suo giorno
      const key = `${profile.route.n}|${departure}`;
      m.set(key, [...(m.get(key) ?? []), { profile, departure }]);
    }
    out[day] = m;
  }
  return out;
}

/**
 * Corsa dell'orario con la stessa linea e partenza. Prima il tipo di giorno atteso, poi gli altri
 * (nei festivi infrasettimanali ACTV usa l'orario festivo).
 */
export function matchTrip(
  index: TripIndex,
  line: string,
  departure: number,
  day: DayType,
  network?: 'navigazione' | 'automobilistico',
): ScheduledTrip | null {
  const order: DayType[] = [day, ...(['weekday', 'saturday', 'sunday'] as DayType[]).filter((d) => d !== day)];
  for (const d of order) {
    const hits = index[d].get(`${line}|${departure}`);
    // con la rete del mezzo si esclude la linea omonima dell'altra rete (es. bus 15 e vaporetto 15)
    const hit = hits?.find((h) => !network || tripNetwork(h.profile) === network);
    if (hit) return hit;
  }
  return null;
}
