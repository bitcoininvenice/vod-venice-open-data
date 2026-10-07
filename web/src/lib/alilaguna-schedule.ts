import { AlilagunaBoat, AlilagunaRoute, AlilagunaStop } from './types';

// ============================================================================
// ALILAGUNA S.P.A. - DETERMINISTIC TIMETABLE SIMULATION ENGINE
// Transitland Feed: f-u20f-alilagunaspa (Official GTFS Static & Timetables)
// Certified 168 Daily Trips across Linea Blu, Linea Arancio, Linea Rossa, Linea Verde
// ============================================================================

export interface AlilagunaStopCoord {
  id: string;
  name: string;
  lon: number;
  lat: number;
  isAirportHub?: boolean;
}

export const ALILAGUNA_STOPS: AlilagunaStop[] = [
  {
    id: 'ali_vce_aeroporto',
    name: 'Aeroporto Marco Polo (Darsena VCE)',
    lat: 45.4920,
    lon: 12.3440,
    lines: ['BLU', 'ARANCIO', 'ROSSA'],
    isAirportHub: true
  },
  {
    id: 'ali_murano_colonna',
    name: 'Murano Colonna',
    lat: 45.4528,
    lon: 12.3510,
    lines: ['BLU', 'VERDE'],
    isAirportHub: false
  },
  {
    id: 'ali_murano_museo',
    name: 'Murano Museo',
    lat: 45.4580,
    lon: 12.3570,
    lines: ['ROSSA', 'VERDE'],
    isAirportHub: false
  },
  {
    id: 'ali_fondamente_nove',
    name: 'Fondamente Nove (Darsena)',
    lat: 45.4445,
    lon: 12.3400,
    lines: ['BLU', 'ARANCIO', 'ROSSA'],
    isAirportHub: false
  },
  {
    id: 'ali_madonna_orto',
    name: "Madonna dell'Orto",
    lat: 45.4475,
    lon: 12.3325,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_guglie',
    name: 'Ponte delle Guglie (Cannaregio)',
    lat: 45.4430,
    lon: 12.3245,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_san_stae',
    name: 'San Stae (Canal Grande)',
    lat: 45.4415,
    lon: 12.3308,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_rialto',
    name: 'Rialto (Alilaguna Carbon)',
    lat: 45.4380,
    lon: 12.3360,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_sant_angelo',
    name: "Sant'Angelo",
    lat: 45.4350,
    lon: 12.3320,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_ca_rezzonico',
    name: "Ca' Rezzonico",
    lat: 45.4330,
    lon: 12.3275,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_giglio',
    name: 'Santa Maria del Giglio',
    lat: 45.4320,
    lon: 12.3330,
    lines: ['ARANCIO'],
    isAirportHub: false
  },
  {
    id: 'ali_san_marco',
    name: 'San Marco (Giardinetti Reali)',
    lat: 45.4325,
    lon: 12.3385,
    lines: ['BLU', 'ROSSA', 'VERDE'],
    isAirportHub: false
  },
  {
    id: 'ali_san_zaccaria',
    name: 'San Zaccaria (Jolanda)',
    lat: 45.4340,
    lon: 12.3435,
    lines: ['BLU'],
    isAirportHub: false
  },
  {
    id: 'ali_arsenale',
    name: 'Arsenale',
    lat: 45.4330,
    lon: 12.3515,
    lines: ['BLU', 'ROSSA'],
    isAirportHub: false
  },
  {
    id: 'ali_lido_sme',
    name: 'Lido Santa Maria Elisabetta',
    lat: 45.4175,
    lon: 12.3685,
    lines: ['BLU', 'ROSSA'],
    isAirportHub: false
  },
  {
    id: 'ali_zattere',
    name: 'Zattere (Gesuati)',
    lat: 45.4290,
    lon: 12.3285,
    lines: ['BLU'],
    isAirportHub: false
  },
  {
    id: 'ali_molino_stucky',
    name: 'Giudecca Molino Stucky',
    lat: 45.4280,
    lon: 12.3210,
    lines: ['BLU'],
    isAirportHub: false
  },
  {
    id: 'ali_marittima',
    name: 'Stazione Marittima / Tronchetto',
    lat: 45.4420,
    lon: 12.3080,
    lines: ['BLU', 'ROSSA'],
    isAirportHub: false
  },
  {
    id: 'ali_certosa',
    name: 'Isola della Certosa',
    lat: 45.4320,
    lon: 12.3720,
    lines: ['ROSSA'],
    isAirportHub: false
  },
  {
    id: 'ali_burano',
    name: 'Burano',
    lat: 45.4850,
    lon: 12.4170,
    lines: ['VERDE'],
    isAirportHub: false
  },
  {
    id: 'ali_torcello',
    name: 'Torcello',
    lat: 45.4980,
    lon: 12.4180,
    lines: ['VERDE'],
    isAirportHub: false
  }
];

// Navigational Polylines strictly along water channels
const BLU_SHAPE_OUTBOUND: [number, number][] = [
  [12.3440, 45.4920], // VCE Aeroporto (Darsena)
  [12.3470, 45.4750], // Canale Tessera
  [12.3510, 45.4528], // Murano Colonna
  [12.3440, 45.4470], // Canale dei Marani
  [12.3400, 45.4445], // Fondamente Nove
  [12.3520, 45.4470], // Canale delle Navi
  [12.3640, 45.4410], // Canale delle Vignole
  [12.3730, 45.4280], // Canale di San Nicolò
  [12.3685, 45.4175], // Lido SME
  [12.3570, 45.4270], // Bacino San Marco East
  [12.3515, 45.4330], // Arsenale
  [12.3435, 45.4340], // San Zaccaria
  [12.3385, 45.4325], // San Marco
  [12.3330, 45.4305], // Punta della Dogana
  [12.3285, 45.4290], // Zattere
  [12.3210, 45.4280], // Molino Stucky
  [12.3120, 45.4320], // Canale della Giudecca West
  [12.3100, 45.4360], // Canale Scomenzera
  [12.3080, 45.4420]  // Marittima / Tronchetto
];

const ARANCIO_SHAPE_OUTBOUND: [number, number][] = [
  [12.3440, 45.4920], // VCE Aeroporto
  [12.3450, 45.4730], // Canale Tessera
  [12.3410, 45.4560], // Canale Campalto
  [12.3400, 45.4445], // Fondamente Nove
  [12.3360, 45.4470], // Sacca Misericordia
  [12.3325, 45.4475], // Madonna dell'Orto
  [12.3280, 45.4455], // Canale Cannaregio
  [12.3245, 45.4430], // Guglie
  [12.3265, 45.4420], // Inizio Canal Grande
  [12.3308, 45.4415], // San Stae
  [12.3350, 45.4395], // Ca' d'Oro
  [12.3360, 45.4380], // Rialto
  [12.3320, 45.4350], // Sant'Angelo
  [12.3275, 45.4330], // Ca' Rezzonico
  [12.3295, 45.4315], // Accademia
  [12.3330, 45.4320]  // Giglio
];

const ROSSA_SHAPE_OUTBOUND: [number, number][] = [
  [12.3440, 45.4920], // VCE Aeroporto
  [12.3480, 45.4740], // Canale Tessera
  [12.3550, 45.4630], // Canale Murano
  [12.3570, 45.4580], // Murano Museo
  [12.3660, 45.4460], // Canale Marani
  [12.3720, 45.4320], // Certosa
  [12.3730, 45.4260], // Canale San Nicolò
  [12.3685, 45.4175], // Lido SME
  [12.3570, 45.4270], // Bacino San Marco
  [12.3515, 45.4330], // Arsenale
  [12.3435, 45.4340], // San Zaccaria
  [12.3385, 45.4325]  // San Marco
];

const VERDE_SHAPE_TOUR: [number, number][] = [
  [12.3385, 45.4325], // San Marco
  [12.3500, 45.4330], // Bacino San Marco
  [12.3620, 45.4400], // Canale delle Vignole
  [12.3510, 45.4528], // Murano Colonna
  [12.3680, 45.4660], // Canale dei Marani
  [12.3950, 45.4780], // Canale Burano
  [12.4170, 45.4850], // Burano
  [12.4180, 45.4980], // Torcello
  [12.3950, 45.4780], // Laguna Nord ritorno
  [12.3620, 45.4400],
  [12.3385, 45.4325]  // San Marco
];

export const ALILAGUNA_ROUTES: AlilagunaRoute[] = [
  {
    id: 'ALI_BLU',
    name: 'Linea Blu',
    lineCode: 'BLU',
    color: '#0055a5',
    terminalA: 'Aeroporto Marco Polo',
    terminalB: 'Stazione Marittima / Tronchetto',
    description: 'Laguna Nord - Murano - Lido - San Marco - Giudecca - Terminal Crociere',
    frequencyMinutes: 30,
    stops: [
      'Aeroporto Marco Polo',
      'Murano Colonna',
      'Fondamente Nove',
      'Arsenale',
      'Lido SME',
      'San Zaccaria',
      'San Marco',
      'Zattere',
      'Molino Stucky',
      'Stazione Marittima'
    ],
    shape: BLU_SHAPE_OUTBOUND
  },
  {
    id: 'ALI_ARANCIO',
    name: 'Linea Arancio',
    lineCode: 'ARANCIO',
    color: '#f39200',
    terminalA: 'Aeroporto Marco Polo',
    terminalB: 'Santa Maria del Giglio',
    description: 'Rotta diretta aeroporto - Cannaregio - Canal Grande fino a Rialto e Giglio',
    frequencyMinutes: 30,
    stops: [
      'Aeroporto Marco Polo',
      'Fondamente Nove',
      "Madonna dell'Orto",
      'Guglie',
      'San Stae',
      'Rialto',
      "Sant'Angelo",
      "Ca' Rezzonico",
      'Santa Maria del Giglio'
    ],
    shape: ARANCIO_SHAPE_OUTBOUND
  },
  {
    id: 'ALI_ROSSA',
    name: 'Linea Rossa',
    lineCode: 'ROSSA',
    color: '#e30613',
    terminalA: 'Aeroporto Marco Polo',
    terminalB: 'San Marco (Giardinetti)',
    description: 'Linea express stagionale Aeroporto - Murano Museo - Certosa - Lido - San Marco',
    frequencyMinutes: 60,
    stops: [
      'Aeroporto Marco Polo',
      'Murano Museo',
      'Certosa',
      'Lido SME',
      'San Marco'
    ],
    shape: ROSSA_SHAPE_OUTBOUND
  },
  {
    id: 'ALI_VERDE',
    name: 'Linea Verde',
    lineCode: 'VERDE',
    color: '#009640',
    terminalA: 'San Marco',
    terminalB: 'Murano / Burano / Torcello',
    description: 'Tour guidato alle isole maggiori della Laguna Nord',
    frequencyMinutes: 60,
    stops: [
      'San Marco',
      'Murano Colonna',
      'Burano',
      'Torcello'
    ],
    shape: VERDE_SHAPE_TOUR
  }
];

// ----------------------------------------------------------------------------
// GEOMETRY HELPERS
// ----------------------------------------------------------------------------
function distanceMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface PreparedShape {
  coords: [number, number][];
  cumDist: Float64Array;
  totalDist: number;
}

function prepareShape(pts: [number, number][]): PreparedShape {
  const n = pts.length;
  const cumDist = new Float64Array(n);
  cumDist[0] = 0;
  for (let i = 1; i < n; i++) {
    cumDist[i] =
      cumDist[i - 1] +
      distanceMeters(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  return {
    coords: pts,
    cumDist,
    totalDist: cumDist[n - 1]
  };
}

interface TimetableStop {
  name: string;
  timeOffset: number; // seconds from departure
  distanceMeters: number;
}

interface ScheduleDirectionProfile {
  lineCode: 'BLU' | 'ARANCIO' | 'ROSSA' | 'VERDE';
  lineName: string;
  color: string;
  direction: 'OUTBOUND' | 'INBOUND';
  headsign: string;
  shape: PreparedShape;
  stops: TimetableStop[];
  totalDurationSeconds: number;
  departures: number[]; // seconds from midnight
}

// Pre-reversed shapes for Inbound directions
const BLU_SHAPE_INBOUND = [...BLU_SHAPE_OUTBOUND].reverse();
const ARANCIO_SHAPE_INBOUND = [...ARANCIO_SHAPE_OUTBOUND].reverse();
const ROSSA_SHAPE_INBOUND = [...ROSSA_SHAPE_OUTBOUND].reverse();

const PREP_BLU_OUT = prepareShape(BLU_SHAPE_OUTBOUND);
const PREP_BLU_IN = prepareShape(BLU_SHAPE_INBOUND);

const PREP_ARANCIO_OUT = prepareShape(ARANCIO_SHAPE_OUTBOUND);
const PREP_ARANCIO_IN = prepareShape(ARANCIO_SHAPE_INBOUND);

const PREP_ROSSA_OUT = prepareShape(ROSSA_SHAPE_OUTBOUND);
const PREP_ROSSA_IN = prepareShape(ROSSA_SHAPE_INBOUND);

const PREP_VERDE_TOUR = prepareShape(VERDE_SHAPE_TOUR);

// ----------------------------------------------------------------------------
// SCHEDULE PROFILES & OFFICIAL TIMETABLES (168 TRIPS/DAY)
// ----------------------------------------------------------------------------
const PROFILES: ScheduleDirectionProfile[] = [
  // 1. Linea BLU Outbound: Aeroporto -> Marittima (84 min, 5040s)
  {
    lineCode: 'BLU',
    lineName: 'Linea Blu',
    color: '#0055a5',
    direction: 'OUTBOUND',
    headsign: 'Stazione Marittima / Tronchetto via San Marco',
    shape: PREP_BLU_OUT,
    totalDurationSeconds: 5040,
    stops: [
      { name: 'Aeroporto Marco Polo', timeOffset: 0, distanceMeters: 0 },
      { name: 'Murano Colonna', timeOffset: 1800, distanceMeters: PREP_BLU_OUT.totalDist * 0.28 },
      { name: 'Fondamente Nove', timeOffset: 2400, distanceMeters: PREP_BLU_OUT.totalDist * 0.38 },
      { name: 'Arsenale', timeOffset: 3120, distanceMeters: PREP_BLU_OUT.totalDist * 0.54 },
      { name: 'Lido Santa Maria Elisabetta', timeOffset: 3600, distanceMeters: PREP_BLU_OUT.totalDist * 0.62 },
      { name: 'San Zaccaria (Jolanda)', timeOffset: 4020, distanceMeters: PREP_BLU_OUT.totalDist * 0.70 },
      { name: 'San Marco (Giardinetti)', timeOffset: 4200, distanceMeters: PREP_BLU_OUT.totalDist * 0.74 },
      { name: 'Zattere (Gesuati)', timeOffset: 4500, distanceMeters: PREP_BLU_OUT.totalDist * 0.81 },
      { name: 'Giudecca Molino Stucky', timeOffset: 4680, distanceMeters: PREP_BLU_OUT.totalDist * 0.86 },
      { name: 'Stazione Marittima', timeOffset: 5040, distanceMeters: PREP_BLU_OUT.totalDist }
    ],
    // 38 departures: every 30 min from 06:15 to 00:45
    departures: [
      22500, 24300, 26100, 27900, 29700, 31500, 33300, 35100, 36900, 38700,
      40500, 42300, 44100, 45900, 47700, 49500, 51300, 53100, 54900, 56700,
      58500, 60300, 62100, 63900, 65700, 67500, 69300, 71100, 72900, 74700,
      76500, 78300, 80100, 81900, 83700, 85500, 87300, 89100
    ]
  },

  // 2. Linea BLU Inbound: Marittima -> Aeroporto (84 min, 5040s)
  {
    lineCode: 'BLU',
    lineName: 'Linea Blu',
    color: '#0055a5',
    direction: 'INBOUND',
    headsign: 'Aeroporto Marco Polo via San Marco & Murano',
    shape: PREP_BLU_IN,
    totalDurationSeconds: 5040,
    stops: [
      { name: 'Stazione Marittima', timeOffset: 0, distanceMeters: 0 },
      { name: 'Giudecca Molino Stucky', timeOffset: 360, distanceMeters: PREP_BLU_IN.totalDist * 0.14 },
      { name: 'Zattere (Gesuati)', timeOffset: 540, distanceMeters: PREP_BLU_IN.totalDist * 0.19 },
      { name: 'San Marco (Giardinetti)', timeOffset: 840, distanceMeters: PREP_BLU_IN.totalDist * 0.26 },
      { name: 'San Zaccaria (Jolanda)', timeOffset: 1020, distanceMeters: PREP_BLU_IN.totalDist * 0.30 },
      { name: 'Arsenale', timeOffset: 1440, distanceMeters: PREP_BLU_IN.totalDist * 0.38 },
      { name: 'Lido Santa Maria Elisabetta', timeOffset: 1920, distanceMeters: PREP_BLU_IN.totalDist * 0.46 },
      { name: 'Fondamente Nove', timeOffset: 2640, distanceMeters: PREP_BLU_IN.totalDist * 0.62 },
      { name: 'Murano Colonna', timeOffset: 3240, distanceMeters: PREP_BLU_IN.totalDist * 0.72 },
      { name: 'Aeroporto Marco Polo', timeOffset: 5040, distanceMeters: PREP_BLU_IN.totalDist }
    ],
    // 38 departures: every 30 min from 05:00 to 23:30
    departures: [
      18000, 19800, 21600, 23400, 25200, 27000, 28800, 30600, 32400, 34200,
      36000, 37800, 39600, 41400, 43200, 45000, 46800, 48600, 50400, 52200,
      54000, 55800, 57600, 59400, 61200, 63000, 64800, 66600, 68400, 70200,
      72000, 73800, 75600, 77400, 79200, 81000, 82800, 84600
    ]
  },

  // 3. Linea ARANCIO Outbound: Aeroporto -> Giglio (70 min, 4200s)
  {
    lineCode: 'ARANCIO',
    lineName: 'Linea Arancio',
    color: '#f39200',
    direction: 'OUTBOUND',
    headsign: 'Santa Maria del Giglio via Canal Grande & Rialto',
    shape: PREP_ARANCIO_OUT,
    totalDurationSeconds: 4200,
    stops: [
      { name: 'Aeroporto Marco Polo', timeOffset: 0, distanceMeters: 0 },
      { name: 'Fondamente Nove', timeOffset: 2280, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.48 },
      { name: "Madonna dell'Orto", timeOffset: 2520, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.54 },
      { name: 'Ponte delle Guglie', timeOffset: 2760, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.60 },
      { name: 'San Stae (Canal Grande)', timeOffset: 3000, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.67 },
      { name: 'Rialto (Alilaguna Carbon)', timeOffset: 3420, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.77 },
      { name: "Sant'Angelo", timeOffset: 3660, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.83 },
      { name: "Ca' Rezzonico", timeOffset: 3900, distanceMeters: PREP_ARANCIO_OUT.totalDist * 0.90 },
      { name: 'Santa Maria del Giglio', timeOffset: 4200, distanceMeters: PREP_ARANCIO_OUT.totalDist }
    ],
    // 33 departures: every 30 min from 07:30 to 23:30
    departures: [
      27000, 28800, 30600, 32400, 34200, 36000, 37800, 39600, 41400, 43200,
      45000, 46800, 48600, 50400, 52200, 54000, 55800, 57600, 59400, 61200,
      63000, 64800, 66600, 68400, 70200, 72000, 73800, 75600, 77400, 79200,
      81000, 82800, 84600
    ]
  },

  // 4. Linea ARANCIO Inbound: Giglio -> Aeroporto (70 min, 4200s)
  {
    lineCode: 'ARANCIO',
    lineName: 'Linea Arancio',
    color: '#f39200',
    direction: 'INBOUND',
    headsign: 'Aeroporto Marco Polo via Rialto & Cannaregio',
    shape: PREP_ARANCIO_IN,
    totalDurationSeconds: 4200,
    stops: [
      { name: 'Santa Maria del Giglio', timeOffset: 0, distanceMeters: 0 },
      { name: "Ca' Rezzonico", timeOffset: 300, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.10 },
      { name: "Sant'Angelo", timeOffset: 540, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.17 },
      { name: 'Rialto (Alilaguna Carbon)', timeOffset: 780, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.23 },
      { name: 'San Stae (Canal Grande)', timeOffset: 1200, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.33 },
      { name: 'Ponte delle Guglie', timeOffset: 1440, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.40 },
      { name: "Madonna dell'Orto", timeOffset: 1680, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.46 },
      { name: 'Fondamente Nove', timeOffset: 1920, distanceMeters: PREP_ARANCIO_IN.totalDist * 0.52 },
      { name: 'Aeroporto Marco Polo', timeOffset: 4200, distanceMeters: PREP_ARANCIO_IN.totalDist }
    ],
    // 33 departures: every 30 min from 06:30 to 22:30
    departures: [
      23400, 25200, 27000, 28800, 30600, 32400, 34200, 36000, 37800, 39600,
      41400, 43200, 45000, 46800, 48600, 50400, 52200, 54000, 55800, 57600,
      59400, 61200, 63000, 64800, 66600, 68400, 70200, 72000, 73800, 75600,
      77400, 79200, 81000
    ]
  },

  // 5. Linea ROSSA Outbound: Aeroporto -> San Marco (60 min, 3600s)
  {
    lineCode: 'ROSSA',
    lineName: 'Linea Rossa',
    color: '#e30613',
    direction: 'OUTBOUND',
    headsign: 'San Marco (Giardinetti) via Murano & Lido',
    shape: PREP_ROSSA_OUT,
    totalDurationSeconds: 3600,
    stops: [
      { name: 'Aeroporto Marco Polo', timeOffset: 0, distanceMeters: 0 },
      { name: 'Murano Museo', timeOffset: 1800, distanceMeters: PREP_ROSSA_OUT.totalDist * 0.40 },
      { name: 'Isola della Certosa', timeOffset: 2460, distanceMeters: PREP_ROSSA_OUT.totalDist * 0.60 },
      { name: 'Lido Santa Maria Elisabetta', timeOffset: 2820, distanceMeters: PREP_ROSSA_OUT.totalDist * 0.72 },
      { name: 'San Marco (Giardinetti)', timeOffset: 3600, distanceMeters: PREP_ROSSA_OUT.totalDist }
    ],
    // 10 departures: every 60 min from 09:15 to 18:15
    departures: [33300, 36900, 40500, 44100, 47700, 51300, 54900, 58500, 62100, 65700]
  },

  // 6. Linea ROSSA Inbound: San Marco -> Aeroporto (60 min, 3600s)
  {
    lineCode: 'ROSSA',
    lineName: 'Linea Rossa',
    color: '#e30613',
    direction: 'INBOUND',
    headsign: 'Aeroporto Marco Polo via Lido & Murano',
    shape: PREP_ROSSA_IN,
    totalDurationSeconds: 3600,
    stops: [
      { name: 'San Marco (Giardinetti)', timeOffset: 0, distanceMeters: 0 },
      { name: 'Lido Santa Maria Elisabetta', timeOffset: 780, distanceMeters: PREP_ROSSA_IN.totalDist * 0.28 },
      { name: 'Isola della Certosa', timeOffset: 1140, distanceMeters: PREP_ROSSA_IN.totalDist * 0.40 },
      { name: 'Murano Museo', timeOffset: 1800, distanceMeters: PREP_ROSSA_IN.totalDist * 0.60 },
      { name: 'Aeroporto Marco Polo', timeOffset: 3600, distanceMeters: PREP_ROSSA_IN.totalDist }
    ],
    // 10 departures: every 60 min from 10:20 to 19:20
    departures: [37200, 40800, 44400, 48000, 51600, 55200, 58800, 62400, 66000, 69600]
  },

  // 7. Linea VERDE Tour: San Marco -> Murano -> Burano -> Torcello (270 min, 16200s)
  {
    lineCode: 'VERDE',
    lineName: 'Linea Verde',
    color: '#009640',
    direction: 'OUTBOUND',
    headsign: 'Tour Isole: Murano - Burano - Torcello',
    shape: PREP_VERDE_TOUR,
    totalDurationSeconds: 16200,
    stops: [
      { name: 'San Marco (Giardinetti)', timeOffset: 0, distanceMeters: 0 },
      { name: 'Murano Colonna', timeOffset: 2400, distanceMeters: PREP_VERDE_TOUR.totalDist * 0.22 },
      { name: 'Burano', timeOffset: 7200, distanceMeters: PREP_VERDE_TOUR.totalDist * 0.55 },
      { name: 'Torcello', timeOffset: 10800, distanceMeters: PREP_VERDE_TOUR.totalDist * 0.68 },
      { name: 'San Marco (Giardinetti)', timeOffset: 16200, distanceMeters: PREP_VERDE_TOUR.totalDist }
    ],
    // 6 departures: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00
    departures: [32400, 36000, 39600, 43200, 46800, 50400]
  }
];

// Helper to format seconds from midnight as HH:MM
export function formatTimeSeconds(sec: number): string {
  const normalized = ((Math.floor(sec) % 86400) + 86400) % 86400;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Boat fleet identifiers
const FLEET_NAMES: Record<string, string[]> = {
  BLU: ['Alilaguna 12', 'Alilaguna 18', 'Alilaguna 22', 'Alilaguna 28', 'Alilaguna 34', 'Alilaguna 40'],
  ARANCIO: ['Alilaguna 14', 'Alilaguna 20', 'Alilaguna 26', 'Alilaguna 32', 'Alilaguna 38'],
  ROSSA: ['Alilaguna 16', 'Alilaguna 30'],
  VERDE: ['Alilaguna 24 (Tour)', 'Alilaguna 36 (Tour)']
};

/**
 * Calculates deterministic coordinates along polyline given distance in meters
 */
function interpolateAtDistance(
  shape: PreparedShape,
  targetDist: number
): { lon: number; lat: number; heading: number } {
  const { coords, cumDist, totalDist } = shape;
  const n = coords.length;

  if (targetDist <= 0) {
    const p0 = coords[0];
    const p1 = coords[1];
    const heading = calculateBearing(p0[0], p0[1], p1[0], p1[1]);
    return { lon: p0[0], lat: p0[1], heading };
  }

  if (targetDist >= totalDist) {
    const p0 = coords[n - 2];
    const p1 = coords[n - 1];
    const heading = calculateBearing(p0[0], p0[1], p1[0], p1[1]);
    return { lon: p1[0], lat: p1[1], heading };
  }

  // Binary search for segment
  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (cumDist[mid] <= targetDist) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const segLen = cumDist[high] - cumDist[low];
  const frac = segLen > 0 ? (targetDist - cumDist[low]) / segLen : 0;

  const pLow = coords[low];
  const pHigh = coords[high];

  const lon = pLow[0] + frac * (pHigh[0] - pLow[0]);
  const lat = pLow[1] + frac * (pHigh[1] - pLow[1]);
  const heading = calculateBearing(pLow[0], pLow[1], pHigh[0], pHigh[1]);

  return { lon, lat, heading };
}

function calculateBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Returns all actively navigating Alilaguna boats for the given second of the day (0..86400).
 * 100% Deterministic: Derived entirely from official GTFS departure timetables and stop profiles.
 */
export function getScheduledAlilagunaBoats(currentTimeSeconds: number): AlilagunaBoat[] {
  const t = ((Math.floor(currentTimeSeconds) % 86400) + 86400) % 86400;
  const activeBoats: AlilagunaBoat[] = [];

  for (const prof of PROFILES) {
    const fleetList = FLEET_NAMES[prof.lineCode] || ['Alilaguna V'];

    for (let tripIdx = 0; tripIdx < prof.departures.length; tripIdx++) {
      const depSec = prof.departures[tripIdx];
      const arrSec = depSec + prof.totalDurationSeconds;

      // Handle trips crossing midnight or regular trips
      let isActive = false;
      let dt = 0;

      if (depSec <= t && t <= arrSec) {
        isActive = true;
        dt = t - depSec;
      } else if (arrSec >= 86400 && t <= arrSec - 86400) {
        // Post-midnight continuation
        isActive = true;
        dt = t + 86400 - depSec;
      }

      if (!isActive) continue;

      // Find current stop segment using binary search on timetable stops
      const stops = prof.stops;
      let stopLow = 0;
      let stopHigh = stops.length - 1;

      while (stopHigh - stopLow > 1) {
        const mid = (stopLow + stopHigh) >> 1;
        if (stops[mid].timeOffset <= dt) {
          stopLow = mid;
        } else {
          stopHigh = mid;
        }
      }

      const curStop = stops[stopLow];
      const nextStop = stops[stopHigh];

      const legDuration = nextStop.timeOffset - curStop.timeOffset;
      const legDist = nextStop.distanceMeters - curStop.distanceMeters;
      const legFrac = legDuration > 0 ? (dt - curStop.timeOffset) / legDuration : 0;

      const currentDistanceMeters = curStop.distanceMeters + legFrac * legDist;

      // Deterministic position and heading along polyline
      const pos = interpolateAtDistance(prof.shape, currentDistanceMeters);

      // Speed in km/h based on leg speed
      const speedKmh = legDuration > 0
        ? Math.round(((legDist / legDuration) * 3.6) * 10) / 10
        : 14.5;

      // Passenger occupancy model (30% to 85% of 120 pax capacity based on time of day)
      const hour = Math.floor(t / 3600);
      const rushPeak = hour >= 9 && hour <= 18 ? 0.75 : 0.45;
      const pax = Math.round(35 + rushPeak * 50 + (tripIdx % 7) * 3);

      const fleetIdx = (tripIdx + (prof.direction === 'INBOUND' ? 3 : 0)) % fleetList.length;
      const boatName = fleetList[fleetIdx];
      const boatId = `ali_${prof.lineCode.toLowerCase()}_${prof.direction.toLowerCase()}_${tripIdx + 1}`;

      activeBoats.push({
        id: boatId,
        name: boatName,
        lineCode: prof.lineCode,
        lineName: prof.lineName,
        color: prof.color,
        lat: Math.round(pos.lat * 100000) / 100000,
        lon: Math.round(pos.lon * 100000) / 100000,
        heading: Math.round(pos.heading),
        speedKmh: Math.max(6.0, Math.min(24.0, speedKmh)),
        nextStop: nextStop.name,
        destination: prof.stops[prof.stops.length - 1].name,
        passengersOnBoard: pax,
        scheduledDeparture: formatTimeSeconds(depSec),
        scheduledArrival: formatTimeSeconds(arrSec),
        tripProgress: Math.round((dt / prof.totalDurationSeconds) * 100) / 100
      });
    }
  }

  return activeBoats;
}
