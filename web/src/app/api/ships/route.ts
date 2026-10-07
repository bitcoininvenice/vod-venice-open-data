import { NextResponse } from 'next/server';
import { ShipItem, MaritimeRouteItem } from '@/lib/types';

// Official maritime navigational routes in Venice Lagoon & Port
const MARITIME_ROUTES: MaritimeRouteItem[] = [
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

// Realistic live AIS simulation for marine traffic in Venice Lagoon, Port, and Tronchetto Cruise Terminal
export async function GET() {
  const t = Date.now() / 1000;

  // Real maritime channel trajectories and berths in Venice Lagoon
  const ships: ShipItem[] = [
    {
      mmsi: "228045000",
      imo: "9603099",
      name: "Le Lyrial",
      shipType: "CRUISE",
      // Boutique luxury cruise (<25.000 GT, authorized at Tronchetto / Marittima under DL 103/2021)
      lat: 45.4418,
      lon: 12.3050,
      speedKnots: 0.1,
      heading: 110,
      draughtMeters: 4.8,
      lengthMeters: 142,
      grossTonnage: 10992,
      destination: "Venezia Marittima",
      berth: "Banchina Isonzo 1, Tronchetto",
      flag: "France 🇫🇷",
      operator: "Compagnie du Ponant",
      eta: "Ormeggiata (Banchina Isonzo)",
      isRestrictedLagoonRoute: false,
      routeId: "LIDO_TRONCHETTO"
    },
    {
      mmsi: "311142000",
      imo: "9192167",
      name: "Silver Whisper",
      shipType: "CRUISE",
      // Ultra-luxury cruise ship (<25.000 GT) docked at Tronchetto Terminal Passeggeri
      lat: 45.4429,
      lon: 12.3082,
      speedKnots: 0.0,
      heading: 105,
      draughtMeters: 6.0,
      lengthMeters: 186,
      grossTonnage: 28258,
      destination: "Venezia Tronchetto",
      berth: "Banchina Isonzo 2, Tronchetto",
      flag: "Bahamas 🇧🇸",
      operator: "Silversea Cruises",
      eta: "In Banchina (Operazioni Imbarco)",
      isRestrictedLagoonRoute: false,
      routeId: "LIDO_TRONCHETTO"
    },
    {
      mmsi: "247012900",
      imo: "9210141",
      name: "MSC Sinfonia",
      shipType: "CRUISE",
      // Large cruise ship (>25.000 GT): DEVIATA da San Marco verso Marghera via Canale dei Petroli (D.L. 103/2021)
      lat: 45.4180 + Math.sin(t * 0.02) * 0.005,
      lon: 12.2580 + Math.cos(t * 0.02) * 0.008,
      speedKnots: 8.4,
      heading: 325,
      draughtMeters: 6.8,
      lengthMeters: 275,
      grossTonnage: 65542,
      destination: "Venezia - Porto Marghera",
      berth: "Banchina Liguria, Porto Marghera (Deviazione DL 103/2021)",
      flag: "Panama 🇵🇦",
      operator: "MSC Crociere",
      eta: "Canale Industriale Nord",
      isRestrictedLagoonRoute: true,
      routeId: "CANALE_PETROLI"
    },
    {
      mmsi: "247198500",
      imo: "8953837",
      name: "Ferry Metamauco (ACTV/AVM)",
      shipType: "FERRY",
      // Regular public transport car-ferry crossing Tronchetto <-> Lido San Nicolò
      lat: 45.4330 + Math.sin(t * 0.04) * 0.015,
      lon: 12.3350 + Math.cos(t * 0.04) * 0.035,
      speedKnots: 7.2,
      heading: 95,
      draughtMeters: 2.9,
      lengthMeters: 63,
      grossTonnage: 1350,
      destination: "Lido San Nicolò",
      berth: "Pontile Ferry Tronchetto - Linea 17",
      flag: "Italy 🇮🇹",
      operator: "ACTV / AVM S.p.A.",
      eta: "In Navigazione Canale della Giudecca",
      isRestrictedLagoonRoute: false,
      routeId: "FERRY_LINEA_17"
    },
    {
      mmsi: "256194000",
      imo: "9005479",
      name: "San Frangisk (Venezia Lines)",
      shipType: "HYDROFOIL",
      // High-speed passenger catamaran connecting Venice to Istria/Croatia (Poreč/Rovinj)
      lat: 45.4335,
      lon: 12.3160,
      speedKnots: 0.2,
      heading: 260,
      draughtMeters: 2.1,
      lengthMeters: 39,
      grossTonnage: 310,
      destination: "San Basilio / Tronchetto",
      berth: "Banchina San Basilio / Marittima",
      flag: "Malta 🇲🇹",
      operator: "Venezia Lines",
      eta: "Ormeggiato San Basilio",
      isRestrictedLagoonRoute: false,
      routeId: "FAST_FERRY_ISTRIA"
    },
    {
      mmsi: "247348200",
      imo: "9459345",
      name: "Rimorchiatore Achille",
      shipType: "TUG",
      // Harbor tugboat assisting ships in Canale dei Petroli / Malamocco
      lat: 45.3620 + Math.sin(t * 0.03) * 0.008,
      lon: 12.2740 + Math.cos(t * 0.03) * 0.008,
      speedKnots: 10.5,
      heading: 15,
      draughtMeters: 4.5,
      lengthMeters: 32,
      grossTonnage: 440,
      destination: "Bocca di Malamocco",
      berth: "Canale dei Petroli (Pattugliamento)",
      flag: "Italy 🇮🇹",
      operator: "Rimorchiatori Riuniti Panfido",
      eta: "In Servizio Pilotina",
      isRestrictedLagoonRoute: false,
      routeId: "CANALE_PETROLI"
    },
    {
      mmsi: "247285100",
      imo: "9293408",
      name: "Grande Baltimora",
      shipType: "CARGO",
      // Ro-Ro Container ship entering from Malamocco towards Marghera
      lat: 45.3400 + ((t * 0.0008) % 0.04),
      lon: 12.2880 - ((t * 0.0006) % 0.03),
      speedKnots: 6.8,
      heading: 330,
      draughtMeters: 8.2,
      lengthMeters: 199,
      grossTonnage: 38400,
      destination: "Porto Marghera Terminal Rinfuse",
      berth: "Banchina Traghetti e Ro-Ro Fusina",
      flag: "Italy 🇮🇹",
      operator: "Grimaldi Lines",
      eta: "Canale di Malamocco",
      isRestrictedLagoonRoute: true,
      routeId: "CANALE_PETROLI"
    }
  ];

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    totalShips: ships.length,
    regulationNotice: "Decreto Legge 103/2021: navi passeggeri >25.000 GT instradate a Marghera via Canale dei Petroli; navi <25.000 GT e traghetti autorizzati a Tronchetto / San Basilio.",
    routes: MARITIME_ROUTES,
    data: ships
  });
}
