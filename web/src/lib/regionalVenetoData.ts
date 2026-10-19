import {
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem
} from './types';
import { AIRBNB_ZONES } from './airbnb';

// ==========================================
// 1. QUALITÀ DELLE ACQUE LAGUNARI
// I valori di esempio sono stati sostituiti dalle misure reali delle sonde ARPAV
// (pipeline/import_arpav_lagoon.py -> src/data/arpav-lagoon.json, servite da /api/regional-data).
// ==========================================

// ==========================================
// 2. STRUTTURE RICETTIVE & LOCAZIONI BREVI (Inside Airbnb + ISTAT 2021)
// Dati reali elaborati da pipeline/import_inside_airbnb.py -> src/data/inside-airbnb-venezia.json
// ==========================================
export const REGIONAL_TOURIST_ACCOMMODATIONS: TouristAccommodationItem[] = AIRBNB_ZONES;

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
  },
  {
    id: 'BIKE_RIVIERA_BRENTA',
    routeName: 'Ciclovia della Riviera del Brenta (Tratta Laguna)',
    section: 'Malcontenta (Villa Foscari) - Dogana Fusina - Terminal Laguna',
    surfaceType: 'ASFALTO_CICLABILE',
    lengthKm: 14.5,
    elevationGainM: 8,
    difficulty: 'FACILE_PANORAMICO',
    ferryInterchange: 'Terminal Fusina Motonave ACTV Linea 16 per Zattere',
    path: [
      [12.2020, 45.4370], // Villa Foscari La Malcontenta
      [12.2210, 45.4280], // Argine Naviglio del Brenta
      [12.2410, 45.4210], // Darsena Fusina
      [12.2560, 45.4180]  // Terminal Traghetti Fusina
    ],
    description: 'Percorso storico-paesaggistico lungo l\'antico corso del Brenta navigabile tra ville venete sansoviniane e l\'approdo lagunare di Fusina.',
    officialSource: 'Regione del Veneto - REV Itinerario I1 (dati.veneto.it)'
  },
  {
    id: 'BIKE_BARENE_CAVALLINO',
    routeName: 'Ciclovia delle Barene del Cavallino & Lio Piccolo',
    section: 'Treporti - Piazza del Prà - Valle Mesole - Lio Piccolo',
    surfaceType: 'PIETRA_MURAZZI',
    lengthKm: 15.8,
    elevationGainM: 5,
    difficulty: 'FACILE_PANORAMICO',
    ferryInterchange: 'Terminal Punta Sabbioni / Treporti Ricevitoria ACTV Linee 12/14',
    path: [
      [12.4490, 45.4740], // Ricevitoria Treporti
      [12.4560, 45.4850], // Saffa / Canale Saccagnana
      [12.4640, 45.4980], // Borgo Storico Mesole
      [12.4150, 45.5050]  // Palazzetto nobile Lio Piccolo & Barene
    ],
    description: 'Ciclabile sospesa sull\'acqua che attraversa valli da pesca incontaminate, barene salmastre e colonie stanziali di fenicotteri rosa.',
    officialSource: 'Parco Turistico Cavallino-Treporti / dati.veneto.it'
  },
  {
    id: 'BIKE_PONTE_LIBERTA',
    routeName: 'Pista Ciclabile a Sbalzo "Ponte della Libertà"',
    section: 'Porta di Venezia (Mestre VEGA) - Ponte Ferro-Stradale - Venezia Santa Chiara',
    surfaceType: 'ASFALTO_CICLABILE',
    lengthKm: 4.2,
    elevationGainM: 6,
    difficulty: 'FACILE_PANORAMICO',
    ferryInterchange: 'Tronchetto People Mover / Piazzale Roma Vaporetti',
    path: [
      [12.2590, 45.4710], // Parco Scientifico VEGA Marghera
      [12.2780, 45.4550], // Inizio sbalzo lagunare
      [12.2980, 45.4480], // Tratto centrale su Laguna
      [12.3160, 45.4410]  // Arrivo Tronchetto / Banchina Santa Chiara
    ],
    description: 'Pista ciclabile protetta a sbalzo sulla laguna aperta inaugurata nel 2016, corridoio ecologico esclusivo di ingresso a Venezia insulare.',
    officialSource: 'Comune di Venezia - Direzione Mobilità e Trasporti (dati.veneto.it)'
  }
];

// ==========================================
// 4. PREVISIONE POLLINI (Copernicus CAMS via Open-Meteo)
// Punti di previsione: i valori arrivano dal modello europeo in /api/regional-data.
// Non sono stazioni di campionamento: per i bollettini misurati fa fede ARPAV.
// ==========================================
export const REGIONAL_POLLEN_STATIONS: PollenMonitoringStationItem[] = [
  { id: 'POL_VENEZIA', stationName: 'Venezia centro storico', lat: 45.4372, lon: 12.3326, validTime: null, pollens: [], overallAllergyRisk: null },
  { id: 'POL_MESTRE', stationName: 'Mestre', lat: 45.4905, lon: 12.242, validTime: null, pollens: [], overallAllergyRisk: null },
  { id: 'POL_LIDO', stationName: 'Lido di Venezia', lat: 45.405, lon: 12.365, validTime: null, pollens: [], overallAllergyRisk: null },
  { id: 'POL_CHIOGGIA', stationName: 'Chioggia', lat: 45.219, lon: 12.279, validTime: null, pollens: [], overallAllergyRisk: null },
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
