import type { VehicleDelay } from '@/lib/realtimeDelay';

export type RealtimeCategory = 'vaporetto' | 'ferry' | 'island' | 'bus' | 'tram' | 'peoplemover';

/** Mezzo ACTV con posizione reale dal feed GTFS-Realtime (risposta di /api/realtime/vehicles). */
export interface RealtimeVehicleDto {
  id: string;
  tripId: string | null;
  routeId: string | null;
  /** partenza programmata "HH:MM:SS" e giorno di servizio "YYYYMMDD" della corsa, se indicati */
  startTime?: string | null;
  startDate?: string | null;
  label: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  /** epoch seconds della posizione */
  timestamp: number | null;
  network: 'navigazione' | 'automobilistico';
  line: string | null;
  category: RealtimeCategory | null;
  /** ritardo rispetto all'orario (dalla posizione GPS verificata con ACTV, oppure di ACTV), solo se recente */
  delay?: VehicleDelay | null;
  /** posizione e dato ACTV non coerenti: il ritardo non viene mostrato */
  delayConflict?: boolean;
}
