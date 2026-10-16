/**
 * Distributori di carburante e prezzi comunicati al Ministero delle Imprese e del Made in Italy
 * (art. 51 L. 99/2009), dal dataset aperto «Prezzi praticati e anagrafica degli impianti».
 * Il confronto dei prezzi è fra i distributori dell'area della mappa, per un carburante alla volta.
 */

/** Prezzo comunicato dal gestore per un carburante, in self o servito. */
export interface FuelPrice {
  /** nome del carburante come nel dataset (Benzina, Gasolio, GPL, Blue Diesel…) */
  fuel: string;
  self: boolean;
  /** €/litro (€/kg per il metano) */
  price: number;
  /** quando il gestore ha comunicato il prezzo (ISO) */
  communicatedAt: string | null;
}

/** Distributore: solo marchio e indirizzo, mai il nome del gestore (spesso una persona). */
export interface FuelStation {
  /** codice dell'impianto nel dataset del Ministero */
  id: string;
  lat: number;
  lon: number;
  /** marchio (Agip Eni, Api-Ip, Pompe Bianche…) */
  brand: string;
  address: string;
  comune: string;
  highway: boolean;
  prices: FuelPrice[];
}

/** Carburanti confrontabili sulla mappa: le versioni «premium» si vedono nella scheda ma non si confrontano. */
export const FUEL_KINDS = ['benzina', 'gasolio', 'gpl', 'metano'] as const;
export type FuelKind = (typeof FUEL_KINDS)[number];

/** Oltre questa età un prezzo non entra nel confronto: il gestore potrebbe non averlo aggiornato. */
export const FUEL_STALE_DAYS = 7;

const KIND_BY_NAME: Record<string, FuelKind> = { benzina: 'benzina', gasolio: 'gasolio', gpl: 'gpl', metano: 'metano' };

export function fuelKindOf(fuel: string): FuelKind | null {
  return KIND_BY_NAME[fuel.trim().toLowerCase()] ?? null;
}

export function isStalePrice(p: FuelPrice, now: number): boolean {
  if (!p.communicatedAt) return true;
  const t = Date.parse(p.communicatedAt);
  return !Number.isFinite(t) || now - t > FUEL_STALE_DAYS * 86_400_000;
}

/** Prezzo più basso del carburante nel distributore (self o servito), solo fra quelli aggiornati. */
export function stationPrice(s: FuelStation, kind: FuelKind, now: number): FuelPrice | null {
  let best: FuelPrice | null = null;
  for (const p of s.prices) {
    if (fuelKindOf(p.fuel) !== kind || isStalePrice(p, now)) continue;
    if (!best || p.price < best.price) best = p;
  }
  return best;
}

export interface FuelRank {
  price: FuelPrice;
  /** 0 = il più economico dell'area, 1 = il più caro (posizione media in caso di parità) */
  rank: number;
  /** posizione 1..total dal più economico */
  position: number;
  total: number;
}

/** Posizione di ogni distributore fra quelli dell'area con un prezzo aggiornato per il carburante. */
export function rankFuelStations(stations: FuelStation[], kind: FuelKind, now: number): Map<string, FuelRank> {
  const priced = stations
    .map((s) => ({ id: s.id, price: stationPrice(s, kind, now) }))
    .filter((x): x is { id: string; price: FuelPrice } => x.price !== null);
  const values = priced.map((x) => x.price.price).sort((a, b) => a - b);
  const total = values.length;
  const out = new Map<string, FuelRank>();
  for (const x of priced) {
    const first = values.indexOf(x.price.price);
    const last = values.lastIndexOf(x.price.price);
    const mid = (first + last) / 2;
    out.set(x.id, { price: x.price, rank: total > 1 ? mid / (total - 1) : 0, position: first + 1, total });
  }
  return out;
}

const GREEN: [number, number, number] = [22, 163, 74];
const AMBER: [number, number, number] = [234, 179, 8];
const RED: [number, number, number] = [220, 38, 38];
/** Distributore senza un prezzo aggiornato per il carburante scelto */
export const FUEL_NO_PRICE_COLOR = '#94a3b8';

/** Dal verde (più economico) al rosso (più caro), passando per il giallo. */
export function fuelRankColor(rank: number): string {
  const r = Math.min(1, Math.max(0, rank));
  const [a, b, k] = r < 0.5 ? [GREEN, AMBER, r * 2] : [AMBER, RED, (r - 0.5) * 2];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Prezzo con tre decimali, come lo pubblica il Ministero */
export function formatFuelPrice(price: number, locale: string): string {
  return price.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
