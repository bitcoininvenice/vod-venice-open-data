/**
 * Tabellone dei collegamenti dell'aeroporto Marco Polo nei prossimi 90 minuti, dagli orari ufficiali:
 * autobus ACTV (5 Aerobus e linee per Mestre), barche Alilaguna, FlixBus. Partenze e arrivi.
 * Gli orari dei voli non sono pubblicati come dati aperti: qui ci sono solo i mezzi di terra e d'acqua.
 */
import type { SimModel } from './simulationCore';
import type { DayType } from './types';
import { scheduledArrivals, scheduledDepartures } from './scheduledDepartures';
import { ALILAGUNA_STOPS, type AlilagunaTripTimes } from './alilaguna-schedule';
import { AIRPORT_DOCKS, AEROBUS_COLOR } from './airportPlanner';
import { dayStart, FLIXBUS_COLOR, type FlixbusData } from './flixbus';
import { ATVO_COLOR, type AtvoData } from './atvo';
import { DOLOMITI_COLOR, type DolomitiData } from './dolomitibus';

/** Fermata degli autobus ACTV all'aeroporto (GTFS «Aeroporto MARCO POLO») */
const AIRPORT_BUS_STOP = { lon: 12.339084, lat: 45.504509 };
/** Nome della fermata dell'aeroporto nel feed FlixBus */
export const FLIX_AIRPORT_STOP = 'Venice (Marco Polo Airport)';
export const BOARD_WINDOW_S = 90 * 60;

export interface BoardRow {
  kind: 'bus' | 'alilaguna' | 'flixbus' | 'atvo' | 'dolomitibus';
  line: string;
  color: string | null;
  /** destinazione (partenze) o provenienza (arrivi) */
  place: string;
  /** istante (ms) */
  at: number;
}

export interface AirportBoard {
  departures: BoardRow[];
  arrivals: BoardRow[];
}

/** Nomi delle fermate ACTV più leggibili (la corsia degli autobus a Piazzale Roma si chiama «VENEZIA CORSIA C») */
export function prettyPlace(name: string): string {
  if (/^venezia corsia/i.test(name)) return 'Venezia, Piazzale Roma';
  return name;
}

interface BoardInput {
  sim: SimModel | null;
  day: DayType;
  nextDay: DayType;
  /** adesso: istante (ms) e secondi dalla mezzanotte a Venezia */
  nowMs: number;
  nowS: number;
  alilaguna: AlilagunaTripTimes[];
  flixbus: FlixbusData | null;
  atvo?: AtvoData | null;
  dolomitibus?: DolomitiData | null;
  /** destinazione di una linea quando il capolinea è fuori dalla mappa (nome lungo della linea) */
  lineName?: (line: string) => string | null;
  windowS?: number;
}

/** Fermata dell'aeroporto negli orari ATVO e Dolomiti Bus */
const AIRPORT_STOP = /aeroporto|airport|marco polo/i;

export function airportBoard({ sim, day, nextDay, nowMs, nowS, alilaguna, flixbus, atvo, dolomitibus, lineName, windowS = BOARD_WINDOW_S }: BoardInput): AirportBoard {
  const departures: BoardRow[] = [];
  const arrivals: BoardRow[] = [];
  const at = (s: number) => nowMs + (s - nowS) * 1000;
  const end = nowMs + windowS * 1000;

  if (sim) {
    for (const d of scheduledDepartures(sim, AIRPORT_BUS_STOP, day, nowS, windowS, nextDay)) {
      departures.push({ kind: 'bus', line: d.line, color: d.line === '5' ? AEROBUS_COLOR : null, place: prettyPlace(d.headsign || lineName?.(d.line) || ''), at: at(d.time) });
    }
    for (const a of scheduledArrivals(sim, AIRPORT_BUS_STOP, day, nowS, windowS, nextDay)) {
      arrivals.push({ kind: 'bus', line: a.line, color: a.line === '5' ? AEROBUS_COLOR : null, place: prettyPlace(a.origin || lineName?.(a.line) || ''), at: at(a.time) });
    }
  }

  for (const trip of alilaguna) {
    const line = trip.line.replace(/^Linea\s+/i, '');
    trip.stops.forEach((s, i) => {
      if (!AIRPORT_DOCKS.includes(s.stop)) return;
      if (i < trip.stops.length - 1 && s.dep >= nowS && s.dep <= nowS + windowS) {
        departures.push({ kind: 'alilaguna', line, color: trip.color, place: trip.headsign.replace(/^per\s+/i, ''), at: at(s.dep) });
      }
      if (i > 0 && s.arr >= nowS && s.arr <= nowS + windowS) {
        arrivals.push({ kind: 'alilaguna', line, color: trip.color, place: ALILAGUNA_STOPS[trip.stops[0].stop]?.name ?? '', at: at(s.arr) });
      }
    });
  }

  if (flixbus) {
    for (const trip of flixbus.trips) {
      const stop = trip.stops.find((s) => s[3] === FLIX_AIRPORT_STOP);
      if (!stop) continue;
      for (const ymd of trip.dates) {
        const base = dayStart(ymd);
        const dep = base + stop[2] * 1000;
        const arr = base + stop[1] * 1000;
        if (trip.to !== FLIX_AIRPORT_STOP && dep >= nowMs && dep <= end) departures.push({ kind: 'flixbus', line: trip.line, color: FLIXBUS_COLOR, place: trip.to, at: dep });
        if (trip.from !== FLIX_AIRPORT_STOP && arr >= nowMs && arr <= end) arrivals.push({ kind: 'flixbus', line: trip.line, color: FLIXBUS_COLOR, place: trip.from, at: arr });
      }
    }
  }

  // ATVO e Dolomiti Bus: orari in UTC per data di servizio, come FlixBus
  const coaches: [AtvoData | DolomitiData | null | undefined, 'atvo' | 'dolomitibus', string, string][] = [
    [atvo, 'atvo', 'ATVO', ATVO_COLOR],
    [dolomitibus, 'dolomitibus', 'Dolomiti Bus', DOLOMITI_COLOR],
  ];
  for (const [data, kind, label, color] of coaches) {
    for (const trip of data?.trips ?? []) {
      const i = trip.stops.findIndex((s) => AIRPORT_STOP.test(s[3]));
      if (i < 0) continue;
      const stop = trip.stops[i];
      for (const ymd of trip.dates) {
        const base = dayStart(ymd);
        const dep = base + stop[2] * 1000;
        const arr = base + stop[1] * 1000;
        if (i < trip.stops.length - 1 && dep >= nowMs && dep <= end) departures.push({ kind, line: `${label} ${trip.line}`, color, place: trip.to, at: dep });
        if (i > 0 && arr >= nowMs && arr <= end) arrivals.push({ kind, line: `${label} ${trip.line}`, color, place: trip.from, at: arr });
      }
    }
  }

  const byTime = (a: BoardRow, b: BoardRow) => a.at - b.at || a.line.localeCompare(b.line);
  return { departures: departures.sort(byTime), arrivals: arrivals.sort(byTime) };
}
