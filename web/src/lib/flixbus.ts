/**
 * Bus FlixBus simulati dall'orario ufficiale (GTFS europeo FlixMobility, ODbL) lungo il percorso del feed,
 * solo nel tratto dentro l'area della mappa. Non sono posizioni GPS.
 */

/** [distanza sul percorso (m), arrivo (s UTC dalla mezzanotte della data), partenza, nome fermata, fermata veneziana] */
export type FlixStop = [number, number, number, string, boolean];

export interface FlixTrip {
  id: string;
  line: string;
  name: string;
  from: string;
  to: string;
  /** partenza dal capolinea e arrivo a destinazione (s UTC dalla mezzanotte della data) */
  start?: number;
  end?: number;
  /** date di servizio YYYYMMDD (UTC) */
  dates: string[];
  shape: number;
  stops: FlixStop[];
}

/** Percorso ritagliato: [lon, lat, distanza progressiva (m)] */
export type FlixShape = [number, number, number][];

export interface FlixbusData {
  trips: FlixTrip[];
  shapes: FlixShape[];
}

export interface FlixBusPosition {
  id: string;
  trip: FlixTrip;
  lon: number;
  lat: number;
  /** direzione in radianti (0 = nord, senso orario) */
  heading: number;
  /** fermo a una fermata */
  atStop: string | null;
  /** prossima fermata e orario (epoch ms) */
  next: { name: string; at: number; venice: boolean } | null;
  /** mezzanotte UTC della data di servizio (epoch ms): gli orari della corsa sono relativi a questa */
  base: number;
  /** indice della fermata in sosta o della prossima, nell'elenco trip.stops */
  stopIndex: number | null;
}

/** Istante (epoch ms) di un orario della corsa, in secondi dalla mezzanotte UTC della data */
export const flixTime = (base: number, seconds: number) => base + seconds * 1000;

export const FLIXBUS_COLOR = '#73d700';

const dayStart = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));

/** Distanza percorsa all'istante `t` (s dall'inizio della data) e prossima fermata; null fuori dalla corsa. */
export function distanceAt(stops: FlixStop[], t: number): { d: number; atStop: number | null; next: number | null } | null {
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

/** Punto del percorso alla distanza `d`, con la direzione; null se fuori dal tratto ritagliato (fuori mappa). */
export function pointOnShape(shape: FlixShape, d: number): { lon: number; lat: number; heading: number } | null {
  if (shape.length < 2 || d < shape[0][2] || d > shape[shape.length - 1][2]) return null;
  for (let i = 1; i < shape.length; i++) {
    const [ax, ay, ad] = shape[i - 1];
    const [bx, by, bd] = shape[i];
    if (d > bd) continue;
    // tratti con un salto (il percorso esce e rientra nell'area): niente interpolazione attraverso il vuoto
    if (bd - ad > 15000) return null;
    const f = bd > ad ? (d - ad) / (bd - ad) : 0;
    const k = Math.cos((ay * Math.PI) / 180);
    return { lon: ax + (bx - ax) * f, lat: ay + (by - ay) * f, heading: Math.atan2((bx - ax) * k, by - ay) };
  }
  return null;
}

/** Bus FlixBus in viaggio all'istante `nowMs` dentro l'area della mappa. */
export function flixbusPositions(data: FlixbusData, nowMs: number): FlixBusPosition[] {
  const out: FlixBusPosition[] = [];
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
