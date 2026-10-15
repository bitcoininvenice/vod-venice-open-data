import { useEffect, useSyncExternalStore } from 'react';
import { SIM_URL } from '@/lib/simulation-data';
import { buildSimulation, type RawSimulation, type SimModel } from './simulationCore';

export * from './simulationCore';

/**
 * Modello della simulazione da orario dei mezzi ACTV, costruito una sola volta dal dataset
 * GTFS pre-elaborato (public/data/sim-<hash>.json, generato da pipeline/export_simulation_data.py).
 * Il file (circa 1,2 MB, 220 KB compressi) non è nel bundle: si scarica solo quando servono i mezzi
 * o le rotte, e il browser lo tiene in cache finché i dati non cambiano (il nome contiene l'hash).
 * Coordinate in unità della griglia virtuale della mappa (circa 1 m).
 */

let model: SimModel | null = null;
let pending: Promise<SimModel> | null = null;
const listeners = new Set<() => void>();

/** Modello già caricato, oppure null (il disegno e i conteggi aspettano il caricamento). */
export function getSimulation(): SimModel | null {
  return model;
}

/** Costruisce il modello da dati già letti (test, o caricamento esterno). */
export function initSimulation(raw: RawSimulation): SimModel {
  model = buildSimulation(raw);
  listeners.forEach((l) => l());
  return model;
}

/** Scarica la simulazione una sola volta; le chiamate successive riusano la stessa promessa. */
function loadSimulation(): Promise<SimModel> {
  if (model) return Promise.resolve(model);
  if (!pending) {
    pending = fetch(SIM_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`simulazione non disponibile (${r.status})`);
        return r.json() as Promise<RawSimulation>;
      })
      .then(initSimulation)
      .catch((e) => {
        pending = null;
        throw e;
      });
  }
  return pending;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Modello per i componenti React: avvia il caricamento quando `needed` diventa vero. */
export function useSimulation(needed: boolean): SimModel | null {
  const current = useSyncExternalStore(subscribe, getSimulation, () => null);
  useEffect(() => {
    if (needed && !model) loadSimulation().catch((e) => console.warn('Simulazione ACTV non disponibile:', e));
  }, [needed]);
  return current;
}
