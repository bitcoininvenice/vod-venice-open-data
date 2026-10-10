'use client';

import { useEffect, useReducer, useRef } from 'react';
import { DATA_RESOURCES, INITIAL_CITY_DATA, RESOURCES, pickResource, type CityData, type DataResource, type ResourceSpec } from './cityData';
import { startPolling } from './polling';

const merge = (state: CityData, patch: Partial<CityData>): CityData => ({ ...state, ...patch });

/**
 * Carica le API del registro quando servono: le risorse statiche una sola volta per sessione,
 * quelle live con aggiornamento periodico (in pausa con la scheda nascosta) finché servono.
 */
export function useCityData(needed: Record<DataResource, boolean>): CityData {
  const [data, apply] = useReducer(merge, INITIAL_CITY_DATA);
  const loaded = useRef(new Set<DataResource>());
  const pollers = useRef(new Map<DataResource, () => void>());

  useEffect(() => {
    const load = (key: DataResource) =>
      fetch(RESOURCES[key].url)
        .then((res) => res.json())
        .then((json) => {
          const patch = pickResource(key, json);
          if (patch) apply(patch);
        })
        .catch((err) => console.warn(`${RESOURCES[key].url} non disponibile:`, err));

    for (const key of DATA_RESOURCES) {
      const { refreshMs }: ResourceSpec = RESOURCES[key];
      if (refreshMs) {
        const running = pollers.current.get(key);
        if (needed[key] && !running) pollers.current.set(key, startPolling(() => void load(key), refreshMs));
        if (!needed[key] && running) {
          running();
          pollers.current.delete(key);
        }
      } else if (needed[key] && !loaded.current.has(key)) {
        loaded.current.add(key);
        void load(key);
      }
    }
  }, [needed]);

  // Arresto degli aggiornamenti periodici quando la pagina si smonta
  useEffect(() => {
    const active = pollers.current;
    return () => {
      active.forEach((stop) => stop());
      active.clear();
    };
  }, []);

  return data;
}
