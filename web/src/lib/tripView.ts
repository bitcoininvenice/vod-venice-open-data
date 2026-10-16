/**
 * Corsa di un mezzo ACTV selezionato: la corsa dell'orario (profilo e partenza) e le sue fermate con
 * nome e orario, per evidenziarla sulla mappa e mostrarne il percorso nella scheda.
 */
import { pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid, indexTrips, matchTrip, parseGtfsTime, type TripIndex } from './positionDelay';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import type { DayType, StopItem } from './types';
import { romeDayType, romeLocalToDate } from './time';

export interface SelectedTrip {
  profile: SimProfile;
  /** partenza programmata, secondi dalla mezzanotte del giorno di servizio */
  departure: number;
}

export interface TripStop {
  name: string | null;
  lon: number;
  lat: number;
  /** orario programmato, secondi dalla mezzanotte del giorno di servizio */
  scheduled: number;
}

/** Riferimento alla corsa: diretto per i mezzi da orario, linea e partenza per quelli GPS. */
export interface TripRef {
  line: string;
  /** mezzi simulati dall'orario: indice del profilo e partenza */
  profileIndex?: number;
  departure?: number;
  /** mezzi GPS: partenza "HH:MM:SS" e giorno di servizio "YYYYMMDD" dal feed GTFS-Realtime */
  startTime?: string | null;
  startDate?: string | null;
  day?: DayType;
  /** rete del mezzo GPS: distingue linee omonime (es. bus 15 e vaporetto 15) */
  network?: 'navigazione' | 'automobilistico';
}

const indexCache = new WeakMap<SimModel, TripIndex>();

export function resolveTrip(sim: SimModel | null, ref: TripRef | null | undefined): SelectedTrip | null {
  if (!sim || !ref) return null;
  if (ref.profileIndex !== undefined && ref.departure !== undefined) {
    const profile = sim.profs[ref.profileIndex];
    return profile ? { profile, departure: ref.departure } : null;
  }
  const departure = parseGtfsTime(ref.startTime);
  if (departure === null) return null;
  let index = indexCache.get(sim);
  if (!index) {
    index = indexTrips(sim);
    indexCache.set(sim, index);
  }
  let day = ref.day ?? 'weekday';
  if (ref.startDate && /^\d{8}$/.test(ref.startDate)) {
    const d = ref.startDate;
    day = romeDayType(romeLocalToDate(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)} 12:00:00`));
  }
  return matchTrip(index, ref.line, departure, day, ref.network);
}

const WATER_CATEGORIES = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry']);

/**
 * Tipi di fermata in cui cercare il nome per una categoria di mezzo: pontili per i battelli, fermate del tram,
 * del People Mover o dei bus (terraferma, Lido e Pellestrina), e distanza massima dal punto della corsa.
 * Le fermate bus con più corsie sono unite in un punto medio: per loro la distanza ammessa è più ampia.
 */
export function stopModesFor(category: string): { modes: string[]; maxM: number } {
  if (WATER_CATEGORIES.has(category)) return { modes: ['navigazione', 'ferry'], maxM: 150 };
  if (category === 'tram') return { modes: ['tram'], maxM: 80 };
  if (category === 'peoplemover') return { modes: ['peoplemover'], maxM: 80 };
  return { modes: ['bus'], maxM: 120 };
}

/** Fermata più vicina a un punto fra quelle dei tipi indicati, entro `maxM` metri. */
function nearestStopName(lon: number, lat: number, stops: StopItem[], modes: string[], maxM: number): string | null {
  const k = Math.cos((lat * Math.PI) / 180) * 111320;
  let best: { d: number; name: string } | null = null;
  for (const s of stops) {
    if (!modes.includes(s.mode)) continue;
    const d = Math.hypot((s.lon - lon) * k, (s.lat - lat) * 110540);
    if (d <= maxM && (!best || d < best.d)) best = { d, name: s.name };
  }
  return best?.name ?? null;
}

/**
 * Fermate della corsa in ordine, con orario programmato e nome della fermata più vicina dello stesso tipo di mezzo.
 * `stops`: fermate in cui cercare (di norma quelle della mappa più, per i bus, l'elenco completo delle fermate bus).
 */
export function tripStops(trip: SelectedTrip, stops: StopItem[] = ACTV_STOPS_REFERENCE): TripStop[] {
  const { profile: p, departure } = trip;
  const { modes, maxM } = stopModesFor(p.route.c);
  const pt: [number, number] = [0, 0];
  const out: TripStop[] = [];
  for (let k = 0; k < p.Dd.length; k++) {
    pointAt(p.sh, p.Dd[k], pt);
    const [lon, lat] = fromGrid(pt[0], pt[1]);
    const name = nearestStopName(lon, lat, stops, modes, maxM);
    const prev = out[out.length - 1];
    if (prev && prev.name !== null && prev.name === name) continue; // pontili consecutivi della stessa fermata
    out.push({ name, lon, lat, scheduled: departure + p.T[k] });
  }
  return out;
}

/** "HH:MM" da secondi dalla mezzanotte (anche oltre le 24 per le corse dopo mezzanotte). */
export function clock(seconds: number): string {
  const s = ((Math.round(seconds) % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
}
