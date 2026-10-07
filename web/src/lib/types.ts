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

export interface CantiereItem {
  id: number;
  codice: string;
  titolo: string;
  localizzazione: string;
  quartiere: string;
  tipologia: string;
  stato: 'In corso' | 'Programmato' | 'Concluso';
  dataInizio: string;
  dataFinePrevista: string;
  importoLavori: number;
  enteResponsabile: string;
  impattoMobilita: 'Basso' | 'Medio' | 'Critico';
  dettagli: string;
  lat: number;
  lon: number;
}

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
  impattoMobilita: string;
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

export interface PlatformMetrics {
  // Trasporto Pubblico ACTV
  totalRoutes: number;
  routesNavigazione: number;
  routesAutomobilistico: number;
  totalStops: number;
  totalTrips: number;
  activeVehiclesInService: number;

  // Alilaguna S.p.A. (Transitland f-u20f-alilagunaspa)
  alilagunaRoutesCount: number;
  alilagunaStopsCount: number;
  alilagunaBoatsCount: number;

  // Maree & MOSE (CPSM Centro Maree)
  tideLevelCm: number;
  moseStatus: string;
  moseGatesCount: number;
  cpsmStationsCount: number;
  floodingPercentage: number;

  // Qualità dell'Aria & Ambiente (ARPAV)
  airStationsCount: number;
  averageAqi: number;
  averagePm10: number;
  averageNo2: number;
  airQualityStatus: string;

  // Traffico Marittimo AIS & Canali (VTS / Crociere)
  activeShipsCount: number;
  totalGrossTonnage: number;
  maritimeChannelsCount: number;
  restrictedLagoonVesselsCount: number;

  // Voli & Aeroporto VCE (ENAV / OpenSky)
  activeFlightsCount: number;
  vceDailyMovements: number;
  averageFlightAltitudeMeters: number;

  // Flussi Pedonali (Smart Control Room)
  pedestrianSensorsCount: number;
  totalHourlyPedestrians: number;
  peakPedestrianSensor: string;

  // Mobilità Terraferma & Parcheggi AVM
  totalParkingSpaces: number;
  freeParkingSpots: number;
  parkingOccupancyRate: number;

  // Satelliti & Osservazione Spaziale (Copernicus ESA / ASI / NASA)
  activeSatellitesCount: number;
  copernicusSentinelsCount: number;
  radarEarthObservationSwathKm: number;
  nextOrbitalPassMinutes: number;

  // Patrimonio & Opere Pubbliche
  activeCantieri: number;
  totalInvestmentCantieri: number;
  occupazioniAttive: number;
  stopsNearWorksites200m: number;
  drinkingFountainsCount: number;
  accessibleBridgesCount: number;
  veritasServicePointsCount: number;
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
  status: 'ABBASSATO' | 'IN_SOLLEVAMENTO' | 'ATTIVATO';
  elevationCm: number;
  tideSeaCm: number;
  tideLagoonCm: number;
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
}

export interface ParkingItem {
  id: string;
  name: string;
  location: 'Piazzale Roma' | 'Tronchetto' | 'Mestre';
  totalSpots: number;
  freeSpots: number;
  lat: number;
  lon: number;
  rateHourly: string;
  operator: string;
}

export interface AirQualityItem {
  id: string;
  stationName: string;
  location: string;
  lat: number;
  lon: number;
  aqi: 'BUONA' | 'ACCETTABILE' | 'SCADENTE';
  pm10: number; // µg/m³
  pm25: number; // µg/m³
  no2: number; // µg/m³
  lastUpdate: string;
}

export interface PedestrianFlowItem {
  id: string;
  sensorName: string;
  location: string;
  lat: number;
  lon: number;
  hourlyFlow: number;
  trend: 'STABILE' | 'IN_AUMENTO' | 'IN_CALO';
  crowdingLevel: 'BASSO' | 'MEDIO' | 'ELEVATO';
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
}
