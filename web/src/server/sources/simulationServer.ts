import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SIM_URL } from '@/lib/simulation-data';
import { buildSimulation, type RawSimulation, type SimModel } from '@/lib/simulationCore';
import { indexTrips, type TripIndex } from '@/lib/positionDelay';

let loading: Promise<{ model: SimModel; index: TripIndex } | null> | null = null;

/**
 * Orario ufficiale ACTV (stesso file della simulazione in public/data) letto dal disco una volta per
 * istanza del server. null se il file manca: il ritardo resta quello dichiarato da ACTV.
 */
export function serverSimulation(): Promise<{ model: SimModel; index: TripIndex } | null> {
  loading ??= readFile(path.join(process.cwd(), 'public', SIM_URL), 'utf8')
    .then((text) => {
      const model = buildSimulation(JSON.parse(text) as RawSimulation);
      return { model, index: indexTrips(model) };
    })
    .catch((e) => {
      console.warn('Orario per il ritardo dalla posizione non disponibile:', e);
      loading = null;
      return null;
    });
  return loading;
}
