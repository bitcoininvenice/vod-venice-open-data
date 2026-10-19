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
  /** dati da OpenStreetMap: tutta la scheda quando i prezzi del Ministero non sono raggiungibili, altrimenti i dettagli */
  osm?: FuelStationOsm;
  /** Codice identificativo impianto MIMIT / ref:mise */
  mimitId?: string;
}

/** Dettagli del distributore su OpenStreetMap (ODbL), collegato al Ministero dal codice ref:mise */
export interface FuelStationOsm {
  url: string;
  /** carburanti venduti (fuel:*=yes), con i nomi del Ministero */
  fuels: string[];
  /** distributore per barche (waterway=fuel o boat=yes) */
  boat: boolean;
  openingHours: string | null;
}

/** Distributore di OpenStreetMap come generato da pipeline/import_osm_fuel.py */
export interface OsmFuelRecord {
  id: string;
  osmUrl: string;
  lat: number;
  lon: number;
  brand: string | null;
  address: string | null;
  comune: string | null;
  boat: boolean;
  fuels: string[];
  openingHours: string | null;
  mimitId: string | null;
}

const osmDetails = (r: OsmFuelRecord): FuelStationOsm => ({ url: r.osmUrl, fuels: r.fuels, boat: r.boat, openingHours: r.openingHours });

/** Distributore da OpenStreetMap senza prezzi (quando il dato del Ministero non è raggiungibile) */
export function stationFromOsm(r: OsmFuelRecord): FuelStation {
  return { id: r.id, lat: r.lat, lon: r.lon, brand: r.brand ?? '', address: r.address ?? '', comune: r.comune ?? '', highway: false, prices: [], osm: osmDetails(r), mimitId: r.mimitId ?? undefined };
}

/** Aggiunge ai distributori del Ministero i dettagli di OpenStreetMap (orari, barche), collegati da ref:mise */
export function withOsmDetails(stations: FuelStation[], osm: OsmFuelRecord[]): FuelStation[] {
  const byMimit = new Map(osm.filter((r) => r.mimitId).map((r) => [r.mimitId as string, r]));
  return stations.map((s) => {
    const r = byMimit.get(s.id);
    return r ? { ...s, osm: osmDetails(r) } : s;
  });
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

/** Zone per le statistiche: il Comune di Venezia diviso fra centro e isole, Lido e Pellestrina, terraferma. */
export const FUEL_ZONES = ['centro', 'lido', 'terraferma', 'chioggia', 'altri'] as const;
export type FuelZone = (typeof FUEL_ZONES)[number];

/**
 * Zona del distributore dal comune e da riquadri semplici: terraferma veneziana a nord del ponte della Libertà
 * (escluse Burano e le isole a est) e a ovest di Tronchetto; Lido e Pellestrina a sud del bacino di San Marco
 * (Fusina e Malcontenta, più a ovest, restano in terraferma).
 */
export function fuelZoneOf(s: Pick<FuelStation, 'comune' | 'lat' | 'lon'>): FuelZone {
  const comune = s.comune.trim().toUpperCase();
  if (comune === 'CHIOGGIA') return 'chioggia';
  if (comune !== 'VENEZIA') return 'altri';
  if ((s.lat > 45.465 && s.lon < 12.4) || (s.lon < 12.29 && s.lat > 45.4)) return 'terraferma';
  if (s.lat < 45.42 && s.lon > 12.28) return 'lido';
  return 'centro';
}

export interface FuelExtreme {
  price: number;
  station: Pick<FuelStation, 'id' | 'brand' | 'address' | 'comune'>;
}

export interface FuelStats {
  /** distributori con un prezzo aggiornato del carburante */
  count: number;
  /** distributori della zona con almeno un prezzo comunicato, anche vecchio o di un altro carburante */
  total: number;
  /** impianti dell'anagrafica della zona senza nessun prezzo comunicato (non sulla mappa) */
  withoutPrices: number;
  min: FuelExtreme | null;
  max: FuelExtreme | null;
  mean: number | null;
  median: number | null;
}

export interface FuelSummary {
  kind: FuelKind;
  all: FuelStats;
  byZone: Record<FuelZone, FuelStats>;
  /** distributori che vendono il carburante ma con un prezzo comunicato da oltre FUEL_STALE_DAYS giorni */
  stale: number;
  /** quanto costa in media il servito rispetto al self nello stesso distributore (€/l) */
  attendedPremium: number | null;
  /** differenza fra la media autostradale e quella delle altre strade (€/l) */
  highwayPremium: number | null;
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

function stats(rows: { s: FuelStation; price: number }[], total: number, withoutPrices: number): FuelStats {
  if (rows.length === 0) return { count: 0, total, withoutPrices, min: null, max: null, mean: null, median: null };
  const sorted = [...rows].sort((a, b) => a.price - b.price);
  const pick = (r: { s: FuelStation; price: number }): FuelExtreme => ({
    price: r.price,
    station: { id: r.s.id, brand: r.s.brand, address: r.s.address, comune: r.s.comune },
  });
  const mid = sorted.length / 2;
  const median = sorted.length % 2 ? sorted[Math.floor(mid)].price : (sorted[mid - 1].price + sorted[mid].price) / 2;
  return { count: rows.length, total, withoutPrices, min: pick(sorted[0]), max: pick(sorted[sorted.length - 1]), mean: mean(rows.map((r) => r.price)), median };
}

/** Statistiche dell'area e per zona su un carburante, con lo stesso prezzo usato dai colori della mappa. */
export function fuelSummary(
  stations: FuelStation[],
  kind: FuelKind,
  now: number,
  listedWithoutPrices: Pick<FuelStation, 'comune' | 'lat' | 'lon'>[] = [],
): FuelSummary {
  const rows: { s: FuelStation; price: number }[] = [];
  let stale = 0;
  const premiums: number[] = [];
  for (const s of stations) {
    const p = stationPrice(s, kind, now);
    if (p) rows.push({ s, price: p.price });
    else if (s.prices.some((x) => fuelKindOf(x.fuel) === kind)) stale += 1;
    const fresh = s.prices.filter((x) => fuelKindOf(x.fuel) === kind && !isStalePrice(x, now));
    const self = fresh.find((x) => x.self);
    const attended = fresh.find((x) => !x.self);
    if (self && attended) premiums.push(attended.price - self.price);
  }
  const byZone = Object.fromEntries(
    FUEL_ZONES.map((z) => [
      z,
      stats(
        rows.filter((r) => fuelZoneOf(r.s) === z),
        stations.filter((s) => fuelZoneOf(s) === z).length,
        listedWithoutPrices.filter((s) => fuelZoneOf(s) === z).length,
      ),
    ]),
  ) as Record<FuelZone, FuelStats>;
  const hw = mean(rows.filter((r) => r.s.highway).map((r) => r.price));
  const road = mean(rows.filter((r) => !r.s.highway).map((r) => r.price));
  return {
    kind,
    all: stats(rows, stations.length, listedWithoutPrices.length),
    byZone,
    stale,
    attendedPremium: mean(premiums),
    highwayPremium: hw !== null && road !== null ? hw - road : null,
  };
}
