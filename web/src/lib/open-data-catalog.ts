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
  },
  {
    id: 'SPEED_CANALE_MARANI',
    channelName: 'Canale dei Marani (Venezia - Murano)',
    maxSpeedKmh: 11,
    isBarcavelox: true,
    zoneType: 'CANALE_PRINCIPALE',
    path: [
      [12.3420, 45.4460], // Fondamente Nove
      [12.3480, 45.4510], // Murano Faro
      [12.3550, 45.4580]  // Murano Museo
    ],
    ordinanza: 'Ordinanza n. 274/2015 - Limite 11 km/h natanti trasporto pubblico ACTV',
    color: '#06b6d4',
    description: 'Arteria principale verso la Laguna Nord e Murano con telecamera Barcavelox e briccole luminose.'
  },
  {
    id: 'SPEED_CANALE_SAN_NICOLO',
    channelName: 'Canale di San Nicolò del Lido',
    maxSpeedKmh: 15,
    isBarcavelox: false,
    zoneType: 'LAGUNA_APERTA',
    path: [
      [12.3780, 45.4260], // Sant\'Elena
      [12.4150, 45.4210], // San Nicolò Lido
      [12.4380, 45.4190]  // Bocca di Lido
    ],
    ordinanza: 'Ordinanza Capitaneria di Porto n. 112/2018 - Limite 15 km/h',
    color: '#10b981',
    description: 'Accesso marittimo est per Ferry-Boat Tronchetto-Lido e aliscafi verso l\'Adriatico.'
  },
  {
    id: 'SPEED_CANALE_GRAZIA',
    channelName: 'Canale della Grazia & Canale San Marco',
    maxSpeedKmh: 11,
    isBarcavelox: false,
    zoneType: 'CANALE_PRINCIPALE',
    path: [
      [12.3420, 45.4210], // Isola della Grazia
      [12.3470, 45.4270], // San Giorgio
      [12.3410, 45.4320]  // Bacino San Marco
    ],
    ordinanza: 'Ordinanza n. 274/2015 - Limite 11 km/h',
    color: '#06b6d4',
    description: 'Raccordo acqueo tra Laguna Centrale e Bacino Marciano per lance granturismo e vaporetti.'
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
    id: 'TRAIN_FR_9725',
    trainNumber: 'Frecciarossa FR 9725',
    trainType: 'FRECCIAROSSA',
    origin: 'Venezia Santa Lucia (08:15)',
    destination: 'Milano Centrale / Torino',
    currentLocation: 'In partenza da Santa Lucia viadotto lagunare',
    lat: 45.4435,
    lon: 12.3080,
    delayMinutes: 0,
    speedKmh: 68,
    platform: 'Binario 8',
    status: 'IN_ORARIO',
    routeProgress: 0.85
  },
  {
    id: 'TRAIN_ITALO_9980',
    trainNumber: 'Italo AV 9980',
    trainType: 'ITALO',
    origin: 'Roma Termini / Napoli Centrale',
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
    id: 'TRAIN_ITALO_9983',
    trainNumber: 'Italo AV 9983',
    trainType: 'ITALO',
    origin: 'Venezia Santa Lucia',
    destination: 'Firenze SMN / Roma / Salerno',
    currentLocation: 'Tratto centrale viadotto Ponte della Libertà',
    lat: 45.4495,
    lon: 12.2740,
    delayMinutes: 0,
    speedKmh: 112,
    platform: 'Binario 6',
    status: 'IN_ORARIO',
    routeProgress: 0.50
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
    id: 'TRAIN_RV_3482',
    trainNumber: 'Regionale Veloce RV 3482',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Bologna Centrale (07:10)',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Ponte della Libertà corsia Nord (Km 263)',
    lat: 45.4540,
    lon: 12.2680,
    delayMinutes: 1,
    speedKmh: 98,
    platform: 'Binario 3',
    status: 'IN_ORARIO',
    routeProgress: 0.40
  },
  {
    id: 'TRAIN_RV_3811',
    trainNumber: 'Regionale Veloce RV 3811',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Venezia Santa Lucia (08:23)',
    destination: 'Trieste Centrale',
    currentLocation: 'In transito bivio Marghera / Mestre',
    lat: 45.4690,
    lon: 12.2470,
    delayMinutes: 0,
    speedKmh: 88,
    platform: 'Binario 5',
    status: 'IN_ORARIO',
    routeProgress: 0.20
  },
  {
    id: 'TRAIN_R_16724',
    trainNumber: 'Regionale R 16724',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Bassano del Grappa (07:35)',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Raccordo Porto Marghera scalo viaggiatori',
    lat: 45.4640,
    lon: 12.2560,
    delayMinutes: 4,
    speedKmh: 75,
    platform: 'Binario 2',
    status: 'IN_RITARDO',
    routeProgress: 0.28
  },
  {
    id: 'TRAIN_R_16840',
    trainNumber: 'Regionale R 16840',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Udine / Conegliano / Treviso',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Ponte della Libertà (Km 266 verso S. Lucia)',
    lat: 45.4445,
    lon: 12.2980,
    delayMinutes: 0,
    speedKmh: 92,
    platform: 'Binario 1',
    status: 'IN_ORARIO',
    routeProgress: 0.75
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
  },
  {
    id: 'TRAIN_RJ_131',
    trainNumber: 'Railjet ÖBB RJ 131',
    trainType: 'RAILJET',
    origin: 'Wien Hbf (Vienna) via Villach',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Viadotto lagunare corsia internazionale',
    lat: 45.4480,
    lon: 12.2810,
    delayMinutes: 0,
    speedKmh: 108,
    platform: 'Binario 7',
    status: 'IN_ORARIO',
    routeProgress: 0.58
  },
  {
    id: 'TRAIN_IC_580',
    trainNumber: 'Intercity Notte ICN 580',
    trainType: 'INTERCITY',
    origin: 'Roma Termini / Orte / Bologna',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'In manovra scalo binari tronco S. Lucia',
    lat: 45.4418,
    lon: 12.3195,
    delayMinutes: 0,
    speedKmh: 20,
    platform: 'Binario 10',
    status: 'IN_ARRIVO',
    routeProgress: 0.98
  },
  {
    id: 'TRAIN_CARGO_44120',
    trainNumber: 'Mercitalia Rail MC 44120',
    trainType: 'MERCITALIA_CARGO',
    origin: 'Porto Marghera Banchina Azoto',
    destination: 'Verona Quadrante Europa',
    currentLocation: 'Raccordo scalo merci Marghera Banchine',
    lat: 45.4710,
    lon: 12.2380,
    delayMinutes: 0,
    speedKmh: 45,
    platform: 'Fascio Merci Marghera',
    status: 'IN_ORARIO',
    routeProgress: 0.12
  },
  {
    id: 'TRAIN_SFMR_2210',
    trainNumber: 'SFMR Metropolitano 2210',
    trainType: 'REGIONALE_VELOCE',
    origin: 'Mira Brecce / Spinea',
    destination: 'Venezia Santa Lucia',
    currentLocation: 'Ponte della Libertà Km 264.5',
    lat: 45.4470,
    lon: 12.2845,
    delayMinutes: 0,
    speedKmh: 80,
    platform: 'Binario 11',
    status: 'IN_ORARIO',
    routeProgress: 0.61
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
    capacityKg: 2000,
    isOperatingNow: true
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
    capacityKg: 2600,
    isOperatingNow: true
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
    capacityKg: 2200,
    isOperatingNow: true
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
    capacityKg: 2800,
    isOperatingNow: true
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
    conservationState: 'BUONO',
    cisternaDepthMeters: 4.6
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.2
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.6
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
    conservationState: 'BUONO',
    cisternaDepthMeters: 4.7
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.8
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.0
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 5.5
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 6.0
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
    conservationState: 'RESTAURATO',
    cisternaDepthMeters: 5.1
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
    conservationState: 'BUONO',
    cisternaDepthMeters: 4.8
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
    conservationState: 'OTTIMO',
    cisternaDepthMeters: 4.5
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
    conservationState: 'BUONO',
    cisternaDepthMeters: 5.3
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
  },
  {
    id: 'FORT_SAN_FELICE_CHIOGGIA',
    name: 'Forte San Felice (Bocca di Porto di Chioggia)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'RESTAURO_IN_CORSO',
    areaMq: 110000,
    lat: 45.2285,
    lon: 12.2960,
    description: 'Castello a pianta stellata del 1385 (Guerra di Chioggia) potenziato dal Sanmicheli con portale monumentale in pietra d\'Istria.'
  },
  {
    id: 'ISLE_CERTOSA',
    name: 'Isola della Certosa (Parco della Certosa)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'MUSEO_APERTO',
    areaMq: 240000,
    lat: 45.4335,
    lon: 12.3705,
    description: 'Antico monastero certosino del \'200, poi opificio militare napoleonico e oggi parco naturale con marina per voga e vela.'
  },
  {
    id: 'ISLE_SAN_SERVOLO',
    name: 'Isola di San Servolo (Polo Museale e Universitario)',
    era: 'SANITARIO_MEDIEVALE',
    status: 'MUSEO_APERTO',
    areaMq: 48000,
    lat: 45.4195,
    lon: 12.3555,
    description: 'Convento benedettino millenario, ospedale militare e psichiatrico storico; oggi sede universitaria Venice International University e museo del manicomio.'
  },
  {
    id: 'ISLE_OTTAGONO_CA_ROMAN',
    name: 'Ottagono Ca\' Roman (Bocca di Chioggia)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'ZONA_MILITARE_DISMESSA',
    areaMq: 2500,
    lat: 45.2340,
    lon: 12.2880,
    description: 'Fortificazione ottagonale insulare a protezione del canale interno dei Murazzi di Pellestrina e dell\'imbocco meridionale.'
  },
  {
    id: 'FORT_BATTERIA_DANDOLO',
    name: 'Batteria Dandolo (Lido di Venezia)',
    era: 'ASBURGICA',
    status: 'ZONA_MILITARE_DISMESSA',
    areaMq: 34000,
    lat: 45.3850,
    lon: 12.3550,
    description: 'Postazione corazzata ottocentesca della piazzaforte marittima veneziana con casematte e terrapieni di difesa litoranea.'
  },
  {
    id: 'ISLE_SANT_ANGELO_POLVERE',
    name: 'Isola di Sant\'Angelo della Polvere (Canale di Contorta)',
    era: 'SERENISSIMA_REPUBBLICA',
    status: 'ISOLA_ABBANDONATA',
    areaMq: 5200,
    lat: 45.3980,
    lon: 12.2850,
    description: 'Monastero trasformato dal Senato nel 1555 in polveriera di massima sicurezza isolata nella laguna centrale.'
  }
];

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
    hasDirectHospitalRamp: false
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
    hasDirectHospitalRamp: true
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
    hasDirectHospitalRamp: true
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
    hasDirectHospitalRamp: false
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
  },
  {
    id: 'DAE_ZATTERE',
    code: 'DAE-VE-06',
    location: 'Fondamenta Zattere ai Gesuati - Pontile ACTV',
    lat: 45.4292,
    lon: 12.3282,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-18'
  },
  {
    id: 'DAE_SAN_GIACOMO_DELL_ORIO',
    code: 'DAE-VE-07',
    location: 'Campo San Giacomo da l\'Orio - Portico Farmacia',
    lat: 45.4400,
    lon: 12.3272,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-12'
  },
  {
    id: 'DAE_SAN_BARNABA',
    code: 'DAE-VE-08',
    location: 'Campo San Barnaba - Ingresso Sottoportego',
    lat: 45.4330,
    lon: 12.3252,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-14'
  },
  {
    id: 'DAE_FONDAMENTE_NOVE',
    code: 'DAE-VE-09',
    location: 'Fondamente Nove - Pontile Terminal ACTV D',
    lat: 45.4440,
    lon: 12.3402,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA / ULSS 3',
    lastInspected: '2026-09-25'
  },
  {
    id: 'DAE_ARSENALE_MUSEO',
    code: 'DAE-VE-10',
    location: 'Campo San Biagio - Museo Storico Navale',
    lat: 45.4338,
    lon: 12.3495,
    accessType: 'PUBBLICO_H24',
    operator: 'Marina Militare / ULSS 3',
    lastInspected: '2026-09-08'
  },
  {
    id: 'DAE_MURANO_COLONNA',
    code: 'DAE-VE-11',
    location: 'Murano - Pontile Colonna / Fondamenta dei Vetrai',
    lat: 45.4526,
    lon: 12.3512,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-11'
  },
  {
    id: 'DAE_BURANO_GALUPPI',
    code: 'DAE-VE-12',
    location: 'Burano - Piazza Galuppi / Municipio',
    lat: 45.4850,
    lon: 12.4172,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-16'
  },
  {
    id: 'DAE_GIUDECCA_PALANCA',
    code: 'DAE-VE-13',
    location: 'Giudecca - Imbarcadero Palanca / Fondamenta',
    lat: 45.4262,
    lon: 12.3250,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima',
    lastInspected: '2026-09-21'
  },
  {
    id: 'DAE_SANT_ELENA_STADIO',
    code: 'DAE-VE-14',
    location: 'Sant\'Elena - Viale IV Novembre / Stadio Penzo',
    lat: 45.4278,
    lon: 12.3630,
    accessType: 'PUBBLICO_H24',
    operator: 'ULSS 3 Serenissima / Venezia FC',
    lastInspected: '2026-09-19'
  },
  {
    id: 'DAE_TRONCHETTO_PEOPLE_MOVER',
    code: 'DAE-VE-15',
    location: 'Tronchetto - Stazione People Mover / Parcheggio',
    lat: 45.4418,
    lon: 12.3052,
    accessType: 'PUBBLICO_H24',
    operator: 'AVM SpA',
    lastInspected: '2026-09-24'
  },
  {
    id: 'DAE_MESTRE_STAZIONE',
    code: 'DAE-VE-16',
    location: 'Mestre Stazione FS - Piazzale Favretti Atrio',
    lat: 45.4828,
    lon: 12.2320,
    accessType: 'PUBBLICO_H24',
    operator: 'RFI / Polfer / ULSS 3',
    lastInspected: '2026-09-26'
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
  },
  {
    id: 'PHARM_ZAMPIRONI_SALVATORE',
    name: 'Farmacia Zampironi (San Salvador)',
    address: 'Campo San Salvador 4813 (San Marco)',
    lat: 45.4368,
    lon: 12.3370,
    isOnDutyNow: true,
    isNightShift: true,
    phone: '041-5224993'
  },
  {
    id: 'PHARM_SANTA_MARGHERITA',
    name: 'Farmacia Santa Margherita',
    address: 'Campo Santa Margherita 2930 (Dorsoduro)',
    lat: 45.4340,
    lon: 12.3230,
    isOnDutyNow: true,
    isNightShift: false,
    phone: '041-5223872'
  },
  {
    id: 'PHARM_PONCI_ZATTERE',
    name: 'Farmacia Ponci alle Zattere',
    address: 'Fondamenta Zattere 1483 (Dorsoduro)',
    lat: 45.4288,
    lon: 12.3270,
    isOnDutyNow: false,
    isNightShift: false,
    phone: '041-5225287'
  },
  {
    id: 'PHARM_STELLA_D_ORO',
    name: 'Farmacia Stella d\'Oro',
    address: 'Rio Terà San Leonardo 1345 (Cannaregio)',
    lat: 45.4435,
    lon: 12.3265,
    isOnDutyNow: true,
    isNightShift: true,
    phone: '041-716377'
  },
  {
    id: 'PHARM_SAN_BOLDO',
    name: 'Farmacia San Boldo',
    address: 'Campo San Boldo 2818 (Santa Croce)',
    lat: 45.4390,
    lon: 12.3288,
    isOnDutyNow: false,
    isNightShift: false,
    phone: '041-718290'
  },
  {
    id: 'PHARM_REDENTORE_GIUDECCA',
    name: 'Farmacia del Redentore (Giudecca)',
    address: 'Fondamenta Sant\'Eufemia 460 (Giudecca)',
    lat: 45.4260,
    lon: 12.3245,
    isOnDutyNow: true,
    isNightShift: false,
    phone: '041-5285141'
  },
  {
    id: 'PHARM_BURANO_GALUPPI',
    name: 'Farmacia di Burano',
    address: 'Via Baldassarre Galuppi 312 (Burano)',
    lat: 45.4855,
    lon: 12.4170,
    isOnDutyNow: true,
    isNightShift: false,
    phone: '041-730058'
  },
  {
    id: 'PHARM_LIDO_SME',
    name: 'Farmacia Internazionale del Lido',
    address: 'Gran Viale Santa Maria Elisabetta 2 (Lido)',
    lat: 45.4172,
    lon: 12.3685,
    isOnDutyNow: true,
    isNightShift: true,
    phone: '041-5260133'
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
