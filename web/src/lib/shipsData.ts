import { MaritimeRouteItem } from './types';

// Canali di navigazione marittima della Laguna e del Porto di Venezia (anagrafica statica)
export const MARITIME_ROUTES: MaritimeRouteItem[] = [
  {
    id: 'CANALE_PETROLI',
    name: 'Canale dei Petroli / Malamocco - Marghera',
    type: 'DEEP_WATER',
    channelName: 'Canale dei Petroli (D.L. 103/2021)',
    depthMeters: 14.5,
    color: '#f59e0b',
    waypoints: [
      { name: 'PILOTA MALAMOCCO', depth: '-15.0m', lon: 12.3600, lat: 45.3200 },
      { name: 'BOCCA MALAMOCCO MOSE', depth: '-14.0m', lon: 12.3350, lat: 45.3340 },
      { name: 'ALBERONI ROCCHETTA', depth: '-13.5m', lon: 12.2980, lat: 45.3520 },
      { name: 'CURVA S. LEONARDO', depth: '-12.5m', lon: 12.2700, lat: 45.3800 },
      { name: 'FUSINA WP', depth: '-12.0m', lon: 12.2560, lat: 45.4180 },
      { name: 'BANCHINE MARGHERA', depth: '-11.5m', lon: 12.2450, lat: 45.4420 }
    ]
  },
  {
    id: 'LIDO_TRONCHETTO',
    name: 'Rotta Bocca di Lido -> Tronchetto Marittima',
    type: 'CRUISE_TRONCHETTO',
    channelName: 'Canale San Nicolò - Marittima (<25k GT)',
    depthMeters: 11.0,
    color: '#6366f1',
    waypoints: [
      { name: 'FARO DIGA LIDO', depth: '-12.0m', lon: 12.4480, lat: 45.4180 },
      { name: 'BOCCA DI LIDO MOSE', depth: '-11.0m', lon: 12.4220, lat: 45.4210 },
      { name: 'BACINO S. NICOLÒ', depth: '-10.0m', lon: 12.3850, lat: 45.4290 },
      { name: 'CANALE DELLE NAVI', depth: '-9.5m', lon: 12.3650, lat: 45.4280 },
      { name: 'CANALE S. MARCO NORD', depth: '-9.0m', lon: 12.3350, lat: 45.4330 },
      { name: 'TRONCHETTO ISONZO', depth: '-8.5m', lon: 12.3050, lat: 45.4418 }
    ]
  },
  {
    id: 'FERRY_LINEA_17',
    name: 'Canale Ferry-Boat Linea 17 (Tronchetto - Lido)',
    type: 'FERRY',
    channelName: 'Canale della Giudecca - Ferry',
    depthMeters: 7.0,
    color: '#14b8a6',
    waypoints: [
      { name: 'TRONCHETTO FERRY', depth: '-6.5m', lon: 12.3050, lat: 45.4418 },
      { name: 'GIUDECCA OVEST', depth: '-7.0m', lon: 12.3200, lat: 45.4330 },
      { name: 'GIUDECCA EST', depth: '-7.0m', lon: 12.3550, lat: 45.4290 },
      { name: 'LIDO S. NICOLÒ DARSENA', depth: '-6.0m', lon: 12.3820, lat: 45.4310 }
    ]
  },
  {
    id: 'FAST_FERRY_ISTRIA',
    name: 'Rotta Alto Adriatico - Aliscafi Istria',
    type: 'FAST_FERRY',
    channelName: 'Canale della Grazia - Adriatico',
    depthMeters: 15.0,
    color: '#06b6d4',
    waypoints: [
      { name: 'SAN BASILIO MARITTIMA', depth: '-7.5m', lon: 12.3160, lat: 45.4335 },
      { name: 'CANALE DELLA GRAZIA', depth: '-8.0m', lon: 12.3450, lat: 45.4220 },
      { name: 'BOCCA DI LIDO SUD', depth: '-10.5m', lon: 12.4200, lat: 45.4150 },
      { name: 'ADRIATICO OPEN SEA', depth: '-22.0m', lon: 12.4850, lat: 45.3900 }
    ]
  }
];

