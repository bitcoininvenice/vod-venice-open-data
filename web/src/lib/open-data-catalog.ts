import { BridgeClearanceItem, GondolaStationItem, PublicDockItem, SubsidenceInSARItem, LagoonMorphologyItem, TrainLiveItem, VeritasWasteBoatItem, NizioletoCivicoItem, VeniceWellItem, BellTowerItem, LagoonFortressIslandItem, EmergencyWaterDockItem, PublicDaeItem, PharmacyItem, HeatIslandSurfaceTempItem } from './types';

// ==========================================
// 1. VIABILITÀ ACQUEA & CANALI
// ==========================================
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
  },
  {
    id: 'BRIDGE_COSTITUZIONE',
    bridgeName: 'Ponte della Costituzione (Calatrava)',
    rioName: 'Canal Grande',
    lat: 45.4389,
    lon: 12.3188,
    clearanceCmZeroMarea: 710,
    stepsCount: 78,
    isAccessibleRamp: false,
    minNavigableTideCm: 220,
    historicalNotes: 'Progettato da Santiago Calatrava (2008), struttura in acciaio e vetro a campata unica tra Piazzale Roma e Stazione S.Lucia.'
  },
  {
    id: 'BRIDGE_PAGLIA',
    bridgeName: 'Ponte della Paglia',
    rioName: 'Rio di Palazzo / Bacino San Marco',
    lat: 45.4338,
    lon: 12.3405,
    clearanceCmZeroMarea: 360,
    stepsCount: 0,
    isAccessibleRamp: true,
    minNavigableTideCm: 120,
    historicalNotes: 'Dotato di rampe agevolate (pendenza 6%) per consentire il transito continuo Marciana-Castello anche a passeggini e carrozzine.'
  },
  {
    id: 'BRIDGE_PANADA',
    bridgeName: 'Ponte de la Panada',
    rioName: 'Rio dei Mendicanti',
    lat: 45.4415,
    lon: 12.3412,
    clearanceCmZeroMarea: 230,
    stepsCount: 18,
    isAccessibleRamp: false,
    minNavigableTideCm: 80,
    historicalNotes: 'Ponte critico nel tratto interno di Castello. Con marea superiore a +85 cm le imbarcazioni commerciali non riescono a transitare.'
  },
  {
    id: 'BRIDGE_CRISTO',
    bridgeName: 'Ponte del Cristo',
    rioName: 'Rio de San Marcuola',
    lat: 45.4435,
    lon: 12.3278,
    clearanceCmZeroMarea: 220,
    stepsCount: 16,
    isAccessibleRamp: false,
    minNavigableTideCm: 75,
    historicalNotes: 'Arco ribassato in pietra d\'Istria; punto di strozzatura per le consegne merci a Cannaregio durante le maree sostenute.'
  },
  {
    id: 'BRIDGE_SAN_POLO',
    bridgeName: 'Ponte San Polo',
    rioName: 'Rio de San Polo',
    lat: 45.4365,
    lon: 12.3315,
    clearanceCmZeroMarea: 290,
    stepsCount: 26,
    isAccessibleRamp: false,
    minNavigableTideCm: 100,
    historicalNotes: 'Collega Campo San Polo a Campo Sant\'Aponal; permette il passaggio dei motoscafi taxi con marea ordinaria.'
  },
  {
    id: 'BRIDGE_FUSERI',
    bridgeName: 'Ponte dei Fuseri',
    rioName: 'Rio dei Fuseri',
    lat: 45.4348,
    lon: 12.3340,
    clearanceCmZeroMarea: 210,
    stepsCount: 14,
    isAccessibleRamp: false,
    minNavigableTideCm: 70,
    historicalNotes: 'Tra i ponti più bassi di San Marco. In caso di marea medio-alta (+80 cm) il transito delle imbarcazioni da lavoro è totalmente bloccato.'
  },
  {
    id: 'BRIDGE_MARAVEGIE',
    bridgeName: 'Ponte de le Maravegie',
    rioName: 'Rio de San Trovaso',
    lat: 45.4318,
    lon: 12.3262,
    clearanceCmZeroMarea: 265,
    stepsCount: 24,
    isAccessibleRamp: false,
    minNavigableTideCm: 90,
    historicalNotes: 'Ponte storico che scavalca il Rio de San Trovaso collegando l\'Accademia con San Barnaba.'
  },
  {
    id: 'BRIDGE_ARSENALE',
    bridgeName: 'Ponte de l\'Arsenale (Magna)',
    rioName: 'Rio de l\'Arsenale',
    lat: 45.4348,
    lon: 12.3498,
    clearanceCmZeroMarea: 390,
    stepsCount: 32,
    isAccessibleRamp: false,
    minNavigableTideCm: 135,
    historicalNotes: 'Ponte ad arco ligneo monumentale di fronte alla Porta di Terra e ai Leoni dell\'Arsenale di Venezia.'
  },
  {
    id: 'BRIDGE_DAI',
    bridgeName: 'Ponte dei Dai',
    rioName: 'Rio delle Procuratie',
    lat: 45.4345,
    lon: 12.3370,
    clearanceCmZeroMarea: 195,
    stepsCount: 12,
    isAccessibleRamp: false,
    minNavigableTideCm: 65,
    historicalNotes: 'Il ponte con il franco di tiro più ridotto nei pressi di Piazza San Marco. Praticabile dai barchini solo a bassa o media marea.'
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
  },
  {
    id: 'TRAGHETTO_CARBON',
    name: 'Traghetto da Parada: Riva del Carbon ⇄ Riva del Vin',
    type: 'TRAGHETTO_DA_PARADA',
    crossingPath: [
      [12.3360, 45.4368], // Carbon (San Marco)
      [12.3350, 45.4372]  // Vin (San Polo)
    ],
    lat: 45.4368,
    lon: 12.3360,
    activeGondolas: 1,
    priceEur: 2.00,
    openingHours: '09:00 - 13:00',
    managedBy: 'Associazione Gondolieri'
  },
  {
    id: 'TRAGHETTO_SAN_MARCUOLA',
    name: 'Traghetto da Parada: San Marcuola ⇄ Fontego dei Turchi',
    type: 'TRAGHETTO_DA_PARADA',
    crossingPath: [
      [12.3285, 45.4425], // San Marcuola (Cannaregio)
      [12.3280, 45.4418]  // Fontego (Santa Croce)
    ],
    lat: 45.4425,
    lon: 12.3285,
    activeGondolas: 1,
    priceEur: 2.00,
    openingHours: '09:00 - 13:00 (feriali)',
    managedBy: 'Associazione Gondolieri'
  },
  {
    id: 'STAZIO_GIGLIO_HOTEL',
    name: 'Stazio Gondole Santa Maria del Giglio',
    type: 'STAZIO_GONDOLA',
    lat: 45.4320,
    lon: 12.3325,
    activeGondolas: 14,
    priceEur: 90.00,
    openingHours: '08:30 - 21:00',
    managedBy: 'Bancarotta Giglio'
  },
  {
    id: 'STAZIO_BAUER_TRINITA',
    name: 'Stazio Gondole Bauer / Trinità (Rio San Moisè)',
    type: 'STAZIO_GONDOLA',
    lat: 45.4328,
    lon: 12.3360,
    activeGondolas: 12,
    priceEur: 90.00,
    openingHours: '09:00 - 22:00',
    managedBy: 'Bancarotta San Moisè'
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
  },
  {
    id: 'DOCK_RIVA_CARBON',
    name: 'Riva del Carbon (Scarico Rialto Mercato)',
    lat: 45.4370,
    lon: 12.3362,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 45,
    managedBy: 'Comune di Venezia'
  },
  {
    id: 'DOCK_RIVA_VIN',
    name: 'Riva del Vin (Rifornimento Ristorazione)',
    lat: 45.4375,
    lon: 12.3350,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 30,
    managedBy: 'Comune di Venezia'
  },
  {
    id: 'DOCK_CANNAREGIO_MERCI',
    name: 'Banchina Merci Canale di Cannaregio',
    lat: 45.4445,
    lon: 12.3210,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 60,
    managedBy: 'Comune di Venezia'
  },
  {
    id: 'DOCK_SANTA_CHIARA',
    name: 'Banchina Taxi Piazzale Roma Santa Chiara',
    lat: 45.4385,
    lon: 12.3175,
    dockType: 'TAXI_ACQUEO',
    maxStayMinutes: 20,
    managedBy: 'Consorzio Taxi Venezia'
  },
  {
    id: 'DOCK_SANTA_LUCIA_FS',
    name: 'Scalo Banchina Ferrovia Santa Lucia',
    lat: 45.4418,
    lon: 12.3225,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 45,
    managedBy: 'RFI / Poste Italiane'
  },
  {
    id: 'DOCK_ZATTERE_GESUATI',
    name: 'Banchina Servizi Zattere ai Gesuati',
    lat: 45.4292,
    lon: 12.3285,
    dockType: 'ORMEGGIO_PUBBLICO',
    maxStayMinutes: 120,
    managedBy: 'Comune di Venezia'
  },
  {
    id: 'DOCK_SCHIAVONI_TAXI',
    name: 'Pontile Taxi Riva degli Schiavoni / Pietà',
    lat: 45.4342,
    lon: 12.3460,
    dockType: 'TAXI_ACQUEO',
    maxStayMinutes: 15,
    managedBy: 'Consorzio Taxi Venezia'
  },
  {
    id: 'DOCK_MURANO_COLONNA_MERCI',
    name: 'Banchina Merci Murano Colonna',
    lat: 45.4525,
    lon: 12.3520,
    dockType: 'MERCI_CARICO_SCARICO',
    maxStayMinutes: 60,
    managedBy: 'Consorzio Vetrai Murano'
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
  },
  {
    id: 'INSAR_RIALTO',
    location: 'Ponte di Rialto - Sponda San Polo',
    lat: 45.4380,
    lon: 12.3355,
    velocityMmYear: -1.1,
    accelerationMmYear2: -0.01,
    coherence: 0.95,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'STABILE',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_PELLESTRINA',
    location: 'Pellestrina - Portosecco Murazzi',
    lat: 45.2950,
    lon: 12.3050,
    velocityMmYear: -1.4,
    accelerationMmYear2: -0.02,
    coherence: 0.91,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'SUBSIDENZA_MODERATA',
    historicalPeriod: '2016 - 2026'
  },
  {
    id: 'INSAR_MESTRE_CENTRO',
    location: 'Mestre Centro - Piazza Ferretto',
    lat: 45.4940,
    lon: 12.2410,
    velocityMmYear: -0.6,
    accelerationMmYear2: 0.00,
    coherence: 0.97,
    satellite: 'Sentinel-1 InSAR (Copernicus EGMS)',
    trend: 'STABILE',
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
  },
  {
    id: 'MORPH_PALUDO_MAGGIORE',
    name: 'Barena del Paludo Maggiore (Torcello)',
    type: 'BARENA_NATURALE',
    center: [12.4250, 45.5100],
    coordinates: [
      [12.4150, 45.5020],
      [12.4350, 45.5050],
      [12.4380, 45.5180],
      [12.4180, 45.5150]
    ],
    areaHectares: 62.0,
    avgDepthMeters: -0.30,
    ramsarProtected: true,
    protectionDirective: 'Sito di Interesse Comunitario SIC IT3250031',
    floraFauna: 'Estese praterie di Zostera noltii e fioriture di fior di loto di mare (Limonium).'
  },
  {
    id: 'MORPH_VELMA_FISOLO',
    name: 'Velma del Fisolo (Laguna Centrale)',
    type: 'VELMA',
    center: [12.3150, 45.3950],
    coordinates: [
      [12.3080, 45.3900],
      [12.3220, 45.3920],
      [12.3250, 45.4010],
      [12.3100, 45.3990]
    ],
    areaHectares: 18.5,
    avgDepthMeters: -0.70,
    ramsarProtected: true,
    protectionDirective: 'Direttiva Uccelli 2009/147/CE',
    floraFauna: 'Piattaforma tidale limosa scoperta durante le basse maree sizigiali; zona di pascolo per limicoli.'
  },
  {
    id: 'MORPH_CONCHE_VALLE_ZAPPA',
    name: 'Barena di Conche & Valle Zappa (Laguna Sud)',
    type: 'VALLE_DA_PESCA',
    center: [12.2450, 45.2400],
    coordinates: [
      [12.2300, 45.2300],
      [12.2600, 45.2350],
      [12.2620, 45.2500],
      [12.2320, 45.2480]
    ],
    areaHectares: 140.0,
    avgDepthMeters: -0.90,
    ramsarProtected: true,
    protectionDirective: 'Vincolo Paesaggistico D.Lgs 42/2004',
    floraFauna: 'Caratterizzata dallo storico Casone di caccia in stile nordico (1925) e garzaia di Aironi rossi.'
  },
  {
    id: 'MORPH_CANALE_PETROLI_TRINCEA',
    name: 'Canale dei Petroli (Trincea di Bordo)',
    type: 'CANALE_PROFONDO',
    center: [12.2850, 45.3700],
    coordinates: [
      [12.2800, 45.3650],
      [12.2900, 45.3670],
      [12.2920, 45.3780],
      [12.2820, 45.3760]
    ],
    areaHectares: 35.0,
    avgDepthMeters: -14.50,
    ramsarProtected: false,
    protectionDirective: 'Piano Morfologico della Laguna di Venezia',
    floraFauna: 'Canale scavato artificialmente nel 1969 per navi commerciali, oggetto di interventi anti-erosione.'
  }
];


// ==========================================
// 3. FERROVIA & LOGISTICA URBANA
// ==========================================
export const OPEN_LIVE_TRAINS: TrainLiveItem[] = [
  {
    id: "RFI_SANTA_LUCIA",
    trainNumber: "Stazione di Venezia Santa Lucia (RFI)",
    trainType: "FRECCIAROSSA",
    origin: "Polo Storico Insulare (30 mln passeggeri/anno)",
    destination: "Direttrici AV Milano, Roma, Salerno, Udine, Trieste",
    currentLocation: "Fondamenta Santa Lucia, Cannaregio",
    lat: 45.4412,
    lon: 12.3210,
    platform: "23 binari di testa elettrificati (3 kV CC)",
  },
  {
    id: "RFI_MESTRE",
    trainNumber: "Stazione di Venezia Mestre (RFI)",
    trainType: "ITALO",
    origin: "Nodo Centrale di Terraferma",
    destination: "Interscambio Linee Milano-Venezia, Bologna-Venezia, Udine/Trieste",
    currentLocation: "Piazzale Favretti, Mestre",
    lat: 45.4825,
    lon: 12.2320,
    platform: "13 binari passanti con banchine rialzate e ascensori PRM",
  },
  {
    id: "RFI_PONTE_LIBERTA_VIADOTTO",
    trainNumber: "Ponte della Libertà - Viadotto Ferroviario RFI",
    trainType: "REGIONALE_VELOCE",
    origin: "Km 262.0 (Bivio Marghera)",
    destination: "Km 266.5 (Scalo Santa Lucia)",
    currentLocation: "Viadotto lagunare storico a 4 binari (Km 262-267)",
    lat: 45.4470,
    lon: 12.2845,
    platform: "4 binari di corsa banalizzati (Quadruplicamento RFI)",
  },
  {
    id: "RFI_PORTO_MARGHERA_STAZIONE",
    trainNumber: "Stazione di Venezia Porto Marghera",
    trainType: "REGIONALE_VELOCE",
    origin: "Fermata Suburbana e Polo Universitario/Scientifico VEGA",
    destination: "Raccordo Urbano Linea Storica Milano-Venezia",
    currentLocation: "Via Torino / Parco VEGA",
    lat: 45.4640,
    lon: 12.2560,
    platform: "4 binari viaggiatori con sottopasso pedonale",
  },
  {
    id: "RFI_SCALO_MERCI_MARGHERA",
    trainNumber: "Scalo Merci Marghera Banchina Azoto",
    trainType: "MERCITALIA_CARGO",
    origin: "Fascio Banchine Portuali e Zona Industriale",
    destination: "Corridoio Merci Mediterraneo / Interporto Quadrante Europa",
    currentLocation: "Raccordo Ferroviario Portuale, Porto Marghera",
    lat: 45.4710,
    lon: 12.2380,
    platform: "Fascio binari smistamento merci pesanti e raccordi chimici",
  },
  {
    id: "RFI_SOTTOSTAZIONE_MARGHERA",
    trainNumber: "Sottostazione Elettrica RFI Marghera (SSE)",
    trainType: "EUROCITY",
    origin: "Rete Nazionale Alta Tensione 132 kV (Terna)",
    destination: "Alimentazione Trazione Elettrica Ferroviaria 3.000 V CC",
    currentLocation: "Area Impianti RFI Mestre Sud",
    lat: 45.4760,
    lon: 12.2420,
    platform: "Impianto primario di trasformazione e soccorso TE lagunare",
  },
  {
    id: "RFI_RACCORDO_TRONCHETTO",
    trainNumber: "Raccordo Scalo Tecnico Tronchetto",
    trainType: "INTERCITY",
    origin: "Scalo Manovra Tronchetto Ovest",
    destination: "Interscambio Idroviario Merci Lagunari",
    currentLocation: "Isola del Tronchetto, Raccordo Merci",
    lat: 45.4425,
    lon: 12.3080,
    platform: "Binari di consegna e manovra carri ferroviari",
  },
  {
    id: "RFI_DEPOSITO_SANTA_LUCIA",
    trainNumber: "Deposito Locomotive & Manutenzione Santa Lucia",
    trainType: "RAILJET",
    origin: "Impianto Manutenzione Corrente Trenitalia",
    destination: "Fascio Ricovero e Pulizia Convogli Passeggeri",
    currentLocation: "Scalo Ovest Santa Lucia, Cannaregio",
    lat: 45.4435,
    lon: 12.3140,
    platform: "8 binari tronchi per ricovero e manutenzione materiale rotabile",
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
    capacityKg: 2400
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
    capacityKg: 1800
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
    capacityKg: 2100
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
    capacityKg: 3200
  },
  {
    id: 'VERITAS_BOAT_02',
    boatCode: 'ECO-VE 02',
    assignedZone: 'Santa Croce - Rio Marin / San Simeon',
    dockName: 'Pontile Ponte de la Bergama',
    lat: 45.4405,
    lon: 12.3245,
    collectionType: 'CARTA_CARTONE',
    scheduleHours: '06:30 - 08:30',
    capacityKg: 2000
  },
  {
    id: 'VERITAS_BOAT_18',
    boatCode: 'ECO-VE 18',
    assignedZone: 'Giudecca - Canale Palanca',
    dockName: 'Pontile Palanca Centro',
    lat: 45.4260,
    lon: 12.3275,
    collectionType: 'INDIFFERENZIATO',
    scheduleHours: '06:45 - 08:45',
    capacityKg: 2600
  },
  {
    id: 'VERITAS_BOAT_09',
    boatCode: 'ECO-VE 09',
    assignedZone: 'San Marco - Rio de Sant\'Angelo',
    dockName: 'Pontile Sant\'Angelo / Canal Grande',
    lat: 45.4352,
    lon: 12.3325,
    collectionType: 'PLASTICA_VETRO_LATTINE',
    scheduleHours: '06:15 - 08:15',
    capacityKg: 2200
  },
  {
    id: 'VERITAS_BOAT_22',
    boatCode: 'ECO-VE 22',
    assignedZone: 'Murano - Canale dei Vetrai',
    dockName: 'Pontile Murano Faro',
    lat: 45.4545,
    lon: 12.3525,
    collectionType: 'INDIFFERENZIATO',
    scheduleHours: '07:00 - 09:00',
    capacityKg: 2800
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
  },
  {
    id: 'NIZIOLETO_VARISCO',
    sestiere: 'Cannaregio',
    civicNumber: 5410,
    streetName: 'Calle Varisco',
    nizioletoText: 'CALLE VARISCO (CALLE PIÙ STRETTA DI VENEZIA, 53 CM)',
    historicalNotes: 'La calle più angusta della città: una fessura di soli 53 centimetri che sfocia a sorpresa sul Rio dei Santi Apostoli.',
    lat: 45.4412,
    lon: 12.3392
  },
  {
    id: 'NIZIOLETO_MORI',
    sestiere: 'Cannaregio',
    civicNumber: 3399,
    streetName: 'Campo dei Mori',
    nizioletoText: 'CAMPO DEI MORI · PALAZZO MASTELLI',
    historicalNotes: 'Prende il nome dai mercanti levantini fratelli Mastelli giunti dalla Morea nel 1112; famoso per la statua di "Sior Antonio Rioba" con il naso in ferro.',
    lat: 45.4468,
    lon: 12.3325
  },
  {
    id: 'NIZIOLETO_SETTE_MARTIRI',
    sestiere: 'Castello',
    civicNumber: 1540,
    streetName: 'Riva dei Sette Martiri',
    nizioletoText: 'RIVA DEI SETTE MARTIRI · CASTELLO',
    historicalNotes: 'Dedicata alla memoria dei sette partigiani fucilati per rappresaglia dalla guardia nazifascista nell\'agosto del 1944.',
    lat: 45.4310,
    lon: 12.3540
  },
  {
    id: 'NIZIOLETO_CARAMPANE',
    sestiere: 'San Polo',
    civicNumber: 1582,
    streetName: 'Rio Terà de le Carampane',
    nizioletoText: 'RIO TERÀ DE LE CARAMPANE · SAN POLO',
    historicalNotes: 'Storico quartiere di cortigiane e prostitute autorizzate dal Senato nel \'400 presso le case patrizie di Ca\' Rampani.',
    lat: 45.4375,
    lon: 12.3318
  },
  {
    id: 'NIZIOLETO_ZATTERE',
    sestiere: 'Dorsoduro',
    civicNumber: 770,
    streetName: 'Fondamenta Zattere ai Gesuati',
    nizioletoText: 'FONDAMENTA DELLE ZATTERE · DORSODURO',
    historicalNotes: 'Ampia passeggiata sul Canale della Giudecca originata come banchina di scarico dei carichi di legname (zattere) provenienti dal Cadore.',
    lat: 45.4290,
    lon: 12.3275
  },
  {
    id: 'NIZIOLETO_PRETI',
    sestiere: 'Castello',
    civicNumber: 3584,
    streetName: 'Sottoportego dei Preti',
    nizioletoText: 'SOTTOPORTEGO DEI PRETI · IL CUORE DI PIETRA',
    historicalNotes: 'Celebre per il mattoncino in pietra d\'Istria a forma di cuore: la leggenda vuole che toccandolo si trovi l\'amore eterno entro l\'anno.',
    lat: 45.4358,
    lon: 12.3508
  },
  {
    id: 'NIZIOLETO_SPEZIERI',
    sestiere: 'San Polo',
    civicNumber: 280,
    streetName: 'Ruga dei Spezieri',
    nizioletoText: 'RUGA DEI SPEZIERI · RIALTO',
    historicalNotes: 'Cuore mercantile degli aromi e dei medicamenti d\'Oriente, dove la Serenissima tassava e certificava pepe, cannella, noce moscata e triaca.',
    lat: 45.4385,
    lon: 12.3345
  },
  {
    id: 'NIZIOLETO_ASSASSINI',
    sestiere: 'San Marco',
    civicNumber: 3690,
    streetName: 'Rio Terà dei Assassini',
    nizioletoText: 'RIO TERÀ DEI ASSASSINI · SAN MARCO',
    historicalNotes: 'Canale interrato nel \'700, noto per le aggressioni notturne a tradimento prima dell\'introduzione delle lampade a olio comunali (i "cesendeli").',
    lat: 45.4348,
    lon: 12.3335
  },
  {
    id: 'NIZIOLETO_FREZZERIA',
    sestiere: 'San Marco',
    civicNumber: 1245,
    streetName: 'Calle Frezzeria',
    nizioletoText: 'FREZZERIA · SAN MARCO',
    historicalNotes: 'Strada medievale dove operavano i maestri fabbricanti di frecce per le balestre dei rematori delle galere da guerra marciane.',
    lat: 45.4338,
    lon: 12.3365
  },
  {
    id: 'NIZIOLETO_MISERICORDIA',
    sestiere: 'Cannaregio',
    civicNumber: 3599,
    streetName: 'Fondamenta de la Misericordia',
    nizioletoText: 'FONDAMENTA DE LA MISERICORDIA · CANNAREGIO',
    historicalNotes: 'Lungo canale parallelo alla Laguna Nord dominato dalla grandiosa mole della Scuola Grande della Misericordia progettata da Jacopo Sansovino.',
    lat: 45.4448,
    lon: 12.3320
  },
  {
    id: 'NIZIOLETO_FORNO',
    sestiere: 'Santa Croce',
    civicNumber: 1102,
    streetName: 'Calle del Forno',
    nizioletoText: 'CALLE DEL FORNO · SANTA CROCE',
    historicalNotes: 'Indica la sede di uno dei forni comunitari regolamentati dal Magistrato alle Biave per assicurare il pane a prezzo calmierato alla popolazione.',
    lat: 45.4410,
    lon: 12.3270
  },
  {
    id: 'NIZIOLETO_TOLENTINI',
    sestiere: 'Santa Croce',
    civicNumber: 191,
    streetName: 'Campo dei Tolentini',
    nizioletoText: 'CAMPO DEI TOLENTINI · SANTA CROCE',
    historicalNotes: 'Sede della chiesa dei Teatini progettata da Vincenzo Scamozzi, oggi ingresso monumentale dello IUAV architettura di Carlo Scarpa.',
    lat: 45.4375,
    lon: 12.3218
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
    source: 'ELENCO_CURATO'
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
    source: 'ELENCO_CURATO'
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
    source: 'ELENCO_CURATO'
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
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SAN_ZAN_DEGOLA',
    name: 'Vera da Pozzo San Giovanni Decollato (Zan Degola)',
    century: 'XI Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'VENETO_BIZANTINO',
    campo: 'Campo San Zan Degola',
    lat: 45.4415,
    lon: 12.3280,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SAN_GIACOMO_DELL_ORIO',
    name: 'Vera da Pozzo Campo San Giacomo da l\'Orio',
    century: 'XIII Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'VENETO_BIZANTINO',
    campo: 'Campo San Giacomo da l\'Orio',
    lat: 45.4402,
    lon: 12.3268,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SANTA_MARGHERITA',
    name: 'Vera da Pozzo Campo Santa Margherita',
    century: 'XVI Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'RINASCIMENTALE',
    campo: 'Campo Santa Margherita',
    lat: 45.4342,
    lon: 12.3235,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SAN_BARNABA',
    name: 'Vera da Pozzo Campo San Barnaba',
    century: 'XV Secolo',
    material: 'ROSSO_DI_VERONA',
    style: 'GOTICO',
    campo: 'Campo San Barnaba',
    lat: 45.4332,
    lon: 12.3255,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SANTO_STEFANO',
    name: 'Vera da Pozzo Campo Santo Stefano',
    century: 'XIV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo Santo Stefano',
    lat: 45.4330,
    lon: 12.3315,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SANT_ANGELO',
    name: 'Vera da Pozzo Campo Sant\'Angelo',
    century: 'XV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'RINASCIMENTALE',
    campo: 'Campo Sant\'Angelo',
    lat: 45.4350,
    lon: 12.3330,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SANTA_MARIA_FORMOSA',
    name: 'Vera da Pozzo Campo Santa Maria Formosa',
    century: 'XV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo Santa Maria Formosa',
    lat: 45.4372,
    lon: 12.3412,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SS_GIOVANNI_E_PAOLO',
    name: 'Vera da Pozzo Campo SS. Giovanni e Paolo',
    century: 'XVI Secolo',
    material: 'MARMO_GRECO',
    style: 'RINASCIMENTALE',
    campo: 'Campo Santi Giovanni e Paolo (San Zanipolo)',
    lat: 45.4398,
    lon: 12.3420,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_GHETTO_NUOVO',
    name: 'Vera da Pozzo Campo di Ghetto Nuovo',
    century: 'XVI Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'RINASCIMENTALE',
    campo: 'Campo di Ghetto Nuovo',
    lat: 45.4452,
    lon: 12.3262,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_MADONNA_DELL_ORTO',
    name: 'Vera da Pozzo Campo Madonna dell\'Orto',
    century: 'XV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo Madonna dell\'Orto',
    lat: 45.4478,
    lon: 12.3328,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_CA_D_ORO',
    name: 'Vera da Pozzo di Bartolomeo Bon a Ca\' d\'Oro',
    century: '1427 (XV Secolo)',
    material: 'ROSSO_DI_VERONA',
    style: 'GOTICO',
    campo: 'Corte di Ca\' d\'Oro',
    lat: 45.4408,
    lon: 12.3338,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'WELL_SAN_TROVASO',
    name: 'Vera da Pozzo Campo San Trovaso',
    century: 'XIV Secolo',
    material: 'PIETRA_D_ISTRIA',
    style: 'GOTICO',
    campo: 'Campo San Trovaso (Squero)',
    lat: 45.4305,
    lon: 12.3248,
    source: 'ELENCO_CURATO'
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
  },
  {
    id: 'TOWER_TORCELLO',
    name: 'Campanile di Santa Maria Assunta a Torcello',
    heightMeters: 55.0,
    tiltAngleDeg: 0.2,
    isLeaning: false,
    yearBuilt: 1008,
    lat: 45.4982,
    lon: 12.4190,
    description: 'Antichissima torre d\'avvistamento dell\'alto medioevo veneziano; conserva la rampa interna originaria in pietra.'
  },
  {
    id: 'TOWER_SAN_PIETRO_CASTELLO',
    name: 'Campanile del Duomo di San Pietro di Castello (Pendente)',
    heightMeters: 54.0,
    tiltAngleDeg: 1.5,
    isLeaning: true,
    yearBuilt: 1488,
    lat: 45.4345,
    lon: 12.3605,
    description: 'Capolavoro rinascimentale di Mauro Codussi, rivestito in candida pietra d\'Istria, con sensibile inclinazione verso il canale.'
  },
  {
    id: 'TOWER_SAN_GIORGIO_MAGGIORE',
    name: 'Campanile di San Giorgio Maggiore',
    heightMeters: 75.0,
    tiltAngleDeg: 0.1,
    isLeaning: false,
    yearBuilt: 1791,
    lat: 45.4298,
    lon: 12.3435,
    description: 'Progettato da Benedetto Buratti dopo il crollo della torre quattrocentesca. Offre la vista a 360° più celebre sul Bacino San Marco.'
  },
  {
    id: 'TOWER_MADONNA_ORTO',
    name: 'Campanile della Madonna dell\'Orto',
    heightMeters: 56.0,
    tiltAngleDeg: 0.2,
    isLeaning: false,
    yearBuilt: 1503,
    lat: 45.4480,
    lon: 12.3325,
    description: 'Sormontato da una cupola a cipolla circolare con la statua del Redentore in pietra d\'Istria, domina la Laguna Nord.'
  },
  {
    id: 'TOWER_SAN_FRANCESCO_VIGNA',
    name: 'Campanile di San Francesco della Vigna',
    heightMeters: 69.0,
    tiltAngleDeg: 0.4,
    isLeaning: false,
    yearBuilt: 1581,
    lat: 45.4382,
    lon: 12.3490,
    description: 'Tra i campanili più maestosi di Castello, eretto su disegno di Bernardo Ongarin sul modello del campanile marciano.'
  }
];

export const OPEN_LAGOON_FORTRESS_ISLANDS: LagoonFortressIslandItem[] = [
  {
    id: 'FORT_MARGHERA',
    name: 'Forte Marghera (Mestre / Gronda Lagunare)',
    era: 'NAPOLEONICA',
    areaMq: 480000,
    lat: 45.4785,
    lon: 12.2580,
    description: 'Complesso fortificato di 48 ettari con ridotti, polveriere, darsena e canali. Oggi parco pubblico e polo di arte contemporanea.',
    status: 'MUSEO_APERTO'
  },
  {
    id: 'FORT_SANT_ANDREA',
    name: 'Forte di Sant\'Andrea (Bocca di Porto di Lido)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 95000,
    lat: 45.4310,
    lon: 12.3820,
    description: 'Capolavoro militare di Michele Sanmicheli (1545) con 40 bocche da fuoco in pietra d\'Istria a guardia dell\'ingresso dal mare.',
    status: 'RESTAURO_IN_CORSO'
  },
  {
    id: 'ISLE_OTTAGONO_ALBERONI',
    name: 'Ottagono Alberoni (Canale di Malamocco)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 2800,
    lat: 45.3480,
    lon: 12.3120,
    description: 'Uno dei 5 forti a pianta ottagonale costruiti dopo la Guerra di Cipro (1571) a guardia delle bocche lagunari.',
    status: 'ZONA_MILITARE_DISMESSA'
  },
  {
    id: 'ISLE_POVEGLIA',
    name: 'Isola di Poveglia (Canale Malamocco)',
    era: 'SANITARIO_MEDIEVALE',
    areaMq: 72000,
    lat: 45.3820,
    lon: 12.3310,
    description: 'Storico borgo lagunare medievale, divenuto stazione di quarantena e lazzaretto della Serenissima nel Settecento.',
    status: 'ISOLA_ABBANDONATA'
  },
  {
    id: 'ISLE_LAZZARETTO_NUOVO',
    name: 'Isola del Lazzaretto Nuovo (Canale dei Marani)',
    era: 'SANITARIO_MEDIEVALE',
    areaMq: 86000,
    lat: 45.4560,
    lon: 12.3860,
    description: 'Istituito dal Senato della Repubblica nel 1468 per la contumacia delle navi e merci sospette di peste. Ospita il grandioso Tezon Grande.',
    status: 'MUSEO_APERTO'
  },
  {
    id: 'ISLE_LAZZARETTO_VECCHIO',
    name: 'Isola del Lazzaretto Vecchio (Bacino Lido)',
    era: 'SANITARIO_MEDIEVALE',
    areaMq: 25000,
    lat: 45.4090,
    lon: 12.3610,
    description: 'Il primo lazzaretto al mondo (istituito nel 1423 dal Doge Tommaso Mocenigo). In corso di trasformazione a Museo della Città e della Laguna.',
    status: 'RESTAURO_IN_CORSO'
  },
  {
    id: 'FORT_SAN_FELICE_CHIOGGIA',
    name: 'Forte San Felice (Bocca di Porto di Chioggia)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 110000,
    lat: 45.2285,
    lon: 12.2960,
    description: 'Castello a pianta stellata del 1385 (Guerra di Chioggia) potenziato dal Sanmicheli con portale monumentale in pietra d\'Istria.',
    status: 'RESTAURO_IN_CORSO'
  },
  {
    id: 'ISLE_CERTOSA',
    name: 'Isola della Certosa (Parco della Certosa)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 240000,
    lat: 45.4335,
    lon: 12.3705,
    description: 'Antico monastero certosino del \'200, poi opificio militare napoleonico e oggi parco naturale con marina per voga e vela.',
    status: 'MUSEO_APERTO'
  },
  {
    id: 'ISLE_SAN_SERVOLO',
    name: 'Isola di San Servolo (Polo Museale e Universitario)',
    era: 'SANITARIO_MEDIEVALE',
    areaMq: 48000,
    lat: 45.4195,
    lon: 12.3555,
    description: 'Convento benedettino millenario, ospedale militare e psichiatrico storico; oggi sede universitaria Venice International University e museo del manicomio.',
    status: 'MUSEO_APERTO'
  },
  {
    id: 'ISLE_OTTAGONO_CA_ROMAN',
    name: 'Ottagono Ca\' Roman (Bocca di Chioggia)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 2500,
    lat: 45.2340,
    lon: 12.2880,
    description: 'Fortificazione ottagonale insulare a protezione del canale interno dei Murazzi di Pellestrina e dell\'imbocco meridionale.',
    status: 'ZONA_MILITARE_DISMESSA'
  },
  {
    id: 'FORT_BATTERIA_DANDOLO',
    name: 'Batteria Dandolo (Lido di Venezia)',
    era: 'ASBURGICA',
    areaMq: 34000,
    lat: 45.3850,
    lon: 12.3550,
    description: 'Postazione corazzata ottocentesca della piazzaforte marittima veneziana con casematte e terrapieni di difesa litoranea.',
    status: 'ZONA_MILITARE_DISMESSA'
  },
  {
    id: 'ISLE_SANT_ANGELO_POLVERE',
    name: 'Isola di Sant\'Angelo della Polvere (Canale di Contorta)',
    era: 'SERENISSIMA_REPUBBLICA',
    areaMq: 5200,
    lat: 45.3980,
    lon: 12.2850,
    description: 'Monastero trasformato dal Senato nel 1555 in polveriera di massima sicurezza isolata nella laguna centrale.',
    status: 'ISOLA_ABBANDONATA'
  }
];

/**
 * Approdi idroambulanze: elenco compilato a mano. Non esiste un dataset aperto SUEM 118/ULSS 3;
 * posizioni e dotazioni vanno verificate. L'interfaccia lo dichiara e ricorda di chiamare il 118.
 */
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
    hasDirectHospitalRamp: true,
    source: 'ELENCO_CURATO'
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
    hasDirectHospitalRamp: false,
    source: 'ELENCO_CURATO'
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
    hasDirectHospitalRamp: false,
    source: 'ELENCO_CURATO'
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
    hasDirectHospitalRamp: true,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EMERGENCY_DOCK_FONDAMENTE_NOVE',
    name: 'Pontile Emergenza Fondamente Nove (Laguna Nord)',
    hospital: 'Presidio Ospedaliero di Venezia / Laguna Nord',
    dockCode: 'SUEM-VE-05',
    lat: 45.4442,
    lon: 12.3415,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: false,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EMERGENCY_DOCK_GIUSTINIAN',
    name: 'Pontile Sanitario Dorsoduro (Ex Ospedale Giustinian)',
    hospital: 'Distretto Sanitario 1 Dorsoduro - ULSS 3',
    dockCode: 'SUEM-VE-06',
    lat: 45.4320,
    lon: 12.3195,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: true,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EMERGENCY_DOCK_BURANO',
    name: 'Pontile Punto Primo Intervento Burano',
    hospital: 'Punto di Primo Soccorso Isole Laguna Nord',
    dockCode: 'SUEM-VE-07',
    lat: 45.4862,
    lon: 12.4168,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: true,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EMERGENCY_DOCK_OSPEDALE_AL_MARE',
    name: 'Pontile Emergenza Idroambulanze Lido San Nicolò',
    hospital: 'Presidio Ospedale al Mare / Bocca di Porto',
    dockCode: 'SUEM-VE-08',
    lat: 45.4265,
    lon: 12.3855,
    is24hOperative: true,
    phone: '118',
    hasDirectHospitalRamp: false,
    source: 'ELENCO_CURATO'
  }
];

/**
 * Elenco DAE compilato a mano nel progetto, senza fonte aperta verificabile.
 * Non usarlo direttamente: lib/dae-data.ts lo unisce ai DAE OpenStreetMap e mostra
 * come "da verificare" solo le voci che non coincidono con un DAE OSM.
 */
export const CURATED_PUBLIC_DAE: PublicDaeItem[] = [
  {
    id: 'DAE_SAN_MARCO',
    code: 'DAE-VE-01',
    location: 'Piazza San Marco - Loggia Palazzo Ducale',
    lat: 45.4342,
    lon: 12.3398,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima / Cuore di Venezia',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_SANTA_LUCIA',
    code: 'DAE-VE-02',
    location: 'Stazione Ferroviaria Santa Lucia - Atrio Biglietteria',
    lat: 45.4418,
    lon: 12.3218,
    accessType: 'PUBBLICO_H24',
    operator: 'RFI / Croce Rossa Italiana',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_PIAZZALE_ROMA',
    code: 'DAE-VE-03',
    location: 'Piazzale Roma - InfoPoint AVM / Calatrava',
    lat: 45.4385,
    lon: 12.3182,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_SANTA_MARGHERITA',
    code: 'DAE-VE-04',
    location: 'Campo Santa Margherita - Edicola Centrale',
    lat: 45.4345,
    lon: 12.3238,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_RIALTO',
    code: 'DAE-VE-05',
    location: 'Campo San Bartolomeo - Piede Ponte di Rialto',
    lat: 45.4378,
    lon: 12.3368,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_ZATTERE',
    code: 'DAE-VE-06',
    location: 'Fondamenta Zattere ai Gesuati - Pontile ACTV',
    lat: 45.4292,
    lon: 12.3282,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_SAN_GIACOMO_DELL_ORIO',
    code: 'DAE-VE-07',
    location: 'Campo San Giacomo da l\'Orio - Portico Farmacia',
    lat: 45.4400,
    lon: 12.3272,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_SAN_BARNABA',
    code: 'DAE-VE-08',
    location: 'Campo San Barnaba - Ingresso Sottoportego',
    lat: 45.4330,
    lon: 12.3252,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_FONDAMENTE_NOVE',
    code: 'DAE-VE-09',
    location: 'Fondamente Nove - Pontile Terminal ACTV D',
    lat: 45.4440,
    lon: 12.3402,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA / ULSS 3',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_ARSENALE_MUSEO',
    code: 'DAE-VE-10',
    location: 'Campo San Biagio - Museo Storico Navale',
    lat: 45.4338,
    lon: 12.3495,
    accessType: 'PUBBLICO_H24',
    operator: 'Marina Militare / ULSS 3',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_MURANO_COLONNA',
    code: 'DAE-VE-11',
    location: 'Murano - Pontile Colonna / Fondamenta dei Vetrai',
    lat: 45.4526,
    lon: 12.3512,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_BURANO_GALUPPI',
    code: 'DAE-VE-12',
    location: 'Burano - Piazza Galuppi / Municipio',
    lat: 45.4850,
    lon: 12.4172,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_GIUDECCA_PALANCA',
    code: 'DAE-VE-13',
    location: 'Giudecca - Imbarcadero Palanca / Fondamenta',
    lat: 45.4262,
    lon: 12.3250,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_SANT_ELENA_STADIO',
    code: 'DAE-VE-14',
    location: 'Sant\'Elena - Viale IV Novembre / Stadio Penzo',
    lat: 45.4278,
    lon: 12.3630,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima / Venezia FC',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_TRONCHETTO_PEOPLE_MOVER',
    code: 'DAE-VE-15',
    location: 'Tronchetto - Stazione People Mover / Parcheggio',
    lat: 45.4418,
    lon: 12.3052,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'DAE_MESTRE_STAZIONE',
    code: 'DAE-VE-16',
    location: 'Mestre Stazione FS - Piazzale Favretti Atrio',
    lat: 45.4828,
    lon: 12.2320,
    accessType: 'PUBBLICO_H24',
    operator: 'RFI / Polfer / ULSS 3',
    source: 'ELENCO_CURATO'
  }
];

/**
 * Elenco farmacie compilato a mano nel progetto (recapiti non verificati).
 * Non usarlo direttamente: lib/pharmacies-data.ts lo unisce alle farmacie OpenStreetMap
 * e mostra come "da verificare" solo le voci che non coincidono con una farmacia OSM.
 */
export const CURATED_PHARMACIES: PharmacyItem[] = [
  {
    id: 'PHARM_MORELLI_RIALTO',
    name: 'Farmacia Morelli (Ponte di Rialto)',
    address: 'San Polo 5364 (Piede Ponte di Rialto)',
    lat: 45.4382,
    lon: 12.3355,
    phone: '041-5224196',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_SAN_MARCO',
    name: 'Farmacia San Marco',
    address: 'Piazza San Marco 88 (Sotto i Portici)',
    lat: 45.4344,
    lon: 12.3382,
    phone: '041-5223297',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_SANTA_LUCIA',
    name: 'Farmacia della Stazione Santa Lucia',
    address: 'Fondamenta Santa Lucia 1',
    lat: 45.4412,
    lon: 12.3210,
    phone: '041-716442',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_DUE_SAN_MARCHI',
    name: 'Farmacia Ai Due San Marchi',
    address: 'Strada Nova, Cannaregio 2133',
    lat: 45.4422,
    lon: 12.3298,
    phone: '041-715783',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_ZAMPIRONI_SALVATORE',
    name: 'Farmacia Zampironi (San Salvador)',
    address: 'Campo San Salvador 4813 (San Marco)',
    lat: 45.4368,
    lon: 12.3370,
    phone: '041-5224993',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_SANTA_MARGHERITA',
    name: 'Farmacia Santa Margherita',
    address: 'Campo Santa Margherita 2930 (Dorsoduro)',
    lat: 45.4340,
    lon: 12.3230,
    phone: '041-5223872',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_PONCI_ZATTERE',
    name: 'Farmacia Ponci alle Zattere',
    address: 'Fondamenta Zattere 1483 (Dorsoduro)',
    lat: 45.4288,
    lon: 12.3270,
    phone: '041-5225287',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_STELLA_D_ORO',
    name: 'Farmacia Stella d\'Oro',
    address: 'Rio Terà San Leonardo 1345 (Cannaregio)',
    lat: 45.4435,
    lon: 12.3265,
    phone: '041-716377',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_SAN_BOLDO',
    name: 'Farmacia San Boldo',
    address: 'Campo San Boldo 2818 (Santa Croce)',
    lat: 45.4390,
    lon: 12.3288,
    phone: '041-718290',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_REDENTORE_GIUDECCA',
    name: 'Farmacia del Redentore (Giudecca)',
    address: 'Fondamenta Sant\'Eufemia 460 (Giudecca)',
    lat: 45.4260,
    lon: 12.3245,
    phone: '041-5285141',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_BURANO_GALUPPI',
    name: 'Farmacia di Burano',
    address: 'Via Baldassarre Galuppi 312 (Burano)',
    lat: 45.4855,
    lon: 12.4170,
    phone: '041-730058',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'PHARM_LIDO_SME',
    name: 'Farmacia Internazionale del Lido',
    address: 'Gran Viale Santa Maria Elisabetta 2 (Lido)',
    lat: 45.4172,
    lon: 12.3685,
    phone: '041-5260133',
    source: 'ELENCO_CURATO'
  }
];

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
  },
  {
    id: 'LST_TRONCHETTO_SILO',
    zoneName: 'Isola del Tronchetto (Silos & Coperture Bituminose)',
    lat: 45.4415,
    lon: 12.3045,
    surfaceTempCelsius: 38.6,
    airTempDelta: +7.4,
    surfaceType: 'ASFALTO_PORTUALE',
    coolingEffect: 'ISOLA_DI_CALORE',
    satelliteMission: 'Landsat-9 TIRS'
  },
  {
    id: 'LST_ARSENALE_BACINI',
    zoneName: 'Arsenale di Venezia (Darsena Grande & Grandi Bacini)',
    lat: 45.4358,
    lon: 12.3540,
    surfaceTempCelsius: 23.8,
    airTempDelta: -7.2,
    surfaceType: 'ACQUA_CANALE',
    coolingEffect: 'ALTO',
    satelliteMission: 'Copernicus Sentinel-3 SLSTR'
  },
  {
    id: 'LST_SACCA_FISOLA',
    zoneName: 'Sacca Fisola - Residenziale Moderno & Calcestruzzo',
    lat: 45.4280,
    lon: 12.3135,
    surfaceTempCelsius: 33.5,
    airTempDelta: +3.8,
    surfaceType: 'TETTO_TEGOLE',
    coolingEffect: 'NEUTRO',
    satelliteMission: 'Copernicus Land LST'
  },
  {
    id: 'LST_ALBERONI_PINETA',
    zoneName: 'Alberoni - Oasi WWF & Pineta Litoranea Dunale',
    lat: 45.3450,
    lon: 12.3350,
    surfaceTempCelsius: 23.0,
    airTempDelta: -7.8,
    surfaceType: 'VERDE_URBANO',
    coolingEffect: 'ALTO',
    satelliteMission: 'Copernicus Sentinel-3 SLSTR'
  }
];
