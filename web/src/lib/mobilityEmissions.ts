/**
 * Alimentazione dei mezzi pubblici (elettrica o a motore termico) per il planner e le metriche.
 *
 * Solo ciò che è noto: tram, People Mover e treni sono elettrici; vaporetti, motoscafi, motonavi, Alilaguna e
 * bus extraurbani (ATVO, Dolomiti Bus, FlixBus, Busitalia) vanno a motore termico; la flotta dei bus urbani ACTV
 * è mista e l'orario non dice quale mezzo fa la corsa, quindi resta «non nota». Nessuna stima di CO2: non
 * esistono fattori di emissione ufficiali per passeggero dei mezzi lagunari, e un numero inventato sarebbe peggio
 * di nessun numero.
 */
import type { Itinerary, Leg } from './tripPlanner';
import { WATER_CATEGORIES } from './transitNetwork';

export type Propulsion = 'electric' | 'fossil' | 'unknown';

const ELECTRIC_CATEGORIES = new Set(['tram', 'peoplemover', 'train']);
const FOSSIL_OPERATORS = new Set(['alilaguna', 'ATVO', 'Dolomiti Bus', 'FlixBus', 'Busitalia Veneto']);

/** Alimentazione di un mezzo pubblico per categoria e operatore */
export function propulsionOf(category: string, operator?: string, line?: string): Propulsion {
  if (ELECTRIC_CATEGORIES.has(category) || operator === 'Trenitalia' || operator === 'Italo' || line === 'T1' || line === 'T2') return 'electric';
  if (WATER_CATEGORIES.has(category) || (operator && FOSSIL_OPERATORS.has(operator))) return 'fossil';
  return 'unknown';
}

export interface ItineraryEmissions {
  /** secondi a piedi */
  walkSeconds: number;
  /** secondi su mezzi elettrici (tram, People Mover, treni) */
  electricSeconds: number;
  /** secondi su mezzi a motore termico (barche, bus extraurbani, barca propria) */
  fossilSeconds: number;
  /** secondi su bus urbani ACTV (flotta mista, alimentazione non nota) */
  unknownSeconds: number;
  /** solo a piedi o su mezzi elettrici: zero emissioni allo scarico lungo il percorso */
  isZeroEmission: boolean;
}

function legSeconds(leg: Leg): number {
  return Math.max(0, leg.end - leg.start);
}

/** Tempo del viaggio per tipo di alimentazione (dall'orario, non stimato) */
export function calculateItineraryEmissions(itinerary: Pick<Itinerary, 'legs'>): ItineraryEmissions {
  const out = { walkSeconds: 0, electricSeconds: 0, fossilSeconds: 0, unknownSeconds: 0 };
  for (const leg of itinerary.legs) {
    if (leg.kind === 'walk') out.walkSeconds += legSeconds(leg);
    else if (leg.kind === 'boat') out.fossilSeconds += legSeconds(leg);
    else {
      const p = propulsionOf(leg.category, leg.operator, leg.line);
      out[p === 'electric' ? 'electricSeconds' : p === 'fossil' ? 'fossilSeconds' : 'unknownSeconds'] += legSeconds(leg);
    }
  }
  return { ...out, isZeroEmission: out.fossilSeconds === 0 && out.unknownSeconds === 0 };
}

/** Per l'ordinamento «più ecologico»: prima chi passa meno tempo su mezzi a motore termico (o non noti) */
export function fossilScore(e: ItineraryEmissions): number {
  return e.fossilSeconds + e.unknownSeconds;
}

export interface ModeTrips {
  /** chiave del modo (vaporetto, tram, train…) */
  mode: string;
  operator: string;
  propulsion: Propulsion;
  trips: number;
}

export interface PropulsionReport {
  /** giorno a cui si riferiscono le corse, YYYY-MM-DD */
  date: string;
  modes: ModeTrips[];
  totals: Record<Propulsion, number>;
  total: number;
}

/** Riepilogo delle corse del giorno per alimentazione */
export function propulsionReport(date: string, modes: ModeTrips[]): PropulsionReport {
  const totals: Record<Propulsion, number> = { electric: 0, fossil: 0, unknown: 0 };
  for (const m of modes) totals[m.propulsion] += m.trips;
  return { date, modes: [...modes].sort((a, b) => b.trips - a.trips), totals, total: totals.electric + totals.fossil + totals.unknown };
}
