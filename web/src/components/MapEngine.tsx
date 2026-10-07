'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Navigation, Plane, Anchor, Waves, Ship, Droplets, Car, Wind, Footprints, Satellite, Plus, Minus, Maximize2 } from 'lucide-react';
import {
  CameraViewPreset,
  TransportModeCategory,
  StopItem,
  CantiereItem,
  PaletteTheme,
  FlightItem,
  ShipItem,
  MoseGateItem,
  CityAssetItem,
  ParkingItem,
  AirQualityItem,
  PedestrianFlowItem,
  AlilagunaRoute,
  AlilagunaStop,
  AlilagunaBoat,
  SatelliteItem,
  PasserellaItem,
  BriccolaSignalItem,
  OceanStationItem,
  BathingWaterItem,
  UrbanTreeItem,
  EvChargingItem,
  WifiHotspotItem,
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
} from '@/lib/types';
import { VeniceFeatureSelected } from './VeniceFeatureDetailModal';
import { D, LAND, CFG } from '@/lib/simulation-data';
import { getDynamicPalette, NOTTE, CARTA, ColorScheme } from '@/lib/solar';

const MARITIME_CHANNELS = [
  {
    id: 'CANALE_PETROLI',
    name: 'Canale dei Petroli / Malamocco - Marghera',
    type: 'DEEP_WATER',
    color: '#f59e0b',
    depth: '-14.5m',
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
    color: '#6366f1',
    depth: '-11.0m',
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
    name: 'Canale Ferry-Boat Linea 17',
    type: 'FERRY',
    color: '#14b8a6',
    depth: '-7.0m',
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
    color: '#06b6d4',
    depth: '-15.0m',
    waypoints: [
      { name: 'SAN BASILIO MARITTIMA', depth: '-7.5m', lon: 12.3160, lat: 45.4335 },
      { name: 'CANALE DELLA GRAZIA', depth: '-8.0m', lon: 12.3450, lat: 45.4220 },
      { name: 'BOCCA DI LIDO SUD', depth: '-10.5m', lon: 12.4200, lat: 45.4150 },
      { name: 'ADRIATICO OPEN SEA', depth: '-22.0m', lon: 12.4850, lat: 45.3900 }
    ]
  }
];

// Smooth Kinematics Helper: Interpolate point along polyline waypoints
function interpolateAlongWaypoints(
  wps: { lon: number; lat: number }[],
  progress: number
): { lon: number; lat: number; heading: number } {
  if (!wps || wps.length === 0) return { lon: 12.338, lat: 45.438, heading: 0 };
  if (wps.length === 1) return { lon: wps[0].lon, lat: wps[0].lat, heading: 0 };

  const dists: number[] = [0];
  for (let i = 1; i < wps.length; i++) {
    const d = Math.hypot(wps[i].lon - wps[i - 1].lon, wps[i].lat - wps[i - 1].lat);
    dists.push(dists[i - 1] + d);
  }
  const totalDist = dists[dists.length - 1];
  if (totalDist <= 0) return { lon: wps[0].lon, lat: wps[0].lat, heading: 0 };

  const targetDist = Math.max(0, Math.min(1, progress)) * totalDist;

  let seg = 1;
  while (seg < dists.length && dists[seg] < targetDist) {
    seg++;
  }
  if (seg >= dists.length) seg = dists.length - 1;

  const p0 = wps[seg - 1];
  const p1 = wps[seg];
  const segSpan = dists[seg] - dists[seg - 1];
  const frac = segSpan > 0 ? (targetDist - dists[seg - 1]) / segSpan : 0;

  const lon = p0.lon + frac * (p1.lon - p0.lon);
  const lat = p0.lat + frac * (p1.lat - p0.lat);
  const headingRad = Math.atan2(p1.lon - p0.lon, p1.lat - p0.lat);
  const heading = (headingRad * 180 / Math.PI + 360) % 360;

  return { lon, lat, heading };
}

// Live kinematics for airplanes around Venice (continuous 60 FPS motion synced to timeline)
function getLiveFlight(
  f: FlightItem,
  t: number
): { lon: number; lat: number; heading: number; alt: number } {
  const rad = (f.trackDegrees * Math.PI) / 180;
  const cycleSeconds = 240; // 4 minutes radar loop across lagoon sector
  const seed = (parseInt(f.icao24, 16) || 0) * 31;
  const progress = ((t + seed) % cycleSeconds) / cycleSeconds;

  // Flight displacement along its track angle (-0.08° to +0.08° across the lagoon sector)
  const distDeg = (progress - 0.5) * 0.16;
  const lon = f.lon + Math.sin(rad) * distDeg;
  const lat = f.lat + Math.cos(rad) * distDeg;
  const heading = f.trackDegrees;
  const alt = Math.max(120, Math.round(f.altitudeMeters + (f.verticalRate || 0) * (progress - 0.5) * 60));

  return { lon, lat, heading, alt };
}

// Live kinematics for AIS ships along maritime navigation channels
function getLiveShip(
  sh: ShipItem,
  t: number
): { lon: number; lat: number; heading: number } {
  if (sh.speedKnots <= 0.2) {
    return { lon: sh.lon, lat: sh.lat, heading: sh.heading };
  }

  const channel = MARITIME_CHANNELS.find((c) => c.id === sh.routeId);
  if (!channel || !channel.waypoints || channel.waypoints.length < 2) {
    const rad = (sh.heading * Math.PI) / 180;
    const cycle = 1800;
    const hash = (parseInt(sh.mmsi, 10) || 1) * 37;
    const p = ((t + hash) % cycle) / cycle;
    const dist = (p - 0.5) * 0.03;
    return {
      lon: sh.lon + Math.sin(rad) * dist,
      lat: sh.lat + Math.cos(rad) * dist,
      heading: sh.heading
    };
  }

  const wps = channel.waypoints.map((w) => ({ lon: w.lon, lat: w.lat }));
  const cycle = 2400; // 40 min roundtrip
  const hash = (parseInt(sh.mmsi, 10) || 1) * 47;
  const p = ((t + hash) % cycle) / cycle;

  if (p <= 0.5) {
    const prog = p * 2;
    return interpolateAlongWaypoints(wps, prog);
  } else {
    const prog = (1 - p) * 2;
    const pt = interpolateAlongWaypoints(wps, prog);
    return {
      lon: pt.lon,
      lat: pt.lat,
      heading: (pt.heading + 180) % 360
    };
  }
}

// Live kinematics for Alilaguna waterbuses along route shapes
function getLiveAlilagunaBoat(
  b: AlilagunaBoat,
  t: number,
  routes: AlilagunaRoute[]
): { lon: number; lat: number; heading: number } {
  const route = routes.find((r) => r.lineCode === b.lineCode || r.id === b.lineCode);
  if (!route || !route.shape || route.shape.length < 2) {
    const rad = (b.heading * Math.PI) / 180;
    const cycle = 1200;
    const hash = (parseInt(b.id.replace(/\D/g, ''), 10) || 1) * 59;
    const p = ((t + hash) % cycle) / cycle;
    const dist = (p - 0.5) * 0.02;
    return {
      lon: b.lon + Math.sin(rad) * dist,
      lat: b.lat + Math.cos(rad) * dist,
      heading: b.heading
    };
  }

  const wps = route.shape.map((pt) => ({ lon: pt[0], lat: pt[1] }));
  const cycle = 1800; // 30 min roundtrip
  const hash = (parseInt(b.id.replace(/\D/g, ''), 10) || 1) * 113;
  const p = ((t + hash) % cycle) / cycle;

  if (p <= 0.5) {
    const prog = p * 2;
    return interpolateAlongWaypoints(wps, prog);
  } else {
    const prog = (1 - p) * 2;
    const pt = interpolateAlongWaypoints(wps, prog);
    return {
      lon: pt.lon,
      lat: pt.lat,
      heading: (pt.heading + 180) % 360
    };
  }
}

// Live kinematics for Earth Observation Satellites (continuous orbital pass across Venetian sky)
function getLiveSatellite(
  sat: SatelliteItem,
  t: number
): { lon: number; lat: number; heading: number } {
  if (!sat.groundTrack || sat.groundTrack.length < 2) {
    return { lon: sat.currentLon, lat: sat.currentLat, heading: sat.heading };
  }

  const wps = sat.groundTrack.map((pt) => ({ lon: pt[0], lat: pt[1] }));
  const cycleSeconds = 180; // 3 min orbital pass interval across radar screen
  const hash = sat.noradId * 17;
  const progress = ((t + hash) % cycleSeconds) / cycleSeconds;

  return interpolateAlongWaypoints(wps, progress);
}

interface MapEngineProps {
  currentTimeSeconds: number;
  selectedDay: 'weekday' | 'saturday' | 'sunday';
  paletteTheme: PaletteTheme;
  currentView: CameraViewPreset;
  showRoutes: boolean;
  showStops: boolean;
  showVehicles: boolean;
  showCantieri: boolean;
  showSpatialBuffer: boolean;
  showFlights?: boolean;
  flights?: FlightItem[];
  showShips?: boolean;
  showShipRoutes?: boolean;
  ships?: ShipItem[];
  showMose?: boolean;
  moseGates?: MoseGateItem[];
  showCityAssets?: boolean;
  fountains?: CityAssetItem[];
  accessibleBridges?: CityAssetItem[];
  veritasServices?: CityAssetItem[];
  showParkings?: boolean;
  parkings?: ParkingItem[];
  showAirQuality?: boolean;
  airStations?: AirQualityItem[];
  showPedestrianFlows?: boolean;
  pedestrianFlows?: PedestrianFlowItem[];
  showAlilaguna?: boolean;
  alilagunaRoutes?: AlilagunaRoute[];
  alilagunaStops?: AlilagunaStop[];
  alilagunaBoats?: AlilagunaBoat[];
  onSelectAlilaguna?: () => void;
  showSatellites?: boolean;
  satellites?: SatelliteItem[];
  onSelectSatellite?: (satellite: SatelliteItem) => void;
  showPasserelle?: boolean;
  passerelle?: PasserellaItem[];
  showMarineSignals?: boolean;
  briccole?: BriccolaSignalItem[];
  showOceanStations?: boolean;
  oceanStations?: OceanStationItem[];
  showBathingWaters?: boolean;
  bathingWaters?: BathingWaterItem[];
  showTrees?: boolean;
  trees?: UrbanTreeItem[];
  showServicesVenice?: boolean;
  evCharging?: EvChargingItem[];
  wifiHotspots?: WifiHotspotItem[];
  onSelectFeature?: (feature: VeniceFeatureSelected) => void;
  bufferRadiusMeters: number;
  selectedCategory: TransportModeCategory | 'all';
  cantieri: CantiereItem[];
  stops: StopItem[];
  onSelectStop: (stop: StopItem) => void;
  onSelectCantiere: (cantiere: CantiereItem) => void;
  onSelectAirport?: () => void;
  onSelectShip?: (ship: ShipItem) => void;
  onSelectMose?: () => void;
  focusedCoordinates?: { lat: number; lon: number } | null;
  // New Open Data Feeds
  showCanalLimits?: boolean;
  canalSpeedLimits?: CanalSpeedLimitItem[];
  showBridges?: boolean;
  bridges?: BridgeClearanceItem[];
  showGondolas?: boolean;
  gondolas?: GondolaStationItem[];
  showDocks?: boolean;
  docks?: PublicDockItem[];
  showSubsidence?: boolean;
  subsidencePoints?: SubsidenceInSARItem[];
  showMorphology?: boolean;
  lagoonMorphology?: LagoonMorphologyItem[];
  showMarineWind?: boolean;
  marineWindStations?: MeteoMarineWindItem[];
  showTrains?: boolean;
  liveTrains?: TrainLiveItem[];
  showWasteBoats?: boolean;
  wasteBoats?: VeritasWasteBoatItem[];
  showNizioleti?: boolean;
  nizioleti?: NizioletoCivicoItem[];
  showWells?: boolean;
  wells?: VeniceWellItem[];
  showBellTowers?: boolean;
  bellTowers?: BellTowerItem[];
  showFortresses?: boolean;
  fortressIslands?: LagoonFortressIslandItem[];
  showEmergencyDocks?: boolean;
  emergencyDocks?: EmergencyWaterDockItem[];
  showDae?: boolean;
  daeList?: PublicDaeItem[];
  showPharmacies?: boolean;
  pharmacies?: PharmacyDutyItem[];
  showHeatIslands?: boolean;
  heatIslands?: HeatIslandSurfaceTempItem[];
  tideLevel?: number;
  isDesktopLayerPanelOpen?: boolean;
}

export const MapEngine: React.FC<MapEngineProps> = ({
  currentTimeSeconds,
  selectedDay,
  paletteTheme,
  currentView,
  showRoutes,
  showStops,
  showVehicles,
  showCantieri,
  showSpatialBuffer,
  showFlights = false,
  flights = [],
  showShips = true,
  showShipRoutes = true,
  ships = [],
  showMose = true,
  moseGates = [],
  showCityAssets = true,
  fountains = [],
  accessibleBridges = [],
  veritasServices = [],
  showParkings = true,
  parkings = [],
  showAirQuality = true,
  airStations = [],
  showPedestrianFlows = true,
  pedestrianFlows = [],
  showAlilaguna = true,
  alilagunaRoutes = [],
  alilagunaStops = [],
  alilagunaBoats = [],
  onSelectAlilaguna,
  showSatellites = true,
  satellites = [],
  onSelectSatellite,
  showPasserelle = true,
  passerelle = [],
  showMarineSignals = true,
  briccole = [],
  showOceanStations = true,
  oceanStations = [],
  showBathingWaters = true,
  bathingWaters = [],
  showTrees = true,
  trees = [],
  showServicesVenice = true,
  evCharging = [],
  wifiHotspots = [],
  onSelectFeature,
  bufferRadiusMeters,
  selectedCategory,
  cantieri,
  stops,
  onSelectStop,
  onSelectCantiere,
  onSelectAirport,
  onSelectShip,
  onSelectMose,
  focusedCoordinates,
  showCanalLimits = false,
  canalSpeedLimits = [],
  showBridges = false,
  bridges = [],
  showGondolas = false,
  gondolas = [],
  showDocks = false,
  docks = [],
  showSubsidence = false,
  subsidencePoints = [],
  showMorphology = false,
  lagoonMorphology = [],
  showMarineWind = false,
  marineWindStations = [],
  showTrains = false,
  liveTrains = [],
  showWasteBoats = false,
  wasteBoats = [],
  showNizioleti = false,
  nizioleti = [],
  showWells = false,
  wells = [],
  showBellTowers = false,
  bellTowers = [],
  showFortresses = false,
  fortressIslands = [],
  showEmergencyDocks = false,
  emergencyDocks = [],
  showDae = false,
  daeList = [],
  showPharmacies = false,
  pharmacies = [],
  showHeatIslands = false,
  heatIslands = [],
  tideLevel = 76,
  isDesktopLayerPanelOpen = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map coordinate bounds
  const W = D.W; // 26194
  const H = D.H; // 38701
  const [LON0, LON1, LAT0, LAT1] = D.frame;
  const KX = W / (LON1 - LON0);
  const KY = H / (LAT1 - LAT0);

  const mx = useCallback((lon: number) => (lon - LON0) * KX, [LON0, KX]);
  const my = useCallback((lat: number) => (LAT1 - lat) * KY, [LAT1, KY]);
  const invLon = useCallback((x: number) => LON0 + x / KX, [LON0, KX]);
  const invLat = useCallback((y: number) => LAT1 - y / KY, [LAT1, KY]);

  // View Camera State (x0, y0, scale)
  const [camera, setCamera] = useState({ x0: 0, y0: 0, s: 0.02 });
  const [targetCamera, setTargetCamera] = useState({ x0: 0, y0: 0, s: 0.02 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  // Hover & Selection state
  const [hoveredVehicle, setHoveredVehicle] = useState<{ line: string; label: string; x: number; y: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<{
    line: string;
    category: string;
    speedKmh: number;
    screenX: number;
    screenY: number;
    color: string;
    headsign: string;
  } | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightItem | null>(null);
  const [selectedShipOnMap, setSelectedShipOnMap] = useState<ShipItem | null>(null);
  const [selectedAlilagunaBoat, setSelectedAlilagunaBoat] = useState<AlilagunaBoat | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteItem | null>(null);

  // Active Fleet preallocated buffers
  const simDataRef = useRef<any>(null);

  // Initialize simulation shapes, routes, profiles, and trips
  useEffect(() => {
    const CATS = CFG.cats;
    const catMap = new Map(CATS.map((c: any, i: number) => [c.k, i]));

    const catOf = (r: any) => {
      let d = 0;
      for (let i = 0; i < CATS.length; i++) {
        const c: any = CATS[i];
        if (c.base !== r.c) continue;
        if (c.lines && c.lines.includes(r.n)) return i;
        d = i;
      }
      return d;
    };

    const shapes = D.shapes.map((a: number[]) => {
      const n = a.length / 2;
      const xy = new Float32Array(a);
      const cum = new Float32Array(n);
      for (let i = 1; i < n; i++) {
        cum[i] = cum[i - 1] + Math.hypot(xy[2 * i] - xy[2 * i - 2], xy[2 * i + 1] - xy[2 * i - 1]);
      }
      return { xy, cum, n };
    });

    const routes = D.routes.map((r: any) => ({ ...r, ci: catOf(r) }));

    const profs = D.profiles.map((p: any) => ({
      sh: shapes[p[0]],
      route: routes[p[1]],
      T: Int32Array.from(p[2]),
      Dd: Int32Array.from(p[3])
    }));

    // Precalculate trip departure and duration
    const daysTrips: Record<string, { tP: Int32Array; t0: Int32Array; t1: Int32Array; count: number }> = {};
    for (const dKey of ['weekday', 'saturday', 'sunday']) {
      const rawTrips = (D.days as any)[dKey]?.trips || [];
      const count = rawTrips.length;
      const tP = new Int32Array(count);
      const t0 = new Int32Array(count);
      const t1 = new Int32Array(count);

      rawTrips.forEach((t: number[], i: number) => {
        const p = profs[t[0]];
        tP[i] = t[0];
        t0[i] = t[1];
        t1[i] = t[1] + p.T[p.T.length - 1];
      });

      daysTrips[dKey] = { tP, t0, t1, count };
    }

    simDataRef.current = {
      shapes,
      routes,
      profs,
      daysTrips,
      CATS
    };
  }, []);

  // Update camera based on presets with exact mathematical centering
  const updateCameraToPreset = useCallback((preset: CameraViewPreset, containerWidth: number, containerHeight: number) => {
    const cw = containerWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const ch = containerHeight || (typeof window !== 'undefined' ? window.innerHeight - 56 : 720);
    const isMobile = cw < 768;
    const bottomInset = isMobile ? 120 : 0; // Account for floating TimelineControls on mobile
    const chEffective = ch - bottomInset;

    let target = { x0: 0, y0: 0, s: 0.02 };

    if (preset === 'lagoon') {
      // Entire Venetian Lagoon / Central Basin view
      // Mobile: increased by 1 zoom level (+1 zoom click / 1.35x, s = Math.min(cw / 14400, chEffective / 16300)), centered at 45.4265
      // Desktop: increased by 2 zoom levels (+2 zoom clicks / 2x scale, s = Math.min(cw / 7500, ch / 9000)), centered at 12.3280 / 45.4380 with space for LayerPanel
      const s = isMobile ? Math.min(cw / 14400, chEffective / 16300) : Math.min(cw / 7500, ch / 9000);
      const centerLon = isMobile ? 12.3380 : (isDesktopLayerPanelOpen ? 12.3280 : 12.3380);
      const centerLat = isMobile ? 45.4265 : 45.4380;
      target = {
        s,
        x0: mx(centerLon) - cw / (2 * s),
        y0: my(centerLat) - chEffective / (2 * s)
      };
    } else if (preset === 'venezia') {
      // Historical Venice (San Marco, Rialto, Canal Grande, Giudecca, Piazzale Roma)
      // Center coordinates (lon: 12.3358, lat: 45.4371)
      const s = isMobile ? Math.min(cw / 5400, chEffective / 4600) : Math.min(cw / 6200, ch / 5000);
      target = {
        s,
        x0: mx(12.3358) - cw / (2 * s),
        y0: my(45.4371) - chEffective / (2 * s)
      };
    } else if (preset === 'mestre') {
      // Mainland Mestre (Piazza Ferretto, Stazione FS, Marghera, Parco San Giuliano)
      // Center coordinates (lon: 12.2420, lat: 45.4880)
      const s = isMobile ? Math.min(cw / 6800, chEffective / 5600) : Math.min(cw / 7500, ch / 6200);
      target = {
        s,
        x0: mx(12.2420) - cw / (2 * s),
        y0: my(45.4880) - chEffective / (2 * s)
      };
    } else if (preset === 'lido') {
      // Lido di Venezia (Piazzale SME, Gran Viale, San Nicolò, Darsena)
      // Center coordinates (lon: 12.3685, lat: 45.4180)
      const s = isMobile ? Math.min(cw / 6000, chEffective / 5600) : Math.min(cw / 6800, ch / 6400);
      target = {
        s,
        x0: mx(12.3685) - cw / (2 * s),
        y0: my(45.4180) - chEffective / (2 * s)
      };
    } else if (preset === 'aeroporto') {
      // Marco Polo VCE Airport Hub (Runway 04R/22L, Terminal, Darsena Alilaguna)
      // Center coordinates (lon: 12.3480, lat: 45.5030)
      const s = isMobile ? Math.min(cw / 5200, chEffective / 4600) : Math.min(cw / 5800, ch / 5200);
      target = {
        s,
        x0: mx(12.3480) - cw / (2 * s),
        y0: my(45.5030) - chEffective / (2 * s)
      };
    }

    setTargetCamera(target);
    setCamera(target);
  }, [mx, my, isDesktopLayerPanelOpen]);

  // Handle focused coordinates (e.g. from spatial modal)
  useEffect(() => {
    if (focusedCoordinates && containerRef.current) {
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || (window.innerHeight - 56);
      const s = Math.min(w / 3800, h / 3200);
      const newCam = {
        s,
        x0: mx(focusedCoordinates.lon) - w / (2 * s),
        y0: my(focusedCoordinates.lat) - h / (2 * s)
      };
      setTargetCamera(newCam);
      setCamera(newCam);
    }
  }, [focusedCoordinates, mx, my]);

  // Resize handler with ResizeObserver for immediate initial container measurement
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || (window.innerHeight - 56);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;

      updateCameraToPreset(currentView, w, h);
    };

    handleResize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentView, updateCameraToPreset]);

  // Manual Zoom & Centering handlers (+ / - / Reset)
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || (window.innerHeight - 56);
    const factor = 1.35;
    setCamera((prev) => {
      const newS = Math.min(0.25, prev.s * factor);
      const centerMapX = prev.x0 + w / (2 * prev.s);
      const centerMapY = prev.y0 + h / (2 * prev.s);
      return {
        s: newS,
        x0: centerMapX - w / (2 * newS),
        y0: centerMapY - h / (2 * newS)
      };
    });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || (window.innerHeight - 56);
    const factor = 1 / 1.35;
    setCamera((prev) => {
      const newS = Math.max(0.005, prev.s * factor);
      const centerMapX = prev.x0 + w / (2 * prev.s);
      const centerMapY = prev.y0 + h / (2 * prev.s);
      return {
        s: newS,
        x0: centerMapX - w / (2 * newS),
        y0: centerMapY - h / (2 * newS)
      };
    });
  };

  const handleResetCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || (window.innerHeight - 56);
    updateCameraToPreset(currentView, w, h);
  };

  // Mouse interaction: Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      camX: camera.x0,
      camY: camera.y0
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / camera.s;
      const dy = (e.clientY - dragStartRef.current.y) / camera.s;
      setCamera((prev) => ({
        ...prev,
        x0: dragStartRef.current.camX - dx,
        y0: dragStartRef.current.camY - dy
      }));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(containerRef.current.clientWidth / W, Math.min(0.2, camera.s * zoomFactor));

    // Anchor zoom at mouse pointer
    const newX0 = camera.x0 + mouseX / camera.s - mouseX / newScale;
    const newY0 = camera.y0 + mouseY / camera.s - mouseY / newScale;

    setCamera({ s: newScale, x0: newX0, y0: newY0 });
  };

  // Touch Interaction: Pan (1 finger) & Pinch-to-Zoom (2 fingers)
  const touchStartRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dist: number;
    startScale: number;
    camX: number;
    camY: number;
    startTime: number;
  }>({
    mode: 'none',
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    dist: 0,
    startScale: 0.02,
    camX: 0,
    camY: 0,
    startTime: 0
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = {
        mode: 'pan',
        x1: t.clientX - rect.left,
        y1: t.clientY - rect.top,
        x2: 0,
        y2: 0,
        dist: 0,
        startScale: camera.s,
        camX: camera.x0,
        camY: camera.y0,
        startTime: Date.now()
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const x1 = t1.clientX - rect.left;
      const y1 = t1.clientY - rect.top;
      const x2 = t2.clientX - rect.left;
      const y2 = t2.clientY - rect.top;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      touchStartRef.current = {
        mode: 'pinch',
        x1,
        y1,
        x2,
        y2,
        dist: Math.max(10, dist),
        startScale: camera.s,
        camX: camera.x0,
        camY: camera.y0,
        startTime: Date.now()
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const st = touchStartRef.current;

    if (e.touches.length === 1 && st.mode === 'pan') {
      const t = e.touches[0];
      const currentX = t.clientX - rect.left;
      const currentY = t.clientY - rect.top;
      const dx = (currentX - st.x1) / camera.s;
      const dy = (currentY - st.y1) / camera.s;

      setCamera((prev) => ({
        ...prev,
        x0: st.camX - dx,
        y0: st.camY - dy
      }));
    } else if (e.touches.length === 2 && st.mode === 'pinch') {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const x1 = t1.clientX - rect.left;
      const y1 = t1.clientY - rect.top;
      const x2 = t2.clientX - rect.left;
      const y2 = t2.clientY - rect.top;
      const newDist = Math.hypot(x2 - x1, y2 - y1);
      const ratio = newDist / (st.dist || 1);

      const newScale = Math.max(containerRef.current.clientWidth / W, Math.min(0.25, st.startScale * ratio));
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const newX0 = st.camX + midX / st.startScale - midX / newScale;
      const newY0 = st.camY + midY / st.startScale - midY / newScale;

      setCamera({ s: newScale, x0: newX0, y0: newY0 });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const st = touchStartRef.current;
    if (st.mode === 'pan' && Date.now() - st.startTime < 320) {
      if (e.changedTouches.length === 1 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const t = e.changedTouches[0];
        const tapX = t.clientX - rect.left;
        const tapY = t.clientY - rect.top;
        if (Math.hypot(tapX - st.x1, tapY - st.y1) < 14) {
          handlePointClick(tapX, tapY);
        }
      }
    }
    touchStartRef.current.mode = 'none';
  };

  // Unified Point Click handler (used by both Mouse Click and Touch Tap)
  const handlePointClick = (clickX: number, clickY: number) => {
    // 0. Hit test Aeroporto di Venezia Marco Polo (VCE / LIPZ)
    const vceX = (mx(12.3519) - camera.x0) * camera.s;
    const vceY = (my(45.5053) - camera.y0) * camera.s;
    if (Math.hypot(clickX - vceX, clickY - vceY) <= Math.max(34, 45 * (camera.s / 0.02))) {
      if (onSelectAirport) {
        onSelectAirport();
        setSelectedVehicle(null);
        setSelectedFlight(null);
        setSelectedShipOnMap(null);
        return;
      }
    }

    // 1. Hit test Flights (with live flight motion)
    if (showFlights && flights && flights.length > 0) {
      for (const f of flights) {
        const live = getLiveFlight(f, currentTimeSeconds);
        const fx = (mx(live.lon) - camera.x0) * camera.s;
        const fy = (my(live.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - fx, clickY - fy) <= 24) {
          setSelectedFlight({
            ...f,
            lon: live.lon,
            lat: live.lat,
            trackDegrees: live.heading,
            altitudeMeters: live.alt
          });
          setSelectedVehicle(null);
          setSelectedShipOnMap(null);
          setSelectedAlilagunaBoat(null);
          return;
        }
      }
    }

    // 1b. Hit test Ships & Cruise Vessels (with live channel motion)
    if (showShips && ships && ships.length > 0) {
      for (const s of ships) {
        const live = getLiveShip(s, currentTimeSeconds);
        const sxPos = (mx(live.lon) - camera.x0) * camera.s;
        const syPos = (my(live.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - sxPos, clickY - syPos) <= 24) {
          setSelectedShipOnMap({
            ...s,
            lon: live.lon,
            lat: live.lat,
            heading: live.heading
          });
          setSelectedVehicle(null);
          setSelectedFlight(null);
          setSelectedAlilagunaBoat(null);
          return;
        }
      }
    }

    // 1c. Hit test MOSE Gates (Bocche di Porto)
    if (showMose && moseGates && moseGates.length > 0) {
      for (const g of moseGates) {
        const gx = (mx(g.lon) - camera.x0) * camera.s;
        const gy = (my(g.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - gx, clickY - gy) <= 30) {
          if (onSelectMose) {
            onSelectMose();
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            return;
          }
        }
      }
    }

    // 1d. Hit test Alilaguna Waterbuses (with live route motion)
    if (showAlilaguna && alilagunaBoats && alilagunaBoats.length > 0) {
      for (const b of alilagunaBoats) {
        const live = getLiveAlilagunaBoat(b, currentTimeSeconds, alilagunaRoutes);
        const bxPos = (mx(live.lon) - camera.x0) * camera.s;
        const byPos = (my(live.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bxPos, clickY - byPos) <= 22) {
          setSelectedAlilagunaBoat({
            ...b,
            lon: live.lon,
            lat: live.lat,
            heading: live.heading
          });
          setSelectedVehicle(null);
          setSelectedFlight(null);
          setSelectedShipOnMap(null);
          return;
        }
      }
    }

    // 1e. Hit test Alilaguna Darsene & Piers (e.g. Darsena Aeroporto VCE)
    if (showAlilaguna && alilagunaStops && alilagunaStops.length > 0) {
      for (const st of alilagunaStops) {
        const sxPos = (mx(st.lon) - camera.x0) * camera.s;
        const syPos = (my(st.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - sxPos, clickY - syPos) <= 18) {
          if (onSelectAlilaguna) {
            onSelectAlilaguna();
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1f. Hit test Earth Observation Satellites (ESA / ASI / NASA)
    if (showSatellites && satellites && satellites.length > 0) {
      for (const sat of satellites) {
        const live = getLiveSatellite(sat, currentTimeSeconds);
        const satX = (mx(live.lon) - camera.x0) * camera.s;
        const satY = (my(live.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - satX, clickY - satY) <= 24) {
          if (onSelectSatellite) {
            onSelectSatellite({
              ...sat,
              currentLon: live.lon,
              currentLat: live.lat,
              heading: live.heading
            });
          } else {
            setSelectedSatellite({
              ...sat,
              currentLon: live.lon,
              currentLat: live.lat,
              heading: live.heading
            });
          }
          setSelectedVehicle(null);
          setSelectedFlight(null);
          setSelectedShipOnMap(null);
          setSelectedAlilagunaBoat(null);
          return;
        }
      }
    }

    // 1g. Hit test Ocean Stations (Piattaforma CNR & Boe)
    if (showOceanStations && oceanStations && oceanStations.length > 0) {
      for (const st of oceanStations) {
        const sxPos = (mx(st.lon) - camera.x0) * camera.s;
        const syPos = (my(st.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - sxPos, clickY - syPos) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'oceanStation', data: st });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1h. Hit test Briccole & Fanali di Canale
    if (showMarineSignals && briccole && briccole.length > 0) {
      for (const br of briccole) {
        const bxPos = (mx(br.lon) - camera.x0) * camera.s;
        const byPos = (my(br.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bxPos, clickY - byPos) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'briccola', data: br });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1i. Hit test Passerelle Acqua Alta
    if (showPasserelle && passerelle && passerelle.length > 0) {
      for (const p of passerelle) {
        for (const pt of p.path) {
          const px = (mx(pt[0]) - camera.x0) * camera.s;
          const py = (my(pt[1]) - camera.y0) * camera.s;
          if (Math.hypot(clickX - px, clickY - py) <= 18) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'passerella', data: p });
              setSelectedVehicle(null);
              setSelectedFlight(null);
              setSelectedShipOnMap(null);
              setSelectedAlilagunaBoat(null);
              setSelectedSatellite(null);
              return;
            }
          }
        }
      }
    }

    // 1j. Hit test Bathing Waters (Lido & Pellestrina)
    if (showBathingWaters && bathingWaters && bathingWaters.length > 0) {
      for (const bw of bathingWaters) {
        const bx = (mx(bw.lon) - camera.x0) * camera.s;
        const by = (my(bw.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bx, clickY - by) <= 22) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'bathingWater', data: bw });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1k. Hit test Alberi Monumentali
    if (showTrees && trees && trees.length > 0) {
      for (const tr of trees) {
        const tx = (mx(tr.lon) - camera.x0) * camera.s;
        const ty = (my(tr.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - tx, clickY - ty) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'urbanTree', data: tr });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1l. Hit test EV Charging & Wi-Fi Hotspots
    if (showServicesVenice) {
      if (evCharging && evCharging.length > 0) {
        for (const ev of evCharging) {
          const ex = (mx(ev.lon) - camera.x0) * camera.s;
          const ey = (my(ev.lat) - camera.y0) * camera.s;
          if (Math.hypot(clickX - ex, clickY - ey) <= 20) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'evCharging', data: ev });
              setSelectedVehicle(null);
              setSelectedFlight(null);
              setSelectedShipOnMap(null);
              setSelectedAlilagunaBoat(null);
              setSelectedSatellite(null);
              return;
            }
          }
        }
      }
      if (wifiHotspots && wifiHotspots.length > 0) {
        for (const wf of wifiHotspots) {
          const wx = (mx(wf.lon) - camera.x0) * camera.s;
          const wy = (my(wf.lat) - camera.y0) * camera.s;
          if (Math.hypot(clickX - wx, clickY - wy) <= 20) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'wifiHotspot', data: wf });
              setSelectedVehicle(null);
              setSelectedFlight(null);
              setSelectedShipOnMap(null);
              setSelectedAlilagunaBoat(null);
              setSelectedSatellite(null);
              return;
            }
          }
        }
      }
    }

    // 1m. Hit test Franchi di Tiro Ponti
    if (showBridges && bridges && bridges.length > 0) {
      for (const b of bridges) {
        const bx = (mx(b.lon) - camera.x0) * camera.s;
        const by = (my(b.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bx, clickY - by) <= 22) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'bridgeClearance', data: b });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1n. Hit test Traghetti da Parada & Stazi Gondole
    if (showGondolas && gondolas && gondolas.length > 0) {
      for (const g of gondolas) {
        const gx = (mx(g.lon) - camera.x0) * camera.s;
        const gy = (my(g.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - gx, clickY - gy) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'gondolaStation', data: g });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1o. Hit test Rive d'Approdo Pubbliche & Merci
    if (showDocks && docks && docks.length > 0) {
      for (const d of docks) {
        const dx = (mx(d.lon) - camera.x0) * camera.s;
        const dy = (my(d.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - dx, clickY - dy) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'publicDock', data: d });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1p. Hit test Subsidenza InSAR (Copernicus EGMS)
    if (showSubsidence && subsidencePoints && subsidencePoints.length > 0) {
      for (const sub of subsidencePoints) {
        const sxPos = (mx(sub.lon) - camera.x0) * camera.s;
        const syPos = (my(sub.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - sxPos, clickY - syPos) <= 22) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'subsidence', data: sub });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1q. Hit test Morfologia Barene & Velme
    if (showMorphology && lagoonMorphology && lagoonMorphology.length > 0) {
      for (const morph of lagoonMorphology) {
        const cx = (mx(morph.center[0]) - camera.x0) * camera.s;
        const cy = (my(morph.center[1]) - camera.y0) * camera.s;
        if (Math.hypot(clickX - cx, clickY - cy) <= 26) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'lagoonMorphology', data: morph });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1r. Hit test Stazioni Vento Meteomarino (Scirocco/Bora)
    if (showMarineWind && marineWindStations && marineWindStations.length > 0) {
      for (const w of marineWindStations) {
        const wx = (mx(w.lon) - camera.x0) * camera.s;
        const wy = (my(w.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - wx, clickY - wy) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'marineWind', data: w });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1s. Hit test Treni Live Ponte Libertà
    if (showTrains && liveTrains && liveTrains.length > 0) {
      for (const tr of liveTrains) {
        const tx = (mx(tr.lon) - camera.x0) * camera.s;
        const ty = (my(tr.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - tx, clickY - ty) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'trainLive', data: tr });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1t. Hit test Battelli Ecologici Veritas
    if (showWasteBoats && wasteBoats && wasteBoats.length > 0) {
      for (const wb of wasteBoats) {
        const bx = (mx(wb.lon) - camera.x0) * camera.s;
        const by = (my(wb.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bx, clickY - by) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'wasteBoat', data: wb });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1u. Hit test Nizioleti Tradizionali
    if (showNizioleti && nizioleti && nizioleti.length > 0) {
      for (const niz of nizioleti) {
        const nx = (mx(niz.lon) - camera.x0) * camera.s;
        const ny = (my(niz.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - nx, clickY - ny) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'nizioleto', data: niz });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1v. Hit test Vere da Pozzo Storiche
    if (showWells && wells && wells.length > 0) {
      for (const w of wells) {
        const wx = (mx(w.lon) - camera.x0) * camera.s;
        const wy = (my(w.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - wx, clickY - wy) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'veniceWell', data: w });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1w. Hit test Campanili & Torri Pendenti
    if (showBellTowers && bellTowers && bellTowers.length > 0) {
      for (const bt of bellTowers) {
        const bx = (mx(bt.lon) - camera.x0) * camera.s;
        const by = (my(bt.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bx, clickY - by) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'bellTower', data: bt });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1x. Hit test Fortezze Lagunari & Isole
    if (showFortresses && fortressIslands && fortressIslands.length > 0) {
      for (const fort of fortressIslands) {
        const fx = (mx(fort.lon) - camera.x0) * camera.s;
        const fy = (my(fort.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - fx, clickY - fy) <= 26) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'fortressIsland', data: fort });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1y. Hit test Sanità SUEM 118, DAE & Farmacie
    if (showEmergencyDocks && emergencyDocks && emergencyDocks.length > 0) {
      for (const ed of emergencyDocks) {
        const ex = (mx(ed.lon) - camera.x0) * camera.s;
        const ey = (my(ed.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - ex, clickY - ey) <= 22) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'emergencyDock', data: ed });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    if (showDae && daeList && daeList.length > 0) {
      for (const dae of daeList) {
        const dx = (mx(dae.lon) - camera.x0) * camera.s;
        const dy = (my(dae.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - dx, clickY - dy) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'publicDae', data: dae });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    if (showPharmacies && pharmacies && pharmacies.length > 0) {
      for (const ph of pharmacies) {
        const px = (mx(ph.lon) - camera.x0) * camera.s;
        const py = (my(ph.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - px, clickY - py) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'pharmacy', data: ph });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1z. Hit test Isole di Calore LST
    if (showHeatIslands && heatIslands && heatIslands.length > 0) {
      for (const hi of heatIslands) {
        const hx = (mx(hi.lon) - camera.x0) * camera.s;
        const hy = (my(hi.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - hx, clickY - hy) <= 26) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'heatIsland', data: hi });
            setSelectedVehicle(null);
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            setSelectedAlilagunaBoat(null);
            setSelectedSatellite(null);
            return;
          }
        }
      }
    }

    // 1aa. Hit test Limiti Velocità Canali
    if (showCanalLimits && canalSpeedLimits && canalSpeedLimits.length > 0) {
      for (const sl of canalSpeedLimits) {
        for (const pt of sl.path) {
          const px = (mx(pt[0]) - camera.x0) * camera.s;
          const py = (my(pt[1]) - camera.y0) * camera.s;
          if (Math.hypot(clickX - px, clickY - py) <= 18) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'speedLimit', data: sl });
              setSelectedVehicle(null);
              setSelectedFlight(null);
              setSelectedShipOnMap(null);
              setSelectedAlilagunaBoat(null);
              setSelectedSatellite(null);
              return;
            }
          }
        }
      }
    }

    // 2. Hit test Cantieri (Worksites)
    if (showCantieri) {
      for (const c of cantieri) {
        const cx = (mx(c.lon) - camera.x0) * camera.s;
        const cy = (my(c.lat) - camera.y0) * camera.s;
        const dist = Math.hypot(clickX - cx, clickY - cy);
        if (dist <= 18) {
          onSelectCantiere(c);
          setSelectedVehicle(null);
          setSelectedFlight(null);
          return;
        }
      }
    }

    // 3. Hit test Stops (Fermate)
    if (showStops) {
      for (const s of stops) {
        const sx = (mx(s.lon) - camera.x0) * camera.s;
        const sy = (my(s.lat) - camera.y0) * camera.s;
        const dist = Math.hypot(clickX - sx, clickY - sy);
        if (dist <= 15) {
          onSelectStop(s);
          setSelectedVehicle(null);
          setSelectedFlight(null);
          return;
        }
      }
    }

    // 4. Hit test Moving Vehicles (ACTV)
    if (showVehicles && simDataRef.current) {
      const sim = simDataRef.current;
      const tripsData = sim.daysTrips[selectedDay];
      if (tripsData) {
        const { tP, t0, t1, count } = tripsData;
        const t = currentTimeSeconds;
        const ptNow: [number, number] = [0, 0];

        const distAt = (p: any, dt: number) => {
          const T = p.T, Dd = p.Dd, hi = T.length - 1;
          if (dt >= T[hi]) return Dd[hi];
          if (dt <= 0) return Dd[0];
          let l = 0, r = hi;
          while (r - l > 1) {
            const m = (l + r) >> 1;
            if (T[m] <= dt) l = m; else r = m;
          }
          const span = T[r] - T[l];
          return span > 0 ? Dd[l] + ((Dd[r] - Dd[l]) * (dt - T[l])) / span : Dd[r];
        };

        const pointAt = (sh: any, d: number, out: [number, number]) => {
          const cum = sh.cum, xy = sh.xy, hi = sh.n - 1;
          if (d <= 0) { out[0] = xy[0]; out[1] = xy[1]; return; }
          if (d >= cum[hi]) { out[0] = xy[2 * hi]; out[1] = xy[2 * hi + 1]; return; }
          let l = 0, r = hi;
          while (r - l > 1) {
            const m = (l + r) >> 1;
            if (cum[m] <= d) l = m; else r = m;
          }
          const f = (d - cum[l]) / (cum[r] - cum[l] || 1);
          out[0] = xy[2 * l] + (xy[2 * r] - xy[2 * l]) * f;
          out[1] = xy[2 * l + 1] + (xy[2 * r + 1] - xy[2 * l + 1]) * f;
        };

        for (let i = 0; i < count; i++) {
          if (t0[i] > t || t1[i] < t) continue;
          const prof = sim.profs[tP[i]];
          const rCat = prof.route.mode_category || 'vaporetto';
          if (selectedCategory !== 'all' && rCat !== selectedCategory) continue;

          pointAt(prof.sh, distAt(prof, t - t0[i]), ptNow);
          const vx = (ptNow[0] - camera.x0) * camera.s;
          const vy = (ptNow[1] - camera.y0) * camera.s;

          if (Math.hypot(clickX - vx, clickY - vy) <= 18) {
            const lineName = prof.route.route_short_name || prof.route.n || 'ACTV';
            const longName = prof.route.route_long_name || `Linea ${lineName}`;
            setSelectedVehicle({
              line: lineName,
              category: rCat.toUpperCase(),
              speedKmh: rCat === 'vaporetto' ? 12.8 : rCat === 'motoscafo' ? 17.5 : rCat === 'tram' ? 32.0 : 38.0,
              screenX: clickX,
              screenY: clickY,
              color: prof.route.route_color || '#5cc8ff',
              headsign: longName
            });
            setSelectedFlight(null);
            setSelectedShipOnMap(null);
            return;
          }
        }
      }
    }

    // Dismiss tooltips on empty click
    setSelectedVehicle(null);
    setSelectedFlight(null);
    setSelectedShipOnMap(null);
    setSelectedAlilagunaBoat(null);
  };

  // Mouse click wrapper
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    handlePointClick(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Main Render Loop (Canvas 2D)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      // Select active palette
      let pal: ColorScheme;
      if (paletteTheme === 'notte') pal = NOTTE;
      else if (paletteTheme === 'carta') pal = CARTA;
      else pal = getDynamicPalette(currentTimeSeconds);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Water background
      ctx.fillStyle = pal.water;
      ctx.fillRect(0, 0, cw, ch);

      // Coordinate transforms: Virtual Map space -> Screen space
      const sx = (x: number) => (x - camera.x0) * camera.s;
      const sy = (y: number) => (y - camera.y0) * camera.s;

      // 2. Render Land Polygons (Venice Islands & Mainland)
      ctx.fillStyle = pal.land;
      ctx.strokeStyle = pal.coast;
      ctx.lineWidth = 1;

      const zoomed = camera.s / (cw / W) > 1.6;
      const landSet = zoomed ? LAND.hi : LAND.lo;

      for (const rings of landSet) {
        ctx.beginPath();
        for (const ring of rings) {
          if (ring.length < 4) continue;
          ctx.moveTo(sx(ring[0]), sy(ring[1]));
          for (let i = 2; i < ring.length; i += 2) {
            ctx.lineTo(sx(ring[i]), sy(ring[i + 1]));
          }
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
      }

      // 3. Render ACTV Routes (Shapes)
      if (showRoutes && simDataRef.current) {
        ctx.lineWidth = Math.max(1, 1.2 * (camera.s / (cw / W)));
        ctx.globalAlpha = 0.35;

        for (const shape of simDataRef.current.shapes) {
          const xy = shape.xy;
          ctx.beginPath();
          ctx.moveTo(sx(xy[0]), sy(xy[1]));
          for (let i = 1; i < shape.n; i++) {
            ctx.lineTo(sx(xy[2 * i]), sy(xy[2 * i + 1]));
          }
          ctx.strokeStyle = pal.cats.vaporetto || '#5cc8ff';
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }

      // 4. Render Spatial Buffer Circles around Cantieri
      if (showSpatialBuffer && showCantieri) {
        // Meter to virtual map unit: 1 degree latitude ~ 111,139 meters
        const metersToVirtual = (bufferRadiusMeters / 111139) * KY * camera.s;

        for (const c of cantieri) {
          if (c.stato !== 'In corso') continue;
          const cx = sx(mx(c.lon));
          const cy = sy(my(c.lat));

          ctx.beginPath();
          ctx.arc(cx, cy, metersToVirtual, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 5. Render Moving Fleet (Vehicles with directional trails)
      if (showVehicles && simDataRef.current) {
        const sim = simDataRef.current;
        const tripsData = sim.daysTrips[selectedDay];

        if (tripsData) {
          const { tP, t0, t1, count } = tripsData;
          const t = currentTimeSeconds;
          const trailSec = 45; // Ghosting trail duration

          // Helper: distance along profile
          const distAt = (p: any, dt: number) => {
            const T = p.T;
            const Dd = p.Dd;
            const hi = T.length - 1;
            if (dt >= T[hi]) return Dd[hi];
            if (dt <= 0) return Dd[0];
            let l = 0, r = hi;
            while (r - l > 1) {
              const m = (l + r) >> 1;
              if (T[m] <= dt) l = m;
              else r = m;
            }
            const span = T[r] - T[l];
            return span > 0 ? Dd[l] + ((Dd[r] - Dd[l]) * (dt - T[l])) / span : Dd[r];
          };

          // Helper: point on polyline
          const pointAt = (sh: any, d: number, out: [number, number]) => {
            const cum = sh.cum;
            const xy = sh.xy;
            const hi = sh.n - 1;
            if (d <= 0) { out[0] = xy[0]; out[1] = xy[1]; return; }
            if (d >= cum[hi]) { out[0] = xy[2 * hi]; out[1] = xy[2 * hi + 1]; return; }
            let l = 0, r = hi;
            while (r - l > 1) {
              const m = (l + r) >> 1;
              if (cum[m] <= d) l = m;
              else r = m;
            }
            const f = (d - cum[l]) / (cum[r] - cum[l] || 1);
            out[0] = xy[2 * l] + (xy[2 * r] - xy[2 * l]) * f;
            out[1] = xy[2 * l + 1] + (xy[2 * r + 1] - xy[2 * l + 1]) * f;
          };

          const ptNow: [number, number] = [0, 0];
          const ptTail: [number, number] = [0, 0];

          ctx.globalCompositeOperation = paletteTheme === 'notte' ? 'lighter' : 'source-over';

          for (let i = 0; i < count; i++) {
            if (t0[i] > t || t1[i] < t) continue;
            const prof = sim.profs[tP[i]];
            const rCat = prof.route.mode_category || 'vaporetto';

            if (selectedCategory !== 'all' && rCat !== selectedCategory) continue;

            const dt = t - t0[i];
            pointAt(prof.sh, distAt(prof, dt), ptNow);
            const vx = sx(ptNow[0]);
            const vy = sy(ptNow[1]);

            if (vx < -50 || vx > cw + 50 || vy < -50 || vy > ch + 50) continue;

            const col = pal.cats[rCat] || '#5cc8ff';

            // Trail
            pointAt(prof.sh, distAt(prof, Math.max(0, dt - trailSec)), ptTail);
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(sx(ptTail[0]), sy(ptTail[1]));
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.45;
            ctx.stroke();

            // Vehicle Glow & Dot
            ctx.beginPath();
            ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.95;
            ctx.fill();
          }

          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }
      }

      // 6. Render ACTV Stops & Piers
      if (showStops) {
        for (const s of stops) {
          const px = sx(mx(s.lon));
          const py = sy(my(s.lat));

          // Base anchor marker
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Stop name label if zoomed in
          if (camera.s > 0.04) {
            ctx.font = '500 10px "Bricolage Grotesque", sans-serif';
            ctx.fillStyle = pal.ink;
            ctx.fillText(s.name, px + 7, py + 3);
          }
        }
      }

      // 7. Render Comune di Venezia Cantieri (Worksites)
      if (showCantieri) {
        for (const c of cantieri) {
          const cx = sx(mx(c.lon));
          const cy = sy(my(c.lat));

          // Pulsing warning halo
          ctx.beginPath();
          ctx.arc(cx, cy, 9, 0, Math.PI * 2);
          ctx.fillStyle = c.impattoMobilita === 'Critico' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';
          ctx.fill();

          // Worksite pin
          ctx.beginPath();
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = c.impattoMobilita === 'Critico' ? '#ef4444' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          if (camera.s > 0.035) {
            ctx.font = '600 10px "Bricolage Grotesque", sans-serif';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`🚧 ${c.titolo.slice(0, 24)}...`, cx + 9, cy - 2);
          }
        }
      }

      // 8. Render Venice Marco Polo Airport (VCE / LIPZ) Infrastructure & Radar
      if (showFlights) {
        // Airport Coordinates: Tessera (Runways 04R/22L and 04L/22R)
        const r1x = sx(mx(12.3378));
        const r1y = sy(my(45.4943));
        const r2x = sx(mx(12.3660));
        const r2y = sy(my(45.5163));

        const p1x = sx(mx(12.3357));
        const p1y = sy(my(45.4956));
        const p2x = sx(mx(12.3639));
        const p2y = sy(my(45.5176));

        const rAng = Math.atan2(r2y - r1y, r2x - r1x);

        // Terminal Apron & Darsena Pad (Lagoon connection to Alilaguna water transport)
        const darsenaX = sx(mx(12.3440));
        const darsenaY = sy(my(45.4920));
        const terminalX = sx(mx(12.3480));
        const terminalY = sy(my(45.4980));

        // Apron polygon
        ctx.beginPath();
        ctx.moveTo(r1x, r1y);
        ctx.lineTo(r2x, r2y);
        ctx.lineTo(terminalX + 18, terminalY + 12);
        ctx.lineTo(darsenaX, darsenaY);
        ctx.closePath();
        ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.45)';
        ctx.fill();
        ctx.strokeStyle = paletteTheme === 'notte' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Secondary Runway / Parallel Taxiway 04L / 22R
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.strokeStyle = paletteTheme === 'notte' ? '#334155' : '#94a3b8';
        ctx.lineWidth = Math.max(3, 5 * (camera.s / 0.02));
        ctx.stroke();

        // Main Runway 04R / 22L (Heavy asphalt tarmac)
        ctx.beginPath();
        ctx.moveTo(r1x, r1y);
        ctx.lineTo(r2x, r2y);
        ctx.strokeStyle = paletteTheme === 'notte' ? '#0f172a' : '#475569';
        ctx.lineWidth = Math.max(5, 8 * (camera.s / 0.02));
        ctx.stroke();

        // Main Runway White Dashed Centerline
        ctx.beginPath();
        ctx.moveTo(r1x, r1y);
        ctx.lineTo(r2x, r2y);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = Math.max(1, 1.8 * (camera.s / 0.02));
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Runway Threshold Piano Keys & Identifiers
        if (camera.s > 0.012) {
          ctx.save();
          ctx.translate(r1x, r1y);
          ctx.rotate(rAng);
          // 04R Threshold
          ctx.fillStyle = '#ffffff';
          for (let k = -3; k <= 3; k += 2) {
            ctx.fillRect(0, k * 2, 7, 1.2);
          }
          ctx.font = '700 9px "DM Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('04R', -22, 3);
          ctx.restore();

          ctx.save();
          ctx.translate(r2x, r2y);
          ctx.rotate(rAng);
          // 22L Threshold
          ctx.fillStyle = '#ffffff';
          for (let k = -3; k <= 3; k += 2) {
            ctx.fillRect(-7, k * 2, 7, 1.2);
          }
          ctx.font = '700 9px "DM Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('22L', 10, 3);
          ctx.restore();
        }

        // Radar Tower & Sweeping Radar Beam (Tessera radar)
        const towerX = sx(mx(12.3480));
        const towerY = sy(my(45.5020));
        const radarSweep = ((currentTimeSeconds * 0.8) + (performance.now() * 0.001)) % (Math.PI * 2);

        // Radar Range Rings
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(towerX, towerY, 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(towerX, towerY, 68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sweeping Radar Cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(towerX, towerY);
        ctx.arc(towerX, towerY, 68, radarSweep, radarSweep + 0.45);
        ctx.closePath();
        const radGrad = ctx.createRadialGradient(towerX, towerY, 2, towerX, towerY, 68);
        radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        radGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
        ctx.fillStyle = radGrad;
        ctx.fill();
        ctx.restore();

        // Tower Beacon Light
        ctx.beginPath();
        ctx.arc(towerX, towerY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Airport Interactive Badge / Landmark Tag
        const badgeX = sx(mx(12.3519));
        const badgeY = sy(my(45.5053)) - (camera.s > 0.03 ? 32 : 22);

        ctx.save();
        ctx.font = '700 11px "Bricolage Grotesque", sans-serif';
        const txt = '✈️ Aeroporto Marco Polo (VCE / LIPZ)';
        const txtWidth = ctx.measureText(txt).width;

        ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX - txtWidth / 2 - 8, badgeY - 14, txtWidth + 16, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = paletteTheme === 'notte' ? '#38bdf8' : '#0284c7';
        ctx.fillText(txt, badgeX - txtWidth / 2, badgeY + 1);

        if (camera.s > 0.025) {
          ctx.font = '500 9px "DM Mono", monospace';
          ctx.fillStyle = paletteTheme === 'notte' ? '#94a3b8' : '#64748b';
          const subTxt = 'Pista 04R/22L · Darsena Alilaguna';
          ctx.fillText(subTxt, badgeX - ctx.measureText(subTxt).width / 2, badgeY + 14);
        }
        ctx.restore();

        // 9. Render Flight Paths & ILS Approach Corridors (Runway 04R)
        const fixes = [
          { name: 'CHIOGGIA FIX', alt: '3500ft', lon: 12.2450, lat: 45.2850 },
          { name: 'LIDO IAF', alt: '2200ft', lon: 12.2850, lat: 45.3850 },
          { name: 'LAGUNA FAF', alt: '1200ft', lon: 12.3120, lat: 45.4480 },
          { name: 'THR 04R', alt: '50ft', lon: 12.3378, lat: 45.4943 },
        ];

        // Draw ILS Approach Centerline over Laguna & Adriatic
        ctx.beginPath();
        ctx.moveTo(sx(mx(fixes[0].lon)), sy(my(fixes[0].lat)));
        for (let fi = 1; fi < fixes.length; fi++) {
          ctx.lineTo(sx(mx(fixes[fi].lon)), sy(my(fixes[fi].lat)));
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw ILS Funnel Guide Lines (±250m)
        const f0x = sx(mx(fixes[0].lon));
        const f0y = sy(my(fixes[0].lat));
        const f3x = sx(mx(fixes[3].lon));
        const f3y = sy(my(fixes[3].lat));
        const corridorAngle = Math.atan2(f3y - f0y, f3x - f0x);
        const perpX = Math.cos(corridorAngle + Math.PI / 2);
        const perpY = Math.sin(corridorAngle + Math.PI / 2);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(f0x + perpX * 18, f0y + perpY * 18);
        ctx.lineTo(f3x + perpX * 6, f3y + perpY * 6);
        ctx.moveTo(f0x - perpX * 18, f0y - perpY * 18);
        ctx.lineTo(f3x - perpX * 6, f3y - perpY * 6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Departure Climb-out vector towards NE (Friuli / Treviso)
        const depStartX = sx(mx(12.3660));
        const depStartY = sy(my(45.5163));
        const depEndX = sx(mx(12.4300));
        const depEndY = sy(my(45.5650));
        ctx.beginPath();
        ctx.moveTo(depStartX, depStartY);
        ctx.lineTo(depEndX, depEndY);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Waypoints diamond markers (◆)
        for (const fix of fixes) {
          const wx = sx(mx(fix.lon));
          const wy = sy(my(fix.lat));

          ctx.beginPath();
          ctx.moveTo(wx, wy - 4);
          ctx.lineTo(wx + 4, wy);
          ctx.lineTo(wx, wy + 4);
          ctx.lineTo(wx - 4, wy);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          if (camera.s > 0.02) {
            ctx.font = '600 9px "DM Mono", monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(`${fix.name} · ${fix.alt}`, wx + 7, wy + 3);
          }
        }

        // Aircraft Trajectories (Past trail & Approach glideslope vector)
        if (flights && flights.length > 0) {
          const r04x = sx(mx(12.3378));
          const r04y = sy(my(45.4943));

          for (const f of flights) {
            const live = getLiveFlight(f, currentTimeSeconds);
            const fx = sx(mx(live.lon));
            const fy = sy(my(live.lat));
            const isSelected = selectedFlight?.icao24 === f.icao24;

            // 1. Past Trajectory Trail
            const rad = (live.heading * Math.PI) / 180;
            const trailLenDeg = isSelected ? 0.06 : 0.035;
            const tailLon = live.lon - Math.sin(rad) * trailLenDeg;
            const tailLat = live.lat - Math.cos(rad) * trailLenDeg;
            const tailX = sx(mx(tailLon));
            const tailY = sy(my(tailLat));

            const grad = ctx.createLinearGradient(tailX, tailY, fx, fy);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(1, isSelected ? 'rgba(56, 189, 248, 0.95)' : 'rgba(56, 189, 248, 0.6)');

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(fx, fy);
            ctx.strokeStyle = grad;
            ctx.lineWidth = isSelected ? 3 : 1.8;
            ctx.stroke();

            // 2. Projected Approach / Glideslope Vector towards Runway 04R
            if (f.status === 'APPROACH') {
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(r04x, r04y);
              ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)';
              ctx.lineWidth = isSelected ? 2.5 : 1.4;
              ctx.setLineDash([4, 4]);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (f.status === 'DEPARTURE') {
              const headLon = live.lon + Math.sin(rad) * 0.04;
              const headLat = live.lat + Math.cos(rad) * 0.04;
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(sx(mx(headLon)), sy(my(headLat)));
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
              ctx.lineWidth = 1.4;
              ctx.setLineDash([3, 4]);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Distance to VCE readout if selected
            if (isSelected) {
              const distToVceKm = (Math.hypot(live.lon - 12.3519, live.lat - 45.5053) * 111).toFixed(1);
              ctx.font = '700 10px "DM Mono", monospace';
              ctx.fillStyle = '#fbbf24';
              ctx.fillText(`📍 ${distToVceKm} km a VCE`, fx + 14, fy - 10);
            }
          }
        }

        // 10. Render Airplane Silhouettes and Tags
        if (flights && flights.length > 0) {
          for (const f of flights) {
            const live = getLiveFlight(f, currentTimeSeconds);
            const fx = sx(mx(live.lon));
            const fy = sy(my(live.lat));

            if (fx < -60 || fx > cw + 60 || fy < -60 || fy > ch + 60) continue;

            ctx.save();
            ctx.translate(fx, fy);
            ctx.rotate((live.heading * Math.PI) / 180);

            // Airplane silhouette
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(2.5, -2);
            ctx.lineTo(11, 2);
            ctx.lineTo(11, 4.5);
            ctx.lineTo(2.5, 2.5);
            ctx.lineTo(2.5, 8);
            ctx.lineTo(6.5, 11);
            ctx.lineTo(6.5, 13);
            ctx.lineTo(0, 11.5);
            ctx.lineTo(-6.5, 13);
            ctx.lineTo(-6.5, 11);
            ctx.lineTo(-2.5, 8);
            ctx.lineTo(-2.5, 2.5);
            ctx.lineTo(-11, 4.5);
            ctx.lineTo(-11, 2);
            ctx.lineTo(-2.5, -2);
            ctx.closePath();

            ctx.fillStyle = f.onGround
              ? '#94a3b8'
              : f.status === 'APPROACH'
              ? '#38bdf8'
              : f.status === 'DEPARTURE'
              ? '#67e8f9'
              : '#60a5fa';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Flight Tag
            ctx.font = '600 10px "DM Mono", monospace';
            ctx.fillStyle = f.status === 'APPROACH' ? '#38bdf8' : '#7dd3fc';
            ctx.fillText(`✈️ ${f.callsign} · ${Math.round(live.alt)}m`, fx + 13, fy + 3);
          }
        }
      }

      // 11. Render MOSE Defense Barriers at the 3 Bocche di Porto (Lido, Malamocco, Chioggia)
      if (showMose && moseGates && moseGates.length > 0) {
        for (const gate of moseGates) {
          const gx = sx(mx(gate.lon));
          const gy = sy(my(gate.lat));

          // Draw barrier line across channel
          const barWidth = Math.max(28, 48 * (camera.s / 0.02));
          const isActivated = gate.status === 'ATTIVATO';
          const isRaising = gate.status === 'IN_SOLLEVAMENTO';
          const barrierCol = isActivated ? '#ef4444' : isRaising ? '#f59e0b' : '#10b981';

          ctx.save();
          // Barrier line with end anchors
          ctx.beginPath();
          ctx.moveTo(gx - barWidth / 2, gy);
          ctx.lineTo(gx + barWidth / 2, gy);
          ctx.strokeStyle = barrierCol;
          ctx.lineWidth = Math.max(3, 4.5 * (camera.s / 0.02));
          ctx.lineCap = 'round';
          if (!isActivated) ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Mooring caissons / Abutments on both sides
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(gx - barWidth / 2, gy, 3, 0, Math.PI * 2);
          ctx.arc(gx + barWidth / 2, gy, 3, 0, Math.PI * 2);
          ctx.fill();

          // Gate Status Tag
          ctx.font = '700 9px "DM Mono", monospace';
          const gateTag = `🌊 MOSE ${gate.inletName} (${gate.barriersCount}p)`;
          const tagW = ctx.measureText(gateTag).width;

          ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
          ctx.strokeStyle = barrierCol;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(gx - tagW / 2 - 4, gy - 16, tagW + 8, 14, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = barrierCol;
          ctx.fillText(gateTag, gx - tagW / 2, gy - 6);
          ctx.restore();
        }
      }

      // 11b. Render Maritime Navigational Channels & Fairways (Canale dei Petroli & Bocca di Lido -> Tronchetto)
      if (showShipRoutes) {
        for (const ch of MARITIME_CHANNELS) {
          const wps = ch.waypoints;
          if (wps.length < 2) continue;

          const isChannelSelected = selectedShipOnMap?.routeId === ch.id;

          // 1. Draw Channel Centerline
          ctx.beginPath();
          ctx.moveTo(sx(mx(wps[0].lon)), sy(my(wps[0].lat)));
          for (let wi = 1; wi < wps.length; wi++) {
            ctx.lineTo(sx(mx(wps[wi].lon)), sy(my(wps[wi].lat)));
          }
          ctx.strokeStyle = ch.color;
          ctx.globalAlpha = isChannelSelected ? 0.95 : 0.5;
          ctx.lineWidth = isChannelSelected ? Math.max(3, 4.5 * (camera.s / 0.02)) : Math.max(1.8, 2.5 * (camera.s / 0.02));
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1.0;

          // 2. Lateral Channel Fairway Guide Lines (representing lateral buoys / briccole)
          if (camera.s > 0.015 || isChannelSelected) {
            ctx.beginPath();
            for (let wi = 0; wi < wps.length - 1; wi++) {
              const p1x = sx(mx(wps[wi].lon));
              const p1y = sy(my(wps[wi].lat));
              const p2x = sx(mx(wps[wi + 1].lon));
              const p2y = sy(my(wps[wi + 1].lat));
              const segAng = Math.atan2(p2y - p1y, p2x - p1x);
              const perpX = Math.cos(segAng + Math.PI / 2);
              const perpY = Math.sin(segAng + Math.PI / 2);
              const offsetPx = Math.max(5, 10 * (camera.s / 0.02));

              ctx.moveTo(p1x + perpX * offsetPx, p1y + perpY * offsetPx);
              ctx.lineTo(p2x + perpX * offsetPx, p2y + perpY * offsetPx);
              ctx.moveTo(p1x - perpX * offsetPx, p1y - perpY * offsetPx);
              ctx.lineTo(p2x - perpX * offsetPx, p2y - perpY * offsetPx);
            }
            ctx.strokeStyle = ch.color;
            ctx.globalAlpha = isChannelSelected ? 0.45 : 0.22;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
          }

          // 3. Nautical Waypoints & Buoys (◆)
          for (const wp of wps) {
            const wpx = sx(mx(wp.lon));
            const wpy = sy(my(wp.lat));

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(wpx, wpy - 4.5);
            ctx.lineTo(wpx + 4.5, wpy);
            ctx.lineTo(wpx, wpy + 4.5);
            ctx.lineTo(wpx - 4.5, wpy);
            ctx.closePath();
            ctx.fillStyle = ch.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Waypoint Label
            if (camera.s > 0.02 || isChannelSelected) {
              ctx.font = '600 8.5px "DM Mono", monospace';
              ctx.fillStyle = isChannelSelected ? '#ffffff' : ch.color;
              ctx.fillText(`${wp.name} · ${wp.depth}`, wpx + 7, wpy + 3);
            }
            ctx.restore();
          }
        }
      }

      // 12. Render Ships & Cruise Vessels (Tronchetto / Marittima AIS Traffic)
      if (showShips && ships && ships.length > 0) {
        for (const sh of ships) {
          const live = getLiveShip(sh, currentTimeSeconds);
          const shx = sx(mx(live.lon));
          const shy = sy(my(live.lat));

          if (shx < -80 || shx > cw + 80 || shy < -80 || shy > ch + 80) continue;

          const isSelected = selectedShipOnMap?.mmsi === sh.mmsi;
          const headingRad = (live.heading * Math.PI) / 180;

          // 1. Ship Wake Trail (behind vessel)
          if (sh.speedKnots > 0.5) {
            ctx.save();
            ctx.translate(shx, shy);
            ctx.rotate(headingRad);
            const wakeLen = Math.min(80, isSelected ? sh.speedKnots * 7 : sh.speedKnots * 4);
            const wakeGrad = ctx.createLinearGradient(0, 0, 0, wakeLen);
            wakeGrad.addColorStop(0, isSelected ? 'rgba(56, 189, 248, 0.95)' : 'rgba(255, 255, 255, 0.6)');
            wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

            ctx.beginPath();
            ctx.moveTo(-3, 8);
            ctx.lineTo(-9, 8 + wakeLen);
            ctx.lineTo(9, 8 + wakeLen);
            ctx.lineTo(3, 8);
            ctx.closePath();
            ctx.fillStyle = wakeGrad;
            ctx.fill();
            ctx.restore();
          }

          // 2. Projected Heading Course Vector
          if (sh.speedKnots > 0.5) {
            const forwardDist = isSelected ? 0.025 : 0.015;
            const forwardLon = live.lon + Math.sin(headingRad) * forwardDist;
            const forwardLat = live.lat + Math.cos(headingRad) * forwardDist;
            ctx.beginPath();
            ctx.moveTo(shx, shy);
            ctx.lineTo(sx(mx(forwardLon)), sy(my(forwardLat)));
            ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = isSelected ? 2.5 : 1.2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // 3. When Selected, draw direct vector to destination berth with Nautical Miles readout
          if (isSelected) {
            const berthCoord = sh.routeId === 'CANALE_PETROLI'
              ? { lon: 12.2450, lat: 45.4420 }
              : sh.routeId === 'FAST_FERRY_ISTRIA'
              ? { lon: 12.3160, lat: 45.4335 }
              : { lon: 12.3050, lat: 45.4418 };
            const bx = sx(mx(berthCoord.lon));
            const by = sy(my(berthCoord.lat));

            ctx.beginPath();
            ctx.moveTo(shx, shy);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Nautical distance badge
            const distNM = (Math.hypot(live.lon - berthCoord.lon, live.lat - berthCoord.lat) * 60).toFixed(1);
            ctx.font = '700 10px "DM Mono", monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`📍 ${distNM} NM a ${sh.berth.split(',')[0]} (ETA: ${sh.eta})`, shx + 14, shy - 14);
          }

          // 4. Ship Hull & Superstructure (Rotated to heading)
          ctx.save();
          ctx.translate(shx, shy);
          ctx.rotate(headingRad);

          const isCruise = sh.shipType === 'CRUISE';
          const isTug = sh.shipType === 'TUG';
          const isHydrofoil = sh.shipType === 'HYDROFOIL';

          const hullColor = isCruise
            ? (sh.isRestrictedLagoonRoute ? '#f59e0b' : '#6366f1')
            : isTug
            ? '#f97316'
            : isHydrofoil
            ? '#06b6d4'
            : '#3b82f6';

          const sScale = isCruise ? Math.max(1.2, sh.lengthMeters / 180) : 1.0;

          // Ship Hull Polygon
          ctx.beginPath();
          ctx.moveTo(0, -14 * sScale); // Bow
          ctx.lineTo(5 * sScale, -4 * sScale);
          ctx.lineTo(5 * sScale, 12 * sScale);
          ctx.lineTo(-5 * sScale, 12 * sScale);
          ctx.lineTo(-5 * sScale, -4 * sScale);
          ctx.closePath();
          ctx.fillStyle = hullColor;
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#fbbf24' : '#ffffff';
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.stroke();

          // Superstructure / Deck for cruise ships
          if (isCruise) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-3 * sScale, -5 * sScale, 6 * sScale, 12 * sScale);
            // Funnel
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-2 * sScale, 3 * sScale, 4 * sScale, 3 * sScale);
          }

          ctx.restore(); // Undo rotation and translation

          // Ship Label Tag
          ctx.font = '600 10px "Bricolage Grotesque", sans-serif';
          const shipLabel = isCruise
            ? `🚢 ${sh.name} (${sh.speedKnots} kn)`
            : isTug
            ? `⚓ ${sh.name}`
            : isHydrofoil
            ? `⚡ ${sh.name}`
            : `🚢 ${sh.name}`;

          ctx.fillStyle = paletteTheme === 'notte' ? '#e2e8f0' : '#1e293b';
          ctx.fillText(shipLabel, shx + 10, shy - 2);

          // Berth subtext
          if (camera.s > 0.02 || isSelected) {
            ctx.font = '500 8.5px "DM Mono", monospace';
            ctx.fillStyle = sh.isRestrictedLagoonRoute ? '#f59e0b' : '#38bdf8';
            ctx.fillText(sh.berth, shx + 10, shy + 9);
          }
        }
      }

      // 13. Render City Assets (Fontanelle & Ponti Accessibili & Veritas)
      if (showCityAssets) {
        // Fountains 💧
        if (fountains && fountains.length > 0) {
          for (const f of fountains) {
            const fx = sx(mx(f.lon));
            const fy = sy(my(f.lat));

            ctx.beginPath();
            ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#06b6d4';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (camera.s > 0.05) {
              ctx.font = '500 8.5px "DM Mono", monospace';
              ctx.fillStyle = '#06b6d4';
              ctx.fillText(`💧 ${f.name}`, fx + 6, fy + 3);
            }
          }
        }

        // Accessible Bridges ♿
        if (accessibleBridges && accessibleBridges.length > 0) {
          for (const b of accessibleBridges) {
            const bx = sx(mx(b.lon));
            const by = sy(my(b.lat));

            ctx.beginPath();
            ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            if (camera.s > 0.035) {
              ctx.font = '600 9px "DM Mono", monospace';
              ctx.fillStyle = '#10b981';
              ctx.fillText(`♿ ${b.name} (Rampa)`, bx + 7, by + 3);
            }
          }
        }

        // Veritas Waste Boats ♻️
        if (veritasServices && veritasServices.length > 0) {
          for (const v of veritasServices) {
            const vx = sx(mx(v.lon));
            const vy = sy(my(v.lat));

            ctx.beginPath();
            ctx.arc(vx, vy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#84cc16';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (camera.s > 0.035) {
              ctx.font = '500 8.5px "DM Mono", monospace';
              ctx.fillStyle = '#84cc16';
              ctx.fillText(`♻️ ${v.name}`, vx + 6, vy + 3);
            }
          }
        }
      }

      // 14. Render Real-time Parkings (Piazzale Roma & Tronchetto)
      if (showParkings && parkings && parkings.length > 0) {
        for (const p of parkings) {
          const px = sx(mx(p.lon));
          const py = sy(my(p.lat));

          const isFull = p.freeSpots < 50;
          const badgeCol = isFull ? '#ef4444' : p.freeSpots < 150 ? '#f59e0b' : '#14b8a6';

          ctx.save();
          ctx.font = '700 9.5px "DM Mono", monospace';
          const pTxt = `🅿️ ${p.name}: ${p.freeSpots} liberi`;
          const pW = ctx.measureText(pTxt).width;

          ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = badgeCol;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(px - pW / 2 - 5, py - 18, pW + 10, 16, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = badgeCol;
          ctx.fillText(pTxt, px - pW / 2, py - 6);
          ctx.restore();
        }
      }

      // 15. Render ARPAV Air Quality Stations
      if (showAirQuality && airStations && airStations.length > 0) {
        for (const a of airStations) {
          const ax = sx(mx(a.lon));
          const ay = sy(my(a.lat));

          ctx.save();
          ctx.font = '600 9px "DM Mono", monospace';
          const aTxt = `🍃 ARPAV ${a.stationName} · AQI ${a.aqi} (PM10: ${a.pm10}µg)`;
          const aW = ctx.measureText(aTxt).width;

          ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ax - aW / 2 - 4, ay - 16, aW + 8, 15, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.fillText(aTxt, ax - aW / 2, ay - 5);
          ctx.restore();
        }
      }

      // 16. Render Smart Control Room Pedestrian Flow Counters
      if (showPedestrianFlows && pedestrianFlows && pedestrianFlows.length > 0) {
        for (const pf of pedestrianFlows) {
          const pfx = sx(mx(pf.lon));
          const pfy = sy(my(pf.lat));

          ctx.save();
          ctx.font = '700 9px "DM Mono", monospace';
          const pfTxt = `🚶 ${pf.sensorName}: ${pf.hourlyFlow.toLocaleString()} p/h`;
          const pfW = ctx.measureText(pfTxt).width;

          ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(pfx - pfW / 2 - 5, pfy - 16, pfW + 10, 15, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f43f5e';
          ctx.fillText(pfTxt, pfx - pfW / 2, pfy - 5);
          ctx.restore();
        }
      }

      // 17. Render Alilaguna Airport Water Routes, Darsene & Boats (Transitland f-u20f-alilagunaspa)
      if (showAlilaguna) {
        // 17a. Alilaguna Navigational Routes
        if (alilagunaRoutes && alilagunaRoutes.length > 0) {
          for (const r of alilagunaRoutes) {
            if (!r.shape || r.shape.length < 2) continue;
            ctx.save();
            ctx.beginPath();
            const [p0Lon, p0Lat] = r.shape[0];
            ctx.moveTo(sx(mx(p0Lon)), sy(my(p0Lat)));
            for (let i = 1; i < r.shape.length; i++) {
              const [pLon, pLat] = r.shape[i];
              ctx.lineTo(sx(mx(pLon)), sy(my(pLat)));
            }
            ctx.strokeStyle = r.color;
            ctx.lineWidth = camera.s > 0.03 ? 2.5 : 1.8;
            ctx.setLineDash([5, 4]);
            ctx.stroke();
            ctx.restore();
          }
        }

        // 17b. Alilaguna Darsene & Hubs (with special spotlight on Aeroporto Marco Polo Darsena VCE)
        if (alilagunaStops && alilagunaStops.length > 0) {
          for (const st of alilagunaStops) {
            const stx = sx(mx(st.lon));
            const sty = sy(my(st.lat));
            if (stx < -60 || stx > cw + 60 || sty < -60 || sty > ch + 60) continue;

            if (st.isAirportHub) {
              // Darsena Aeroporto VCE Marco Polo - Intermodal Airport Hub
              ctx.save();
              const pulse = 10 + Math.sin(Date.now() / 250) * 3.5;
              ctx.beginPath();
              ctx.arc(stx, sty, pulse, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(0, 85, 165, 0.2)';
              ctx.fill();
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(stx, sty, 5.5, 0, Math.PI * 2);
              ctx.fillStyle = '#0055a5';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Hub Label Tag
              ctx.font = '700 9.5px "Bricolage Grotesque", sans-serif';
              const hubTxt = '✈️ Darsena VCE Aeroporto (Alilaguna Hub)';
              const hubW = ctx.measureText(hubTxt).width;
              ctx.fillStyle = 'rgba(0, 85, 165, 0.92)';
              ctx.beginPath();
              ctx.roundRect(stx - hubW / 2 - 5, sty - 22, hubW + 10, 16, 5);
              ctx.fill();
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.fillText(hubTxt, stx - hubW / 2, sty - 10);
              ctx.restore();
            } else {
              // Regular Alilaguna Darsena
              ctx.save();
              ctx.beginPath();
              ctx.arc(stx, sty, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = '#0055a5';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();

              if (camera.s > 0.04) {
                ctx.font = '600 8px "DM Mono", monospace';
                ctx.fillStyle = '#60a5fa';
                ctx.fillText(`⚓ ${st.name}`, stx + 6, sty + 3);
              }
              ctx.restore();
            }
          }
        }

        // 17c. Alilaguna Active Waterbuses in Navigation
        if (alilagunaBoats && alilagunaBoats.length > 0) {
          for (const b of alilagunaBoats) {
            const live = getLiveAlilagunaBoat(b, currentTimeSeconds, alilagunaRoutes);
            const bx = sx(mx(live.lon));
            const by = sy(my(live.lat));
            if (bx < -60 || bx > cw + 60 || by < -60 || by > ch + 60) continue;

            const isSelected = selectedAlilagunaBoat?.id === b.id;
            const headingRad = (live.heading * Math.PI) / 180;

            // Wake foam trail
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(headingRad);
            const wakeGrad = ctx.createLinearGradient(0, 0, 0, 32);
            wakeGrad.addColorStop(0, isSelected ? 'rgba(56, 189, 248, 0.95)' : 'rgba(255, 255, 255, 0.65)');
            wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            ctx.beginPath();
            ctx.moveTo(-2, 5);
            ctx.lineTo(-6, 30);
            ctx.lineTo(6, 30);
            ctx.lineTo(2, 5);
            ctx.closePath();
            ctx.fillStyle = wakeGrad;
            ctx.fill();

            // Waterbus Hull
            ctx.beginPath();
            ctx.moveTo(0, -10); // bow
            ctx.lineTo(4.5, -3);
            ctx.lineTo(4.5, 9);
            ctx.lineTo(-4.5, 9);
            ctx.lineTo(-4.5, -3);
            ctx.closePath();
            ctx.fillStyle = b.color;
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#fbbf24' : '#ffffff';
            ctx.lineWidth = isSelected ? 2.2 : 1.2;
            ctx.stroke();

            // Cabin Roof
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2.5, -3, 5, 8);
            ctx.restore();

            // Boat label badge
            ctx.save();
            ctx.font = '700 8.5px "DM Mono", monospace';
            const bTxt = `🚤 ALILAGUNA ${b.lineCode} (${b.speedKmh} km/h)`;
            const bW = ctx.measureText(bTxt).width;
            ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)';
            ctx.beginPath();
            ctx.roundRect(bx - bW / 2 - 4, by - 16, bW + 8, 14, 4);
            ctx.fill();
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = b.color;
            ctx.fillText(bTxt, bx - bW / 2, by - 6);
            ctx.restore();
          }
        }
      }

      // 18. Render Earth Observation Satellites (Copernicus Sentinel-1/2, COSMO-SkyMed, ISS, Landsat, Galileo)
      if (showSatellites && satellites && satellites.length > 0) {
        for (const sat of satellites) {
          const live = getLiveSatellite(sat, currentTimeSeconds);
          const satX = sx(mx(live.lon));
          const satY = sy(my(live.lat));
          const isSelected = selectedSatellite?.id === sat.id;

          const satCol = sat.type === 'SAR_RADAR'
            ? '#e879f9' // fuchsia/neon pink for radar
            : sat.type === 'OPTICAL'
            ? '#38bdf8' // cyan for optical multispectral
            : sat.type === 'SPACE_STATION'
            ? '#fbbf24' // gold/amber for ISS
            : sat.type === 'NAVIGATION'
            ? '#34d399' // emerald for Galileo
            : '#a78bfa'; // violet for thermal/Landsat

          // 1. Draw Orbital Ground Track across the Lagoon & Adriatic
          if (sat.groundTrack && sat.groundTrack.length > 1) {
            ctx.save();
            ctx.beginPath();
            sat.groundTrack.forEach((pt, idx) => {
              const px = sx(mx(pt[0]));
              const py = sy(my(pt[1]));
              if (idx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = isSelected ? '#f0abfc' : satCol;
            ctx.lineWidth = isSelected ? 2.5 : 1.2;
            ctx.setLineDash(isSelected ? [6, 4] : [4, 6]);
            ctx.globalAlpha = isSelected ? 0.85 : 0.45;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
            ctx.restore();
          }

          // 2. Draw Radar/Sensor Swath Footprint projection on ground
          const swathRadius = Math.max(35, Math.min(180, (sat.swathWidthKm / 2.5) * (camera.s / 0.02)));
          ctx.save();
          ctx.translate(satX, satY);
          ctx.rotate((live.heading * Math.PI) / 180);

          // Swath scanning polygon
          ctx.beginPath();
          ctx.ellipse(0, 0, swathRadius * 0.45, swathRadius, 0, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(232, 121, 249, 0.16)'
            : sat.type === 'SAR_RADAR'
            ? 'rgba(232, 121, 249, 0.07)'
            : 'rgba(56, 189, 248, 0.06)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#e879f9' : satCol;
          ctx.lineWidth = isSelected ? 1.5 : 0.8;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // 3. Satellite Icon Silhouette
          // Central satellite bus
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3.5, -4, 7, 8);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(-3.5, -4, 7, 8);

          // Golden Multi-layer thermal insulation core
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-2, -2.5, 4, 5);

          // Solar panel array wings (Left & Right)
          // Solar panel 1 (Left wing)
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-16, -3, 11, 6);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-16, -3, 11, 6);
          // Solar panel grid lines
          ctx.beginPath();
          ctx.moveTo(-10.5, -3);
          ctx.lineTo(-10.5, 3);
          ctx.stroke();

          // Solar panel 2 (Right wing)
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(5, -3, 11, 6);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(5, -3, 11, 6);
          ctx.beginPath();
          ctx.moveTo(10.5, -3);
          ctx.lineTo(10.5, 3);
          ctx.stroke();

          // Radar SAR Antenna / Nadir Optical Sensor Boom
          if (sat.type === 'SAR_RADAR') {
            ctx.strokeStyle = '#e879f9';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 4);
            ctx.lineTo(0, 9);
            ctx.stroke();
            // Reflector/feed
            ctx.beginPath();
            ctx.arc(0, 9.5, 2.5, 0, Math.PI);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 5, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();

          // 4. Satellite Label Tag
          if (camera.s > 0.012 || isSelected) {
            ctx.save();
            ctx.font = '700 9px "DM Mono", monospace';
            const satLabel = `🛰️ ${sat.name.split('(')[0].trim()} · ${sat.altitudeKm}km`;
            const sW = ctx.measureText(satLabel).width;

            ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.90)';
            ctx.beginPath();
            ctx.roundRect(satX - sW / 2 - 4, satY - 22, sW + 8, 14, 4);
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#f0abfc' : satCol;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = isSelected ? '#f0abfc' : satCol;
            ctx.fillText(satLabel, satX - sW / 2, satY - 12);

            // Subtext readout
            if (isSelected || camera.s > 0.03) {
              ctx.font = '600 8px "DM Mono", monospace';
              ctx.fillStyle = '#e2e8f0';
              ctx.fillText(`${sat.resolution} · ${sat.operator.split('/')[0].trim()}`, satX - sW / 2, satY + 18);
            }
            ctx.restore();
          }
        }
      }

      // 19. Render Passerelle per Acqua Alta (CPSM / Protezione Civile)
      if (showPasserelle && passerelle && passerelle.length > 0) {
        for (const p of passerelle) {
          if (!p.path || p.path.length < 2) continue;
          ctx.save();

          // Outer walkway board outline
          ctx.beginPath();
          p.path.forEach((pt, idx) => {
            const px = sx(mx(pt[0]));
            const py = sy(my(pt[1]));
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });

          // Wooden planks glow & styling
          ctx.strokeStyle = p.isMounted ? '#f59e0b' : '#78716c';
          ctx.lineWidth = Math.max(3.5, 6 * (camera.s / 0.05));
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = p.isMounted ? 0.95 : 0.45;
          ctx.stroke();

          // Elevated metal stilt legs / planks dashes
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 2.5 * (camera.s / 0.05));
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Stanchion marker posts at vertices
          p.path.forEach((pt) => {
            const px = sx(mx(pt[0]));
            const py = sy(my(pt[1]));
            ctx.fillStyle = p.isMounted ? '#fbbf24' : '#a8a29e';
            ctx.beginPath();
            ctx.arc(px, py, Math.max(2.5, 4 * (camera.s / 0.05)), 0, Math.PI * 2);
            ctx.fill();
          });

          // Label when zoomed in
          if (camera.s > 0.06) {
            const midPt = p.path[Math.floor(p.path.length / 2)];
            const lx = sx(mx(midPt[0]));
            const ly = sy(my(midPt[1]));
            ctx.font = '700 8.5px "DM Mono", monospace';
            const label = `🦺 ${p.name.split('-')[0].trim()} (${p.lengthMeters}m)`;
            const lW = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(lx - lW / 2 - 3, ly - 14, lW + 6, 12);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(label, lx - lW / 2, ly - 5);
          }

          ctx.restore();
        }
      }

      // 20. Render Briccole & Fanali di Canale
      if (showMarineSignals && briccole && briccole.length > 0) {
        for (const br of briccole) {
          const bx = sx(mx(br.lon));
          const by = sy(my(br.lat));
          ctx.save();

          // 3 or 5 wooden oak piles
          const pileCount = br.type === 'DAMA_5_PALI' ? 5 : 3;
          const pileRadius = Math.max(1.5, 2.5 * (camera.s / 0.04));
          const pileOffset = Math.max(2.5, 4.5 * (camera.s / 0.04));

          ctx.fillStyle = br.material === 'ROVERE_NATURALE' ? '#854d0e' : '#059669';
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 0.8;

          for (let i = 0; i < pileCount; i++) {
            const ang = (i / pileCount) * Math.PI * 2;
            const px = bx + Math.cos(ang) * pileOffset;
            const py = by + Math.sin(ang) * pileOffset;
            ctx.beginPath();
            ctx.arc(px, py, pileRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Central pile for Dama
          if (br.type === 'DAMA_5_PALI') {
            ctx.beginPath();
            ctx.arc(bx, by, pileRadius * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Active Lantern / Beacon
          if (br.lightColor !== 'NONE') {
            const flashPhase = (currentTimeSeconds * 2 + (parseInt(br.id.replace(/\D/g, ''), 10) || 1)) % 3;
            const isFlashing = flashPhase < 1.2;
            const lColor = br.lightColor === 'GREEN' ? '#10b981' : br.lightColor === 'RED' ? '#ef4444' : '#f8fafc';

            if (isFlashing) {
              // Glowing lantern aura
              ctx.beginPath();
              ctx.arc(bx, by, Math.max(6, 12 * (camera.s / 0.04)), 0, Math.PI * 2);
              ctx.fillStyle = br.lightColor === 'GREEN' ? 'rgba(16, 185, 129, 0.35)' : br.lightColor === 'RED' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.35)';
              ctx.fill();
            }

            // Lantern core
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(2, 3.5 * (camera.s / 0.04)), 0, Math.PI * 2);
            ctx.fillStyle = lColor;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }

          if (camera.s > 0.05) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(br.code, bx + 8, by + 3);
          }

          ctx.restore();
        }
      }

      // 21. Render Piattaforma Oceanografica CNR-ISMAR & Boe Ondametriche
      if (showOceanStations && oceanStations && oceanStations.length > 0) {
        for (const st of oceanStations) {
          const ox = sx(mx(st.lon));
          const oy = sy(my(st.lat));
          ctx.save();

          // Animated ocean wave concentric ripple circles (60 FPS)
          const wavePhase = (currentTimeSeconds * 1.5) % 3;
          const maxRipple = Math.max(16, 32 * (camera.s / 0.02));
          for (let r = 1; r <= 3; r++) {
            const rippleR = (((wavePhase + r) % 3) / 3) * maxRipple;
            const alpha = 1 - (rippleR / maxRipple);
            ctx.beginPath();
            ctx.arc(ox, oy, rippleR, 0, Math.PI * 2);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha * 0.5;
            ctx.stroke();
          }
          ctx.globalAlpha = 1.0;

          if (st.type === 'OCEANOGRAPHIC_PLATFORM') {
            // Steel Lattice Tower / Platform icon
            ctx.fillStyle = '#0e7490';
            ctx.fillRect(ox - 7, oy - 7, 14, 14);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(ox - 7, oy - 7, 14, 14);

            // Helipad circle & cross
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Telemetry readout
            ctx.font = '700 8.5px "DM Mono", monospace';
            const tag = `🔬 CNR ISMAR · Hs ${st.waveHeightMeters}m · ${st.waterTempC}°C`;
            const tW = ctx.measureText(tag).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(ox - tW / 2 - 4, oy - 22, tW + 8, 13);
            ctx.strokeStyle = '#06b6d4';
            ctx.strokeRect(ox - tW / 2 - 4, oy - 22, tW + 8, 13);
            ctx.fillStyle = '#22d3ee';
            ctx.fillText(tag, ox - tW / 2, oy - 12);
          } else {
            // Wave buoy floating marker
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(ox, oy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`Hs ${st.waveHeightMeters}m`, ox + 8, oy + 3);
          }

          ctx.restore();
        }
      }

      // 22. Render Acque di Balneazione (ARPAV)
      if (showBathingWaters && bathingWaters && bathingWaters.length > 0) {
        for (const bw of bathingWaters) {
          const bx = sx(mx(bw.lon));
          const by = sy(my(bw.lat));
          ctx.save();

          // Coastal lifesaver ring
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Blue Flag badge
          if (bw.blueFlag) {
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          if (camera.s > 0.02) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(`🌊 ${bw.name.split('-')[1]?.trim() || bw.name}`, bx + 9, by + 3);
          }

          ctx.restore();
        }
      }

      // 23. Render Verde Urbano & Alberi Monumentali
      if (showTrees && trees && trees.length > 0) {
        for (const tr of trees) {
          const tx = sx(mx(tr.lon));
          const ty = sy(my(tr.lat));
          ctx.save();

          const canopyR = Math.max(5, Math.min(18, (tr.canopyDiameterMeters / 2) * (camera.s / 0.02)));
          // Tree foliage canopy
          ctx.beginPath();
          ctx.arc(tx, ty, canopyR, 0, Math.PI * 2);
          ctx.fillStyle = tr.ageClass === 'MONUMENTALE' ? 'rgba(34, 197, 94, 0.50)' : 'rgba(74, 222, 128, 0.40)';
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Tree trunk
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(tx, ty, 2, 0, Math.PI * 2);
          ctx.fill();

          if (camera.s > 0.04) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#4ade80';
            ctx.fillText(`🌳 ${tr.commonName}`, tx + canopyR + 3, ty + 3);
          }

          ctx.restore();
        }
      }

      // 24. Render Colonnine Ricarica EV & Wi-Fi Hotspots
      if (showServicesVenice) {
        if (evCharging && evCharging.length > 0) {
          for (const ev of evCharging) {
            const ex = sx(mx(ev.lon));
            const ey = sy(my(ev.lat));
            ctx.save();
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(ex, ey, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Lightning glyph
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 7px sans-serif';
            ctx.fillText('⚡', ex - 3.5, ey + 2.5);

            if (camera.s > 0.035) {
              ctx.font = '600 8px "DM Mono", monospace';
              ctx.fillStyle = '#fde047';
              ctx.fillText(`${ev.availableSockets}/${ev.totalSockets} EV`, ex + 8, ey + 3);
            }
            ctx.restore();
          }
        }

        if (wifiHotspots && wifiHotspots.length > 0) {
          for (const wf of wifiHotspots) {
            const wx = sx(mx(wf.lon));
            const wy = sy(my(wf.lat));
            ctx.save();
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (camera.s > 0.05) {
              ctx.font = '600 8px "DM Mono", monospace';
              ctx.fillStyle = '#818cf8';
              ctx.fillText(`📶 Wi-Fi (${wf.usersConnected})`, wx + 7, wy + 3);
            }
            ctx.restore();
          }
        }
      }

      // 25. Render Limiti di Velocità & Aree Blu (Canali)
      if (showCanalLimits && canalSpeedLimits && canalSpeedLimits.length > 0) {
        for (const limit of canalSpeedLimits) {
          if (!limit.path || limit.path.length < 2) continue;
          ctx.save();
          ctx.beginPath();
          limit.path.forEach((pt, idx) => {
            const px = sx(mx(pt[0]));
            const py = sy(my(pt[1]));
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          // Speed route line
          ctx.strokeStyle = limit.color;
          ctx.lineWidth = Math.max(3, 5 * (camera.s / 0.04));
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.85;
          ctx.stroke();

          // Dashed center guideline
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Speedometer badge at midpoint
          if (camera.s > 0.03) {
            const midIdx = Math.floor(limit.path.length / 2);
            const midPt = limit.path[midIdx];
            const lx = sx(mx(midPt[0]));
            const ly = sy(my(midPt[1]));
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(lx, ly, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = limit.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 9px "DM Mono", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${limit.maxSpeedKmh}`, lx, ly);
            ctx.textAlign = 'start';
            ctx.textBaseline = 'alphabetic';
          }
          ctx.restore();
        }
      }

      // 26. Render Franchi di Tiro Ponti & Altezze Marea
      if (showBridges && bridges && bridges.length > 0) {
        for (const b of bridges) {
          const bx = sx(mx(b.lon));
          const by = sy(my(b.lat));
          ctx.save();

          const liveClearance = b.clearanceCmZeroMarea - tideLevel;
          const isNavigable = liveClearance >= 160;

          // Bridge arch icon
          ctx.fillStyle = isNavigable ? '#06b6d4' : '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, by, 5, Math.PI, 0, false); // Arch shape
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (camera.s > 0.04) {
            ctx.font = 'bold 7.5px "DM Mono", monospace';
            ctx.fillStyle = isNavigable ? '#22d3ee' : '#f87171';
            ctx.fillText(`🌉 ${b.bridgeName.split(' ')[1] || b.bridgeName} (${liveClearance}cm)`, bx + 7, by + 3);
          }
          ctx.restore();
        }
      }

      // 27. Render Traghetti da Parada & Stazi Gondole
      if (showGondolas && gondolas && gondolas.length > 0) {
        for (const g of gondolas) {
          const gx = sx(mx(g.lon));
          const gy = sy(my(g.lat));
          ctx.save();

          // If traghetto with crossing path, draw dotted crossing line
          if (g.crossingPath && g.crossingPath.length === 2) {
            const p1x = sx(mx(g.crossingPath[0][0]));
            const p1y = sy(my(g.crossingPath[0][1]));
            const p2x = sx(mx(g.crossingPath[1][0]));
            const p2y = sy(my(g.crossingPath[1][1]));
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Gondola badge
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Oar / Ferro da prua symbol
          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('🚣', gx - 4.5, gy + 3);

          if (camera.s > 0.045) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#d8b4fe';
            ctx.fillText(g.type === 'TRAGHETTO_DA_PARADA' ? `Parada (€${g.priceEur})` : `Stazio (${g.activeGondolas})`, gx + 8, gy + 3);
          }
          ctx.restore();
        }
      }

      // 28. Render Rive d'Approdo Pubbliche & Merci
      if (showDocks && docks && docks.length > 0) {
        for (const d of docks) {
          const dx = sx(mx(d.lon));
          const dy = sy(my(d.lat));
          ctx.save();
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('⚓', dx - 3.5, dy + 2.5);

          if (camera.s > 0.04) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = '#60a5fa';
            ctx.fillText(`Riva Merci (${d.maxStayMinutes}m)`, dx + 8, dy + 3);
          }
          ctx.restore();
        }
      }

      // 29. Render Subsidenza InSAR (Copernicus EGMS)
      if (showSubsidence && subsidencePoints && subsidencePoints.length > 0) {
        for (const sub of subsidencePoints) {
          const sxPos = sx(mx(sub.lon));
          const syPos = sy(my(sub.lat));
          ctx.save();

          // Pulsating displacement circle
          const rateColor = sub.velocityMmYear < -2.0 ? '#f43f5e' : '#fb923c';
          ctx.fillStyle = rateColor;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(sxPos, syPos, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(sxPos, syPos, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (camera.s > 0.03) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = rateColor;
            ctx.fillText(`${sub.velocityMmYear} mm/a`, sxPos + 7, syPos + 3);
          }
          ctx.restore();
        }
      }

      // 30. Render Morfologia Barene & Velme (Natura 2000)
      if (showMorphology && lagoonMorphology && lagoonMorphology.length > 0) {
        for (const morph of lagoonMorphology) {
          if (!morph.coordinates || morph.coordinates.length < 3) continue;
          ctx.save();
          ctx.beginPath();
          morph.coordinates.forEach((pt, idx) => {
            const px = sx(mx(pt[0]));
            const py = sy(my(pt[1]));
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fillStyle = morph.type === 'BARENA_NATURALE' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(14, 165, 233, 0.20)';
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center label
          const cx = sx(mx(morph.center[0]));
          const cy = sy(my(morph.center[1]));
          if (camera.s > 0.02) {
            ctx.font = 'bold 8.5px "DM Mono", monospace';
            ctx.fillStyle = '#34d399';
            ctx.fillText(`🌿 ${morph.name} (${morph.areaHectares}ha)`, cx - 30, cy);
          }
          ctx.restore();
        }
      }

      // 31. Render Stazioni Vento Meteomarine (Scirocco / Bora)
      if (showMarineWind && marineWindStations && marineWindStations.length > 0) {
        for (const w of marineWindStations) {
          const wx = sx(mx(w.lon));
          const wy = sy(my(w.lat));
          ctx.save();

          // Compass arrow pointing in wind direction
          const rad = (w.windDirectionDeg * Math.PI) / 180;
          ctx.translate(wx, wy);
          ctx.rotate(rad);

          // Arrow head
          ctx.fillStyle = w.tidePushRisk === 'CRITICO' || w.tidePushRisk === 'ALTO' ? '#f43f5e' : '#14b8a6';
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(5, 6);
          ctx.lineTo(0, 3);
          ctx.lineTo(-5, 6);
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          if (camera.s > 0.025) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = '#2dd4bf';
            ctx.fillText(`${w.windDirection} ${w.windSpeedKmh}km/h (Hs ${w.waveHeightMeters}m)`, wx + 10, wy + 3);
          }
        }
      }

      // 32. Render Treni Live su Ponte della Libertà & RFI
      if (showTrains && liveTrains && liveTrains.length > 0) {
        for (const tr of liveTrains) {
          const tx = sx(mx(tr.lon));
          const ty = sy(my(tr.lat));
          ctx.save();

          // Sleek high-speed train body
          ctx.fillStyle = tr.trainType === 'FRECCIAROSSA' ? '#dc2626' : '#2563eb';
          ctx.beginPath();
          ctx.roundRect(tx - 12, ty - 4.5, 24, 9, 4);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Headlight glow
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(tx + 12, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (camera.s > 0.025) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = '#f87171';
            ctx.fillText(`🚆 ${tr.trainNumber} (${tr.speedKmh} km/h)`, tx - 14, ty - 8);
          }
          ctx.restore();
        }
      }

      // 33. Render Battelli Ecologici Veritas
      if (showWasteBoats && wasteBoats && wasteBoats.length > 0) {
        for (const wb of wasteBoats) {
          const bx = sx(mx(wb.lon));
          const by = sy(my(wb.lat));
          ctx.save();

          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#000000';
          ctx.fillText('♻️', bx - 3.5, by + 2.5);

          if (camera.s > 0.04) {
            ctx.font = '600 7.5px "DM Mono", monospace';
            ctx.fillStyle = '#a3e635';
            ctx.fillText(wb.boatCode, bx + 7, by + 3);
          }
          ctx.restore();
        }
      }

      // 34. Render Nizioleti Tradizionali & Toponomastica
      if (showNizioleti && nizioleti && nizioleti.length > 0) {
        for (const niz of nizioleti) {
          const nx = sx(mx(niz.lon));
          const ny = sy(my(niz.lat));
          ctx.save();

          // Characteristic Venetian white plaque with black border
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(nx - 4, ny - 4, 8, 8);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(nx - 4, ny - 4, 8, 8);

          if (camera.s > 0.05) {
            ctx.font = 'bold 8px serif';
            ctx.fillStyle = '#0f172a';
            const label = `${niz.streetName} (${niz.civicNumber})`;
            const tW = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(nx + 6, ny - 6, tW + 6, 12);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(nx + 6, ny - 6, tW + 6, 12);
            ctx.fillStyle = '#000000';
            ctx.fillText(label, nx + 9, ny + 3);
          }
          ctx.restore();
        }
      }

      // 35. Render Vere da Pozzo Storiche
      if (showWells && wells && wells.length > 0) {
        for (const w of wells) {
          const wx = sx(mx(w.lon));
          const wy = sy(my(w.lat));
          ctx.save();

          // Well stone ring
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Hole in the center
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(wx, wy, 1.8, 0, Math.PI * 2);
          ctx.fill();

          if (camera.s > 0.05) {
            ctx.font = '600 7.5px "DM Mono", monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(w.name.split(' ')[4] || w.name, wx + 7, wy + 3);
          }
          ctx.restore();
        }
      }

      // 36. Render Campanili & Torri Pendenti
      if (showBellTowers && bellTowers && bellTowers.length > 0) {
        for (const bt of bellTowers) {
          const bx = sx(mx(bt.lon));
          const by = sy(my(bt.lat));
          ctx.save();

          ctx.fillStyle = bt.isLeaning ? '#f97316' : '#ea580c';
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('🔔', bx - 3.5, by + 2.5);

          if (camera.s > 0.03) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = '#fdba74';
            ctx.fillText(bt.isLeaning ? `${bt.name} (Pendente ${bt.tiltAngleDeg}°)` : bt.name, bx + 8, by + 3);
          }
          ctx.restore();
        }
      }

      // 37. Render Fortezze Lagunari & Isole Storiche
      if (showFortresses && fortressIslands && fortressIslands.length > 0) {
        for (const fort of fortressIslands) {
          const fx = sx(mx(fort.lon));
          const fy = sy(my(fort.lat));
          ctx.save();

          // Star fort bastion badge
          ctx.fillStyle = '#78716c';
          ctx.beginPath();
          ctx.arc(fx, fy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e7e5e4';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 8px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('🏰', fx - 4, fy + 3);

          if (camera.s > 0.02) {
            ctx.font = 'bold 8.5px "DM Mono", monospace';
            ctx.fillStyle = '#d6d3d1';
            ctx.fillText(`🏰 ${fort.name}`, fx + 10, fy + 3);
          }
          ctx.restore();
        }
      }

      // 38. Render Rete Sanitaria SUEM 118, DAE & Farmacie
      if (showEmergencyDocks && emergencyDocks && emergencyDocks.length > 0) {
        for (const ed of emergencyDocks) {
          const ex = sx(mx(ed.lon));
          const ey = sy(my(ed.lat));
          ctx.save();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ex, ey, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('🚑', ex - 3.5, ey + 2.5);

          if (camera.s > 0.035) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = '#f87171';
            ctx.fillText(`SUEM 118 ${ed.dockCode}`, ex + 8, ey + 3);
          }
          ctx.restore();
        }
      }

      if (showDae && daeList && daeList.length > 0) {
        for (const dae of daeList) {
          const dx = sx(mx(dae.lon));
          const dy = sy(my(dae.lat));
          ctx.save();

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 6.5px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('❤️', dx - 3, dy + 2);

          if (camera.s > 0.05) {
            ctx.font = '600 7.5px "DM Mono", monospace';
            ctx.fillStyle = '#34d399';
            ctx.fillText('DAE', dx + 7, dy + 3);
          }
          ctx.restore();
        }
      }

      if (showPharmacies && pharmacies && pharmacies.length > 0) {
        for (const ph of pharmacies) {
          const px = sx(mx(ph.lon));
          const py = sy(my(ph.lat));
          ctx.save();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 6.5px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('💊', px - 3, py + 2);

          if (camera.s > 0.05) {
            ctx.font = '600 7.5px "DM Mono", monospace';
            ctx.fillStyle = '#4ade80';
            ctx.fillText(`Farmacia ${ph.isOnDutyNow ? '(Aperta)' : ''}`, px + 7, py + 3);
          }
          ctx.restore();
        }
      }

      // 39. Render Isole di Calore / LST Satellitare Copernicus
      if (showHeatIslands && heatIslands && heatIslands.length > 0) {
        for (const hi of heatIslands) {
          const hx = sx(mx(hi.lon));
          const hy = sy(my(hi.lat));
          ctx.save();

          const isHot = hi.coolingEffect === 'ISOLA_DI_CALORE';
          const rad = Math.max(14, 28 * (camera.s / 0.03));

          // Radial gradient heatmap blob
          const grad = ctx.createRadialGradient(hx, hy, 2, hx, hy, rad);
          if (isHot) {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
            grad.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
          } else {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
            grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.25)');
            grad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(hx, hy, rad, 0, Math.PI * 2);
          ctx.fill();

          if (camera.s > 0.02) {
            ctx.font = 'bold 8px "DM Mono", monospace';
            ctx.fillStyle = isHot ? '#f87171' : '#38bdf8';
            ctx.fillText(`🌡️ ${hi.surfaceTempCelsius}°C (${hi.airTempDelta > 0 ? '+' : ''}${hi.airTempDelta}°C)`, hx - 20, hy);
          }
          ctx.restore();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    camera,
    currentTimeSeconds,
    selectedDay,
    paletteTheme,
    showRoutes,
    showStops,
    showVehicles,
    showCantieri,
    showSpatialBuffer,
    showFlights,
    flights,
    selectedFlight,
    showShips,
    showShipRoutes,
    ships,
    selectedShipOnMap,
    showMose,
    moseGates,
    showCityAssets,
    fountains,
    accessibleBridges,
    veritasServices,
    showParkings,
    parkings,
    showAirQuality,
    airStations,
    showPedestrianFlows,
    pedestrianFlows,
    showAlilaguna,
    alilagunaRoutes,
    alilagunaStops,
    alilagunaBoats,
    selectedAlilagunaBoat,
    showSatellites,
    satellites,
    selectedSatellite,
    showPasserelle,
    passerelle,
    showMarineSignals,
    briccole,
    showOceanStations,
    oceanStations,
    showBathingWaters,
    bathingWaters,
    showTrees,
    trees,
    showServicesVenice,
    evCharging,
    wifiHotspots,
    bufferRadiusMeters,
    selectedCategory,
    cantieri,
    stops,
    showCanalLimits,
    canalSpeedLimits,
    showBridges,
    bridges,
    showGondolas,
    gondolas,
    showDocks,
    docks,
    showSubsidence,
    subsidencePoints,
    showMorphology,
    lagoonMorphology,
    showMarineWind,
    marineWindStations,
    showTrains,
    liveTrains,
    showWasteBoats,
    wasteBoats,
    showNizioleti,
    nizioleti,
    showWells,
    wells,
    showBellTowers,
    bellTowers,
    showFortresses,
    fortressIslands,
    showEmergencyDocks,
    emergencyDocks,
    showDae,
    daeList,
    showPharmacies,
    pharmacies,
    showHeatIslands,
    heatIslands,
    tideLevel,
    W,
    mx,
    my
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Floating map hint (desktop only to prevent clutter on mobile) */}
      <div className="hidden md:flex absolute md:top-4 md:left-[21rem] xl:md:left-[22rem] pointer-events-none glass-panel px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 text-[11px] sm:text-xs text-[var(--ink-2)] items-center gap-1.5 sm:gap-2 shadow-lg max-w-[calc(100vw-5rem)]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="truncate">Tocca o clicca su mezzi, navi, MOSE, aerei, VCE o cantieri per info</span>
      </div>

      {/* On-Map Zoom & Centering Controls (+ / - / Centra): top-3 on mobile to avoid TimelineControls, bottom-28 on desktop */}
      <div className="absolute right-3 sm:right-5 top-3 sm:top-4 md:top-auto md:bottom-28 lg:md:bottom-32 z-30 flex flex-col items-center gap-1.5 shadow-2xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-white/15 hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Ingrandisci mappa (+)"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-white/15 hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Riduci mappa (-)"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-white/15 hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink-2)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer mt-0.5"
          title="Ricentra vista attuale"
          aria-label="Centra vista"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Floating Vehicle Tooltip */}
      {selectedVehicle && (
        <div
          className="absolute z-40 glass-panel rounded-2xl p-4 shadow-2xl border border-cyan-500/50 w-[calc(100vw-2rem)] max-w-sm sm:w-80 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto"
          style={{
            left:
              typeof window !== 'undefined' && window.innerWidth < 640
                ? 16
                : Math.max(16, Math.min((containerRef.current?.clientWidth || 320) - 340, selectedVehicle.screenX - 160)),
            top:
              typeof window !== 'undefined' && window.innerWidth < 640
                ? 64
                : selectedVehicle.screenY > 210
                ? selectedVehicle.screenY - 180
                : selectedVehicle.screenY + 25
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
                style={{ backgroundColor: selectedVehicle.color }}
              >
                Linea {selectedVehicle.line}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                {selectedVehicle.category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedVehicle(null)}
              className="text-[var(--ink-2)] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Percorso & Direzione</span>
            <span className="font-medium text-[var(--ink)] leading-snug">{selectedVehicle.headsign}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--rule)] text-xs">
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Velocità stimata</span>
              <span className="font-mono font-bold text-emerald-400">{selectedVehicle.speedKmh} km/h</span>
            </div>
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Stato Mezzo</span>
              <span className="font-mono font-bold text-cyan-400">In Navigazione</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Flight Tooltip */}
      {selectedFlight && (
        <div
          className="absolute z-40 glass-panel rounded-2xl p-4 shadow-2xl border border-sky-500/50 w-[calc(100vw-2rem)] max-w-sm sm:w-80 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto right-4 sm:right-5 top-16 sm:top-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-sky-500 text-white flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" /> {selectedFlight.callsign}
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                {selectedFlight.status}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFlight(null)}
              className="text-[var(--ink-2)] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Compagnia & Aeroporto</span>
            <span className="font-medium text-[var(--ink)] leading-snug">
              {selectedFlight.country} · {selectedFlight.airport}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--rule)] text-xs">
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Quota</span>
              <span className="font-mono font-bold text-sky-400">{selectedFlight.altitudeMeters} metri</span>
            </div>
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Velocità</span>
              <span className="font-mono font-bold text-emerald-400">{selectedFlight.speedKmh} km/h</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--ink-2)]">
            <span>Rotta: {selectedFlight.trackDegrees}°</span>
            <span className="text-amber-400 font-semibold">
              Dist. VCE: {(Math.hypot(selectedFlight.lon - 12.3519, selectedFlight.lat - 45.5053) * 111).toFixed(1)} km
            </span>
          </div>

          {onSelectAirport && (
            <button
              type="button"
              onClick={() => {
                setSelectedFlight(null);
                onSelectAirport();
              }}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-mono font-medium border border-sky-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plane className="w-3.5 h-3.5" /> Dettagli Aeroporto Marco Polo (VCE)
            </button>
          )}
        </div>
      )}

      {/* Floating Ship Tooltip */}
      {selectedShipOnMap && (
        <div
          className="absolute z-40 glass-panel rounded-2xl p-4 shadow-2xl border border-indigo-500/50 w-[calc(100vw-2rem)] max-w-sm sm:w-84 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto left-4 sm:left-6 top-16 sm:top-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500 text-white flex items-center gap-1 shadow-sm">
                <Ship className="w-3.5 h-3.5" /> {selectedShipOnMap.name}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                {selectedShipOnMap.shipType}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedShipOnMap(null)}
              className="text-[var(--ink-2)] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Ormeggio & Canale Navigabile</span>
            <span className="font-semibold text-[var(--ink)] leading-snug">{selectedShipOnMap.berth}</span>
            <span className="text-[11px] text-[var(--ink-2)] font-mono">{selectedShipOnMap.destination}</span>
          </div>

          {/* Regulatory compliance pill */}
          <div className={`p-2 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border ${
            selectedShipOnMap.isRestrictedLagoonRoute
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <span>
              {selectedShipOnMap.isRestrictedLagoonRoute
                ? '⚠️ Deviazione Marghera (>25.000 GT · D.L. 103/2021)'
                : '🛡️ Autorizzata al Tronchetto (<25.000 GT)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--rule)] text-xs">
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Velocità</span>
              <span className="font-mono font-bold text-emerald-400">{selectedShipOnMap.speedKnots} nodi</span>
            </div>
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Stazza Lorda</span>
              <span className="font-mono font-bold text-indigo-300">{selectedShipOnMap.grossTonnage.toLocaleString()} GT</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--ink-2)]">
            <span>Rotta: {selectedShipOnMap.heading}° · Pesc: {selectedShipOnMap.draughtMeters}m</span>
            <span className="text-amber-400 font-semibold">{selectedShipOnMap.flag}</span>
          </div>

          {onSelectShip && (
            <button
              type="button"
              onClick={() => {
                const s = selectedShipOnMap;
                setSelectedShipOnMap(null);
                onSelectShip(s);
              }}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Ship className="w-3.5 h-3.5" /> Dettagli Completi & Telemetria AIS
            </button>
          )}
        </div>
      )}

      {/* Floating Alilaguna Boat Tooltip */}
      {selectedAlilagunaBoat && (
        <div
          className="absolute z-40 glass-panel rounded-2xl p-4 shadow-2xl border border-blue-500/50 w-[calc(100vw-2rem)] max-w-sm sm:w-84 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto left-4 sm:left-6 top-16 sm:top-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1 shadow-sm"
                style={{ backgroundColor: selectedAlilagunaBoat.color }}
              >
                <Ship className="w-3.5 h-3.5" /> {selectedAlilagunaBoat.lineName}
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                {selectedAlilagunaBoat.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAlilagunaBoat(null)}
              className="text-[var(--ink-2)] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Destinazione & Scalo Successivo</span>
            <span className="font-semibold text-[var(--ink)] leading-snug">
              Direzione: {selectedAlilagunaBoat.destination}
            </span>
            <span className="text-[11px] text-blue-400 font-mono">
              Prossima fermata: {selectedAlilagunaBoat.nextStop}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--rule)] text-xs">
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Velocità</span>
              <span className="font-mono font-bold text-emerald-400">{selectedAlilagunaBoat.speedKmh} km/h</span>
            </div>
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Passeggeri a bordo</span>
              <span className="font-mono font-bold text-cyan-400">{selectedAlilagunaBoat.passengersOnBoard} pax</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--ink-2)]">
            <span>Rotta: {selectedAlilagunaBoat.heading}°</span>
            <span className="text-amber-400 font-semibold">Feed: f-u20f-alilagunaspa</span>
          </div>

          {onSelectAlilaguna && (
            <button
              type="button"
              onClick={() => {
                setSelectedAlilagunaBoat(null);
                onSelectAlilaguna();
              }}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-mono font-medium border border-blue-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Ship className="w-3.5 h-3.5" /> Dettagli Linee & GTFS Transitland
            </button>
          )}
        </div>
      )}

      {/* Floating Satellite Tooltip */}
      {selectedSatellite && (
        <div
          className="absolute z-40 glass-panel rounded-2xl p-4 shadow-2xl border border-fuchsia-500/50 w-[calc(100vw-2rem)] max-w-sm sm:w-88 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto left-4 sm:left-6 top-16 sm:top-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1 shadow-sm">
                <Satellite className="w-3.5 h-3.5 text-fuchsia-400" /> {selectedSatellite.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                {selectedSatellite.operator.split('/')[0].trim()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSatellite(null)}
              className="text-[var(--ink-2)] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Missione & Telerilevamento</span>
            <span className="font-bold text-[var(--ink)] leading-snug">
              {selectedSatellite.name}
            </span>
            <span className="text-[11px] text-fuchsia-300 leading-relaxed">
              {selectedSatellite.missionTarget}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--rule)] text-xs">
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Quota & Velocità</span>
              <span className="font-mono font-bold text-fuchsia-400">{selectedSatellite.altitudeKm} km</span>
              <span className="text-[10px] text-[var(--ink-2)] font-mono">{selectedSatellite.speedKmh.toLocaleString()} km/h</span>
            </div>
            <div className="bg-[var(--rule)]/40 p-2 rounded-xl border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] block font-mono">Sensore & Risoluzione</span>
              <span className="font-mono font-bold text-cyan-400">{selectedSatellite.resolution}</span>
              <span className="text-[10px] text-[var(--ink-2)] font-mono">Swath {selectedSatellite.swathWidthKm} km</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--ink-2)]">
            <span>Passaggio: {selectedSatellite.nextPassVenice.split('(')[0].trim()}</span>
            <span className="text-emerald-400 font-semibold">Elev. {selectedSatellite.maxElevationDeg}°</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const sat = selectedSatellite;
              setSelectedSatellite(null);
              if (onSelectSatellite) onSelectSatellite(sat);
            }}
            className="w-full mt-1 py-1.5 px-3 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 text-xs font-mono font-medium border border-fuchsia-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Satellite className="w-3.5 h-3.5" /> Scheda Completa & Dati ESA/ASI
          </button>
        </div>
      )}
    </div>
  );
};
