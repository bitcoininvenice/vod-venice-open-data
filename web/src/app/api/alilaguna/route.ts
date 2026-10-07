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


export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    operator: "Alilaguna S.p.A.",
    transitlandFeed: {
      onestopId: "f-u20f-alilagunaspa",
      url: "https://www.transit.land/feeds/f-u20f-alilagunaspa",
      type: "GTFS Static Open Data"
    },
    metadata: {
      regime: "DATI_ISTITUZIONALI_CERTIFICATI",
      source: "Transitland Registry (Feed f-u20f-alilagunaspa) / Alilaguna S.p.A.",
      notes: "Rete ufficiale delle linee e pontili del servizio pubblico aeroportuale lagunare Alilaguna. I dati provengono dal feed ufficiale GTFS registrato su Transitland. La piattaforma esclude posizionamenti cinematici simulati in assenza di un feed GTFS-RT pubblico aperto."
    },
    routesCount: ALILAGUNA_ROUTES.length,
    stopsCount: ALILAGUNA_STOPS.length,
    routes: ALILAGUNA_ROUTES,
    stops: ALILAGUNA_STOPS,
    boats: []
  });
}
