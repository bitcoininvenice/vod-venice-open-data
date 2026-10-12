import type { MoseGateItem } from '@/lib/types';

/** Schiera MOSE con le stazioni mareografiche CPSM sulla diga (lato mare) e nella bocca (lato laguna). */
export type MoseGateDef = Omit<MoseGateItem, 'tideSeaCm' | 'tideLagoonCm'> & { seaStationId: string; lagoonStationId: string };

/**
 * Anagrafica delle quattro schiere MOSE (dato strutturale statico).
 * I livelli lato mare/laguna vengono associati alle stazioni mareografiche reali più vicine.
 */
export const MOSE_GATES: MoseGateDef[] = [
  {
    id: 'mose-lido-treporti',
    inletName: 'Lido San Nicolò - Canale Treporti',
    channel: 'Bocca di Porto di Lido Nord (Canale Treporti)',
    lat: 45.4353, lon: 12.4176,
    startLon: 12.4140, startLat: 45.4344,
    endLon: 12.4212, endLat: 45.4362,
    barriersCount: 21,
    status: 'NON_DISPONIBILE', elevationCm: null,
    seaStationId: '1022', lagoonStationId: '1025',
  },
  {
    id: 'mose-lido-sannicolo',
    inletName: 'Lido - Canale San Nicolò',
    channel: 'Bocca di Porto di Lido Sud (Canale San Nicolò)',
    lat: 45.4293, lon: 12.4126,
    startLon: 12.4114, startLat: 45.4320,
    endLon: 12.4138, endLat: 45.4265,
    barriersCount: 20,
    status: 'NON_DISPONIBILE', elevationCm: null,
    seaStationId: '1022', lagoonStationId: '1025',
  },
  {
    id: 'mose-malamocco',
    inletName: 'Bocca di Malamocco',
    channel: 'Canale di Grande Navigazione / Petroli',
    lat: 45.3355, lon: 12.3282,
    startLon: 12.3285, startLat: 45.3372,
    endLon: 12.3278, endLat: 45.3338,
    barriersCount: 19,
    status: 'NON_DISPONIBILE', elevationCm: null,
    seaStationId: '1023', lagoonStationId: '1032',
  },
  {
    id: 'mose-chioggia',
    inletName: 'Bocca di Chioggia',
    channel: 'Bocca di Porto Sud / Chioggia',
    lat: 45.2326, lon: 12.2965,
    startLon: 12.2968, startLat: 45.2348,
    endLon: 12.2962, endLat: 45.2305,
    barriersCount: 18,
    status: 'NON_DISPONIBILE', elevationCm: null,
    seaStationId: '1024', lagoonStationId: '1033',
  },
];
