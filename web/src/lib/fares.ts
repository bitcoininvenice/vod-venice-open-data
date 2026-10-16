/**
 * Costo stimato di un itinerario con i mezzi pubblici, dalle tariffe pubblicate da AVM/ACTV («Prezzi in vigore»)
 * e da Alilaguna («Tariffe»), verificate il FARES_CHECKED_AT. I GTFS di ACTV e Alilaguna non contengono le
 * tariffe: i prezzi sono riportati qui a mano e vanno ricontrollati quando cambiano.
 *
 * Regole ACTV (rete unica urbana del Comune di Venezia): il biglietto vale 75 minuti dalla prima validazione e il
 * viaggio deve concludersi entro la validità; oltre serve un nuovo biglietto. Il biglietto ordinario vale per
 * vaporetti, bus, tram e People Mover ma non per i viaggi da e per l'aeroporto (aerobus); con la tessera Venezia
 * Unica il biglietto da 75 minuti vale anche per l'aeroporto. Le linee extraurbane hanno tariffe a fasce: non
 * si stimano.
 */
import type { Itinerary, Leg } from './tripPlanner';
import { WATER_CATEGORIES } from './transitNetwork';

export const FARES_CHECKED_AT = '2026-10-16';

/** Chi viaggia: biglietto ordinario, tessera Venezia Unica abilitata (residenti, studenti, pendolari), abbonamento ACTV */
export const FARE_PROFILES = ['ordinary', 'veneziaUnica', 'pass'] as const;
export type FareProfile = (typeof FARE_PROFILES)[number];

export const ACTV_FARES = {
  /** biglietto ordinario 75 minuti rete unica (navigazione, bus, tram, People Mover) */
  reteUnica: 9.5,
  /** biglietto ordinario automobilistico 75 minuti (bus, tram, People Mover) */
  bus: 1.5,
  /** biglietto aerobus, da e per l'aeroporto Marco Polo */
  aerobus: 10,
  /** biglietto rete unica 75 minuti con tessera Venezia Unica abilitata, aeroporto compreso */
  veneziaUnica: 1.5,
} as const;

export const ALILAGUNA_FARES = {
  ordinary: { airportVenice: 18, airportMurano: 10, other: 10 },
  veneziaUnica: { airportVenice: 10, airportMurano: 5, other: 5 },
} as const;

/** Validità del biglietto ACTV a tempo */
export const ACTV_TICKET_S = 75 * 60;

export type TicketKind = 'reteUnica' | 'bus' | 'aerobus' | 'veneziaUnica' | 'pass' | 'alilaguna';

export interface FareTicket {
  kind: TicketKind;
  price: number;
  /** indici delle tappe coperte dal biglietto */
  legs: number[];
}

export interface TripCost {
  profile: FareProfile;
  /** somma dei biglietti stimati (0 a piedi o con l'abbonamento) */
  total: number;
  tickets: FareTicket[];
  /** linee senza tariffa stimata (extraurbane): il totale le esclude */
  unpriced: string[];
}

type Ride = Extract<Leg, { kind: 'ride' }>;

const AIRPORT = /aeroporto|marco polo/i;
const MURANO = /murano/i;

/** Linee extraurbane ACTV: nel GTFS il nome finisce con «E» (53E, 10E…) oppure è un servizio OMN */
export function isExtraurbanLine(line: string): boolean {
  return /^\d+[A-Z]*E$|^HE$|^OMN/i.test(line.trim());
}

const touchesAirport = (r: Ride) => AIRPORT.test(r.from) || AIRPORT.test(r.to);

function alilagunaPrice(r: Ride, profile: FareProfile): number {
  // chi ha l'abbonamento ACTV ha la tessera Venezia Unica: Alilaguna non è compresa, si paga a tariffa Venezia Unica
  const table = profile === 'ordinary' ? ALILAGUNA_FARES.ordinary : ALILAGUNA_FARES.veneziaUnica;
  if (!touchesAirport(r)) return table.other;
  return MURANO.test(r.from) || MURANO.test(r.to) ? table.airportMurano : table.airportVenice;
}

/** Biglietti stimati per un itinerario e un profilo di viaggiatore. */
export function tripCost(it: Pick<Itinerary, 'legs'>, profile: FareProfile): TripCost {
  const tickets: FareTicket[] = [];
  const unpriced: string[] = [];
  /** biglietto ACTV a tempo in uso: inizio della validità e indice in `tickets` */
  let open: { from: number; index: number } | null = null;
  it.legs.forEach((leg, i) => {
    if (leg.kind !== 'ride') return;
    if (leg.operator === 'alilaguna') {
      tickets.push({ kind: 'alilaguna', price: alilagunaPrice(leg, profile), legs: [i] });
      return;
    }
    if (isExtraurbanLine(leg.line)) {
      if (!unpriced.includes(leg.line)) unpriced.push(leg.line);
      return;
    }
    if (profile === 'pass') {
      tickets.push({ kind: 'pass', price: 0, legs: [i] });
      return;
    }
    const water = WATER_CATEGORIES.has(leg.category);
    if (profile === 'ordinary' && touchesAirport(leg)) {
      // l'ordinario non vale per l'aeroporto: aerobus a parte
      tickets.push({ kind: 'aerobus', price: ACTV_FARES.aerobus, legs: [i] });
      return;
    }
    if (open && leg.end <= open.from + ACTV_TICKET_S) {
      const t = tickets[open.index];
      t.legs.push(i);
      // un tratto in vaporetto nello stesso biglietto richiede la rete unica
      if (profile === 'ordinary' && water && t.kind === 'bus') {
        t.kind = 'reteUnica';
        t.price = ACTV_FARES.reteUnica;
      }
      return;
    }
    const kind: TicketKind = profile === 'veneziaUnica' ? 'veneziaUnica' : water ? 'reteUnica' : 'bus';
    tickets.push({ kind, price: ACTV_FARES[kind], legs: [i] });
    open = { from: leg.start, index: tickets.length - 1 };
  });
  const total = Math.round(tickets.reduce((s, t) => s + t.price, 0) * 100) / 100;
  return { profile, total, tickets, unpriced };
}

/** Importo in euro con due decimali */
export function formatEuro(v: number, locale: string): string {
  return `${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Litri e costo stimati del carburante per un tragitto in barca, dal consumo orario indicato dall'utente. */
export function boatFuelCost(seconds: number, litresPerHour: number, pricePerLitre: number): { litres: number; cost: number } {
  const litres = (seconds / 3600) * litresPerHour;
  return { litres, cost: litres * pricePerLitre };
}
