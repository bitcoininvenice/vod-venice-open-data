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
  cpsmStationsCount: number | null;
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
  maritimeChannelsCount: number | null;
  restrictedLagoonVesselsCount: number | null;

  // Voli & Aeroporto VCE (ENAV / OpenSky)
  activeFlightsCount: number | null;
  vceDailyMovements: number | null;
  averageFlightAltitudeMeters: number;

  // Flussi Pedonali (Smart Control Room)
  pedestrianSensorsCount: number | null;
  totalHourlyPedestrians: number | null;
  peakPedestrianSensor: string | null;

  // Mobilità Terraferma & Parcheggi AVM
  totalParkingSpaces: number | null;
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
  occupazioniAttive: number | null;
  stopsNearWorksites200m: number;
  drinkingFountainsCount: number;
  accessibleBridgesCount: number | null;
  veritasServicePointsCount: number | null;

  // Nuovi Open Data Venezia: Emergenza, Laguna, Ambiente & Servizi
  passerelleTotalMeters: number;
  passerelleMountedCount: number;
  briccoleCount: number;
  marineLightsCount: number | null;
  oceanStationsCount: number;
  cnrWaveHeightMeters: number | null;
  cnrWaterTempC: number | null;
  bathingWaterStationsCount: number;
  monumentalTreesCount: number | null;
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
  source?: PointSource;
  sourceUrl?: string;
}

export interface ParkingItem {
  id: string;
  name: string;
  location: string;
  totalSpots: number | null;
  freeSpots?: number;
  lat: number;
  lon: number;
  /** Tariffa riportata nell'elenco curato (non verificata); assente per i dati OSM */
  rateHourly?: string;
  operator: string;
  source: PointSource;
  sourceUrl?: string;
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
  /** Previsione oraria del modello Copernicus CAMS nel punto della stazione (non misura ARPAV) */
  forecast?: AirForecast | null;
}

export interface AirForecast {
  validTime: string;
  pm10: number | null;
  pm25: number | null;
  no2: number | null;
  o3: number | null;
  /** European Air Quality Index (0-100+) */
  europeanAqi: number | null;
  uvIndex: number | null;
  uvMaxToday: number | null;
  /** indice europeo per le prossime 24 ore, un valore all'ora */
  aqiNext24h: Array<number | null>;
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

export interface MarineForecast {
  validTime: string;
  waveHeightM: number | null;
  waveDirectionDeg: number | null;
  wavePeriodS: number | null;
  seaTempC: number | null;
  /** onda massima prevista nelle prossime 72 ore e ora locale in cui è attesa */
  waveMax72hM: number | null;
  waveMax72hAt: string | null;
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
  /** Ora locale (HH:MM) dell'ultima misura aperta; null se la stazione non ha misure pubblicate */
  observedAt: string | null;
  /** Previsione del modello marino (Open-Meteo), distinta dalle misure */
  forecast?: MarineForecast | null;
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
  blueFlag: boolean;
  officialSource: string;
}

export interface UrbanTreeItem {
  id: string;
  species: string;
  commonName: string;
  location: string;
  lat: number;
  lon: number;
  heightMeters: number | null;
  circumferenceMeters?: number | null;
  /** Codice dell'Elenco nazionale degli alberi monumentali (MASAF), se riportato */
  masafRef?: string | null;
  source: PointSource;
  sourceUrl?: string;
}

/** Ecocentro o biblioteca mappati su OpenStreetMap. */
export interface CivicPoiItem {
  id: string;
  kind: 'recycling' | 'library';
  name: string;
  lat: number;
  lon: number;
  operator: string | null;
  openingHours: string | null;
  website: string | null;
  address: string | null;
  zone: string;
  source: 'OPENSTREETMAP';
  sourceUrl: string;
}

/** Origine di un punto: OpenStreetMap (ODbL) o elenco compilato nel progetto, da verificare. */
export type PointSource = 'OPENSTREETMAP' | 'ELENCO_CURATO';

export interface EvChargingItem {
  id: string;
  name: string;
  operator: string;
  location: string;
  lat: number;
  lon: number;
  /** Prese dichiarate (null se la fonte non lo indica) */
  totalSockets: number | null;
  /** Disponibilità in tempo reale: non pubblicata dai gestori, quindi null */
  availableSockets: number | null;
  powerKw: number | null;
  socketTypes: string[];
  openingHours?: string | null;
  source: PointSource;
  sourceUrl?: string;
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

/**
 * Campo di vento previsto su una griglia regolare (Open-Meteo, modelli numerici).
 * u e v in m/s, verso est e verso nord; righe da sud a nord, colonne da ovest a est.
 */
export interface WindField {
  /** Ora locale (Europe/Rome) a cui si riferisce la previsione, es. "2026-10-09T10:30" */
  validTime: string;
  fetchedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  lon0: number;
  lat0: number;
  dLon: number;
  dLat: number;
  nx: number;
  ny: number;
  u: number[];
  v: number[];
  maxSpeedMs: number;
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
  platform: string;
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
  /** Campi descrittivi presenti solo nell'elenco curato (da verificare) */
  century?: string;
  material?: 'PIETRA_D_ISTRIA' | 'ROSSO_DI_VERONA' | 'MARMO_GRECO';
  style?: 'GOTICO' | 'RINASCIMENTALE' | 'VENETO_BIZANTINO';
  campo?: string;
  lat: number;
  lon: number;
  source: PointSource;
  sourceUrl?: string;
  /** true se la posizione dell'elenco curato coincide con un pozzo mappato in OSM */
  positionConfirmed?: boolean;
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
  /** Nessun dataset aperto degli approdi SUEM 118: tutte le voci sono di un elenco curato da verificare */
  source: 'ELENCO_CURATO';
}

export interface PublicDaeItem {
  id: string;
  code: string;
  location: string;
  lat: number;
  lon: number;
  /** H24 solo se dichiarato dalla fonte; NON_INDICATO quando la fonte non riporta gli orari */
  accessType: 'PUBBLICO_H24' | 'ORARIO_DIURNO' | 'ORARIO_LIMITATO' | 'NON_INDICATO';
  operator: string;
  /** OPENSTREETMAP (ODbL) oppure ELENCO_CURATO: voce del progetto non ancora confermata da una fonte aperta */
  source: 'OPENSTREETMAP' | 'ELENCO_CURATO';
  sourceUrl?: string;
  openingHours?: string;
  indoor?: boolean;
  /** Data dell'ultimo controllo riportata dalla fonte (OSM check_date), se presente */
  checkDate?: string;
}

/**
 * Farmacia. I turni cambiano ogni giorno e non sono open data: nessun campo "di turno"
 * (l'interfaccia rimanda alla pagina ufficiale ULSS 3).
 */
export interface PharmacyItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  openingHours?: string;
  /** OPENSTREETMAP (ODbL) oppure ELENCO_CURATO: voce del progetto non confermata da una fonte aperta */
  source: 'OPENSTREETMAP' | 'ELENCO_CURATO';
  sourceUrl?: string;
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
/** Stazione di monitoraggio ARPAV della laguna: ultimo campionamento dell'anno, al punto più vicino alla superficie. */
export interface LagoonWaterQualityItem {
  id: string;
  stationName: string;
  lat: number;
  lon: number;
  /** data del campionamento (AAAA-MM-GG) */
  sampledAt: string;
  time: string | null;
  depthMeters: number;
  samplingDays: number;
  waterTempCelsius: number | null;
  conductivityMsCm: number | null;
  salinityPsu: number | null;
  dissolvedOxygenPercent: number | null;
  dissolvedOxygenMgL: number | null;
  ph: number | null;
  chlorophyllUgL: number | null;
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

export type PollenKey = 'alder' | 'birch' | 'grass' | 'mugwort' | 'olive' | 'ragweed';
export type PollenLevel = 'ASSENTE' | 'BASSO' | 'MEDIO' | 'ALTO';

export interface PollenFamilyItem {
  key: PollenKey;
  /** granuli/m³ previsti; null se il modello non dà il valore (fuori stagione) */
  grainsM3: number | null;
  level: PollenLevel;
}

/** Punto di previsione dei pollini (Copernicus CAMS via Open-Meteo): modello, non campionatore. */
export interface PollenMonitoringStationItem {
  id: string;
  stationName: string;
  lat: number;
  lon: number;
  /** ora locale della previsione; null se la fonte non era raggiungibile */
  validTime: string | null;
  pollens: PollenFamilyItem[];
  overallAllergyRisk: PollenLevel | null;
  /** Calendario misurato da ARPAV (solo per il punto di Venezia, stazione aerobiologica) */
  measured?: PollenMeasuredProfile | null;
}

/** Medie e massimi mensili (granuli/m³) misurati da ARPAV a Venezia nell'ultimo anno pubblicato. */
export interface PollenMeasuredProfile {
  year: number;
  days: number;
  families: Record<string, { mean: Array<number | null>; max: Array<number | null> }>;
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



