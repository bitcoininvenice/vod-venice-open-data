/**
 * Treni fra Venezia Santa Lucia e Venezia Mestre sul Ponte della Libertà, dall'orario ufficiale.
 *
 * L'orario viene da pipeline/import_busone_trains.py: GTFS Trenitalia (NeTEx del Punto di Accesso Nazionale) e
 * Italo pubblicati da BusOne, solo i treni che fermano in entrambe le stazioni, con le date di servizio dei
 * prossimi giorni. La posizione sul ponte è quella prevista dall'orario (partenza e arrivo), non un GPS: per i
 * treni in tempo reale c'è /api/trains.
 * - Movimento agganciato all'orologio della timeline.
 * - Corsie separate per direzione e per alta velocità, solo per leggibilità sulla mappa.
 */

import type { DayType, TrainLiveItem } from '@/lib/types';
import { VENICE_RAILWAY_MAINLINE } from '@/lib/railwayTracks';
import { romeDayType, romeToday } from '@/lib/time';

export interface ScheduledTrainTrip {
  id: string;
  trainNumber: string;
  operator: 'Trenitalia' | 'Italo';
  trainType: TrainLiveItem['trainType'];
  /** categoria commerciale del feed (REG, RV, FR, IC…) */
  category: string | null;
  /** OUTBOUND: da Santa Lucia verso Mestre */
  direction: 'INBOUND' | 'OUTBOUND';
  origin: string;
  destination: string;
  /** secondi dalla mezzanotte locale della data di servizio (oltre 86400 dopo mezzanotte) */
  departureSeconds: number;
  arrivalSeconds: number;
  /** binario a Santa Lucia, se il feed lo indica */
  platform: string | null;
  /** un carattere per giorno da startDate: «1» = in servizio */
  days: string;
}

export interface TrainScheduleData {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  /** primo giorno della maschera days, YYYYMMDD */
  startDate: string;
  trains: ScheduledTrainTrip[];
}

let schedule: TrainScheduleData | null = null;
let pending: Promise<TrainScheduleData> | null = null;

/** Orario già caricato (null finché il file non è stato letto) */
export function trainSchedule(): TrainScheduleData | null {
  return schedule;
}

/** Imposta l'orario (lato server e nei test) */
export function setTrainSchedule(data: TrainScheduleData): void {
  schedule = data;
}

/** Carica l'orario a richiesta (circa 230 KB): solo quando servono il layer dei treni o il planner per Mestre */
export function loadTrainSchedule(): Promise<TrainScheduleData> {
  if (schedule) return Promise.resolve(schedule);
  pending ??= import('@/data/trains-venezia.json').then((m) => {
    schedule = m.default as unknown as TrainScheduleData;
    return schedule;
  });
  return pending;
}

const ymdToUtc = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
const utcToYmd = (ms: number) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');

/** Data di oggi a Venezia, YYYYMMDD */
export function romeYmd(now: Date = new Date()): string {
  return romeToday(now).replace(/-/g, '');
}

/** Giorno da mostrare per un tipo di giorno della timeline: oggi se coincide, altrimenti il prossimo di quel tipo */
export function dateForDayType(day: DayType, now: Date = new Date()): string {
  const today = romeYmd(now);
  for (let i = 0; i < 7; i++) {
    const ymd = utcToYmd(ymdToUtc(today) + i * 86_400_000);
    if (romeDayType(new Date(ymdToUtc(ymd) + 12 * 3600_000)) === day) return ymd;
  }
  return today;
}

/** Treni in servizio nella data YYYYMMDD (vuoto se fuori dal periodo coperto dal file) */
export function trainsOnDate(ymd: string, data: TrainScheduleData | null = schedule): ScheduledTrainTrip[] {
  if (!data) return [];
  const i = Math.round((ymdToUtc(ymd) - ymdToUtc(data.startDate)) / 86_400_000);
  if (i < 0) return [];
  return data.trains.filter((t) => t.days[i] === '1');
}

// Calcolo distanze cumulative lungo l'asse ferroviario principale Santa Lucia -> Mestre (metri)
const COS_LAT = Math.cos((45.45 * Math.PI) / 180);
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = M_PER_DEG_LAT * COS_LAT;

interface PreparedSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cumStart: number;
  cumEnd: number;
  lenMeters: number;
  bearingOutbound: number;
}

const PREPARED_SEGMENTS: PreparedSegment[] = [];
let TOTAL_TRACK_METERS = 0;

for (let i = 0; i < VENICE_RAILWAY_MAINLINE.length - 1; i++) {
  const pA = VENICE_RAILWAY_MAINLINE[i];
  const pB = VENICE_RAILWAY_MAINLINE[i + 1];
  const dxM = (pB.lon - pA.lon) * M_PER_DEG_LON;
  const dyM = (pB.lat - pA.lat) * M_PER_DEG_LAT;
  const len = Math.hypot(dxM, dyM);
  const rad = Math.atan2(dxM, dyM);
  const bearingOutbound = ((rad * 180) / Math.PI + 360) % 360;

  PREPARED_SEGMENTS.push({
    ax: pA.lon,
    ay: pA.lat,
    bx: pB.lon,
    by: pB.lat,
    cumStart: TOTAL_TRACK_METERS,
    cumEnd: TOTAL_TRACK_METERS + len,
    lenMeters: len,
    bearingOutbound,
  });
  TOTAL_TRACK_METERS += len;
}

/** Distanza da Santa Lucia ai binari viaggiatori di Mestre: la linea prosegue oltre verso Padova */
const MESTRE_INDEX = VENICE_RAILWAY_MAINLINE.findIndex((p) => /Venezia Mestre/.test(p.label ?? ''));
const MESTRE_TRACK_METERS = MESTRE_INDEX > 0 ? PREPARED_SEGMENTS[MESTRE_INDEX - 1].cumEnd : TOTAL_TRACK_METERS;

/**
 * Trova il punto e l'orientamento a una data distanza progressiva (metri da Santa Lucia).
 * Offset laterale in metri perpendicolare alla rotta (positivo a destra, negativo a sinistra).
 */
export function interpolateTrackPosition(
  distMeters: number,
  lateralOffsetMeters = 0
): { lon: number; lat: number; bearingOutbound: number } {
  const d = Math.max(0, Math.min(TOTAL_TRACK_METERS, distMeters));

  let seg = PREPARED_SEGMENTS[0];
  for (const s of PREPARED_SEGMENTS) {
    if (d <= s.cumEnd || s === PREPARED_SEGMENTS[PREPARED_SEGMENTS.length - 1]) {
      seg = s;
      break;
    }
  }

  const f = seg.lenMeters > 0 ? (d - seg.cumStart) / seg.lenMeters : 0;
  const baseLon = seg.ax + f * (seg.bx - seg.ax);
  const baseLat = seg.ay + f * (seg.by - seg.ay);

  if (lateralOffsetMeters === 0) {
    return { lon: baseLon, lat: baseLat, bearingOutbound: seg.bearingOutbound };
  }

  // Vettore perpendicolare destro rispetto alla direzione outbound (bearing)
  const radBearing = (seg.bearingOutbound * Math.PI) / 180;
  const normalLon = Math.cos(radBearing);
  const normalLat = -Math.sin(radBearing);

  const offLon = (lateralOffsetMeters * normalLon) / M_PER_DEG_LON;
  const offLat = (lateralOffsetMeters * normalLat) / M_PER_DEG_LAT;

  return {
    lon: baseLon + offLon,
    lat: baseLat + offLat,
    bearingOutbound: seg.bearingOutbound,
  };
}

/**
 * Curva di accelerazione/decelerazione S-curve (smoothstep).
 * Fornisce un movimento fluido: transizione progressiva alle fermate
 * e velocita di crociera massima sul viadotto lagunare.
 */
function smoothMotionProfile(t: number): { progress: number } {
  const clamped = Math.max(0, Math.min(1, t));
  // S-curve cubica: 3*t^2 - 2*t^3
  return { progress: clamped * clamped * (3 - 2 * clamped) };
}

/** Scostamento laterale (m) delle corsie disegnate sul ponte: solo per non sovrapporre i treni sulla mappa */
const TRACK_LATERAL_OFFSET_METERS: Record<1 | 2 | 3 | 4, number> = {
  1: -2.2, // verso Venezia
  2: 2.2, // verso la terraferma
  3: -5.6, // alta velocità verso Venezia
  4: 5.6, // alta velocità verso la terraferma
};

const DWELL_SECONDS = 75; // Sosta a banchina prima della partenza e dopo l'arrivo

/**
 * Calcola i treni in circolazione, in sosta o in manovra per l'istante temporale selezionato.
 * Reagisce istantaneamente allo scorrimento della timeline e alla velocita di riproduzione.
 */
export function getSimulatedTrainsAtTime(
  currentTimeSeconds: number,
  liveTrainsOverride?: TrainLiveItem[],
  ymd: string = romeYmd(),
): TrainLiveItem[] {
  const normTime = ((currentTimeSeconds % 86400) + 86400) % 86400;
  const out: TrainLiveItem[] = [];
  // treni del giorno e quelli del giorno prima che passano dopo mezzanotte (orari oltre le 24)
  const yesterday = utcToYmd(ymdToUtc(ymd) - 86_400_000);
  const running = [
    ...trainsOnDate(ymd).map((trip) => ({ trip, shift: 0 })),
    ...trainsOnDate(yesterday).filter((t) => t.arrivalSeconds >= 86400).map((trip) => ({ trip, shift: 86400 })),
  ];

  for (const { trip, shift } of running) {
    const t0 = trip.departureSeconds - shift;
    const t1 = trip.arrivalSeconds - shift;
    const duration = Math.max(60, t1 - t0);

    // Considera il treno visibile da DWELL_SECONDS prima di t0 fino a DWELL_SECONDS dopo t1
    if (normTime < t0 - DWELL_SECONDS || normTime > t1 + DWELL_SECONDS) {
      continue;
    }

    // corsie disegnate: dispari verso Venezia, pari verso la terraferma; esterne per l'alta velocità
    const fast = trip.trainType === 'FRECCIAROSSA' || trip.trainType === 'ITALO';
    const track: 1 | 2 | 3 | 4 = trip.direction === 'INBOUND' ? (fast ? 3 : 1) : fast ? 4 : 2;
    const latOffset = TRACK_LATERAL_OFFSET_METERS[track];

    let distMeters: number;
    let bearing: number;
    let speedKmh = 0;
    let status = 'IN_TRANSITO';

    if (normTime < t0) {
      // In sosta a banchina in attesa di partenza
      status = 'IN_PARTENZA';
      speedKmh = 0;
      if (trip.direction === 'OUTBOUND') {
        distMeters = 0; // Venezia Santa Lucia
        bearing = 120;  // Rivolto verso i respingenti o uscita
      } else {
        distMeters = MESTRE_TRACK_METERS; // Mestre
        bearing = 300;
      }
    } else if (normTime > t1) {
      // Appena arrivato a destinazione
      status = 'ARRIVATO';
      speedKmh = 0;
      if (trip.direction === 'OUTBOUND') {
        distMeters = MESTRE_TRACK_METERS; // Mestre
        bearing = 300;
      } else {
        distMeters = 0; // Santa Lucia
        bearing = 120;
      }
    } else {
      // In corsa lungo il Ponte della Liberta
      status = 'IN_TRANSITO';
      const normElapsed = (normTime - t0) / duration;
      const { progress } = smoothMotionProfile(normElapsed);

      if (trip.direction === 'OUTBOUND') {
        distMeters = progress * MESTRE_TRACK_METERS;
      } else {
        distMeters = (1 - progress) * MESTRE_TRACK_METERS;
      }

      // velocità media da orario fra le due stazioni (non misurata)
      speedKmh = Math.round((MESTRE_TRACK_METERS / duration) * 3.6);
    }

    const pt = interpolateTrackPosition(distMeters, latOffset);

    // Se il treno e inbound, la rotta punta verso Santa Lucia (opposta a bearingOutbound)
    bearing = trip.direction === 'INBOUND' ? (pt.bearingOutbound + 180) % 360 : pt.bearingOutbound;

    out.push({
      id: trip.id,
      trainNumber: trip.trainNumber,
      trainType: trip.trainType,
      origin: trip.origin,
      destination: trip.destination,
      currentLocation: `${pt.lat.toFixed(4)}, ${pt.lon.toFixed(4)}`,
      lat: pt.lat,
      lon: pt.lon,
      bearing: Math.round(bearing),
      snappedToTrack: true,
      platform: trip.platform ?? '',
      operator: trip.operator,
      speedKmh,
      status,
    });
  }

  // Se ci sono nodi fissi o override live specifici, possiamo integrarli preservando l'unicita
  if (liveTrainsOverride && liveTrainsOverride.length > 0) {
    // Aggiungi i nodi fissi di scalo/stazione se non gia presenti
    for (const ov of liveTrainsOverride) {
      if (ov.id.startsWith('RFI_') && !out.some((t) => t.id === ov.id)) {
        out.push(ov);
      }
    }
  }

  return out;
}
