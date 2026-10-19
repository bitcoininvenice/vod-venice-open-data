import { fetchUpstream } from '@/server/upstream';
import { GRID } from '@/lib/simulation-data';
import type { TrainLiveItem } from '@/lib/types';
import { SOURCE_CODE_URL } from '@/lib/site';
import { snapTrainToRailway } from '@/lib/railwayTracks';
import { romeMidnightOf } from '@/lib/coachSchedule';
import { romeYmd, trainsOnDate, setTrainSchedule, trainSchedule, type ScheduledTrainTrip, type TrainScheduleData } from '@/lib/trainSimulation';
import trainsJson from '@/data/trains-venezia.json';

if (!trainSchedule()) setTrainSchedule(trainsJson as unknown as TrainScheduleData);

export const BUSONE_HEADERS = {
  'X-BusOne-Client': `VeniceOpenData (${SOURCE_CODE_URL})`,
  'X-BusOne-Use': 'nonprofit',
};

export const BUSONE_TRAIN_FEEDS = {
  trenitaliaVehicles: 'https://proxy.busone.app/trenitalia/gtfs-rt/vehicle-positions.json',
  trenitaliaTrips: 'https://proxy.busone.app/trenitalia/gtfs-rt/trip-updates.json',
  italoVehicles: 'https://proxy.busone.app/italo/gtfs-rt/vehicle-positions.json',
  italoTrips: 'https://proxy.busone.app/italo/gtfs-rt/trip-updates.json',
} as const;

const [LON0, LON1, LAT0, LAT1] = GRID.frame;

export function isInVeniceFrame(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat) && lon >= LON0 && lon <= LON1 && lat >= LAT0 && lat <= LAT1;
}

export function detectTrainType(labelOrNumber: string, operator: 'Trenitalia' | 'Italo'): TrainLiveItem['trainType'] {
  if (operator === 'Italo') return 'ITALO';
  const s = labelOrNumber.toUpperCase();
  if (s.includes('FR') || s.includes('FRECCIA') || s.includes('97') || s.includes('95')) return 'FRECCIAROSSA';
  if (s.includes('EC') || s.includes('EUROCITY')) return 'EUROCITY';
  if (s.includes('RJ') || s.includes('RAILJET')) return 'RAILJET';
  if (s.includes('IC') || s.includes('INTERCITY')) return 'INTERCITY';
  if (s.includes('CARGO') || s.includes('MIR')) return 'MERCITALIA_CARGO';
  return 'REGIONALE_VELOCE';
}

export interface TrainBoardRow {
  trainNumber: string;
  operator: 'Trenitalia' | 'Italo';
  trainType: TrainLiveItem['trainType'];
  color: string;
  /** destinazione (partenze) o provenienza (arrivi) dall'orario ufficiale */
  place: string;
  scheduledAt: number;
  estimatedAt: number;
  /** ritardo dal feed in tempo reale; null se il treno non è (ancora) nel feed */
  delayMinutes: number | null;
  /** binario dall'orario, se indicato */
  platform: string | null;
}

export interface TrainStationBoard {
  stationId: 'santa_lucia' | 'mestre';
  stationName: string;
  departures: TrainBoardRow[];
  arrivals: TrainBoardRow[];
  updatedAt: string;
}

interface RawVehicleEntity {
  id: string;
  vehicle?: {
    trip?: { tripId?: string; routeId?: string; startTime?: string; startDate?: string };
    position?: { latitude: number; longitude: number; bearing?: number; speed?: number };
    timestamp?: number;
    vehicle?: { id?: string; label?: string };
    currentStatus?: string;
  };
}

interface RawTripUpdateEntity {
  id: string;
  tripUpdate?: {
    trip?: { tripId?: string; routeId?: string; startTime?: string; startDate?: string };
    stopTimeUpdate?: Array<{
      stopSequence?: number;
      stopId?: string;
      arrival?: { delay?: number; time?: number };
      departure?: { delay?: number; time?: number };
    }>;
    delay?: number;
    timestamp?: number;
  };
}

function parseFeedEntities<T>(raw: unknown): T[] {
  if (!raw || typeof raw !== 'object') return [];
  const rec = raw as { entity?: T[] };
  return Array.isArray(rec.entity) ? rec.entity : [];
}

/** Codici RFI delle stazioni nei feed Trenitalia (statico e tempo reale) e sigle Italo */
const STATION_CODES = { santa_lucia: ['02593', 'VSL'], mestre: ['02589', 'VEM'] } as const;
const stationOf = (stopId: string | undefined): keyof typeof STATION_CODES | null => {
  const root = (stopId ?? '').split(':')[0];
  if ((STATION_CODES.santa_lucia as readonly string[]).includes(root)) return 'santa_lucia';
  if ((STATION_CODES.mestre as readonly string[]).includes(root)) return 'mestre';
  return null;
};

/** Numero del treno dall'id della corsa (Trenitalia: «…_v_1-16306-31CE-…»; Italo: «NTV-1021-8907») */
export function trainNumbersOf(tripId: string | undefined): string[] {
  return [...(tripId ?? '').matchAll(/(?:^|[-_])(\d{3,5})(?=[-_]|$)/g)].map((m) => m[1]);
}

/** Treni dell'orario di oggi per numero (ogni numero del treno: Italo ne ha due, es. 1021/8907) */
function scheduleByNumber(ymd: string): Map<string, ScheduledTrainTrip> {
  const map = new Map<string, ScheduledTrainTrip>();
  for (const t of trainsOnDate(ymd)) for (const n of t.trainNumber.match(/\d{3,5}/g) ?? []) map.set(n, t);
  return map;
}

const colorOf = (t: Pick<ScheduledTrainTrip, 'operator' | 'trainType'>) =>
  t.operator === 'Italo' ? '#991b1b' : t.trainType === 'FRECCIAROSSA' ? '#dc2626' : '#2563eb';

export async function fetchLiveTrainsInVenice(nowMs = Date.now()): Promise<{
  trains: TrainLiveItem[];
  ok: boolean;
  source: string;
}> {
  const [trenitaliaRes, italoRes] = await Promise.all([
    fetchUpstream(BUSONE_TRAIN_FEEDS.trenitaliaVehicles, parseFeedEntities<RawVehicleEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
    fetchUpstream(BUSONE_TRAIN_FEEDS.italoVehicles, parseFeedEntities<RawVehicleEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
  ]);
  const byNumber = scheduleByNumber(romeYmd(new Date(nowMs)));
  const trains: TrainLiveItem[] = [];

  const addEntity = (entity: RawVehicleEntity, operator: 'Trenitalia' | 'Italo') => {
    const v = entity.vehicle;
    const pos = v?.position;
    if (!v || !pos || !isInVeniceFrame(pos.longitude, pos.latitude)) return;
    // origine e destinazione dall'orario ufficiale; se il treno non è fra quelli Santa Lucia - Mestre restano vuote
    const scheduled = trainNumbersOf(v.trip?.tripId).map((n) => byNumber.get(n)).find(Boolean);
    const label = scheduled?.trainNumber ?? v.vehicle?.label ?? trainNumbersOf(v.trip?.tripId)[0] ?? entity.id;
    const snapped = snapTrainToRailway(pos.longitude, pos.latitude, {
      destination: scheduled?.destination ?? '',
      rawBearing: pos.bearing,
    });
    trains.push({
      id: `${operator.toLowerCase()}_${entity.id}`,
      trainNumber: label,
      trainType: scheduled?.trainType ?? detectTrainType(label, operator),
      origin: scheduled?.origin ?? '',
      destination: scheduled?.destination ?? '',
      currentLocation: `${snapped.lat.toFixed(4)}, ${snapped.lon.toFixed(4)}`,
      lat: snapped.lat,
      lon: snapped.lon,
      bearing: snapped.bearing,
      snappedToTrack: snapped.snapped,
      platform: scheduled?.platform ?? '',
      operator,
      speedKmh: pos.speed ? Math.round(pos.speed * 3.6) : null,
      status: v.currentStatus || 'IN_TRANSITO',
    });
  };

  if (trenitaliaRes.ok) for (const entity of trenitaliaRes.data) addEntity(entity, 'Trenitalia');
  if (italoRes.ok) for (const entity of italoRes.data) addEntity(entity, 'Italo');

  return {
    trains,
    ok: trenitaliaRes.ok || italoRes.ok,
    source: 'BusOne (https://busone.app) – GTFS-RT Trenitalia & Italo',
  };
}

/** Ritardi dal feed in tempo reale alla stazione, per numero di treno (secondi) */
function delaysAt(entities: RawTripUpdateEntity[], station: keyof typeof STATION_CODES): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of entities) {
    const u = e.tripUpdate;
    const stu = u?.stopTimeUpdate?.find((x) => stationOf(x.stopId) === station);
    const delay = stu?.departure?.delay ?? stu?.arrival?.delay ?? (stu ? u?.delay : undefined);
    if (delay === undefined || delay === null) continue;
    for (const n of trainNumbersOf(u?.trip?.tripId)) out.set(n, delay);
  }
  return out;
}

/**
 * Partenze e arrivi dei prossimi 90 minuti a Santa Lucia o Mestre dall'orario ufficiale (treni fra le due
 * stazioni), con il ritardo del feed in tempo reale quando il treno c'è. Nessun treno inventato: senza orario
 * per la data il tabellone è vuoto.
 */
export async function fetchStationBoard(station: 'santa_lucia' | 'mestre', nowMs = Date.now()): Promise<TrainStationBoard> {
  const [trenitaliaTrips, italoTrips] = await Promise.all([
    fetchUpstream(BUSONE_TRAIN_FEEDS.trenitaliaTrips, parseFeedEntities<RawTripUpdateEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
    fetchUpstream(BUSONE_TRAIN_FEEDS.italoTrips, parseFeedEntities<RawTripUpdateEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
  ]);
  const delays = new Map([
    ...(trenitaliaTrips.ok ? delaysAt(trenitaliaTrips.data, station) : []),
    ...(italoTrips.ok ? delaysAt(italoTrips.data, station) : []),
  ]);
  const now = new Date(nowMs);
  const from = nowMs - 5 * 60_000;
  const to = nowMs + 90 * 60_000;
  const departures: TrainBoardRow[] = [];
  const arrivals: TrainBoardRow[] = [];
  // oggi e i treni di ieri dopo mezzanotte
  for (const dayOffset of [0, -1]) {
    const day = new Date(nowMs + dayOffset * 86_400_000);
    const midnight = romeMidnightOf(day);
    for (const t of trainsOnDate(romeYmd(day))) {
      const leavesHere = (t.direction === 'OUTBOUND') === (station === 'santa_lucia');
      const atMs = midnight + (leavesHere ? t.departureSeconds : t.arrivalSeconds) * 1000;
      const delaySec = (t.trainNumber.match(/\d{3,5}/g) ?? []).map((n) => delays.get(n)).find((d) => d !== undefined);
      const estimated = atMs + (delaySec ?? 0) * 1000;
      if (estimated < from || estimated > to) continue;
      const row: TrainBoardRow = {
        trainNumber: t.trainNumber,
        operator: t.operator,
        trainType: t.trainType,
        color: colorOf(t),
        place: leavesHere ? t.destination : t.origin,
        scheduledAt: atMs,
        estimatedAt: estimated,
        delayMinutes: delaySec === undefined ? null : Math.round(delaySec / 60),
        platform: station === 'santa_lucia' ? t.platform : null,
      };
      (leavesHere ? departures : arrivals).push(row);
    }
  }
  departures.sort((a, b) => a.estimatedAt - b.estimatedAt);
  arrivals.sort((a, b) => a.estimatedAt - b.estimatedAt);
  return {
    stationId: station,
    stationName: station === 'santa_lucia' ? 'Venezia Santa Lucia' : 'Venezia Mestre',
    departures: departures.slice(0, 20),
    arrivals: arrivals.slice(0, 20),
    updatedAt: now.toISOString(),
  };
}
