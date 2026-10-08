export type TransportModeCategory = 
  | 'vaporetto' 
  | 'motoscafo' 
  | 'motonave' 
  | 'ferry' 
  | 'tram' 
  | 'bus' 
  | 'island';

export type DayType = 'weekday' | 'saturday' | 'sunday';

export type PaletteTheme = 'notte' | 'carta' | 'dynamic';

export type CameraViewPreset = 'lagoon' | 'venezia' | 'mestre' | 'lido' | 'aeroporto';

export interface AirportInfo {
  iata: string;
  icao: string;
  name: string;
  operator: string;
  elevationMeters: number;
  lat: number;
  lon: number;
  runways: Array<{
    id: string;
    dimensions: string;
    surface: string;
    ils: string;
    heading: string;
  }>;
  terminal: string;
  actvConnections: string[];
  alilagunaConnections: string[];
  annualPassengers: string;
}

export interface RouteItem {
  id: string;
  shortName: string;
  longName: string;
  type: number; // 0=Tram, 3=Bus, 4=Ferry
  category: TransportModeCategory;
  color: string;
  textColor: string;
}

export interface StopItem {
  id: string;
  name: string;
  desc?: string;
  lat: number;
  lon: number;
  mode: string;
  lines?: string[];
  wheelchair?: boolean;
}

/** Opera pubblica dall'Elenco Annuale dei Lavori del Comune di Venezia (dati.venezia.it, CC BY). */
export interface CantiereItem {
  id: number;
  codice: string;
  titolo: string;
  /** Luogo usato per la geocodifica, oppure "Non localizzata" */
  localizzazione: string;
  /** Municipalità */
  quartiere: string;
  tipologia: string;
  categoria: string;
  /** Stato di avanzamento del progetto come pubblicato (es. "Progetto Esecutivo"), altrimenti "Programmato" */
  stato: string;
  importoLavori: number;
  enteResponsabile: string;
  cup: string | null;
  provvedimento: string | null;
  finalita: string | null;
  lat: number | null;
  lon: number | null;
  /** true se la posizione è stimata con geocodifica OpenStreetMap del luogo citato nel titolo */
  posizioneApprossimata: boolean;
}

/** Opera pubblica con posizione sulla mappa. */
export type LocatedCantiere = CantiereItem & { lat: number; lon: number };

export const isLocated = (c: CantiereItem): c is LocatedCantiere => c.lat !== null && c.lon !== null;

export interface OccupazioneItem {
  id: number;
  protocollo: string;
  richiedente: string;
  motivo: string;
  dataInizio: string;
  dataFine: string;
  superficieMq: number;
  via: string;
  lat: number;
  lon: number;
}

export interface StopNearCantiere {
  stopId: string;
  stopName: string;
  transportMode: string;
  stopLat: number;
  stopLon: number;
  cantiereId: number;
  cantiereTitolo: string;
  cantiereTipologia: string;
  cantiereCategoria: string;
  distanzaMetri: number;
}

export interface FlightItem {
  icao24: string;
  callsign: string;
  country: string;
  lat: number;
  lon: number;
  altitudeMeters: number;
  speedKmh: number;
  trackDegrees: number;
  verticalRate: number;
  onGround: boolean;
  airport: string;
  status: 'APPROACH' | 'DEPARTURE' | 'CRUISE' | 'TAXI';
}

export interface TideData {
  livelloCm: number;
  stazione: string;
  dataOra: string;
  tendenza: 'IN_AUMENTO' | 'STAZIONARIA' | 'IN_CALO';
  categoria: 'NORMALE' | 'SOSTENUTA' | 'MOLTO_SOSTENUTA' | 'ECCEZIONALE';
  moseStatus: {
    lido: 'ABBASSATO' | 'ATTIVATO';
    malamocco: 'ABBASSATO' | 'ATTIVATO';
    chioggia: 'ABBASSATO' | 'ATTIVATO';
  };
  prossimoPicco: {
    ora: string;
    livelloPrevistoCm: number;
  };
  percentualeAllagamentoVenezia: number;
}

/** I campi null indicano misure per cui non è collegata una fonte in tempo reale. */
export interface PlatformMetrics {
  // Trasporto Pubblico ACTV
  totalRoutes: number;
  routesNavigazione: number;
  routesAutomobilistico: number;
  totalStops: number;
  totalTrips: number;
  activeVehiclesInService: number | null;

  // Alilaguna S.p.A. (Transitland f-u20f-alilagunaspa)
  alilagunaRoutesCount: number;
  alilagunaStopsCount: number;
  alilagunaBoatsCount: number;

  // Maree & MOSE (CPSM Centro Maree)
  tideLevelCm: number | null;
  moseStatus: string | null;
  moseGatesCount: number;
  cpsmStationsCount: number;
  floodingPercentage: number | null;

  // Qualità dell'Aria & Ambiente (ARPAV)
  airStationsCount: number;
  averageAqi: number | null;
  averagePm10: number | null;
  averageNo2: number | null;
  airQualityStatus: string | null;

  // Traffico Marittimo AIS & Canali (VTS / Crociere)
  activeShipsCount: number;
  totalGrossTonnage: number;
  maritimeChannelsCount: number;
  restrictedLagoonVesselsCount: number;

  // Voli & Aeroporto VCE (ENAV / OpenSky)
  activeFlightsCount: number | null;
  vceDailyMovements: number | null;
  averageFlightAltitudeMeters: number;

  // Flussi Pedonali (Smart Control Room)
  pedestrianSensorsCount: number;
  totalHourlyPedestrians: number | null;
  peakPedestrianSensor: string | null;

  // Mobilità Terraferma & Parcheggi AVM
  totalParkingSpaces: number;
  freeParkingSpots: number | null;
  parkingOccupancyRate: number | null;

  // Satelliti & Osservazione Spaziale (Copernicus ESA / ASI / NASA)
  activeSatellitesCount: number;
  copernicusSentinelsCount: number;
  radarEarthObservationSwathKm: number;
  nextOrbitalPassMinutes: number | null;

  // Patrimonio & Opere Pubbliche
  activeCantieri: number;
  totalInvestmentCantieri: number;
  occupazioniAttive: number;
  stopsNearWorksites200m: number;
  drinkingFountainsCount: number;
  accessibleBridgesCount: number;
  veritasServicePointsCount: number;

  // Nuovi Open Data Venezia: Emergenza, Laguna, Ambiente & Servizi
  passerelleTotalMeters: number;
  passerelleMountedCount: number;
  briccoleCount: number;
  marineLightsCount: number;
  oceanStationsCount: number;
  cnrWaveHeightMeters: number | null;
  cnrWaterTempC: number | null;
  bathingWaterStationsCount: number;
  monumentalTreesCount: number;
  evChargingStationsCount: number;
  wifiHotspotsCount: number;
}

export interface MaritimeWaypoint {
  name: string;
  depth: string;
  lon: number;
  lat: number;
}

export interface MaritimeRouteItem {
  id: string;
  name: string;
  type: 'DEEP_WATER' | 'CRUISE_TRONCHETTO' | 'FERRY' | 'FAST_FERRY';
  channelName: string;
  depthMeters: number;
  color: string;
  waypoints: MaritimeWaypoint[];
}

export interface ShipItem {
  mmsi: string;
  imo: string;
  name: string;
  shipType: 'CRUISE' | 'FERRY' | 'CARGO' | 'TUG' | 'HYDROFOIL';
  lat: number;
  lon: number;
  speedKnots: number;
  heading: number;
  draughtMeters: number;
  lengthMeters: number;
  grossTonnage: number;
  destination: string;
  berth: string;
  flag: string;
  operator: string;
  eta: string;
  isRestrictedLagoonRoute: boolean; // True for big cruise ships banned from San Marco / Giudecca (DL 103/2021)
  routeId?: string;
}

export interface MoseGateItem {
  id: string;
  inletName: string;
  channel: string;
  lat: number;
  lon: number;
  barriersCount: number;
  /** Lo stato operativo del MOSE non è pubblicato come open data in tempo reale. */
  status: 'ABBASSATO' | 'IN_SOLLEVAMENTO' | 'ATTIVATO' | 'NON_DISPONIBILE';
  elevationCm: number | null;
  /** Livello misurato dalla stazione mareografica lato mare più vicina (null se non disponibile). */
  tideSeaCm: number | null;
  /** Livello misurato dalla stazione mareografica lato laguna più vicina (null se non disponibile). */
  tideLagoonCm: number | null;
}

export interface CityAssetItem {
  id: string;
  name: string;
  type: 'FOUNTAIN' | 'ACCESSIBLE_BRIDGE' | 'VERITAS_WASTE' | 'VERITAS_BOAT';
  lat: number;
  lon: number;
  sestiere: string;
  details: string;
  accessibilityNote?: string;
  typology?: string;
  operator?: string;
  waterSource?: string;
  campaign?: string;
  toponomasticSource?: string;
  potable?: boolean;
}

export interface ParkingItem {
  id: string;
  name: string;
  location: 'Piazzale Roma' | 'Tronchetto' | 'Mestre';
  totalSpots: number;
  freeSpots?: number;
  lat: number;
  lon: number;
  rateHourly: string;
  operator: string;
}

/** Stazione ARPAV con le medie annue validate (µg/m³) dell'anno più recente pubblicato. */
export interface AirQualityItem {
  id: string;
  stationName: string;
  location: string;
  stationType: string;
  lat: number;
  lon: number;
  /** Classificazione rispetto ai limiti UE: BUONA = entro i limiti 2030, ACCETTABILE = entro i limiti vigenti */
  aqi: 'BUONA' | 'ACCETTABILE' | 'SCADENTE';
  year: number;
  pm10: number | null;
  pm25: number | null;
  no2: number | null;
  pm10Exceedances: number | null;
  lastUpdate: string;
}

export interface PedestrianFlowItem {
  id: string;
  sensorName: string;
  location: string;
  lat: number;
  lon: number;
  gateCode?: string;
  technology?: string;
  monitoringScope?: string;
  hourlyFlow?: number;
  trend?: 'STABILE' | 'IN_AUMENTO' | 'IN_CALO';
  crowdingLevel?: 'BASSO' | 'MEDIO' | 'ELEVATO';
  accessFeeEnforced: boolean;
}

export interface AlilagunaStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lines: string[];
  isAirportHub: boolean;
}

export interface AlilagunaRoute {
  id: string;
  name: string;
  lineCode: 'BLU' | 'ARANCIO' | 'ROSSA' | 'VERDE';
  color: string;
  terminalA: string;
  terminalB: string;
  description: string;
  frequencyMinutes: number;
  stops: string[];
  shape: [number, number][]; // [lon, lat]
}

export interface AlilagunaBoat {
  id: string;
  name: string;
  lineCode: 'BLU' | 'ARANCIO' | 'ROSSA' | 'VERDE';
  lineName: string;
  color: string;
  lat: number;
  lon: number;
  heading: number;
  speedKmh: number;
  nextStop: string;
  destination: string;
  passengersOnBoard: number;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  tripProgress?: number;
}

export interface SatelliteItem {
  id: string; // es. "SENTINEL-1A", "SENTINEL-2A", "COSMO-SKYMED-2", "ISS", "LANDSAT-9"
  name: string;
  noradId: number;
  operator: string; // "ESA / Copernicus", "ASI (Agenzia Spaziale Italiana)", "NASA / USGS", "NASA / ESA / JAXA"
  type: 'SAR_RADAR' | 'OPTICAL' | 'SPACE_STATION' | 'THERMAL' | 'NAVIGATION';
  sensor: string; // es. "C-Band SAR Radar (C-SAR)", "MSI Multispectral 13-band", "X-Band SAR Submetrico"
  resolution: string; // es. "5m SAR", "10m Multispettrale", "1m Submetrico"
  missionTarget: string; // Ruolo per Venezia (es. "Interferometria subsidenza San Marco e monitoraggio barriere MOSE")
  altitudeKm: number;
  speedKmh: number;
  inclinationDeg: number;
  periodMinutes: number;
  currentLon: number;
  currentLat: number;
  heading: number; // Angolo di traccia orbitale a terra (deg)
  groundTrack: [number, number][]; // Polilinea [lon, lat] dell'orbita sopra l'Alto Adriatico / Veneto
  swathWidthKm: number; // Larghezza scansione al suolo (impronta radar/ottica)
  nextPassVenice: string;
  passDurationSeconds: number;
  maxElevationDeg: number;
  isPassingNow: boolean;
  openDataSource: string; // "Copernicus Data Space (ESA)", "ASI Open Data", "CelesTrak NORAD", etc.
  apiLink: string;
  /** Elementi orbitali TLE (CelesTrak): se presenti la posizione è calcolata con SGP4 */
  tle?: [string, string];
  /** Data di riferimento del TLE (ISO) */
  tleEpoch?: string;
  /** Inizio del prossimo passaggio sopra Venezia (ISO), calcolato dal TLE */
  nextPassStart?: string;
}

export type CameraType =
  | 'CCTV_DOME'
  | 'CCTV_SPOT'
  | 'CCTV_ROTATING'
  | 'CCTV_ANPR'
  | 'CCTV_ZTL'
  | 'WEBCAM_LIVE_STREAM'
  | 'WEBCAM_CPSM_TIDE'
  | 'WEBCAM_OCEAN_CNR';

export interface VeniceCameraItem {
  id: string;
  name: string;
  type: CameraType;
  typeLabel: string;
  lat: number;
  lon: number;
  sestiere: string;
  location: string;
  targetDescription: string;
  operator: string;
  source: 'ANOPTICON_CIVIC' | 'OPENSTREETMAP' | 'PUBLIC_STREAM' | 'CPSM_COMUNE_VENEZIA' | 'CNR_ISMAR';
  sourceLabel: string;
  sourceUrl: string;
  hasLiveFeed: boolean;
  feedType?: 'YOUTUBE_LIVE' | 'GARR_TV_STREAM' | 'IMAGE_SNAPSHOT_15M' | 'DIRECT_STREAM_LINK';
  streamEmbedUrl?: string;
  streamPageUrl?: string;
  privacyNoticeStatus?: 'PRESENTE' | 'ASSENTE' | 'INCOMPLETA' | 'NON_APPLICABILE_PANORAMICA';
  bearingDeg?: number;
  fovDeg?: number;
  rangeMeters?: number;
  notes?: string;
}

export interface PasserellaItem {
  id: string;
  name: string;
  district: string; // 'San Marco' | 'Castello' | 'Cannaregio' | 'San Polo' | 'Dorsoduro' | 'Santa Croce'
  path: [number, number][]; // LineString [lon, lat] coordinate esatte delle passerelle
  lengthMeters: number;
  groundElevationCm: number; // Quota altimetrica minima del suolo (es. 80cm a San Marco, 95cm a Rialto)
  activationThresholdCm: number; // Soglia attivazione (es. 95cm o 110cm)
  isMounted: boolean;
  priority: 'PRIMARIA' | 'SECONDARIA';
  description: string;
  officialSource: string;
}

export interface BriccolaSignalItem {
  id: string;
  code: string;
  channelName: string;
  type: 'BRICCOLA_3_PALI' | 'DAMA_5_PALI' | 'FANALE_LUMINOSO' | 'PALINA_ORMEGGIO';
  lat: number;
  lon: number;
  lightColor: 'GREEN' | 'RED' | 'WHITE' | 'NONE'; // Lanterna notturna
  lightFlashRythm?: string; // es. "Fl(2) G 6s", "Q R 1s"
  depthMeters: number;
  material: 'ROVERE_NATURALE' | 'PLASTICA_RICICLATA_ECO';
  description: string;
}

export interface OceanStationItem {
  id: string;
  name: string;
  type: 'OCEANOGRAPHIC_PLATFORM' | 'WAVE_BUOY' | 'TIDAL_CURRENT_STATION';
  lat: number;
  lon: number;
  operator: 'CNR-ISMAR' | 'ISPRA RML' | 'CPSM Centro Maree';
  // Misure: null quando la fonte non le pubblica come open data
  waveHeightMeters: number | null; // Altezza significativa onda Hs
  wavePeriodSeconds: number | null; // Periodo d'onda Tp
  waterTempC: number | null;
  salinityPsu: number | null;
  currentSpeedMs: number | null;
  currentDirectionDeg: number | null;
  windSpeedKnots: number | null;
  windDirectionDeg: number | null;
  depthMeters: number;
  lastUpdate: string;
  officialSource: string;
  portalLink: string;
}

export interface BathingWaterItem {
  id: string;
  name: string;
  location: string; // 'Lido di Venezia' | 'Pellestrina' | 'Cavallino-Treporti'
  lat: number;
  lon: number;
  qualityClass: 'ECCELLENTE' | 'BUONO' | 'SUFFICIENTE' | 'VIETATA';
  waterTempC: number;
  escherichiaColiUfc: number; // < 100 ufc/100ml
  enterococchiUfc: number; // < 100 ufc/100ml
  blueFlag: boolean;
  samplingDate: string;
  officialSource: string;
}

export interface UrbanTreeItem {
  id: string;
  code: string;
  species: string; // es. "Platanus acerifolia", "Pinus pinea", "Celtis australis"
  commonName: string; // es. "Platano comune", "Pino domestico", "Bagolaro"
  location: string; // es. "Giardini Reali", "Sant'Elena", "Giardini della Biennale"
  lat: number;
  lon: number;
  heightMeters: number;
  canopyDiameterMeters: number;
  ageClass: 'MONUMENTALE' | 'ADULTO' | 'GIOVANE';
  co2AbsorbedKgYear: number;
  district: string;
}

export interface EvChargingItem {
  id: string;
  name: string;
  operator: string; // 'AVM / Comune di Venezia' | 'Enel X Way' | 'Be Charge'
  location: string;
  lat: number;
  lon: number;
  totalSockets: number;
  /** Disponibilità in tempo reale: non pubblicata dai gestori, quindi null */
  availableSockets: number | null;
  powerKw: number; // es. 22kW, 50kW, 150kW Ultra-Fast
  socketTypes: string[]; // ['Type 2', 'CCS Combo 2']
  isOperational: boolean;
}

/** Hotspot WiFi pubblico del Comune di Venezia (dati.venezia.it, CC BY). */
export interface WifiHotspotItem {
  id: string;
  name: string;
  networkName: 'VeniceConnected' | 'WiFi Italia';
  location: string;
  lat: number;
  lon: number;
  indoorOutdoor: 'OUTDOOR' | 'INDOOR';
  /** Stato pubblicato nel dataset (ok / ko) */
  status: 'ATTIVO' | 'NON_ATTIVO' | 'NON_INDICATO';
  isFreePublic: boolean;
}

// ==========================================
// 1. VIABILITÀ ACQUEA & CANALI (Comune di Venezia / Atlante Laguna / GeoSMA)
// ==========================================
export interface CanalSpeedLimitItem {
  id: string;
  channelName: string;
  maxSpeedKmh: number; // 5, 7, 11, 20 km/h
  isBarcavelox: boolean;
  zoneType: 'CANALE_INTERNO' | 'CANALE_PRINCIPALE' | 'LAGUNA_APERTA' | 'ZTL_ACQUEA';
  path: [number, number][]; // LineString [lon, lat]
  ordinanza: string;
  color: string;
  description: string;
}

export interface BridgeClearanceItem {
  id: string;
  bridgeName: string;
  rioName: string;
  lat: number;
  lon: number;
  clearanceCmZeroMarea: number; // Altezza libera sotto l'arco allo zero mareografico (cm)
  stepsCount: number;
  isAccessibleRamp: boolean;
  minNavigableTideCm: number; // Marea max oltre la quale un motoscafo standard non passa
  historicalNotes: string;
}

export interface GondolaStationItem {
  id: string;
  name: string;
  type: 'TRAGHETTO_DA_PARADA' | 'STAZIO_GONDOLA';
  crossingPath?: [number, number][]; // Per i traghetti che attraversano il Canal Grande
  lat: number;
  lon: number;
  activeGondolas: number;
  priceEur: number;
  openingHours: string;
  managedBy: string;
}

export interface PublicDockItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  dockType: 'MERCI_CARICO_SCARICO' | 'TAXI_ACQUEO' | 'DISABILI' | 'ORMEGGIO_PUBBLICO';
  maxStayMinutes: number;
  managedBy: string;
}

// ==========================================
// 2. IDROGRAFIA, SUBSIDENZA & MORFOLOGIA LAGUNARE (Copernicus EGMS / CNR-ISMAR / ISPRA)
// ==========================================
export interface SubsidenceInSARItem {
  id: string;
  location: string;
  lat: number;
  lon: number;
  velocityMmYear: number; // Velocità verticale millimetri/anno (es. -1.8 mm/anno)
  accelerationMmYear2: number;
  coherence: number; // 0.0 - 1.0 qualità del punto scatterer permanente
  satellite: 'Sentinel-1 InSAR (Copernicus EGMS)' | 'COSMO-SkyMed (ASI)';
  trend: 'STABILE' | 'SUBSIDENZA_MODERATA' | 'SUBSIDENZA_ACCELERATA';
  historicalPeriod: string;
}

export interface LagoonMorphologyItem {
  id: string;
  name: string;
  type: 'BARENA_NATURALE' | 'VELMA' | 'CASSA_COLMATA' | 'VALLE_DA_PESCA' | 'CANALE_PROFONDO';
  center: [number, number]; // [lon, lat]
  coordinates: [number, number][]; // Poligono o perimetro
  areaHectares: number;
  avgDepthMeters: number; // Da -0.4m per barena a -14.5m per canale
  ramsarProtected: boolean;
  protectionDirective: string;
  floraFauna: string;
}

export interface AirportMetarData {
  icao: string; // LIPZ
  iata: string; // VCE
  stationName: string;
  rawMetar: string;
  observationTime: string;
  windDirectionDeg: number;
  windCompass: string;
  windSpeedKnots: number;
  windSpeedKmh: number;
  gustSpeedKnots?: number;
  visibilityMeters: number;
  temperatureCelsius: number;
  dewPointCelsius: number;
  relativeHumidityPercent: number;
  qnhHpa: number;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  cloudsDescription: string;
  activeRunway: string;
  crosswindKnots: number;
  headwindKnots: number;
  runwayCondition: string;
  officialSource: string;
}

export interface MeteoMarineWindItem {
  id: string;
  stationName: string;
  lat: number;
  lon: number;
  windDirection: 'SCIROCCO' | 'BORA' | 'LIBECCIO' | 'MAESTRALE' | 'TRAMONTANA' | 'GRECALE' | 'PONENTE' | 'LEVANTE' | 'OSTRO';
  windDirectionDeg: number;
  windSpeedKmh: number;
  windSpeedKnots: number;
  gustSpeedKmh: number;
  gustSpeedKnots: number;
  /** Altezza d'onda significativa misurata; null se la stazione non misura le onde */
  waveHeightMeters: number | null;
  airTempCelsius?: number;
  pressureHpa?: number;
  humidityPercent?: number;
  tidePushRisk: 'BASSO' | 'MODERATO' | 'ALTO' | 'CRITICO';
  windTypeDescription: string;
  stationType: 'AEROPORTO' | 'PIATTAFORMA_OFFSHORE' | 'BOCCA_DI_PORTO' | 'CENTRO_STORICO' | 'TERRAFERMA';
  metar?: AirportMetarData;
  officialSource: string;
  /** Ora della misura come pubblicata dalla fonte (ora locale) */
  observedAt?: string;
}

// ==========================================
// 3. FERROVIA & LOGISTICA URBANA (Viaggiatreno RFI / Veritas)
// ==========================================
export interface TrainLiveItem {
  id: string;
  trainNumber: string;
  trainType: 'FRECCIAROSSA' | 'REGIONALE_VELOCE' | 'ITALO' | 'EUROCITY' | 'INTERCITY' | 'MERCITALIA_CARGO' | 'RAILJET';
  origin: string;
  destination: string;
  currentLocation: string;
  lat: number;
  lon: number;
  delayMinutes: number;
  speedKmh: number;
  platform: string;
  status: 'IN_ORARIO' | 'IN_RITARDO' | 'IN_ARRIVO';
  routeProgress: number; // 0..1 lungo il Ponte della Libertà
}

export interface VeritasWasteBoatItem {
  id: string;
  boatCode: string;
  assignedZone: string;
  dockName: string;
  lat: number;
  lon: number;
  collectionType: 'INDIFFERENZIATO' | 'CARTA_CARTONE' | 'PLASTICA_VETRO_LATTINE';
  scheduleHours: string;
  capacityKg: number;
  isOperatingNow: boolean;
}

// ==========================================
// 4. PATRIMONIO STORICO & NIZIOLETI (Venice Project Center / Soprintendenza / Demanio)
// ==========================================
export interface NizioletoCivicoItem {
  id: string;
  sestiere: 'San Marco' | 'Castello' | 'Cannaregio' | 'San Polo' | 'Santa Croce' | 'Dorsoduro' | 'Giudecca';
  civicNumber: number;
  streetName: string;
  nizioletoText: string;
  historicalNotes: string;
  lat: number;
  lon: number;
}

export interface VeniceWellItem {
  id: string;
  name: string;
  century: string;
  material: 'PIETRA_D_ISTRIA' | 'ROSSO_DI_VERONA' | 'MARMO_GRECO';
  style: 'GOTICO' | 'RINASCIMENTALE' | 'VENETO_BIZANTINO';
  campo: string;
  lat: number;
  lon: number;
  conservationState: 'OTTIMO' | 'BUONO' | 'RESTAURATO';
  cisternaDepthMeters: number;
}

export interface BellTowerItem {
  id: string;
  name: string;
  heightMeters: number;
  tiltAngleDeg: number; // Grado di inclinazione
  isLeaning: boolean;
  yearBuilt: number;
  lat: number;
  lon: number;
  description: string;
}

export interface LagoonFortressIslandItem {
  id: string;
  name: string;
  era: 'SERENISSIMA_REPUBBLICA' | 'NAPOLEONICA' | 'ASBURGICA' | 'SANITARIO_MEDIEVALE';
  status: 'MUSEO_APERTO' | 'ISOLA_ABBANDONATA' | 'RESTAURO_IN_CORSO' | 'ZONA_MILITARE_DISMESSA';
  areaMq: number;
  lat: number;
  lon: number;
  description: string;
}

// ==========================================
// 5. SALUTE & EMERGENZE SANITARIE (SUEM 118 / ULSS 3 / Regione Veneto)
// ==========================================
export interface EmergencyWaterDockItem {
  id: string;
  name: string;
  hospital: string;
  dockCode: string;
  lat: number;
  lon: number;
  is24hOperative: boolean;
  phone: string;
  hasDirectHospitalRamp: boolean;
}

export interface PublicDaeItem {
  id: string;
  code: string;
  location: string;
  lat: number;
  lon: number;
  accessType: 'PUBBLICO_H24' | 'ORARIO_DIURNO';
  operator: string;
  lastInspected: string;
}

export interface PharmacyDutyItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  isOnDutyNow: boolean;
  isNightShift: boolean;
  phone: string;
}

// ==========================================
// 6. MICROCLIMA & ISOLE DI CALORE (Copernicus LST / Landsat Thermal)
// ==========================================
export interface HeatIslandSurfaceTempItem {
  id: string;
  zoneName: string;
  lat: number;
  lon: number;
  surfaceTempCelsius: number;
  airTempDelta: number; // Gradi rispetto alla temperatura di riferimento
  surfaceType: 'PIETRA_ISTRIA' | 'TETTO_TEGOLE' | 'ACQUA_CANALE' | 'VERDE_URBANO' | 'ASFALTO_PORTUALE';
  coolingEffect: 'ALTO' | 'NEUTRO' | 'ISOLA_DI_CALORE';
  satelliteMission: string;
}

// ==========================================
// 7. OPEN DATA REGIONE VENETO (dati.veneto.it / ARPAV / Direzione Turismo)
// ==========================================
export interface LagoonWaterQualityItem {
  id: string;
  stationName: string;
  subBasin: 'LAGUNA_NORD' | 'LAGUNA_CENTRO' | 'LAGUNA_SUD';
  lat: number;
  lon: number;
  waterTempCelsius: number;
  salinityPsu: number; // Salinità in Practical Salinity Units
  dissolvedOxygenPercent: number; // % saturazione ossigeno disciolto
  dissolvedOxygenMgL: number; // mg/L
  ph: number;
  turbidityNtu: number; // Torbidità NTU
  conductivityMsCm: number; // Conducibilità mS/cm
  trophicState: 'BUONO' | 'ELEVATO' | 'SUFFICIENTE' | 'CRITICO';
  monitoringDepthMeters: number;
  lastUpdated: string;
  officialSource: string;
}

export interface TouristAccommodationItem {
  id: string;
  zoneName: string;
  sestiereOrLocation: string;
  lat: number;
  lon: number;
  totalStructures: number;
  totalBeds: number;
  hotelCount: number;
  extraHotelCount: number; // B&B, locazioni turistiche, affittacamere
  densityCategory: 'CRITICA' | 'MOLTO_ALTA' | 'ALTA' | 'MODERATA';
  bedsPerResidentRatio: number; // Rapporto posti letto turistici / popolazione residente
  starRatingBreakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoOneStar: number;
    bAndB: number;
    holidayHomes: number;
  };
  officialSource: string;
}

export interface RegionalBikeRouteItem {
  id: string;
  routeName: string;
  section: string;
  surfaceType: 'ASFALTO_CICLABILE' | 'PIETRA_MURAZZI' | 'SENTIERO_STERRATO';
  lengthKm: number;
  elevationGainM: number;
  difficulty: 'FACILE_PANORAMICO' | 'MEDIO' | 'CICLOTURISMO';
  ferryInterchange: string;
  path: [number, number][]; // [lon, lat]
  description: string;
  officialSource: string;
}

export interface PollenFamilyItem {
  family: string;
  commonName: string;
  level: 'BASSO' | 'MEDIO' | 'ALTO' | 'MOLTO_ALTO';
  concentrationGrainsM3: number;
  trend: 'STABILE' | 'CRESCITA' | 'DIMINUZIONE';
  allergenicity: 'MOLTO_ALTA' | 'ALTA' | 'MEDIA' | 'BASSA';
}

export interface PollenMonitoringStationItem {
  id: string;
  stationName: string;
  locationName: string;
  lat: number;
  lon: number;
  pollens: PollenFamilyItem[];
  overallAllergyRisk: 'BASSO' | 'MEDIO' | 'ALTO';
  samplerType: 'CAPTOR_VOLUMETRICO_BURKARD' | 'AUTOMATICO_CONTINUO';
  bulletinWeek: string;
  officialSource: string;
}

export interface LagoonTributaryRiverItem {
  id: string;
  riverName: string;
  mouthZone: string;
  lat: number;
  lon: number;
  path: [number, number][]; // [lon, lat]
  avgFlowM3s: number; // Portata idrica media m³/s
  basinAreaKm2: number;
  waterQualityState: 'BUONO' | 'SUFFICIENTE' | 'ELEVATO';
  managementConsortium: string;
  freshwaterInputNotes: string;
  officialSource: string;
}



