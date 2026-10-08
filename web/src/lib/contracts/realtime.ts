export type RealtimeCategory = 'vaporetto' | 'ferry' | 'island' | 'bus' | 'tram';

/** Mezzo ACTV con posizione reale dal feed GTFS-Realtime (risposta di /api/realtime/vehicles). */
export interface RealtimeVehicleDto {
  id: string;
  tripId: string | null;
  routeId: string | null;
  label: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  /** epoch seconds della posizione */
  timestamp: number | null;
  network: 'navigazione' | 'automobilistico';
  line: string | null;
  category: RealtimeCategory | null;
}
