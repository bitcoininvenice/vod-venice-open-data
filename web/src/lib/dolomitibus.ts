/**
 * Bus Dolomiti Bus (Dolomiti Bus S.p.A. - Gruppo Autoguidovie), linea extraurbana di collegamento
 * Dolomiti - Laguna:
 * - Linea 72: Venezia Piazzale Roma <-> Mestre Stazione FS <-> Aeroporto Marco Polo VCE <-> Treviso <-> Longarone <-> Tai di Cadore <-> Cortina d'Ampezzo
 *
 * Fonte: Orario ufficiale Dolomiti Bus S.p.A. / Cortina Express (https://www.dolomitibus.it)
 */

export type DolomitiStop = [number, number, number, string, boolean];

export interface DolomitiTrip {
  id: string;
  line: string;
  name: string;
  from: string;
  to: string;
  start?: number;
  end?: number;
  dates: string[];
  shape: number;
  stops: DolomitiStop[];
}

export type DolomitiShape = [number, number, number][];

export interface DolomitiData {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  trips: DolomitiTrip[];
  shapes: DolomitiShape[];
}

export interface DolomitiBusPosition {
  id: string;
  trip: DolomitiTrip;
  lon: number;
  lat: number;
  /** Direzione in radianti (0 = nord, senso orario) */
  heading: number;
  /** Fermo a una fermata */
  atStop: string | null;
  /** Prossima fermata e orario (epoch ms) */
  next: { name: string; at: number; venice: boolean } | null;
  /** Mezzanotte UTC della data di servizio (epoch ms) */
  base: number;
  stopIndex: number | null;
}

export const DOLOMITI_COLOR = '#059669';

export const dayStart = (ymd: string) =>
  Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));

/**
 * Distanza percorsa all'istante `t` (secondi dalla mezzanotte locale) e prossima fermata.
 */
export function distanceAt(
  stops: DolomitiStop[],
  t: number
): { d: number; atStop: number | null; next: number | null } | null {
  if (stops.length < 2 || t < stops[0][1] || t > stops[stops.length - 1][1]) return null;
  for (let i = 0; i < stops.length; i++) {
    const [d, arr, dep] = stops[i];
    if (t >= arr && t <= dep) return { d, atStop: i, next: i + 1 < stops.length ? i + 1 : null };
    const nx = stops[i + 1];
    if (nx && t > dep && t < nx[1]) {
      const f = (t - dep) / Math.max(1, nx[1] - dep);
      return { d: d + (nx[0] - d) * f, atStop: null, next: i + 1 };
    }
  }
  return null;
}

/**
 * Punto del percorso alla distanza `d` con la relativa direzione bussola.
 */
export function pointOnShape(
  shape: DolomitiShape,
  d: number
): { lon: number; lat: number; heading: number } | null {
  if (shape.length < 2 || d < shape[0][2] || d > shape[shape.length - 1][2]) return null;
  for (let i = 1; i < shape.length; i++) {
    const [ax, ay, ad] = shape[i - 1];
    const [bx, by, bd] = shape[i];
    if (d > bd) continue;
    const f = bd > ad ? (d - ad) / (bd - ad) : 0;
    const k = Math.cos((ay * Math.PI) / 180);
    return {
      lon: ax + (bx - ax) * f,
      lat: ay + (by - ay) * f,
      heading: Math.atan2((bx - ax) * k, by - ay),
    };
  }
  return null;
}

/**
 * Trova i bus Dolomiti Bus in servizio a una data ora (epoch ms).
 */
export function dolomitiPositions(data: DolomitiData, epochMs: number): DolomitiBusPosition[] {
  const d = new Date(epochMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const ymd = `${y}${m}${day}`;
  const base = dayStart(ymd);
  const tSec = Math.floor((epochMs - base) / 1000);

  const out: DolomitiBusPosition[] = [];
  for (const trip of data.trips) {
    if (!trip.dates.includes(ymd)) continue;
    const loc = distanceAt(trip.stops, tSec);
    if (!loc) continue;
    const shape = data.shapes[trip.shape];
    if (!shape) continue;
    const pt = pointOnShape(shape, loc.d);
    if (!pt) continue;

    const atStop = loc.atStop !== null ? trip.stops[loc.atStop][3] : null;
    const nextStop = loc.next !== null ? trip.stops[loc.next] : null;
    out.push({
      id: `${trip.id}-${ymd}`,
      trip,
      lon: pt.lon,
      lat: pt.lat,
      heading: pt.heading,
      atStop,
      next: nextStop ? { name: nextStop[3], at: base + nextStop[1] * 1000, venice: nextStop[4] } : null,
      base,
      stopIndex: loc.atStop ?? loc.next,
    });
  }
  return out;
}
