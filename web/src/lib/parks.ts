import type { ParkPlace } from './types';

/** Colore per tipo di area verde, condiviso da mappa, legenda e scheda. */
export const PARK_COLORS: Record<ParkPlace['kind'], string> = {
  park: '#22c55e',
  garden: '#10b981',
  nature_reserve: '#15803d',
  dog_park: '#84cc16',
  playground: '#f59e0b',
};
