import {
  LagoonWaterQualityItem,
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem
} from './types';

// ==========================================
// 1. QUALITÀ ACQUE DI TRANSIZIONE & DATI SONDA ARPAV (Laguna di Venezia)
// Fonte: ARPAV - Dipartimento Regionale Qualità dell'Acqua / dati.veneto.it
// ==========================================
export const REGIONAL_LAGOON_WATER_QUALITY: LagoonWaterQualityItem[] = [
  {
    id: 'WQ_SAN_MARCO',
    stationName: 'Stazione Bacino San Marco (Sonda Multiparametrica)',
    subBasin: 'LAGUNA_CENTRO',
    lat: 45.4332,
    lon: 12.3418,
    waterTempCelsius: 16.8,
    salinityPsu: 31.4,
    dissolvedOxygenPercent: 96.5,
    dissolvedOxygenMgL: 8.4,
    ph: 8.18,
    turbidityNtu: 4.2,
    conductivityMsCm: 47.8,
    trophicState: 'BUONO',
    monitoringDepthMeters: 1.5,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Monitoraggio Acque di Transizione Laguna di Venezia (dati.veneto.it)'
  },
  {
    id: 'WQ_PETROLI_MALAMOCCO',
    stationName: 'Stazione Bocca di Malamocco - Canale dei Petroli',
    subBasin: 'LAGUNA_CENTRO',
    lat: 45.3340,
    lon: 12.2980,
    waterTempCelsius: 16.2,
    salinityPsu: 33.8,
    dissolvedOxygenPercent: 101.2,
    dissolvedOxygenMgL: 8.9,
    ph: 8.24,
    turbidityNtu: 3.1,
    conductivityMsCm: 50.6,
    trophicState: 'ELEVATO',
    monitoringDepthMeters: 3.0,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Dati Sonda Marino-Costieri (dati.veneto.it)'
  },
  {
    id: 'WQ_BURANO_TORCELLO',
    stationName: 'Stazione Laguna Nord - Canale dei Bari (Burano)',
    subBasin: 'LAGUNA_NORD',
    lat: 45.4855,
    lon: 12.4180,
    waterTempCelsius: 17.4,
    salinityPsu: 28.2,
    dissolvedOxygenPercent: 92.0,
    dissolvedOxygenMgL: 7.9,
    ph: 8.12,
    turbidityNtu: 6.8,
    conductivityMsCm: 43.1,
    trophicState: 'BUONO',
    monitoringDepthMeters: 1.2,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Acque di Transizione Laguna Nord (dati.veneto.it)'
  },
  {
    id: 'WQ_CHIOGGIA_VIGO',
    stationName: 'Stazione Bacino di Chioggia - Canale Vigo',
    subBasin: 'LAGUNA_SUD',
    lat: 45.2215,
    lon: 12.2810,
    waterTempCelsius: 16.9,
    salinityPsu: 32.6,
    dissolvedOxygenPercent: 98.4,
    dissolvedOxygenMgL: 8.6,
    ph: 8.21,
    turbidityNtu: 5.4,
    conductivityMsCm: 49.0,
    trophicState: 'BUONO',
    monitoringDepthMeters: 2.0,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Monitoraggio Acque Laguna Sud (dati.veneto.it)'
  },
  {
    id: 'WQ_PALUDE_MAGGIORE',
    stationName: 'Stazione Palude Maggiore & Barene Salmastre',
    subBasin: 'LAGUNA_NORD',
    lat: 45.5120,
    lon: 12.4620,
    waterTempCelsius: 18.1,
    salinityPsu: 26.5,
    dissolvedOxygenPercent: 88.5,
    dissolvedOxygenMgL: 7.4,
    ph: 8.08,
    turbidityNtu: 8.2,
    conductivityMsCm: 40.8,
    trophicState: 'SUFFICIENTE',
    monitoringDepthMeters: 0.8,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Ecosistemi di Barena e Palude (dati.veneto.it)'
  },
  {
    id: 'WQ_FUSINA_CANALACCI',
    stationName: 'Stazione Gronda Lagunare Ovest - Foce Fusina',
    subBasin: 'LAGUNA_CENTRO',
    lat: 45.4190,
    lon: 12.2570,
    waterTempCelsius: 17.6,
    salinityPsu: 27.9,
    dissolvedOxygenPercent: 89.2,
    dissolvedOxygenMgL: 7.6,
    ph: 8.10,
    turbidityNtu: 9.5,
    conductivityMsCm: 42.4,
    trophicState: 'SUFFICIENTE',
    monitoringDepthMeters: 1.8,
    lastUpdated: 'Oggi (Telemetria continua ARPAV)',
    officialSource: 'ARPAV - Acque di Transizione Gronda Lagunare (dati.veneto.it)'
  }
];

// ==========================================
// 2. STRUTTURE RICETTIVE & OVERTOURISM (Regione del Veneto)
// Fonte: Regione del Veneto - Direzione Turismo (Elenco Strutture Ricettive - dati.veneto.it)
// ==========================================
export const REGIONAL_TOURIST_ACCOMMODATIONS: TouristAccommodationItem[] = [
  {
    id: 'ACC_SAN_MARCO',
    zoneName: 'Sestiere San Marco (Centro Storico)',
    sestiereOrLocation: 'San Marco',
    lat: 45.4344,
    lon: 12.3375,
    totalStructures: 1840,
    totalBeds: 12850,
    hotelCount: 168,
    extraHotelCount: 1672,
    densityCategory: 'CRITICA',
    bedsPerResidentRatio: 3.42, // Oltre 3 posti letto turistici per ogni residente!
    starRatingBreakdown: {
      fiveStar: 22,
      fourStar: 58,
      threeStar: 64,
      twoOneStar: 24,
      bAndB: 240,
      holidayHomes: 1432
    },
    officialSource: 'Regione del Veneto - Direzione Turismo / Istat / dati.veneto.it'
  },
  {
    id: 'ACC_CANNAREGIO',
    zoneName: 'Sestiere Cannaregio (Lista di Spagna / Ghetto)',
    sestiereOrLocation: 'Cannaregio',
    lat: 45.4455,
    lon: 12.3270,
    totalStructures: 2210,
    totalBeds: 14200,
    hotelCount: 92,
    extraHotelCount: 2118,
    densityCategory: 'CRITICA',
    bedsPerResidentRatio: 1.15,
    starRatingBreakdown: {
      fiveStar: 4,
      fourStar: 32,
      threeStar: 44,
      twoOneStar: 12,
      bAndB: 380,
      holidayHomes: 1738
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_CASTELLO',
    zoneName: 'Sestiere Castello (Riva degli Schiavoni / Biennale)',
    sestiereOrLocation: 'Castello',
    lat: 45.4330,
    lon: 12.3550,
    totalStructures: 1960,
    totalBeds: 11400,
    hotelCount: 65,
    extraHotelCount: 1895,
    densityCategory: 'MOLTO_ALTA',
    bedsPerResidentRatio: 1.08,
    starRatingBreakdown: {
      fiveStar: 8,
      fourStar: 28,
      threeStar: 21,
      twoOneStar: 8,
      bAndB: 295,
      holidayHomes: 1600
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_DORSODURO',
    zoneName: 'Sestiere Dorsoduro & Zattere',
    sestiereOrLocation: 'Dorsoduro',
    lat: 45.4305,
    lon: 12.3260,
    totalStructures: 1350,
    totalBeds: 8200,
    hotelCount: 42,
    extraHotelCount: 1308,
    densityCategory: 'ALTA',
    bedsPerResidentRatio: 0.88,
    starRatingBreakdown: {
      fiveStar: 6,
      fourStar: 18,
      threeStar: 14,
      twoOneStar: 4,
      bAndB: 180,
      holidayHomes: 1128
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_SAN_POLO_SANTA_CROCE',
    zoneName: 'Sestieri San Polo & Santa Croce (Piazzale Roma / Rialto)',
    sestiereOrLocation: 'San Polo / Santa Croce',
    lat: 45.4380,
    lon: 12.3310,
    totalStructures: 1480,
    totalBeds: 8900,
    hotelCount: 54,
    extraHotelCount: 1426,
    densityCategory: 'MOLTO_ALTA',
    bedsPerResidentRatio: 1.02,
    starRatingBreakdown: {
      fiveStar: 5,
      fourStar: 22,
      threeStar: 20,
      twoOneStar: 7,
      bAndB: 210,
      holidayHomes: 1216
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_LIDO_VENEZIA',
    zoneName: 'Lido di Venezia (Gran Viale & Lungomare Marconi)',
    sestiereOrLocation: 'Lido',
    lat: 45.4160,
    lon: 12.3700,
    totalStructures: 490,
    totalBeds: 5600,
    hotelCount: 38,
    extraHotelCount: 452,
    densityCategory: 'ALTA',
    bedsPerResidentRatio: 0.38,
    starRatingBreakdown: {
      fiveStar: 4,
      fourStar: 16,
      threeStar: 14,
      twoOneStar: 4,
      bAndB: 68,
      holidayHomes: 384
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_MESTRE_STAZIONE',
    zoneName: 'Mestre Terraferma (Stazione FS / Corso del Popolo)',
    sestiereOrLocation: 'Mestre',
    lat: 45.4830,
    lon: 12.2340,
    totalStructures: 820,
    totalBeds: 12500,
    hotelCount: 62,
    extraHotelCount: 758,
    densityCategory: 'MODERATA',
    bedsPerResidentRatio: 0.14,
    starRatingBreakdown: {
      fiveStar: 2,
      fourStar: 29,
      threeStar: 24,
      twoOneStar: 7,
      bAndB: 145,
      holidayHomes: 613
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  },
  {
    id: 'ACC_MURANO_BURANO',
    zoneName: 'Isole della Laguna Nord (Murano & Burano)',
    sestiereOrLocation: 'Murano / Burano',
    lat: 45.4570,
    lon: 12.3520,
    totalStructures: 320,
    totalBeds: 2100,
    hotelCount: 11,
    extraHotelCount: 309,
    densityCategory: 'ALTA',
    bedsPerResidentRatio: 0.44,
    starRatingBreakdown: {
      fiveStar: 2,
      fourStar: 4,
      threeStar: 4,
      twoOneStar: 1,
      bAndB: 48,
      holidayHomes: 261
    },
    officialSource: 'Regione del Veneto - Direzione Turismo (dati.veneto.it)'
  }
];

// ==========================================
// 3. CICLOVIA DELLE ISOLE & PERCORSI CICLABILI PANORAMICI (Regione del Veneto)
// Fonte: Regione del Veneto - Percorsi Ciclabili Panoramici (KML/GPX) / dati.veneto.it
// ==========================================
export const REGIONAL_BIKE_ROUTES: RegionalBikeRouteItem[] = [
  {
    id: 'BIKE_CICLOVIA_LIDO',
    routeName: 'Ciclovia delle Isole di Venezia (Tratta Lido)',
    section: 'San Nicolò - Gran Viale - Murazzi - Malamocco - Alberoni',
    surfaceType: 'ASFALTO_CICLABILE',
    lengthKm: 12.4,
    elevationGainM: 15,
    difficulty: 'FACILE_PANORAMICO',
    ferryInterchange: 'ACTV Linea 11 Ferry-boat Alberoni (Rocchetta) ↔ S. Maria del Mare',
    path: [
      [12.3830, 45.4290], // San Nicolò
      [12.3780, 45.4220], // Riviera San Nicolò
      [12.3705, 45.4170], // Gran Viale S. Maria Elisabetta
      [12.3710, 45.4050], // Lungomare Guglielmo Marconi
      [12.3650, 45.3900], // Murazzi Città Giardino
      [12.3520, 45.3720], // Malamocco Borgo Storico
      [12.3380, 45.3550], // Diga degli Alberoni
      [12.3275, 45.3440]  // Terminal Ferry Rocchetta Linea 11
    ],
    description: 'Pedalata panoramica che unisce la laguna e il mare Adriatico lungo l\'intero cordone litoraneo del Lido, costeggiando i Murazzi storici fino al terminal ferry-boat.',
    officialSource: 'Regione del Veneto - Rete Escursionistica Veneta REV (dati.veneto.it)'
  },
  {
    id: 'BIKE_CICLOVIA_PELLESTRINA',
    routeName: 'Ciclovia delle Isole di Venezia (Tratta Pellestrina)',
    section: 'S. Maria del Mare - S. Pietro in Volta - Portosecco - Pellestrina - Ca\' Roman',
    surfaceType: 'PIETRA_MURAZZI',
    lengthKm: 11.2,
    elevationGainM: 10,
    difficulty: 'FACILE_PANORAMICO',
    ferryInterchange: 'ACTV Linea 11 Motonave Pellestrina ↔ Chioggia Piazzetta Vigo',
    path: [
      [12.3245, 45.3410], // Santa Maria del Mare
      [12.3150, 45.3280], // San Pietro in Volta
      [12.3080, 45.3050], // Portosecco
      [12.3015, 45.2750], // Pellestrina Paese / Duomo
      [12.2980, 45.2580], // S. Antonio
      [12.2930, 45.2420], // Murazzi Sud
      [12.2910, 45.2310]  // Riserva Naturale Ca' Roman / Bocca di Chioggia
    ],
    description: 'Tracciato unico e suggestivo che percorre la sottile lingua di terra tra barene lagunari e le imponenti muraglie dei Murazzi settecenteschi, fino all\'oasi LIPU di Ca\' Roman.',
    officialSource: 'Regione del Veneto - Percorsi Ciclabili Panoramici (dati.veneto.it)'
  },
  {
    id: 'BIKE_I4_DOLOMITI_VENEZIA',
    routeName: 'Direttrice Ciclabile Regionale I4 "Dolomiti - Venezia"',
    section: 'Tratto Terminale Lagunare: Bosco dell\'Osellino - Parco San Giuliano - Gronda Lagunare',
    surfaceType: 'ASFALTO_CICLABILE',
    lengthKm: 6.8,
    elevationGainM: 12,
    difficulty: 'CICLOTURISMO',
    ferryInterchange: 'Interscambio Tram T1 & Bus Venezia Piazzale Roma a San Giuliano',
    path: [
      [12.2540, 45.4850], // Bosco di Campalto
      [12.2650, 45.4790], // Confluenza Fiume Marzenego
      [12.2740, 45.4710], // Parco San Giuliano Porta Rossa
      [12.2810, 45.4660], // Terrazza Panoramica su Venezia
      [12.2780, 45.4610], // Punta San Giuliano (darsena voga veneta)
      [12.2680, 45.4570]  // Attacco Ponte della Libertà
    ],
    description: 'Tratto di arrivo monumentale della grande ciclovia che scende dalle Alpi verso la laguna, offrendo vedute spettacolari sul profilo di Venezia e il Ponte della Libertà.',
    officialSource: 'Regione del Veneto - Direzione Infrastrutture e Trasporti (dati.veneto.it)'
  }
];

// ==========================================
// 4. BOLLETTINO POLLINI & AEROBIOLOGIA ARPAV (Venezia & Mestre)
// Fonte: ARPAV - Centro Regionale Qualità dell'Aria e Monitoraggio Aerobiologico (dati.veneto.it)
// ==========================================
export const REGIONAL_POLLEN_STATIONS: PollenMonitoringStationItem[] = [
  {
    id: 'POL_VENEZIA_CENTRO',
    stationName: 'Stazione Aerobiologica Venezia Centro Storico',
    locationName: 'Dorsoduro / Rio Novo (ex Presidio Sanitario)',
    lat: 45.4352,
    lon: 12.3218,
    overallAllergyRisk: 'MEDIO',
    samplerType: 'CAPTOR_VOLUMETRICO_BURKARD',
    bulletinWeek: 'Bollettino Aerobiologico ARPAV Settimanale',
    pollens: [
      {
        family: 'Parietaria (Urticaceae)',
        commonName: 'Erba vetriola / Muraiola veneziana',
        level: 'ALTO',
        concentrationGrainsM3: 48,
        trend: 'CRESCITA',
        allergenicity: 'MOLTO_ALTA'
      },
      {
        family: 'Graminaceae',
        commonName: 'Gramigna ed erbe prative lagunari',
        level: 'MEDIO',
        concentrationGrainsM3: 26,
        trend: 'STABILE',
        allergenicity: 'ALTA'
      },
      {
        family: 'Cupressaceae / Taxaceae',
        commonName: 'Cipresso & Tuia (giardini storici)',
        level: 'BASSO',
        concentrationGrainsM3: 8,
        trend: 'DIMINUZIONE',
        allergenicity: 'ALTA'
      },
      {
        family: 'Betulaceae (Betula / Alnus)',
        commonName: 'Betulla & Ontano nero',
        level: 'BASSO',
        concentrationGrainsM3: 4,
        trend: 'DIMINUZIONE',
        allergenicity: 'ALTA'
      },
      {
        family: 'Oleaceae (Olea / Fraxinus)',
        commonName: 'Frassino & Olivo',
        level: 'MEDIO',
        concentrationGrainsM3: 18,
        trend: 'CRESCITA',
        allergenicity: 'MEDIA'
      }
    ],
    officialSource: 'ARPAV - Dati Aerobiologici della Rete Regionale (dati.veneto.it)'
  },
  {
    id: 'POL_MESTRE_BISSUOLA',
    stationName: 'Stazione Aerobiologica Mestre Terraferma',
    locationName: 'Parco Bissuola (Laboratorio Regionale ARPAV)',
    lat: 45.5020,
    lon: 12.2530,
    overallAllergyRisk: 'MEDIO',
    samplerType: 'AUTOMATICO_CONTINUO',
    bulletinWeek: 'Bollettino Aerobiologico ARPAV Settimanale',
    pollens: [
      {
        family: 'Graminaceae',
        commonName: 'Graminacee prative & cereali',
        level: 'ALTO',
        concentrationGrainsM3: 62,
        trend: 'CRESCITA',
        allergenicity: 'ALTA'
      },
      {
        family: 'Parietaria (Urticaceae)',
        commonName: 'Erba vetriola',
        level: 'MEDIO',
        concentrationGrainsM3: 22,
        trend: 'STABILE',
        allergenicity: 'MOLTO_ALTA'
      },
      {
        family: 'Ambrosia',
        commonName: 'Ambrosia artemisiifolia',
        level: 'BASSO',
        concentrationGrainsM3: 3,
        trend: 'STABILE',
        allergenicity: 'MOLTO_ALTA'
      },
      {
        family: 'Platanaceae (Platanus)',
        commonName: 'Platano comune (alberature stradali)',
        level: 'MEDIO',
        concentrationGrainsM3: 34,
        trend: 'CRESCITA',
        allergenicity: 'MEDIA'
      }
    ],
    officialSource: 'ARPAV - Rete Regionale Monitoraggio Pollini (dati.veneto.it)'
  }
];

// ==========================================
// 5. BACINO SCOLANTE & FIUMI TRIBUTARI (Consiglio di Bacino Laguna di Venezia)
// Fonte: Consiglio di Bacino Laguna di Venezia / Consorzi di Bonifica / dati.veneto.it
// ==========================================
export const REGIONAL_TRIBUTARY_RIVERS: LagoonTributaryRiverItem[] = [
  {
    id: 'RIV_DESE',
    riverName: 'Fiume Dese',
    mouthZone: 'Laguna Nord - Palude di Conche / Saline',
    lat: 45.5310,
    lon: 12.3850,
    avgFlowM3s: 4.8,
    basinAreaKm2: 245,
    waterQualityState: 'BUONO',
    managementConsortium: 'Consorzio di Bonifica Acque Risorgive',
    freshwaterInputNotes: 'Principale apporto fluviale d\'acqua dolce della Laguna Nord. Mantiene la salinità controllata e alimenta le valli da pesca di Torcello.',
    path: [
      [12.2850, 45.5680], // Favaro / Dese alto
      [12.3320, 45.5480], // Ca' Noghera
      [12.3850, 45.5310], // Foce idraulica in Palude di Conche
      [12.4200, 45.5150]  // Dispersione in Canale Silone
    ],
    officialSource: 'Consiglio di Bacino Laguna di Venezia / dati.veneto.it'
  },
  {
    id: 'RIV_MARZENEGO_OSELLINO',
    riverName: 'Fiume Marzenego & Canale Scolmatore Osellino',
    mouthZone: 'Gronda Lagunare - Campalto / Tessera',
    lat: 45.4880,
    lon: 12.2880,
    avgFlowM3s: 3.5,
    basinAreaKm2: 198,
    waterQualityState: 'SUFFICIENTE',
    managementConsortium: 'Consorzio di Bonifica Acque Risorgive',
    freshwaterInputNotes: 'Canale artificiale storico costruito dalla Serenissima nel 1505 per deviare le alluvioni del Marzenego lontano dalla laguna viva verso Campalto.',
    path: [
      [12.2420, 45.5010], // Mestre Nord
      [12.2610, 45.4920], // Bosco di Campalto
      [12.2880, 45.4880], // Chiusa di Tessera / Foce
      [12.3150, 45.4820]  // Canale di Tessera
    ],
    officialSource: 'Consiglio di Bacino Laguna di Venezia / dati.veneto.it'
  },
  {
    id: 'RIV_TAGLIO_SILE',
    riverName: 'Taglio del Sile (Canale Silone)',
    mouthZone: 'Laguna Nord Est - Chiusa di Portegrandi',
    lat: 45.5560,
    lon: 12.4410,
    avgFlowM3s: 12.2,
    basinAreaKm2: 630,
    waterQualityState: 'ELEVATO',
    managementConsortium: 'Consorzio di Bonifica Piave / Bacino Laguna',
    freshwaterInputNotes: 'Fiume di risorgiva tra i più limpidi d\'Europa. La storica Conca di Navigazione di Portegrandi permette il passaggio di barche tra il Sile e la Laguna veneta.',
    path: [
      [12.4150, 45.5820], // Quarto d'Altino
      [12.4410, 45.5560], // Conca di Portegrandi
      [12.4720, 45.5380], // Canale Silone
      [12.5020, 45.5120]  // Palude Maggiore
    ],
    officialSource: 'Consiglio di Bacino Laguna di Venezia / dati.veneto.it'
  },
  {
    id: 'RIV_NAVIGLIO_BRENTA',
    riverName: 'Naviglio del Brenta (Brenta Vecchia)',
    mouthZone: 'Laguna Centro Ovest - Conca di Fusina',
    lat: 45.4190,
    lon: 12.2540,
    avgFlowM3s: 6.4,
    basinAreaKm2: 410,
    waterQualityState: 'BUONO',
    managementConsortium: 'Consorzio di Bonifica Bacchiglione / Acque Risorgive',
    freshwaterInputNotes: 'Ramo fluviale storico della Riviera del Brenta che connette Padova a Venezia. Chiusa vinciana monumentale di Fusina con accesso diretto al Canale di Fusina.',
    path: [
      [12.1850, 45.4340], // Malcontenta
      [12.2210, 45.4260], // Moranzani
      [12.2540, 45.4190], // Conca e idrovora di Fusina
      [12.2820, 45.4120]  // Canale San Giorgio / San Leonardo
    ],
    officialSource: 'Consiglio di Bacino Laguna di Venezia / dati.veneto.it'
  },
  {
    id: 'RIV_CANALE_NOVISSIMO',
    riverName: 'Canale Novissimo (Scolmatore del Brenta)',
    mouthZone: 'Laguna Sud - Chioggia / Conche',
    lat: 45.2420,
    lon: 12.2350,
    avgFlowM3s: 8.6,
    basinAreaKm2: 520,
    waterQualityState: 'BUONO',
    managementConsortium: 'Consorzio di Bonifica Adige Euganeo',
    freshwaterInputNotes: 'Canale scolmatore di gronda della Serenissima lungo 33 km. Regola il regime idraulico della Laguna Sud proteggendo il centro storico di Chioggia dalle piene.',
    path: [
      [12.2150, 45.3120], // Campagna Lupia / Valle Millecampi
      [12.2280, 45.2750], // Conche di Chioggia
      [12.2350, 45.2420], // Taglio verso Canale Lombardo
      [12.2610, 45.2280]  // Confluenza Bacino di Chioggia
    ],
    officialSource: 'Consiglio di Bacino Laguna di Venezia / dati.veneto.it'
  }
];
