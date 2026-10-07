import { BathingWaterItem, UrbanTreeItem, EvChargingItem, WifiHotspotItem } from './types';

// Dati Ufficiali ARPAV / Ministero della Salute sulle Acque di Balneazione dei litorali veneziani
export const BATHING_WATERS_DATA: BathingWaterItem[] = [
  {
    id: 'BALN-LIDO-01',
    name: 'Lido di Venezia - Spiaggia Blue Moon & Lungomare',
    location: 'Lido di Venezia',
    lat: 45.4180,
    lon: 12.3780,
    qualityClass: 'ECCELLENTE',
    waterTempC: 19.4,
    escherichiaColiUfc: 14, // limite normativo < 500
    enterococchiUfc: 8,     // limite normativo < 200
    blueFlag: true,
    samplingDate: 'Ieri ore 09:30',
    officialSource: 'ARPAV Veneto - U.O. Qualità Acque Marine'
  },
  {
    id: 'BALN-LIDO-02',
    name: 'Lido di Venezia - San Nicolò (Oasi Dunes)',
    location: 'Lido di Venezia',
    lat: 45.4290,
    lon: 12.3890,
    qualityClass: 'ECCELLENTE',
    waterTempC: 19.1,
    escherichiaColiUfc: 10,
    enterococchiUfc: 5,
    blueFlag: true,
    samplingDate: 'Ieri ore 10:15',
    officialSource: 'ARPAV Veneto'
  },
  {
    id: 'BALN-LIDO-03',
    name: 'Lido di Venezia - Murazzi & Grand Hotel Excelsior',
    location: 'Lido di Venezia',
    lat: 45.4050,
    lon: 12.3680,
    qualityClass: 'ECCELLENTE',
    waterTempC: 19.6,
    escherichiaColiUfc: 22,
    enterococchiUfc: 12,
    blueFlag: true,
    samplingDate: 'Ieri ore 11:00',
    officialSource: 'ARPAV Veneto'
  },
  {
    id: 'BALN-LIDO-04',
    name: 'Lido di Venezia - Alberoni (Oasi WWF Dune e Pineta)',
    location: 'Lido di Venezia',
    lat: 45.3480,
    lon: 12.3210,
    qualityClass: 'ECCELLENTE',
    waterTempC: 19.8,
    escherichiaColiUfc: 8,
    enterococchiUfc: 4,
    blueFlag: true,
    samplingDate: 'Ieri ore 11:45',
    officialSource: 'ARPAV Veneto / Portale Acque Ministero Salute'
  },
  {
    id: 'BALN-PELL-01',
    name: 'Isola di Pellestrina - San Pietro in Volta & Murazzi',
    location: 'Pellestrina',
    lat: 45.2890,
    lon: 12.3080,
    qualityClass: 'ECCELLENTE',
    waterTempC: 19.9,
    escherichiaColiUfc: 12,
    enterococchiUfc: 6,
    blueFlag: true,
    samplingDate: 'Ieri ore 12:30',
    officialSource: 'ARPAV Veneto'
  }
];

// Catasto del Verde e Alberature Monumentali Comunali (dati.venezia.it)
export const URBAN_TREES_DATA: UrbanTreeItem[] = [
  {
    id: 'TREE-VE-01',
    code: 'VE-ARB-0012',
    species: 'Platanus acerifolia',
    commonName: 'Platano orientale monumentale',
    location: 'Giardini Reali di San Marco',
    lat: 45.4330,
    lon: 12.3380,
    heightMeters: 26.5,
    canopyDiameterMeters: 22.0,
    ageClass: 'MONUMENTALE',
    co2AbsorbedKgYear: 48.0,
    district: 'San Marco'
  },
  {
    id: 'TREE-VE-02',
    code: 'VE-ARB-0084',
    species: 'Pinus pinea',
    commonName: 'Pino domestico marittimo',
    location: 'Parco di Sant\'Elena / Viale Quattro Novembre',
    lat: 45.4280,
    lon: 12.3650,
    heightMeters: 19.0,
    canopyDiameterMeters: 14.5,
    ageClass: 'MONUMENTALE',
    co2AbsorbedKgYear: 35.0,
    district: 'Castello'
  },
  {
    id: 'TREE-VE-03',
    code: 'VE-ARB-0115',
    species: 'Celtis australis',
    commonName: 'Bagolaro secolare (Spaccasassi)',
    location: 'Campo San Giacomo dell\'Orio',
    lat: 45.4402,
    lon: 12.3265,
    heightMeters: 17.5,
    canopyDiameterMeters: 13.0,
    ageClass: 'MONUMENTALE',
    co2AbsorbedKgYear: 31.0,
    district: 'Santa Croce'
  },
  {
    id: 'TREE-VE-04',
    code: 'VE-ARB-0220',
    species: 'Fagus sylvatica pendula',
    commonName: 'Faggio pendulo storico',
    location: 'Giardini della Biennale (Castello)',
    lat: 45.4300,
    lon: 12.3580,
    heightMeters: 18.0,
    canopyDiameterMeters: 15.0,
    ageClass: 'MONUMENTALE',
    co2AbsorbedKgYear: 38.0,
    district: 'Castello'
  },
  {
    id: 'TREE-VE-05',
    code: 'VE-ARB-0340',
    species: 'Sophora japonica',
    commonName: 'Sofora del Giappone',
    location: 'Giardino Papadopoli (Piazzale Roma)',
    lat: 45.4390,
    lon: 12.3195,
    heightMeters: 21.0,
    canopyDiameterMeters: 16.5,
    ageClass: 'ADULTO',
    co2AbsorbedKgYear: 40.0,
    district: 'Santa Croce'
  },
  {
    id: 'TREE-VE-06',
    code: 'VE-ARB-0418',
    species: 'Tilia cordata',
    commonName: 'Tiglio nostrano',
    location: 'Campo Santa Margherita',
    lat: 45.4335,
    lon: 12.3235,
    heightMeters: 15.5,
    canopyDiameterMeters: 11.0,
    ageClass: 'ADULTO',
    co2AbsorbedKgYear: 28.0,
    district: 'Dorsoduro'
  }
];

// Colonnine Ricarica Elettrica AVM / Enel X (Piattaforma Unica Nazionale PUN)
export const EV_CHARGING_DATA: EvChargingItem[] = [
  {
    id: 'EV-PR-01',
    name: 'Hub Autorimessa Comunale - Piazzale Roma',
    operator: 'AVM / Comune di Venezia',
    location: 'Piazzale Roma, Isola Santa Chiara',
    lat: 45.4375,
    lon: 12.3180,
    totalSockets: 12,
    availableSockets: 7,
    powerKw: 50,
    socketTypes: ['Type 2 (22kW)', 'CCS Combo 2 (50kW Fast)'],
    isOperational: true
  },
  {
    id: 'EV-TRON-01',
    name: 'Super-Hub Tronchetto Terminal Interscambio',
    operator: 'AVM / Enel X Way',
    location: 'Isola Nuova del Tronchetto',
    lat: 45.4425,
    lon: 12.3070,
    totalSockets: 16,
    availableSockets: 11,
    powerKw: 150,
    socketTypes: ['CCS Combo 2 (150kW Ultra-Fast)', 'CHAdeMO (50kW)', 'Type 2 (22kW)'],
    isOperational: true
  },
  {
    id: 'EV-SM-01',
    name: 'Stazione San Basilio - Santa Marta Porto',
    operator: 'AVM / Be Charge',
    location: 'Ex Cotonificio, Dorsoduro Santa Marta',
    lat: 45.4330,
    lon: 12.3150,
    totalSockets: 4,
    availableSockets: 2,
    powerKw: 22,
    socketTypes: ['Type 2 (22kW)'],
    isOperational: true
  },
  {
    id: 'EV-SG-01',
    name: 'Hub Parco San Giuliano - Ingresso Porta Rossa',
    operator: 'AVM / Comune di Venezia',
    location: 'Via San Giuliano (Fronte Laguna)',
    lat: 45.4660,
    lon: 12.2780,
    totalSockets: 8,
    availableSockets: 5,
    powerKw: 50,
    socketTypes: ['Type 2 (22kW)', 'CCS 50kW'],
    isOperational: true
  }
];

// Punti di Accesso Wi-Fi Pubblico Gratuito "VeniceConnected" (Venis S.p.A. / dati.venezia.it)
export const WIFI_HOTSPOTS_DATA: WifiHotspotItem[] = [
  {
    id: 'WIFI-SM-01',
    name: 'VeniceConnected - Piazza San Marco & Torre Orologio',
    networkName: 'VeniceConnected',
    location: 'Piazza San Marco',
    lat: 45.4344,
    lon: 12.3385,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 248,
    speedMbps: 100,
    isFreePublic: true
  },
  {
    id: 'WIFI-RI-01',
    name: 'VeniceConnected - Campo San Bartolomeo & Rialto',
    networkName: 'VeniceConnected',
    location: 'Campo San Bartolomeo',
    lat: 45.4378,
    lon: 12.3368,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 182,
    speedMbps: 100,
    isFreePublic: true
  },
  {
    id: 'WIFI-ST-01',
    name: 'VeniceConnected - Piazzale Stazione Santa Lucia',
    networkName: 'VeniceConnected',
    location: 'Fondamenta Santa Lucia',
    lat: 45.4415,
    lon: 12.3215,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 215,
    speedMbps: 100,
    isFreePublic: true
  },
  {
    id: 'WIFI-MARG-01',
    name: 'VeniceConnected - Campo Santa Margherita',
    networkName: 'VeniceConnected',
    location: 'Campo Santa Margherita',
    lat: 45.4338,
    lon: 12.3242,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 114,
    speedMbps: 80,
    isFreePublic: true
  },
  {
    id: 'WIFI-STEF-01',
    name: 'VeniceConnected - Campo Santo Stefano',
    networkName: 'VeniceConnected',
    location: 'Campo Santo Stefano',
    lat: 45.4330,
    lon: 12.3305,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 76,
    speedMbps: 80,
    isFreePublic: true
  },
  {
    id: 'WIFI-F9-01',
    name: 'VeniceConnected - Fondamente Nove Terminal Laguna Nord',
    networkName: 'VeniceConnected',
    location: 'Fondamente Nove',
    lat: 45.4445,
    lon: 12.3410,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 89,
    speedMbps: 100,
    isFreePublic: true
  },
  {
    id: 'WIFI-LIDO-01',
    name: 'VeniceConnected - Gran Viale Santa Maria Elisabetta',
    networkName: 'VeniceConnected',
    location: 'Lido Piazzale SME',
    lat: 45.4185,
    lon: 12.3695,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 64,
    speedMbps: 80,
    isFreePublic: true
  },
  {
    id: 'WIFI-MUR-01',
    name: 'VeniceConnected - Murano Faro Imbarcadero',
    networkName: 'VeniceConnected',
    location: 'Murano Faro',
    lat: 45.4530,
    lon: 12.3530,
    indoorOutdoor: 'OUTDOOR',
    usersConnected: 52,
    speedMbps: 80,
    isFreePublic: true
  }
];
