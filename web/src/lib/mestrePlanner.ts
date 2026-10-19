/**
 * «Come arrivare» da e per Mestre Stazione FS con i collegamenti intermodali, tutti da orari ufficiali:
 * - treni Trenitalia e Italo da/per Venezia Santa Lucia (orario BusOne: NeTEx del Punto di Accesso Nazionale e Italo);
 * - mezzi ACTV (bus, tram, vaporetti) dal GTFS ACTV, con il planner normale;
 * - FlixBus da/per Venezia Tronchetto (GTFS FlixMobility);
 * - Dolomiti Bus linea 72 da/per Piazzale Roma (orario PDF di dolomitibus.it).
 * Nessuna corsa cadenzata inventata: se un orario non c'è, l'opzione non compare. I costi li calcola fares.ts.
 */
import type { SimModel } from './simulationCore';
import { metersBetween, type WalkGraph } from './walkGraph';
import { BOARD_BUFFER_S, HORIZON_S, planTrip, type Itinerary, type Leg, type PlannerPoint, type PlanOptions } from './tripPlanner';
import { NO_WATER } from './dryRouting';
import type { DayType, StopItem } from './types';
import { romeYmd, trainsOnDate, type ScheduledTrainTrip } from './trainSimulation';
import { VENICE_RAILWAY_MAINLINE } from './railwayTracks';
import flixJson from '@/data/flixbus-venezia.json';
import dolomitiJson from '@/data/dolomitibus-venezia.json';
import { nextCoachLeg, type CoachData } from './coachSchedule';

/** Nodo di interscambio Mestre Stazione FS (Piazzale Favretti) */
export const MESTRE_STATION: PlannerPoint = { lon: 12.2325, lat: 45.4828, label: 'Mestre Stazione FS' };
/** Stazione di testa di Venezia Santa Lucia (banchine FS) */
export const SANTA_LUCIA: PlannerPoint = { lon: 12.3210, lat: 45.4412, label: 'Venezia Santa Lucia' };
/** Terminal automobilistico di Venezia Piazzale Roma */
export const PIAZZALE_ROMA: PlannerPoint = { lon: 12.3192, lat: 45.4383, label: 'Piazzale Roma' };
/** Terminal bus Tronchetto (People Mover / FlixBus) */
export const TRONCHETTO: PlannerPoint = { lon: 12.3050, lat: 45.4420, label: 'Tronchetto' };

/** Raggio di prossimità per considerare un punto «Mestre Stazione» (m) */
const STATION_RADIUS_M = 1200;

export const isMestreStation = (p: { lon: number; lat: number }): boolean =>
  metersBetween(p.lon, p.lat, MESTRE_STATION.lon, MESTRE_STATION.lat) <= STATION_RADIUS_M;

export const matchesMestreStation = (q: string): boolean =>
  /mestre\s*(stazione|fs|station|favretti)?|stazione\s*(di\s*)?mestre/i.test(q.trim());

/** Tracciato ferroviario Santa Lucia <-> Mestre */
const RAIL_COORDS: [number, number][] = VENICE_RAILWAY_MAINLINE.map((p) => [p.lon, p.lat]);

/** Trova i prossimi treni tra Santa Lucia e Mestre a partire da `readySec` (ora locale) nella data `ymd` */
export function nextTrains(readySec: number, toMestre: boolean, limit = 4, ymd: string = romeYmd()): ScheduledTrainTrip[] {
  const dir = toMestre ? 'OUTBOUND' : 'INBOUND';
  const horizon = readySec + HORIZON_S;
  return trainsOnDate(ymd)
    .filter((t) => t.direction === dir && t.departureSeconds >= readySec && t.departureSeconds <= horizon)
    .sort((a, b) => a.departureSeconds - b.departureSeconds)
    .slice(0, limit);
}

/** Crea una Leg di viaggio in treno */
function trainLeg(train: ScheduledTrainTrip, toMestre: boolean): Leg {
  const coords = toMestre ? RAIL_COORDS : [...RAIL_COORDS].reverse();
  return {
    kind: 'ride',
    line: train.trainNumber,
    category: 'train',
    headsign: train.destination,
    from: toMestre ? 'Venezia Santa Lucia' : 'Venezia Mestre',
    to: toMestre ? 'Venezia Mestre' : 'Venezia Santa Lucia',
    start: train.departureSeconds,
    end: train.arrivalSeconds,
    stops: 1,
    coords,
    tripDeparture: train.departureSeconds,
    color: train.operator === 'Italo' ? '#991b1b' : train.trainType === 'FRECCIAROSSA' ? '#dc2626' : '#0284c7',
    operator: train.operator,
  };
}

const TRONCHETTO_RE = /tronchetto/i;
const MESTRE_RE = /mestre/i;
const PLE_ROMA_RE = /p(iazza)?le\.? ?roma|piazzale roma/i;

/**
 * Calcola le opzioni di viaggio tra Venezia e Mestre Stazione FS: treni Trenitalia/Italo, mezzi ACTV,
 * Dolomiti Bus e FlixBus, tutti dagli orari ufficiali.
 */
export function planMestre(
  graph: WalkGraph,
  sim: SimModel,
  stops: StopItem[],
  from: PlannerPoint,
  to: PlannerPoint,
  nowSec: number,
  day: DayType,
  options: PlanOptions = {},
): Itinerary[] {
  const toMestre = isMestreStation(to);
  if (toMestre === isMestreStation(from)) return [];
  const venicePoint = toMestre ? from : to;
  const date = options.date ?? new Date();
  const ymd = romeYmd(date);
  const itineraries: Itinerary[] = [];
  const fastest = { ...options, mode: 'fastest' as const };
  const near = (p: PlannerPoint) => metersBetween(venicePoint.lon, venicePoint.lat, p.lon, p.lat) < 500;
  const empty = (): Itinerary => ({ depart: nowSec, arrive: nowSec, legs: [], walkMeters: 0, rides: 0, ridesInHighWater: false, ...NO_WATER });

  /** Tratto in città fino al terminal (andata) e itinerario completo con il mezzo verso Mestre */
  const viaTerminal = (terminal: PlannerPoint, ride: (ready: number) => Leg | null, via: Itinerary['via']) => {
    if (toMestre) {
      const city = near(terminal) ? empty() : planTrip(graph, sim, stops, venicePoint, terminal, nowSec, day, fastest).best;
      if (!city) return;
      const leg = ride(city.arrive + BOARD_BUFFER_S);
      if (!leg) return;
      itineraries.push({ depart: city.depart, arrive: leg.end, legs: [...city.legs, leg], rides: city.rides + 1, walkMeters: city.walkMeters, ridesInHighWater: city.ridesInHighWater, via, ...NO_WATER });
    } else {
      const leg = ride(nowSec + BOARD_BUFFER_S);
      if (!leg) return;
      const rest = near(terminal) ? null : planTrip(graph, sim, stops, terminal, venicePoint, leg.end + BOARD_BUFFER_S, day, fastest).best;
      if (!near(terminal) && !rest) return;
      itineraries.push({
        depart: leg.start,
        arrive: rest ? rest.arrive : leg.end,
        legs: rest ? [leg, ...rest.legs] : [leg],
        rides: 1 + (rest ? rest.rides : 0),
        walkMeters: rest ? rest.walkMeters : 0,
        ridesInHighWater: rest ? rest.ridesInHighWater : false,
        via,
        ...NO_WATER,
      });
    }
  };

  // 1. Treni Trenitalia e Italo (fino a due partenze)
  const firstTrains = (ready: number) => nextTrains(ready, toMestre, 2, ymd);
  const readyRail = toMestre
    ? (near(SANTA_LUCIA) ? nowSec : planTrip(graph, sim, stops, venicePoint, SANTA_LUCIA, nowSec, day, fastest).best?.arrive ?? null)
    : nowSec;
  if (readyRail !== null) {
    for (const tr of firstTrains(readyRail + BOARD_BUFFER_S)) {
      const fast = tr.trainType === 'FRECCIAROSSA' || tr.operator === 'Italo';
      viaTerminal(SANTA_LUCIA, () => trainLeg(tr, toMestre), fast ? 'treno_av' : 'treno_regionale');
    }
  }

  // 2. Mezzi ACTV (bus, tram, vaporetti) con il planner normale sul GTFS ACTV
  const actv = planTrip(graph, sim, stops, from, to, nowSec, day, options).best;
  if (actv && actv.rides > 0) itineraries.push({ ...actv, via: 'actv' });

  // 3. Dolomiti Bus linea 72 (Piazzale Roma - Mestre FS)
  viaTerminal(
    PIAZZALE_ROMA,
    (ready) =>
      nextCoachLeg(dolomitiJson as unknown as CoachData, toMestre ? { from: PLE_ROMA_RE, to: MESTRE_RE } : { from: MESTRE_RE, to: PLE_ROMA_RE }, ready, ready + HORIZON_S, date, {
        label: (l) => `Dolomiti Bus ${l}`,
        color: '#059669',
        operator: 'Dolomiti Bus',
      }),
    'dolomitibus',
  );

  // 4. FlixBus (Tronchetto - Mestre)
  viaTerminal(
    TRONCHETTO,
    (ready) =>
      nextCoachLeg(flixJson as unknown as CoachData, toMestre ? { from: TRONCHETTO_RE, to: MESTRE_RE } : { from: MESTRE_RE, to: TRONCHETTO_RE }, ready, ready + HORIZON_S, date, {
        label: (l) => `FlixBus ${l}`,
        color: '#84cc16',
        operator: 'FlixBus',
      }),
    'flixbus',
  );


  return itineraries.sort((a, b) => a.arrive - b.arrive);
}
