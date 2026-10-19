/**
 * Bus ATVO (Azienda Trasporti Veneto Orientale S.p.A.) simulati dall'orario ufficiale di servizio,
 * per i collegamenti strategici lagunari:
 * - Linea 35: Venezia Express (Venezia Piazzale Roma <-> Aeroporto Marco Polo VCE)
 * - Linea 35B: Mestre Express (Mestre Stazione FS <-> Aeroporto Marco Polo VCE)
 * - Linea 10A: Autolinea Venezia P.le Roma <-> Jesolo Lido / San Donà di Piave
 *
 * Fonte: Orari ufficiali ATVO S.p.A. (https://www.atvo.it/it-orari-e-autolinee.html)
 */

export type AtvoStop = [number, number, number, string, boolean];

export interface AtvoTrip {
  id: string;
  line: string;
  name: string;
  from: string;
  to: string;
  start?: number;
  end?: number;
  dates: string[];
  shape: number;
  stops: AtvoStop[];
}

export type AtvoShape = [number, number, number][];

export interface AtvoData {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  trips: AtvoTrip[];
  shapes: AtvoShape[];
}

export interface AtvoBusPosition {
  id: string;
  trip: AtvoTrip;
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

export const ATVO_COLOR = '#0284c7';

export const dayStart = (ymd: string) =>
  Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));

/**
 * Distanza percorsa all'istante `t` (secondi dalla mezzanotte locale) e prossima fermata.
 */
export function distanceAt(
  stops: AtvoStop[],
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
  shape: AtvoShape,
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
 * Bus ATVO in viaggio all'istante `nowMs` dentro l'area della mappa.
 */
export function atvoPositions(data: AtvoData, nowMs: number): AtvoBusPosition[] {
  const out: AtvoBusPosition[] = [];
  for (const trip of data.trips) {
    const shape = data.shapes[trip.shape];
    if (!shape) continue;
    for (const ymd of trip.dates) {
      const base = dayStart(ymd);
      const t = (nowMs - base) / 1000;
      const at = distanceAt(trip.stops, t);
      if (!at) continue;
      const p = pointOnShape(shape, at.d);
      if (!p) continue;
      const nx = at.next !== null ? trip.stops[at.next] : null;
      out.push({
        id: `${trip.id}|${ymd}`,
        trip,
        ...p,
        atStop: at.atStop !== null ? trip.stops[at.atStop][3] : null,
        next: nx ? { name: nx[3], at: base + nx[1] * 1000, venice: nx[4] } : null,
        base,
        stopIndex: at.atStop ?? at.next,
      });
    }
  }
  return out;
}
