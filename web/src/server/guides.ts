import 'server-only';
/**
 * Dati delle pagine guida, calcolati lato server con gli stessi strumenti della mappa: planner (orario ACTV e
 * Alilaguna, rete pedonale OpenStreetMap), elenco delle fermate GTFS e marea del Centro Maree.
 */
import stopsData from '@/data/actv-stops.json';
import gtfsIndex from '@/data/actv-gtfs-index.json';
import { lineColor } from '@/lib/actvLines';
import { planTripService } from '@/server/planning/services';
import { GET as tideGET } from '@/app/api/tide/route';
import type { TideResponse } from '@/lib/contracts/tide';
import { romeDayType } from '@/lib/time';
import { originsFor, type GuidePlace } from '@/lib/guides/places';

interface StopRow { id: string; name: string; mode: string; lines: string[] }
const STOPS = (stopsData as { stops: StopRow[] }).stops;
const ROUTES = (gtfsIndex as { routes: Record<string, { n: string; long: string; color: string | null }> }).routes;

export interface LineInfo {
  line: string;
  /** Capolinea come scritti nel GTFS ACTV */
  terminals: string | null;
  color: string | null;
}

/** Ordine naturale delle linee: 1, 2, 2/, 3, 4.1 … 10, 11 … N, NLN */
function compareLines(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isNaN(na) !== Number.isNaN(nb)) return Number.isNaN(na) ? 1 : -1;
  if (!Number.isNaN(na) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

/** Capolinea della linea urbana di navigazione (route_id «<linea>_UN») */
function terminalsOf(line: string): string | null {
  return ROUTES[`${line}_UN`]?.long.replace(/\s*"[A-Z]"/g, '') ?? null;
}

/** Linee che il GTFS fa fermare alle fermate indicate, con capolinea e colore ufficiale */
export function linesAtStops(stopIds: string[]): { stops: { name: string; mode: string }[]; lines: LineInfo[] } {
  const rows = STOPS.filter((s) => stopIds.includes(s.id));
  const water = rows.filter((s) => s.mode === 'navigazione' || s.mode === 'ferry');
  const set = new Set(water.flatMap((s) => s.lines));
  const lines = [...set].sort(compareLines).map((line) => ({ line, terminals: terminalsOf(line), color: lineColor(line, 'vaporetto') }));
  // People Mover: una sola linea, segnalata a parte
  if (rows.some((s) => s.mode === 'peoplemover')) lines.push({ line: 'People Mover', terminals: 'Tronchetto – Marittima – Piazzale Roma', color: null });
  return { stops: rows.map((s) => ({ name: s.name, mode: s.mode })), lines };
}

/** Tutte le linee urbane di navigazione presenti nel GTFS ACTV */
export function waterLines(): LineInfo[] {
  return Object.entries(ROUTES)
    .filter(([id]) => id.endsWith('_UN'))
    .map(([, r]) => r.n)
    .filter((n, i, all) => all.indexOf(n) === i)
    .sort(compareLines)
    .map((line) => ({ line, terminals: terminalsOf(line), color: lineColor(line, 'vaporetto') }));
}

export const GUIDE_TIME = '10:00';

/** Prossimo giorno feriale (lunedì-venerdì) dopo oggi, ora di Venezia: YYYY-MM-DD */
export function nextWeekday(now: Date = new Date()): string {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86400_000);
    if (romeDayType(d) === 'weekday') {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    }
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now);
}

export interface GuideItinerary {
  minutes: number;
  /** Linee nell'ordine del viaggio; vuoto: tutto a piedi */
  lines: string[];
  walkMeters: number;
  depart: string;
  arrive: string;
  estimatedEur: number | null;
  /** Alternativa per l'aeroporto (Alilaguna, bus ACTV, ATVO…) */
  option: string | null;
}

export interface GuideRoute {
  origin: GuidePlace;
  found: boolean;
  itineraries: GuideItinerary[];
  /** Percorso tutto a piedi, quando il planner lo calcola */
  walkOnly: { minutes: number; meters: number } | null;
  vodUrl: string | null;
}

interface PlanBody {
  found?: boolean;
  vodUrl?: string;
  walkOnly?: { minutes: number; meters: number };
  itineraries?: { minutes: number; lines: string[]; walkMeters: number; depart: string; arrive: string; option?: string; cost?: { estimatedEur?: number | null } }[];
}

const memo = new Map<string, Promise<GuideRoute[]>>();

/**
 * Come arrivare al luogo dalle partenze tipiche (stazione, Piazzale Roma, aeroporto, San Marco), alle 10 del
 * prossimo giorno feriale. Al più tre soluzioni per partenza, nell'ordine del planner (prima la più veloce).
 */
export function guideRoutes(place: GuidePlace, date: string = nextWeekday()): Promise<GuideRoute[]> {
  const key = `${place.id}|${date}`;
  let p = memo.get(key);
  if (!p) {
    p = Promise.all(
      originsFor(place).map(async (origin): Promise<GuideRoute> => {
        const r = await planTripService({ from: origin.target, to: place.target, date, time: GUIDE_TIME, mode: 'fastest', fare: 'ordinary' });
        if (!r.ok) return { origin, found: false, itineraries: [], walkOnly: null, vodUrl: null };
        const body = r.body as PlanBody;
        return {
          origin,
          found: !!body.found,
          itineraries: (body.itineraries ?? []).slice(0, 3).map((it) => ({
            minutes: it.minutes,
            lines: it.lines,
            walkMeters: it.walkMeters,
            depart: it.depart,
            arrive: it.arrive,
            estimatedEur: it.cost?.estimatedEur ?? null,
            option: it.option ?? null,
          })),
          walkOnly: body.walkOnly ? { minutes: body.walkOnly.minutes, meters: body.walkOnly.meters } : null,
          vodUrl: body.vodUrl ?? null,
        };
      }),
    ).catch((e) => {
      memo.delete(key);
      throw e;
    });
    memo.set(key, p);
  }
  return p;
}

/** Marea attuale e previsione (stessa risposta di /api/tide); null se la fonte non risponde */
export async function tideSnapshot(): Promise<TideResponse | null> {
  try {
    return (await (await tideGET()).json()) as TideResponse;
  } catch {
    return null;
  }
}
