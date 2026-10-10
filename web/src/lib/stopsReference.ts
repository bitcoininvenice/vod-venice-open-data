// Modulo leggero: la home lo importa senza trascinare nel browser gli altri dataset di db.ts.
import type { StopItem } from './types';
import actvStops from '@/data/actv-stops.json';

/**
 * Fermate ACTV della mappa dal GTFS ufficiale (pipeline/export_simulation_data.py): tutti i pontili della
 * navigazione e le fermate del tram, più i nodi bus principali. Pontili e corsie con lo stesso nome sono
 * una sola fermata, con i codici GTFS (gtfsIds) usati per i dati in tempo reale.
 */
export const ACTV_STOPS_REFERENCE: StopItem[] = actvStops.stops as StopItem[];

