import {
  CanalSpeedLimitItem,
  BridgeClearanceItem,
  GondolaStationItem,
  PublicDockItem,
  SubsidenceInSARItem,
  LagoonMorphologyItem,
  MeteoMarineWindItem,
  TrainLiveItem,
  VeritasWasteBoatItem,
  NizioletoCivicoItem,
  VeniceWellItem,
  BellTowerItem,
  LagoonFortressIslandItem,
  EmergencyWaterDockItem,
  PublicDaeItem,
  PharmacyDutyItem,
  HeatIslandSurfaceTempItem
} from './types';
import { METEO_MARINE_WIND_STATIONS } from './weatherWindData';

// ==========================================
// 1. VIABILITÀ ACQUEA & CANALI
// ==========================================
export const OPEN_CANAL_SPEED_LIMITS: CanalSpeedLimitItem[] = [
  {
    id: 'SPEED_CANAL_GRANDE',
    channelName: 'Canal Grande',
    maxSpeedKmh: 7,
    isBarcavelox: true,
    zoneType: 'CANALE_PRINCIPALE',
    path: [
      [12.3210, 45.4415], // Santa Lucia
      [12.3285, 45.4425], // San Marcuola
      [12.3330, 45.4410], // Ca' d'Oro
      [12.3360, 45.4380], // Rialto
      [12.3315, 45.4345], // San Tomà
      [12.3285, 45.4320], // Ca' Rezzonico
      [12.3295, 45.4310], // Accademia
      [12.3355, 45.4310], // Salute
      [12.3385, 45.4315]  // Punta della Dogana
    ],
    ordinanza: 'Ordinanza n. 274/2015 - Limite 7 km/h con riduzione a 5 km/h in prossimità del Ponte di Rialto',
    color: '#eab308', // Giallo 7 km/h
    description: 'Arteria principale del centro storico. Sorvegliata da telecamere Barcavelox e sensori optoelettronici anti-moto ondoso.'
  },
  {
    id: 'SPEED_CANALE_CANNAREGIO',
    channelName: 'Canale di Cannaregio',
    maxSpeedKmh: 7,
    isBarcavelox: true,
    zoneType: 'CANALE_INTERNO',
    path: [
      [12.3175, 45.4445], // Tre Archi
      [12.3225, 45.4435], // Guglie
      [12.3265, 45.4430]  // Confluenza Canal Grande
    ],
    ordinanza: 'Ordinanza n. 274/2015 - Limite 7 km/h',
    color: '#eab308',
    description: 'Canale ad alto traffico acqueo di collegamento tra Laguna Ovest e Canal Grande. Barcavelox attivo.'
  },
  {
    id: 'SPEED_CANALE_GIUDECCA',
    channelName: 'Canale della Giudecca',
    maxSpeedKmh: 11,
    isBarcavelox: false,
    zoneType: 'CANALE_PRINCIPALE',
    path: [
      [12.3130, 45.4320], // Sacca Fisola
      [12.3240, 45.4285], // Molino Stucky
      [12.3350, 45.4275], // Redentore
      [12.3440, 45.4285], // Zitelle
      [12.3480, 45.4295]  // Isola di San Giorgio
    ],
    ordinanza: 'Ordinanza n. 93/2007 - Limite 11 km/h natanti ACTV/passeggeri',
    color: '#06b6d4', // Ciano 11 km/h
    description: 'Canale ampio e profondo (fino a -12m) riservato a battelli ACTV, vaporetti e navigazione interna.'
  },
  {
    id: 'SPEED_RIO_NOVO',
    channelName: 'Rio Novo & Rio de Ca Foscari',
    maxSpeedKmh: 5,
    isBarcavelox: true,
    zoneType: 'CANALE_INTERNO',
    path: [
      [12.3195, 45.4375], // Piazzale Roma
      [12.3225, 45.4360], // Santa Margherita
      [12.3260, 45.4345], // San Pantalon
      [12.3280, 45.4340]  // Ca' Foscari
    ],
    ordinanza: 'Ordinanza n. 274/2015 - Limite rigido 5 km/h per protezione fondazioni storiche',
    color: '#ef4444', // Rosso 5 km/h
    description: 'Tratto interno critico soggetto a forte erosione. Vietato creare scia o moto ondoso apprezzabile.'
  },
  {
    id: 'SPEED_CANALE_PETROLI',
    channelName: 'Canale dei Petroli (Malamocco - Marghera)',
    maxSpeedKmh: 20,
    isBarcavelox: false,
    zoneType: 'LAGUNA_APERTA',
    path: [
      [12.3350, 45.3340], // Bocca di Malamocco
      [12.2980, 45.3520], // Alberoni
      [12.2700, 45.3800], // San Leonardo
      [12.2560, 45.4180], // Fusina
      [12.2450, 45.4420]  // Banchine Marghera
    ],
    ordinanza: 'Regolamento Capitaneria di Porto di Venezia - Canale Marittimo Industriale',
    color: '#10b981', // Verde 20 km/h
    description: 'Canale navigabile ad alto fondale (-14.5m) per navi mercantili, chimichiere, container e rimorchiatori.'
  }
];

export const OPEN_BRIDGE_CLEARANCES: BridgeClearanceItem[] = [
  {
    id: 'BRIDGE_RIALTO',
    bridgeName: 'Ponte di Rialto',
    rioName: 'Canal Grande',
    lat: 45.4380,
    lon: 12.3359,
    clearanceCmZeroMarea: 750,
    stepsCount: 0, // Rampe a gradoni molto ampie
    isAccessibleRamp: false,
    minNavigableTideCm: 250,
    historicalNotes: 'Capolavoro marmoreo di Antonio Da Ponte (1591). Ampio arco a tutto sesto transitabile con qualsiasi marea ordinaria.'
  },
  {
    id: 'BRIDGE_ACCADEMIA',
    bridgeName: "Ponte dell'Accademia",
    rioName: 'Canal Grande',
    lat: 45.4312,
    lon: 12.3292,
    clearanceCmZeroMarea: 720,
    stepsCount: 85,
    isAccessibleRamp: false,
    minNavigableTideCm: 230,
    historicalNotes: 'Struttura in legno e metallo progettata da Eugenio Miozzi (1933). Permette il passaggio continuo dei vaporetti Linea 1 e 2.'
  },
  {
    id: 'BRIDGE_SCALZI',
    bridgeName: 'Ponte degli Scalzi',
    rioName: 'Canal Grande',
    lat: 45.4414,
    lon: 12.3225,
    clearanceCmZeroMarea: 700,
    stepsCount: 92,
    isAccessibleRamp: false,
    minNavigableTideCm: 220,
    historicalNotes: 'Ponte ad arco unico in pietra d\'Istria (Eugenio Miozzi, 1934), di fronte alla Stazione Ferroviaria di Santa Lucia.'
  },
  {
    id: 'BRIDGE_GUGLIE',
    bridgeName: 'Ponte delle Guglie',
    rioName: 'Canale di Cannaregio',
    lat: 45.4433,
    lon: 12.3242,
    clearanceCmZeroMarea: 340,
    stepsCount: 36,
    isAccessibleRamp: false,
    minNavigableTideCm: 110,
    historicalNotes: 'Unico ponte veneziano ornato da quattro guglie angolari in pietra d\'Istria (1580). Franco critico con alte maree superiori a +110 cm.'
  },
  {
    id: 'BRIDGE_TRE_ARCHI',
    bridgeName: 'Ponte dei Tre Archi',
    rioName: 'Canale di Cannaregio',
    lat: 45.4452,
    lon: 12.3188,
    clearanceCmZeroMarea: 320,
    stepsCount: 42,
    isAccessibleRamp: false,
    minNavigableTideCm: 105,
    historicalNotes: 'Progettato da Andrea Tirali (1688), è l\'unico ponte a tre arcate superstite nel centro storico di Venezia.'
  },
  {
    id: 'BRIDGE_PUGNI',
    bridgeName: 'Ponte dei Pugni',
    rioName: 'Rio de San Barnaba',
    lat: 45.4332,
    lon: 12.3247,
    clearanceCmZeroMarea: 240,
    stepsCount: 22,
    isAccessibleRamp: false,
    minNavigableTideCm: 85,
    historicalNotes: 'Celebre per le quattro impronte di piedi in marmo dove si sfidavano a pugni le fazioni rivali dei Castellani e dei Nicolotti.'
  },
  {
    id: 'BRIDGE_CHIODO',
    bridgeName: 'Ponte Chiodo',
    rioName: 'Rio de San Felice',
    lat: 45.4428,
    lon: 12.3331,
    clearanceCmZeroMarea: 220,
    stepsCount: 14,
    isAccessibleRamp: false,
    minNavigableTideCm: 80,
    historicalNotes: 'L\'unico ponte storico rimasto a Venezia completamente privo di spallette o parapetti laterali, fedele all\'uso medievale.'
  },
  {
    id: 'BRIDGE_SOSPIRI',
    bridgeName: 'Ponte dei Sospiri',
    rioName: 'Rio di Palazzo',
    lat: 45.4341,
    lon: 12.3409,
    clearanceCmZeroMarea: 380,
    stepsCount: 0,
    isAccessibleRamp: false,
    minNavigableTideCm: 130,
    historicalNotes: 'Ponte pensile barocco coperto (1602) che collegava le sale di giustizia di Palazzo Ducale alle Prigioni Nuove.'
  }
];

export const OPEN_GONDOLA_STATIONS: GondolaStationItem[] = [
  {
    id: 'TRAGHETTO_SANTA_SOFIA',
    name: 'Traghetto da Parada: Santa Sofia ⇄ Pescaria',
    type: 'TRAGHETTO_DA_PARADA',
    crossingPath: [
      [12.3338, 45.4402], // Campo Santa Sofia (Cannaregio)
      [12.3346, 45.4398]  // Mercato del Pesce di Rialto (San Polo)
    ],
    lat: 45.4402,
    lon: 12.3338,
    activeGondolas: 2,
    priceEur: 2.00,
    openingHours: '07:30 - 18:30 (Tutti i giorni)',
    managedBy: 'Associazione Gondolieri di Venezia / Comune di Venezia'
  },
  {
    id: 'TRAGHETTO_SAN_TOMA',
    name: 'Traghetto da Parada: San Tomà ⇄ Sant\'Angelo',
    type: 'TRAGHETTO_DA_PARADA',
    crossingPath: [
      [12.3292, 45.4352], // San Tomà (San Polo)
      [12.3308, 45.4348]  // Sant'Angelo (San Marco)
    ],
    lat: 45.4352,
    lon: 12.3292,
    activeGondolas: 2,
    priceEur: 2.00,
    openingHours: '07:30 - 18:30',
    managedBy: 'Associazione Gondolieri di Venezia'
  },
  {
    id: 'TRAGHETTO_SANTA_MARIA_GIGLIO',
    name: 'Traghetto da Parada: Santa Maria del Giglio ⇄ Salute',
    type: 'TRAGHETTO_DA_PARADA',
    crossingPath: [
      [12.3328, 45.4316], // Giglio (San Marco)
      [12.3338, 45.4308]  // Dogana / Salute (Dorsoduro)
    ],
    lat: 45.4316,
    lon: 12.3328,
    activeGondolas: 1,
    priceEur: 2.00,
    openingHours: '09:00 - 17:00',
    managedBy: 'Associazione Gondolieri di Venezia'
  },
  {
    id: 'STAZIO_BACINO_ORSEOLO',
    name: 'Stazio Gondole Bacino Orseolo',
    type: 'STAZIO_GONDOLA',
    lat: 45.4348,
    lon: 12.3375,
    activeGondolas: 35,
    priceEur: 90.00, // Tariffa nolo standard 30 min diurna
    openingHours: '08:00 - 22:00',
    managedBy: 'Bancarotta Orseolo'
  },
  {
    id: 'STAZIO_MOLO_SAN_MARCO',
    name: 'Stazio Gondole San Marco Molo',
    type: 'STAZIO_GONDOLA',
    lat: 45.4334,
    lon: 12.3396,
    activeGondolas: 28,
    priceEur: 90.00,
    openingHours: '08:00 - 23:00',
    managedBy: 'Bancarotta Molo Palazzo Ducale'
  },
  {
    id: 'STAZIO_DANIELI',
    name: 'Stazio Gondole Riva degli Schiavoni (Danieli)',
    type: 'STAZIO_GONDOLA',
    lat: 45.4340,
    lon: 12.3422,
    activeGondolas: 18,
    priceEur: 90.00,
    openingHours: '08:00 - 22:00',
    managedBy: 'Bancarotta Danieli'
  }
];

export const OPEN_PUBLIC_DOCKS: PublicDockItem[] = [
  {
    id: 'DOCK_TRONCHETTO_MERCI',
    name: 'Banchina Logistica Merci Tronchetto',
    lat: 45.4410,
    lon: 12.3080,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 60,
    managedBy: 'Comune di Venezia - Spazi Acquei'
  },
  {
    id: 'DOCK_SAN_MARCO_GIARDINETTI',
    name: 'Riva Carico/Scarico San Marco Giardinetti',
    lat: 45.4328,
    lon: 12.3382,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 30,
    managedBy: 'Comune di Venezia'
  },
  {
    id: 'DOCK_FONDAMENTE_NOVE',
    name: 'Pontile Pubblico Merci Fondamente Nove',
    lat: 45.4438,
    lon: 12.3395,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 45,
    managedBy: 'Veritas / Comune di Venezia'
  },
  {
    id: 'DOCK_TAXI_SAN_ZACCARIA',
    name: 'Pontile Taxi Acqueo Autorizzato San Zaccaria',
    lat: 45.4342,
    lon: 12.3435,
    dockType: 'TAXI_ACQUEO',
    maxStayMinutes: 15,
    managedBy: 'Consorzio Motoscafi Venezia'
  }
];

// ==========================================
// 2. IDROGRAFIA, SUBSIDENZA & MORFOLOGIA LAGUNARE
// ==========================================
export const OPEN_SUBSIDENCE_INSAR: SubsidenceInSARItem[] = [
  {
    id: 'INSAR_SAN_MARCO',
    location: 'Piazza San Marco - Basamento Campanile',
    lat: 45.4340,
    lon: 12.3388,
    velocityMmYear: -2.1,
    accelerationMmYear2: -0.05,
    coherence: 0.94,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_MODERATA',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_PUNTA_SALUTE',
    location: 'Punta della Salute - Dogana da Mar',
    lat: 45.4312,
    lon: 12.3380,
    velocityMmYear: -1.8,
    accelerationMmYear2: -0.02,
    coherence: 0.92,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_MODERATA',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_ARSENALE',
    location: 'Arsenale Nord - Bacini di Carenaggio',
    lat: 45.4375,
    lon: 12.3580,
    velocityMmYear: -1.2,
    accelerationMmYear2: -0.01,
    coherence: 0.89,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'STABILE',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_MURANO',
    location: 'Murano - Fondamenta dei Vetrai',
    lat: 45.4540,
    lon: 12.3515,
    velocityMmYear: -1.5,
    accelerationMmYear2: -0.03,
    coherence: 0.91,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_MODERATA',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_MOSE_LIDO',
    location: 'Bocca di Porto di Lido - Spalla Nord Barriere MOSE',
    lat: 45.4215,
    lon: 12.4245,
    velocityMmYear: -0.9,
    accelerationMmYear2: 0.01,
    coherence: 0.96,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'STABILE',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_MARGHERA',
    location: 'Porto Marghera - Banchina Azoto',
    lat: 45.4620,
    lon: 12.2480,
    velocityMmYear: -3.1,
    accelerationMmYear2: -0.08,
    coherence: 0.93,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_ACCELERATA',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_CHIOGGIA',
    location: 'Chioggia - Murazzi e Diga Foranea',
    lat: 45.2280,
    lon: 12.2980,
    velocityMmYear: -1.7,
    accelerationMmYear2: -0.03,
    coherence: 0.90,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_MODERATA',
    historicalPeriod: '2016 - 2026'
  }
];

export const OPEN_LAGOON_MORPHOLOGY: LagoonMorphologyItem[] = [
  {
    id: 'MORPH_BARENA_CAMPALTO',
    name: 'Barena di Campalto (Laguna Nord)',
    type: 'BARENA_NATURALE',
    center: [12.3020, 45.4680],
    coordinates: [
      [12.2950, 45.4650],
      [12.3080, 45.4670],
      [12.3090, 45.4720],
      [12.2990, 45.4710]
    ],
    areaHectares: 48.5,
    avgDepthMeters: -0.35,
    ramsarProtected: true,
    protectionDirective: 'Direttiva Habitat 92/43/CEE - ZPS IT3250046',
    floraFauna: 'Vegetazione alofila: Limonium serotinum, Salicornia veneta, Puccinellia palustris. Zona nidificazione Fraticello.'
  },
  {
    id: 'MORPH_BARENA_SAN_FELICE',
    name: 'Barena di San Felice e Canale Silone',
    type: 'BARENA_NATURALE',
    center: [12.4450, 45.4950],
    coordinates: [
      [12.4350, 45.4900],
      [12.4550, 45.4920],
      [12.4580, 45.5010],
      [12.4380, 45.4990]
    ],
    areaHectares: 74.0,
    avgDepthMeters: -0.40,
    ramsarProtected: true,
    protectionDirective: 'Rete Natura 2000 - Progetto LIFE VIMINE',
    floraFauna: 'Una delle formazioni barenicole più integre della Laguna Nord. Sito di sosta per Fenicotteri rosa e Cavalieri d\'Italia.'
  },
  {
    id: 'MORPH_COLMATA_D',
    name: 'Cassa di Colmata D (Laguna Sud)',
    type: 'CASSA_COLMATA',
    center: [12.2350, 45.3620],
    coordinates: [
      [12.2200, 45.3500],
      [12.2500, 45.3550],
      [12.2520, 45.3750],
      [12.2220, 45.3700]
    ],
    areaHectares: 125.0,
    avgDepthMeters: 0.50, // Emersa
    ramsarProtected: false,
    protectionDirective: 'Area di Bonifica e Riconversione Ecologica Lagunare',
    floraFauna: 'Realizzata negli anni \'60 con fanghi di dragaggio. In corso di rinaturalizzazione a bosco igrofilo.'
  },
  {
    id: 'MORPH_VALLE_MILLECAMPI',
    name: 'Valle Millecampi e Canale dei Cuori',
    type: 'VALLE_DA_PESCA',
    center: [12.2150, 45.2850],
    coordinates: [
      [12.1950, 45.2700],
      [12.2350, 45.2750],
      [12.2380, 45.2980],
      [12.2020, 45.2950]
    ],
    areaHectares: 260.0,
    avgDepthMeters: -1.10,
    ramsarProtected: true,
    protectionDirective: 'Zona Umida d\'Importanza Internazionale Convenzione di Ramsar',
    floraFauna: 'Piscicoltura estensiva tradizionale di Branzini, Orate e Cefali. Ricca presenza di Cigni reali e Aironi cinerini.'
  }
];

export const OPEN_METEO_MARINE_WIND: MeteoMarineWindItem[] = METEO_MARINE_WIND_STATIONS;

// ==========================================
// 3. FERROVIA & LOGISTICA URBANA
// ==========================================
export const OPEN_LIVE_TRAINS: TrainLiveItem[] = [
  {
    id: 'TRAIN_FR_9712',
    trainNumber: 'Frecciarossa FR 9712',
    trainType: 'FRECCIAROSSA',
    origin: 'Torino Porta Nuova (06:40)',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'In transito sul Ponte della Libertà (Km 265)',
    lat: 45.4460,
    lon: 12.2880,
    delayMinutes: 2,
    speedKmh: 105,
    platform: 'Binario 7 (Programmato)',
    status: 'IN_ORARIO',
    routeProgress: 0.65
  },
  {
    id: 'TRAIN_RV_3418',
    trainNumber: 'Regionale Veloce RV 3418',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Verona Porta Nuova (07:22)',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'In approccio scalo Santa Lucia',
    lat: 45.4425,
    lon: 12.3150,
    delayMinutes: 0,
    speedKmh: 42,
    platform: 'Binario 4',
    status: 'IN_ARRIVO',
    routeProgress: 0.95
  },
  {
    id: 'TRAIN_ITALO_9980',
    trainNumber: 'Italo AV 9980',
    trainType: 'ITALO',
    origin: 'Roma Termini / Napoli',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'In sosta alla stazione di Venezia Mestre',
    lat: 45.4825,
    lon: 12.2320,
    delayMinutes: 3,
    speedKmh: 0,
    platform: 'Binario 9',
    status: 'IN_RITARDO',
    routeProgress: 0.05
  },
  {
    id: 'TRAIN_EC_84',
    trainNumber: 'EuroCity EC 84',
    trainType: 'EUROCITY',
    origin: 'München Hbf (Monaco di Baviera)',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Tratto Porto Marghera -> Ponte Libertà',
    lat: 45.4590,
    lon: 12.2610,
    delayMinutes: 6,
    speedKmh: 85,
    platform: 'Binario 8',
    status: 'IN_RITARDO',
    routeProgress: 0.35
  }
];

export const OPEN_VERITAS_WASTE_BOATS: VeritasWasteBoatItem[] = [
  {
    id: 'VERITAS_BOAT_04',
    boatCode: 'ECO-VE 04',
    assignedZone: 'Cannaregio - Rio della Misericordia',
    dockName: 'Pontile Misericordia / Scuola Vecchia',
    lat: 45.4448,
    lon: 12.3335,
    collectionType: 'INDIFFERENZIATO',
    scheduleHours: '06:30 - 08:30',
    capacityKg: 2400,
    isOperatingNow: true
  },
  {
    id: 'VERITAS_BOAT_07',
    boatCode: 'ECO-VE 07',
    assignedZone: 'Dorsoduro - Rio de San Trovaso',
    dockName: 'Pontile Squero San Trovaso',
    lat: 45.4312,
    lon: 12.3248,
    collectionType: 'CARTA_CARTONE',
    scheduleHours: '06:45 - 08:45',
    capacityKg: 1800,
    isOperatingNow: true
  },
  {
    id: 'VERITAS_BOAT_11',
    boatCode: 'ECO-VE 11',
    assignedZone: 'Castello - Rio de San Francesco',
    dockName: 'Pontile San Francesco della Vigna',
    lat: 45.4385,
    lon: 12.3485,
    collectionType: 'PLASTICA_VETRO_LATTINE',
    scheduleHours: '06:30 - 08:30',
    capacityKg: 2100,
    isOperatingNow: true
  },
  {
    id: 'VERITAS_BOAT_15',
    boatCode: 'ECO-VE 15',
    assignedZone: 'San Polo - Mercato di Rialto Erbaria',
    dockName: 'Riva dell\'Erbaria Canal Grande',
    lat: 45.4388,
    lon: 12.3362,
    collectionType: 'INDIFFERENZIATO',
    scheduleHours: '06:00 - 08:00',
    capacityKg: 3200,
    isOperatingNow: false
  }
];

// ==========================================
// 4. PATRIMONIO STORICO & NIZIOLETI
// ==========================================
export const OPEN_NIZIOLETI_CIVICI: NizioletoCivicoItem[] = [
  {
    id: 'NIZIOLETO_PARADISO',
    sestiere: 'Castello',
    civicNumber: 5183,
    streetName: 'Calle del Paradiso',
    nizioletoText: 'CALLE DEL PARADISO · SESTIER DE CASTELLO',
    historicalNotes: 'Celebre passaggio medievale sovrastato da barbacani lignei a sporto e sormontato da un arco gotico trecentesco con la Vergine della Misericordia.',
    lat: 45.4362,
    lon: 12.3418
  },
  {
    id: 'NIZIOLETO_REMER',
    sestiere: 'Cannaregio',
    civicNumber: 5701,
    streetName: 'Campiello del Remer',
    nizioletoText: 'CAMPIELLO DEL REMER · CANNAREGIO',
    historicalNotes: 'Suggestivo campiello affacciato sul Canal Grande intitolato all\'antica officina del costruttore di remi e forcole per gondole, con scala scoperta gotica.',
    lat: 45.4388,
    lon: 12.3372
  },
  {
    id: 'NIZIOLETO_FORMOSA',
    sestiere: 'Castello',
    civicNumber: 6140,
    streetName: 'Campo Santa Maria Formosa',
    nizioletoText: 'CAMPO SANTA MARIA FORMOSA · CASTELLO',
    historicalNotes: 'Uno dei campi più vasti di Venezia, crocevia di 11 ponti e 3 rii. Alla base del campanile spicca la grottesca maschera lapidea secentesca contro il malocchio.',
    lat: 45.4372,
    lon: 12.3412
  },
  {
    id: 'NIZIOLETO_ORESI',
    sestiere: 'San Polo',
    civicNumber: 1,
    streetName: 'Ruga dei Oresi',
    nizioletoText: 'RUGA DEI ORESI · SAN POLO',
    historicalNotes: 'La strada ("ruga", dal francese rue) ai piedi del Ponte di Rialto riservata per decreto della Serenissima alle botteghe degli orafi e gioiellieri veneziani.',
    lat: 45.4382,
    lon: 12.3352
  },
  {
    id: 'NIZIOLETO_BARBIERI',
    sestiere: 'Dorsoduro',
    civicNumber: 3412,
    streetName: 'Campiello dei Barbieri',
    nizioletoText: 'CAMPIELLO DEI BARBIERI · DORSODURO',
    historicalNotes: 'Presso Campo Santa Margherita, sede storica della scuola d\'arte e bottega dei barbieri chirurghi abilitati ai salassi nella Repubblica Veneta.',
    lat: 45.4342,
    lon: 12.3235
  },
  {
    id: 'NIZIOLETO_ORMESINI',
    sestiere: 'Cannaregio',
    civicNumber: 2715,
    streetName: 'Fondamenta dei Ormesini',
    nizioletoText: 'FONDAMENTA DEI ORMESINI · CANNAREGIO',
    historicalNotes: 'Prende il nome dall\'"ormesino", pregiato tessuto di seta originario di Hormuz in Persia, tessuto e commercializzato in questa fondamenta nel \'500.',
    lat: 45.4455,
    lon: 12.3280
  }
];

export const OPEN_VENICE_WELLS: VeniceWellItem[] = [
  {
    id: 'WELL_SAN_POLO',
    name: 'Vera da Pozzo di Campo San Polo',
    century: 'XIV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo San Polo',
    lat: 45.4371,
    lon: 12.3305,
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.4
  },
  {
    id: 'WELL_SAN_BARTOLOMEO',
    name: 'Vera da Pozzo Campo San Bartolomeo',
    century: 'XV Secolo',
    material: 'ROSSO_DI_VERONA',
    style: 'RINASCIMENTALE',
    campo: 'Campo San Bartolomeo',
    lat: 45.4378,
    lon: 12.3365,
    conservationState: 'BUONO',
    cisternaDepthMeters: 4.8
  },
  {
    id: 'WELL_SANT_ELENA',
    name: 'Vera da Pozzo Chiostro di Sant\'Elena',
    century: 'XV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'VENETO_BIZANTINO',
    campo: 'Chiostro Convento Sant\'Elena',
    lat: 45.4285,
    lon: 12.3665,
    conservationState: 'RESTAURATO',
    cisternaDepthMeters: 4.2
  },
  {
    id: 'WELL_SANTA_MARINA',
    name: 'Vera da Pozzo Campo Santa Marina',
    century: 'XIV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo Santa Marina',
    lat: 45.4389,
    lon: 12.3402,
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 4.9
  }
];

export const OPEN_BELL_TOWERS: BellTowerItem[] = [
  {
    id: 'TOWER_SAN_MARCO',
    name: 'Campanile di San Marco ("El Paron de Casa")',
    heightMeters: 98.6,
    tiltAngleDeg: 0.1,
    isLeaning: false,
    yearBuilt: 1912, // Ricostruito "com'era e dov'era" dopo il crollo del 1902
    lat: 45.4340,
    lon: 12.3392,
    description: 'La torre più alta di Venezia. Dotato di 5 storiche campane: Marangona, Nona, Trottiera, Mezza Terza e Maleficio.'
  },
  {
    id: 'TOWER_SANTO_STEFANO',
    name: 'Campanile di Santo Stefano (Pendente)',
    heightMeters: 66.0,
    tiltAngleDeg: 2.0,
    isLeaning: true,
    yearBuilt: 1544,
    lat: 45.4328,
    lon: 12.3308,
    description: 'Forte inclinazione causata dal cedimento delle fondazioni nel letto limoso dell\'antico canale. Fu stabilizzato nel 1904.'
  },
  {
    id: 'TOWER_SAN_GIORGIO_GRECI',
    name: 'Campanile di San Giorgio dei Greci (Pendente)',
    heightMeters: 44.0,
    tiltAngleDeg: 1.8,
    isLeaning: true,
    yearBuilt: 1592,
    lat: 45.4358,
    lon: 12.3445,
    description: 'Caratteristico campanile pendente della chiesa greco-ortodossa veneziana, inclinatosi già durante la costruzione.'
  },
  {
    id: 'TOWER_BURANO',
    name: 'Campanile di San Martino a Burano (Pendente)',
    heightMeters: 53.0,
    tiltAngleDeg: 2.8,
    isLeaning: true,
    yearBuilt: 1580,
    lat: 45.4852,
    lon: 12.4175,
    description: 'Uno dei campanili più inclinati d\'Europa (scostamento della sommità di 1.83m). Visibile da tutta la Laguna Nord.'
  },
  {
    id: 'TOWER_FRARI',
    name: 'Campanile di Santa Maria Gloriosa dei Frari',
    heightMeters: 70.0,
    tiltAngleDeg: 0.3,
    isLeaning: false,
    yearBuilt: 1396,
    lat: 45.4368,
    lon: 12.3265,
    description: 'Il secondo campanile più alto di Venezia dopo San Marco, interamente in laterizio a vista con cuspide piramidale.'
  }
];

export const OPEN_LAGOON_FORTRESS_ISLANDS: LagoonFortressIslandItem[] = [
  {
    id: 'FORT_MARGHERA',
    name: 'Forte Marghera (Mestre / Gronda Lagunare)',
    era: 'NAPOLEONICA',
    status: 'MUSEO_APERTO',
    areaMq: 480000,
    lat: 45.4785,
    lon: 12.2580,
    description: 'Complesso fortificato di 48 ettari con ridotti, polveriere, darsena e canali. Oggi parco pubblico e polo di arte contemporanea.'
  },
  {
    id: 'FORT_SANT_ANDREA',
    name: 'Forte di Sant\'Andrea (Bocca di Porto di Lido)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'RESTAURO_IN_CORSO',
    areaMq: 95000,
    lat: 45.4310,
    lon: 12.3820,
    description: 'Capolavoro militare di Michele Sanmicheli (1545) con 40 bocche da fuoco in pietra d\'Istria a guardia dell\'ingresso dal mare.'
  },
  {
    id: 'ISLE_OTTAGONO_ALBERONI',
    name: 'Ottagono Alberoni (Canale di Malamocco)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'ZONA_MILITARE_DISMESSA',
    areaMq: 2800,
    lat: 45.3480,
    lon: 12.3120,
    description: 'Uno dei 5 forti a pianta ottagonale costruiti dopo la Guerra di Cipro (1571) a guardia delle bocche lagunari.'
  },
  {
    id: 'ISLE_POVEGLIA',
    name: 'Isola di Poveglia (Canale Malamocco)',
    era: 'SANITARIO_MEDIEVALE',
    status: 'ISOLA_ABBANDONATA',
    areaMq: 72000,
    lat: 45.3820,
    lon: 12.3310,
    description: 'Storico borgo lagunare medievale, divenuto stazione di quarantena e lazzaretto della Serenissima nel Settecento.'
  },
  {
    id: 'ISLE_LAZZARETTO_NUOVO',
    name: 'Isola del Lazzaretto Nuovo (Canale dei Marani)',
    era: 'SANITARIO_MEDIEVALE',
    status: 'MUSEO_APERTO',
    areaMq: 86000,
    lat: 45.4560,
    lon: 12.3860,
    description: 'Istituito dal Senato della Repubblica nel 1468 per la contumacia delle navi e merci sospette di peste. Ospita il grandioso Tezon Grande.'
  },
  {
    id: 'ISLE_LAZZARETTO_VECCHIO',
    name: 'Isola del Lazzaretto Vecchio (Bacino Lido)',
    era: 'SANITARIO_MEDIEVALE',
    status: 'RESTAURO_IN_CORSO',
    areaMq: 25000,
    lat: 45.4090,
    lon: 12.3610,
    description: 'Il primo lazzaretto al mondo (istituito nel 1423 dal Doge Tommaso Mocenigo). In corso di trasformazione a Museo della Città e della Laguna.'
  }
];

// ==========================================
// 5. SALUTE & EMERGENZE SANITARIE
// ==========================================
export const OPEN_EMERGENCY_WATER_DOCKS: EmergencyWaterDockItem[] = [
  {
    id: 'EMERGENCY_DOCK_OSPEDALE',
    name: 'Pontile SUEM 118 - Ospedale Civile SS. Giovanni e Paolo',
    hospital: 'Presidio Ospedaliero di Venezia - ULSS 3 Serenissima',
    dockCode: 'SUEM-VE-01',
    lat: 45.4418,
    lon: 12.3425,
    is24hOperative: true,
    phone: '118 / 041-5294111',
    hasDirectHospitalRamp: true
  },
  {
    id: 'EMERGENCY_DOCK_SAN_MARCO',
    name: 'Pontile Idroambulanze SUEM San Marco Giardinetti',
    hospital: 'Punto di Primo Intervento San Marco',
    dockCode: 'SUEM-VE-02',
    lat: 45.4325,
    lon: 12.3375,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: false
  },
  {
    id: 'EMERGENCY_DOCK_TRONCHETTO',
    name: 'Pontile Idroambulanze SUEM Tronchetto Interscambio',
    hospital: 'Centrale Operativa 118 Mestre/Venezia',
    dockCode: 'SUEM-VE-03',
    lat: 45.4428,
    lon: 12.3060,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: false
  },
  {
    id: 'EMERGENCY_DOCK_LIDO',
    name: 'Pontile Pronto Soccorso Lido di Venezia',
    hospital: 'Presidio San Camillo - Lido',
    dockCode: 'SUEM-VE-04',
    lat: 45.4180,
    lon: 12.3780,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: true
  }
];

export const OPEN_PUBLIC_DAE: PublicDaeItem[] = [
  {
    id: 'DAE_SAN_MARCO',
    code: 'DAE-VE-01',
    location: 'Piazza San Marco - Loggia Palazzo Ducale',
    lat: 45.4342,
    lon: 12.3398,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima / Cuore di Venezia',
    lastInspected: '2026-09-15'
  },
  {
    id: 'DAE_SANTA_LUCIA',
    code: 'DAE-VE-02',
    location: 'Stazione Ferroviaria Santa Lucia - Atrio Biglietteria',
    lat: 45.4418,
    lon: 12.3218,
    accessType: 'PUBBLICO_H24',
    operator: 'RFI / Croce Rossa Italiana',
    lastInspected: '2026-09-20'
  },
  {
    id: 'DAE_PIAZZALE_ROMA',
    code: 'DAE-VE-03',
    location: 'Piazzale Roma - InfoPoint AVM / Calatrava',
    lat: 45.4385,
    lon: 12.3182,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA',
    lastInspected: '2026-09-22'
  },
  {
    id: 'DAE_SANTA_MARGHERITA',
    code: 'DAE-VE-04',
    location: 'Campo Santa Margherita - Edicola Centrale',
    lat: 45.4345,
    lon: 12.3238,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-08-30'
  },
  {
    id: 'DAE_RIALTO',
    code: 'DAE-VE-05',
    location: 'Campo San Bartolomeo - Piede Ponte di Rialto',
    lat: 45.4378,
    lon: 12.3368,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-10'
  }
];

export const OPEN_PHARMACY_DUTY: PharmacyDutyItem[] = [
  {
    id: 'PHARM_MORELLI_RIALTO',
    name: 'Farmacia Morelli (Ponte di Rialto)',
    address: 'San Polo 5364 (Piede Ponte di Rialto)',
    lat: 45.4382,
    lon: 12.3355,
    isOnDutyNow: true,
    isNightShift: true,
    phone: '041-5224196'
  },
  {
    id: 'PHARM_SAN_MARCO',
    name: 'Farmacia San Marco',
    address: 'Piazza San Marco 88 (Sotto i Portici)',
    lat: 45.4344,
    lon: 12.3382,
    isOnDutyNow: true,
    isNightShift: false,
    phone: '041-5223297'
  },
  {
    id: 'PHARM_SANTA_LUCIA',
    name: 'Farmacia della Stazione Santa Lucia',
    address: 'Fondamenta Santa Lucia 1',
    lat: 45.4412,
    lon: 12.3210,
    isOnDutyNow: true,
    isNightShift: false,
    phone: '041-716442'
  },
  {
    id: 'PHARM_DUE_SAN_MARCHI',
    name: 'Farmacia Ai Due San Marchi',
    address: 'Strada Nova, Cannaregio 2133',
    lat: 45.4422,
    lon: 12.3298,
    isOnDutyNow: false,
    isNightShift: false,
    phone: '041-715783'
  }
];

// ==========================================
// 6. MICROCLIMA & ISOLE DI CALORE
// ==========================================
export const OPEN_HEAT_ISLAND_LST: HeatIslandSurfaceTempItem[] = [
  {
    id: 'LST_SAN_MARCO',
    zoneName: 'Piazza San Marco (Masegni & Pietra d\'Istria)',
    lat: 45.4341,
    lon: 12.3386,
    surfaceTempCelsius: 36.4,
    airTempDelta: +5.2,
    surfaceType: 'PIETRA_ISTRIA',
    coolingEffect: 'ISOLA_DI_CALORE',
    satelliteMission: 'Copernicus Land LST / Landsat-9 Thermal TIRS'
  },
  {
    id: 'LST_RIALTO_TETTI',
    zoneName: 'Rialto Centro - Tetti in Cotto e Botteghe',
    lat: 45.4382,
    lon: 12.3358,
    surfaceTempCelsius: 37.8,
    airTempDelta: +6.6,
    surfaceType: 'TETTO_TEGOLE',
    coolingEffect: 'ISOLA_DI_CALORE',
    satelliteMission: 'Copernicus Land LST / Sentinel-3 SLSTR'
  },
  {
    id: 'LST_MARGHERA_INDUSTRIA',
    zoneName: 'Porto Marghera - Asfalti e Banchine Industriali',
    lat: 45.4640,
    lon: 12.2450,
    surfaceTempCelsius: 39.2,
    airTempDelta: +8.0,
    surfaceType: 'ASFALTO_PORTUALE',
    coolingEffect: 'ISOLA_DI_CALORE',
    satelliteMission: 'Landsat-9 Thermal Infrared Sensor'
  },
  {
    id: 'LST_BIENNALE_GIARDINI',
    zoneName: 'Giardini della Biennale (Pineta e Parco Storico)',
    lat: 45.4295,
    lon: 12.3580,
    surfaceTempCelsius: 24.8,
    airTempDelta: -6.4,
    surfaceType: 'VERDE_URBANO',
    coolingEffect: 'ALTO',
    satelliteMission: 'Copernicus Sentinel-3 SLSTR'
  },
  {
    id: 'LST_CANAL_GRANDE',
    zoneName: 'Canal Grande - Corridoio Idrico Termoregolatore',
    lat: 45.4360,
    lon: 12.3330,
    surfaceTempCelsius: 23.2,
    airTempDelta: -8.0,
    surfaceType: 'ACQUA_CANALE',
    coolingEffect: 'ALTO',
    satelliteMission: 'Copernicus Sentinel-3 Surface Temperature'
  },
  {
    id: 'LST_SAN_GIULIANO',
    zoneName: 'Parco San Giuliano (Prato Costiero Mestre)',
    lat: 45.4710,
    lon: 12.2740,
    surfaceTempCelsius: 25.5,
    airTempDelta: -5.7,
    surfaceType: 'VERDE_URBANO',
    coolingEffect: 'ALTO',
    satelliteMission: 'Copernicus Land Surface Temp'
  }
];
