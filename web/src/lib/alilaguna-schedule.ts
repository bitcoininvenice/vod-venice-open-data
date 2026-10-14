import { AlilagunaBoat, AlilagunaRoute, AlilagunaStop } from './types';
import alilagunaGtfs from '@/data/alilaguna-gtfs.json';

// ============================================================================
// ALILAGUNA – SIMULAZIONE DA ORARIO UFFICIALE
// Corse, fermate e percorsi dal feed GTFS pubblicato da Alilaguna S.p.A.
// (Transitland f-u20f-alilagunaspa), convertito da pipeline/import_alilaguna_gtfs.py.
// Le posizioni sono interpolate dall'orario: non è un tracciamento GPS delle barche.
// ============================================================================

type GtfsTripStop = [stopIndex: number, arrival: number, departure: number, distanceMeters: number];

interface GtfsTrip {
  id: string;
  route: string;
  service: string;
  headsign: string;
  shape: string;
  stops: GtfsTripStop[];
}

const FEED = alilagunaGtfs as unknown as {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  feedVersion: string;
  validFrom: string;
  validTo: string;
  calendar: Array<Record<string, string>>;
  routes: Array<{ id: string; lineCode: AlilagunaBoat['lineCode']; name: string; color: string; description: string; url: string }>;
  stops: Array<{ id: string; name: string; lat: number; lon: number }>;
  shapes: Record<string, [number, number][]>;
  trips: GtfsTrip[];
};

export const ALILAGUNA_FEED_META = {
  source: FEED.source,
  sourceUrl: FEED.sourceUrl,
  license: FEED.license,
  feedVersion: FEED.feedVersion,
  validFrom: FEED.validFrom,
  validTo: FEED.validTo,
  generatedAt: FEED.generatedAt,
  dailyTrips: FEED.trips.length,
} as const;

const ROUTE_BY_ID = new Map(FEED.routes.map((r) => [r.id, r]));

function distanceMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface PreparedShape {
  coords: [number, number][];
  cumDist: Float64Array;
  totalDist: number;
}

function prepareShape(pts: [number, number][]): PreparedShape {
  const n = pts.length;
  const cumDist = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    cumDist[i] = cumDist[i - 1] + distanceMeters(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  return { coords: pts, cumDist, totalDist: cumDist[n - 1] };
}

const SHAPES = new Map(Object.entries(FEED.shapes).map(([id, pts]) => [id, prepareShape(pts)]));

function calculateBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Posizione e rotta a una certa distanza lungo il percorso. */
function interpolateAtDistance(shape: PreparedShape, targetDist: number): { lon: number; lat: number; heading: number } {
  const { coords, cumDist, totalDist } = shape;
  const n = coords.length;
  if (targetDist <= 0) {
    return { lon: coords[0][0], lat: coords[0][1], heading: calculateBearing(coords[0][0], coords[0][1], coords[1][0], coords[1][1]) };
  }
  if (targetDist >= totalDist) {
    const [p0, p1] = [coords[n - 2], coords[n - 1]];
    return { lon: p1[0], lat: p1[1], heading: calculateBearing(p0[0], p0[1], p1[0], p1[1]) };
  }
  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (cumDist[mid] <= targetDist) low = mid;
    else high = mid;
  }
  const segLen = cumDist[high] - cumDist[low];
  const frac = segLen > 0 ? (targetDist - cumDist[low]) / segLen : 0;
  const [pLow, pHigh] = [coords[low], coords[high]];
  return {
    lon: pLow[0] + frac * (pHigh[0] - pLow[0]),
    lat: pLow[1] + frac * (pHigh[1] - pLow[1]),
    heading: calculateBearing(pLow[0], pLow[1], pHigh[0], pHigh[1]),
  };
}

export function formatTimeSeconds(sec: number): string {
  const normalized = ((Math.floor(sec) % 86400) + 86400) % 86400;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// Fermate e linee per mappa e schede
// ----------------------------------------------------------------------------

const linesByStop = new Map<number, Set<string>>();
for (const trip of FEED.trips) {
  const code = ROUTE_BY_ID.get(trip.route)?.lineCode;
  if (!code) continue;
  for (const [stopIdx] of trip.stops) {
    if (!linesByStop.has(stopIdx)) linesByStop.set(stopIdx, new Set());
    linesByStop.get(stopIdx)!.add(code);
  }
}

export const ALILAGUNA_STOPS: AlilagunaStop[] = FEED.stops.map((s, i) => ({
  id: s.id,
  name: s.name,
  lat: s.lat,
  lon: s.lon,
  lines: [...(linesByStop.get(i) ?? [])],
  isAirportHub: /aeroporto/i.test(s.name),
}));

/** Mediana degli intervalli tra partenze consecutive dal capolinea (minuti). */
function medianHeadwayMinutes(departures: number[]): number {
  const sorted = [...departures].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((d, i) => d - sorted[i]).filter((g) => g > 0).sort((a, b) => a - b);
  return gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)] / 60) : 0;
}

export const ALILAGUNA_ROUTES: AlilagunaRoute[] = FEED.routes.map((r) => {
  const routeTrips = FEED.trips.filter((t) => t.route === r.id);
  // Percorso rappresentativo: la corsa con più fermate (in genere l'intero tragitto)
  const longest = routeTrips.reduce((a, b) => (b.stops.length > a.stops.length ? b : a), routeTrips[0]);
  const stopNames = longest ? longest.stops.map(([i]) => FEED.stops[i].name) : [];
  const fromFirstStop = longest ? routeTrips.filter((t) => t.stops[0][0] === longest.stops[0][0]).map((t) => t.stops[0][2]) : [];
  return {
    id: r.id,
    name: r.name,
    lineCode: r.lineCode,
    color: r.color,
    terminalA: stopNames[0] ?? '',
    terminalB: stopNames[stopNames.length - 1] ?? '',
    description: r.description,
    frequencyMinutes: medianHeadwayMinutes(fromFirstStop),
    stops: stopNames,
    shape: longest ? FEED.shapes[longest.shape] ?? [] : [],
    ...servicePeriod(routeTrips.map((t) => t.service)),
  };
});

/** Periodo di servizio di una linea: dal primo inizio all'ultima fine dei calendari delle sue corse. */
function servicePeriod(serviceIds: string[]): { serviceFrom: string | null; serviceTo: string | null } {
  const cals = FEED.calendar.filter((c) => serviceIds.includes(c.service_id));
  if (cals.length === 0) return { serviceFrom: null, serviceTo: null };
  const iso = (ymd: string) => `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  return {
    serviceFrom: iso(cals.map((c) => c.start_date).sort()[0]),
    serviceTo: iso(cals.map((c) => c.end_date).sort().reverse()[0]),
  };
}

// ----------------------------------------------------------------------------
// Calendario di servizio
// ----------------------------------------------------------------------------

type Weekday = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/** Data di Venezia come YYYYMMDD e giorno della settimana. */
function romeDate(date: Date): { ymd: string; weekday: Weekday } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { ymd: `${get('year')}${get('month')}${get('day')}`, weekday: get('weekday').toLowerCase() as Weekday };
}

function serviceActive(serviceId: string, date: Date): boolean {
  const { ymd, weekday } = romeDate(date);
  const cal = FEED.calendar.find((c) => c.service_id === serviceId);
  return !!cal && cal[weekday] === '1' && ymd >= cal.start_date && ymd <= cal.end_date;
}

/** true se l'orario importato copre la data (il feed ha una validità stagionale). */
export function isAlilagunaTimetableValid(date: Date = new Date()): boolean {
  const { ymd } = romeDate(date);
  return ymd >= FEED.validFrom && ymd <= FEED.validTo;
}

// ----------------------------------------------------------------------------
// Barche in navigazione secondo l'orario
// ----------------------------------------------------------------------------

/**
 * Barche in navigazione all'istante dato (secondi dalla mezzanotte di Venezia), dalle corse GTFS
 * attive nel giorno. Restituisce un elenco vuoto se l'orario importato non copre la data.
 */
export function getScheduledAlilagunaBoats(currentTimeSeconds: number, date: Date = new Date()): AlilagunaBoat[] {
  const t = ((Math.floor(currentTimeSeconds) % 86400) + 86400) % 86400;
  const yesterday = new Date(date.getTime() - 86400000);
  const boats: AlilagunaBoat[] = [];

  for (const trip of FEED.trips) {
    const route = ROUTE_BY_ID.get(trip.route);
    const shape = SHAPES.get(trip.shape);
    if (!route || !shape) continue;
    const first = trip.stops[0];
    const last = trip.stops[trip.stops.length - 1];

    // Orario del giorno, oppure coda dopo mezzanotte di una corsa del giorno precedente (orari GTFS > 24:00)
    let now: number | null = null;
    if (first[2] <= t && t <= last[1] && serviceActive(trip.service, date)) now = t;
    else if (last[1] >= 86400 && t + 86400 <= last[1] && serviceActive(trip.service, yesterday)) now = t + 86400;
    if (now === null) continue;

    let i = 0;
    while (i < trip.stops.length - 2 && trip.stops[i + 1][1] <= now) i++;
    const [, , depA, distA] = trip.stops[i];
    const [nextIdx, arrB, , distB] = trip.stops[i + 1];

    // In sosta alla fermata tra arrivo e partenza, poi interpolazione lineare lungo il percorso
    const legDuration = arrB - depA;
    const frac = now <= depA ? 0 : legDuration > 0 ? Math.min(1, (now - depA) / legDuration) : 0;
    const pos = interpolateAtDistance(shape, distA + frac * (distB - distA));
    const speedKmh = legDuration > 0 && now > depA ? Math.round(((distB - distA) / legDuration) * 3.6 * 10) / 10 : 0;

    boats.push({
      id: `ali_${trip.id}`,
      name: `${route.name} – ${trip.headsign}`,
      lineCode: route.lineCode,
      lineName: route.name,
      color: route.color,
      lat: Math.round(pos.lat * 100000) / 100000,
      lon: Math.round(pos.lon * 100000) / 100000,
      heading: Math.round(pos.heading),
      speedKmh,
      nextStop: FEED.stops[nextIdx].name,
      destination: FEED.stops[last[0]].name,
      scheduledDeparture: formatTimeSeconds(first[2]),
      scheduledArrival: formatTimeSeconds(last[1]),
      tripProgress: Math.round(((now - first[2]) / Math.max(1, last[1] - first[2])) * 100) / 100,
    });
  }

  return boats;
}
