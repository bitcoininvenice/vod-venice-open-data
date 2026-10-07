import { NextResponse } from 'next/server';
import { AlilagunaRoute, AlilagunaStop, AlilagunaBoat } from '@/lib/types';

// Transitland Feed f-u20f-alilagunaspa (Alilaguna S.p.A. GTFS open data)
const ALILAGUNA_STOPS: AlilagunaStop[] = [
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

const ALILAGUNA_ROUTES: AlilagunaRoute[] = [
  {
    id: 'ALI_BLU',
    name: 'Linea Blu',
    lineCode: 'BLU',
    color: '#0055a5',
    terminalA: 'Aeroporto Marco Polo ✈️',
    terminalB: 'Stazione Marittima / Tronchetto',
    description: 'Collegamento acqueo principale Laguna Nord - Lido - San Marco - Giudecca - Terminal Crociere',
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
    shape: [
      [12.3440, 45.4920], // VCE Aeroporto
      [12.3470, 45.4750],
      [12.3510, 45.4528], // Murano Colonna
      [12.3440, 45.4470],
      [12.3400, 45.4445], // Fondamente Nove
      [12.3550, 45.4380],
      [12.3685, 45.4175], // Lido SME
      [12.3515, 45.4330], // Arsenale
      [12.3435, 45.4340], // San Zaccaria
      [12.3385, 45.4325], // San Marco
      [12.3285, 45.4290], // Zattere
      [12.3210, 45.4280], // Molino Stucky
      [12.3100, 45.4350],
      [12.3080, 45.4420]  // Marittima
    ]
  },
  {
    id: 'ALI_ARANCIO',
    name: 'Linea Arancio',
    lineCode: 'ARANCIO',
    color: '#f39200',
    terminalA: 'Aeroporto Marco Polo ✈️',
    terminalB: 'Santa Maria del Giglio',
    description: 'Rotta diretta aeroporto verso il cuore di Venezia: Cannaregio e Canal Grande fino a Rialto e San Marco',
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
    shape: [
      [12.3440, 45.4920], // VCE Aeroporto
      [12.3420, 45.4700],
      [12.3400, 45.4445], // Fondamente Nove
      [12.3325, 45.4475], // Madonna dell'Orto
      [12.3245, 45.4430], // Guglie
      [12.3308, 45.4415], // San Stae (Canal Grande)
      [12.3360, 45.4380], // Rialto
      [12.3320, 45.4350], // Sant'Angelo
      [12.3275, 45.4330], // Ca' Rezzonico
      [12.3330, 45.4320]  // Giglio
    ]
  },
  {
    id: 'ALI_ROSSA',
    name: 'Linea Rossa',
    lineCode: 'ROSSA',
    color: '#e30613',
    terminalA: 'Aeroporto Marco Polo ✈️',
    terminalB: 'San Marco (Giardinetti)',
    description: 'Linea express stagionale tra Aeroporto, Murano Museo, Certosa, Lido e Piazza San Marco',
    frequencyMinutes: 30,
    stops: [
      'Aeroporto Marco Polo',
      'Murano Museo',
      'Certosa',
      'Lido SME',
      'San Marco'
    ],
    shape: [
      [12.3440, 45.4920], // VCE Aeroporto
      [12.3550, 45.4720],
      [12.3570, 45.4580], // Murano Museo
      [12.3720, 45.4320], // Certosa
      [12.3685, 45.4175], // Lido SME
      [12.3515, 45.4330], // Arsenale
      [12.3385, 45.4325]  // San Marco
    ]
  },
  {
    id: 'ALI_VERDE',
    name: 'Linea Verde',
    lineCode: 'VERDE',
    color: '#009640',
    terminalA: 'San Marco',
    terminalB: 'Torcello / Burano',
    description: 'Tour ed escursioni turistiche guidate alle isole maggiori della Laguna Nord',
    frequencyMinutes: 60,
    stops: [
      'San Marco',
      'Murano Colonna',
      'Burano',
      'Torcello'
    ],
    shape: [
      [12.3385, 45.4325], // San Marco
      [12.3510, 45.4528], // Murano Colonna
      [12.4170, 45.4850], // Burano
      [12.4180, 45.4980]  // Torcello
    ]
  }
];

export async function GET() {
  const t = Date.now() / 1000;

  // Live fleet movement simulation along shapes
  const boats: AlilagunaBoat[] = [
    {
      id: 'ali_boat_14',
      name: 'Alilaguna 14',
      lineCode: 'BLU',
      lineName: 'Linea Blu',
      color: '#0055a5',
      lat: 45.4720 + Math.sin(t * 0.05) * 0.012,
      lon: 12.3460 + Math.cos(t * 0.05) * 0.005,
      heading: 195,
      speedKmh: 17.8,
      nextStop: 'Murano Colonna',
      destination: 'Stazione Marittima',
      passengersOnBoard: 42
    },
    {
      id: 'ali_boat_22',
      name: 'Alilaguna 22',
      lineCode: 'BLU',
      lineName: 'Linea Blu',
      color: '#0055a5',
      lat: 45.4310 + Math.sin(t * 0.04 + 1.5) * 0.006,
      lon: 12.3420 + Math.cos(t * 0.04 + 1.5) * 0.015,
      heading: 260,
      speedKmh: 14.5,
      nextStop: 'San Marco (Giardinetti)',
      destination: 'Aeroporto VCE',
      passengersOnBoard: 58
    },
    {
      id: 'ali_boat_07',
      name: 'Alilaguna 07',
      lineCode: 'ARANCIO',
      lineName: 'Linea Arancio',
      color: '#f39200',
      lat: 45.4650 + Math.sin(t * 0.06 + 2) * 0.015,
      lon: 12.3410 + Math.cos(t * 0.06 + 2) * 0.004,
      heading: 185,
      speedKmh: 18.2,
      nextStop: "Madonna dell'Orto",
      destination: 'Rialto / Giglio',
      passengersOnBoard: 36
    },
    {
      id: 'ali_boat_19',
      name: 'Alilaguna 19',
      lineCode: 'ARANCIO',
      lineName: 'Linea Arancio',
      color: '#f39200',
      lat: 45.4395 + Math.sin(t * 0.03 + 3) * 0.002,
      lon: 12.3340 + Math.cos(t * 0.03 + 3) * 0.003,
      heading: 140,
      speedKmh: 9.2,
      nextStop: 'Rialto',
      destination: 'Santa Maria del Giglio',
      passengersOnBoard: 47
    },
    {
      id: 'ali_boat_31',
      name: 'Alilaguna 31',
      lineCode: 'ROSSA',
      lineName: 'Linea Rossa',
      color: '#e30613',
      lat: 45.4780 + Math.sin(t * 0.07 + 0.8) * 0.010,
      lon: 12.3500 + Math.cos(t * 0.07 + 0.8) * 0.006,
      heading: 175,
      speedKmh: 19.5,
      nextStop: 'Murano Museo',
      destination: 'San Marco',
      passengersOnBoard: 51
    },
    {
      id: 'ali_boat_04',
      name: 'Alilaguna 04',
      lineCode: 'VERDE',
      lineName: 'Linea Verde',
      color: '#009640',
      lat: 45.4680 + Math.sin(t * 0.04 + 4) * 0.012,
      lon: 12.3850 + Math.cos(t * 0.04 + 4) * 0.018,
      heading: 55,
      speedKmh: 16.0,
      nextStop: 'Burano',
      destination: 'Torcello',
      passengersOnBoard: 64
    },
    {
      id: 'ali_boat_18',
      name: 'Alilaguna 18',
      lineCode: 'BLU',
      lineName: 'Linea Blu',
      color: '#0055a5',
      lat: 45.4285 + Math.sin(t * 0.035 + 2.5) * 0.005,
      lon: 12.3210 + Math.cos(t * 0.035 + 2.5) * 0.008,
      heading: 285,
      speedKmh: 15.2,
      nextStop: 'Molino Stucky Giudecca',
      destination: 'Tronchetto / Marittima',
      passengersOnBoard: 38
    },
    {
      id: 'ali_boat_25',
      name: 'Alilaguna 25',
      lineCode: 'ARANCIO',
      lineName: 'Linea Arancio',
      color: '#f39200',
      lat: 45.4425 + Math.sin(t * 0.04 + 1.2) * 0.003,
      lon: 12.3270 + Math.cos(t * 0.04 + 1.2) * 0.003,
      heading: 135,
      speedKmh: 9.8,
      nextStop: 'San Stae',
      destination: 'Rialto',
      passengersOnBoard: 44
    },
    {
      id: 'ali_boat_33',
      name: 'Alilaguna 33',
      lineCode: 'ROSSA',
      lineName: 'Linea Rossa',
      color: '#e30613',
      lat: 45.4220 + Math.sin(t * 0.045 + 3.8) * 0.008,
      lon: 12.3750 + Math.cos(t * 0.045 + 3.8) * 0.012,
      heading: 240,
      speedKmh: 18.0,
      nextStop: 'Lido SME',
      destination: 'San Marco Giardinetti',
      passengersOnBoard: 53
    },
    {
      id: 'ali_boat_09',
      name: 'Alilaguna 09',
      lineCode: 'VERDE',
      lineName: 'Linea Verde',
      color: '#009640',
      lat: 45.4540 + Math.sin(t * 0.038 + 5.1) * 0.008,
      lon: 12.3680 + Math.cos(t * 0.038 + 5.1) * 0.014,
      heading: 75,
      speedKmh: 16.5,
      nextStop: 'Murano Faro',
      destination: 'Burano / Torcello',
      passengersOnBoard: 49
    }
  ];

  return NextResponse.json({
    success: true,
    operator: 'Alilaguna S.p.A.',
    transitlandFeed: {
      onestopId: 'f-u20f-alilagunaspa',
      url: 'https://www.transit.land/feeds/f-u20f-alilagunaspa',
      versionsTracked: 59,
      type: 'GTFS Static'
    },
    routesCount: ALILAGUNA_ROUTES.length,
    stopsCount: ALILAGUNA_STOPS.length,
    activeBoatsCount: boats.length,
    routes: ALILAGUNA_ROUTES,
    stops: ALILAGUNA_STOPS,
    boats
  });
}
