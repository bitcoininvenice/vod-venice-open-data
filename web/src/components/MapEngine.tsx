'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Minus, Maximize2, Box } from 'lucide-react';
import {
  CameraViewPreset,
  TransportModeCategory,
  StopItem,
  CantiereItem,
  LocatedCantiere,
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
  WindField,
  CivicPoiItem,
  TrainLiveItem,
  VeritasWasteBoatItem,
  NizioletoCivicoItem,
  VeniceWellItem,
  BellTowerItem,
  LagoonFortressIslandItem,
  EmergencyWaterDockItem,
  PublicDaeItem,
  PharmacyItem,
  HeatIslandSurfaceTempItem,
  LagoonWaterQualityItem,
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem,
  VeniceCameraItem
} from '@/lib/types';
import type { VeniceFeatureSelected } from './VeniceFeatureDetailModal';
import type { MapObjectSelected } from './MapObjectPanel';
import type { BdapProject } from '@/lib/bdap';
import { GRID, LAND_LO } from '@/lib/simulation-data';
import { drawBaseMap, isLandHiLoaded, requestLandHi } from './map/baseMap';
import { getDynamicPalette, NOTTE, CARTA, ColorScheme } from '@/lib/solar';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { useTranslation } from '@/lib/i18n';
import { simClock } from '@/lib/simClock';
import { getLiveFlight, getLiveSatellite } from './map/mapHelpers';
import type { RenderContext } from './map/renderContext';
import { drawRoutes, drawSpatialBuffer, drawVehicles, drawRealtimeVehicles, drawStops, drawCantieri } from './map/transitLayers';
import { drawFlights } from './map/airLayers';
import { drawMose, drawShipRoutes, drawShips, drawAlilaguna, drawPasserelle, drawMarineSignals, drawOceanStations, drawCanalLimits, drawBridges, drawGondolas, drawDocks, drawMarineWind } from './map/lagoonLayers';
import { bdapRadius, drawBdapWorks, drawCivicPois, drawCityAssets, drawParkings, drawAirQuality, drawPedestrianFlows, drawCameras, drawBathingWaters, drawTrees, drawEvCharging, drawWifiHotspots, drawTrains, drawWasteBoats, drawNizioleti, drawWells, drawBellTowers, drawFortresses, drawEmergencyDocks, drawDae, drawPharmacies } from './map/cityLayers';
import { drawSatellites, drawSubsidence, drawMorphology, drawHeatIslands, drawLagoonWater, drawAccommodations, drawBikeRoutes, drawPollenStations, drawTributaries } from './map/environmentLayers';
import { drawFloodLayer } from './map/floodLayer';
import { drawWindFlow, WIND_COLOR_STOPS } from './map/windLayer';
import { drawFiber } from './map/fiberLayer';
import { drawLagoonNetwork } from './map/lagoonNetworkLayer';
import { withLabelGuard } from './map/labelGuard';
import { pointSegmentDistance, type LagoonNetwork } from '@/lib/lagoonNetwork';
import { FIBER_COLORS, fiberCellAt, indexFiberCells, type FiberDataset } from '@/lib/fiber';
import { MAP_3D_CSS_TRANSFORM, unprojectFrom3D } from '@/lib/map3d';


import { distAt, getSimulation, pointAt } from '@/lib/simulationModel';
import type { RealtimeVehicleDto } from '@/lib/contracts/realtime';

export interface MapEngineProps {
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
  showCameras?: boolean;
  cameras?: VeniceCameraItem[];
  showRealtimeVehicles?: boolean;
  realtimeVehicles?: RealtimeVehicleDto[];
  onSelectCamera?: (camera: VeniceCameraItem) => void;
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
  showEvCharging?: boolean;
  showWifiHotspots?: boolean;
  evCharging?: EvChargingItem[];
  wifiHotspots?: WifiHotspotItem[];
  onSelectFeature?: (feature: VeniceFeatureSelected) => void;
  bufferRadiusMeters: number;
  selectedCategory: TransportModeCategory | 'all';
  /** Solo opere pubbliche con posizione */
  cantieri: LocatedCantiere[];
  stops: StopItem[];
  onSelectStop: (stop: StopItem) => void;
  onSelectCantiere: (cantiere: CantiereItem) => void;
  onSelectAirport?: () => void;
  /** Oggetti in movimento (navi, voli, mezzi, Alilaguna): si aprono nella scheda informativa */
  onSelectObject?: (object: MapObjectSelected) => void;
  /** Clic su un punto vuoto della mappa */
  onClearSelection?: () => void;
  /** Legenda dei livelli attivi, in cima alla pila delle legende */
  legend?: React.ReactNode;
  /** Oggetto e satellite selezionati, evidenziati sulla mappa */
  selectedObject?: MapObjectSelected | null;
  selectedSatellite?: SatelliteItem | null;
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
  /** Campo di vento previsto (Open-Meteo) per le particelle animate del layer vento */
  windField?: WindField | null;
  /** Copertura della rete fissa (AGCOM) */
  showFiber?: boolean;
  fiberData?: FiberDataset | null;
  /** Ecocentri e biblioteche (OpenStreetMap) */
  showRecyclingCentres?: boolean;
  recyclingCentres?: CivicPoiItem[];
  showLibraries?: boolean;
  libraries?: CivicPoiItem[];
  /** Opere in esecuzione (BDAP); quelle senza posizione non vengono disegnate */
  showBdapWorks?: boolean;
  bdapWorks?: BdapProject[] | null;
  /** Briccole, segnalamenti e canali da OpenStreetMap */
  showCanals?: boolean;
  lagoonNetwork?: LagoonNetwork | null;
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
  pharmacies?: PharmacyItem[];
  showHeatIslands?: boolean;
  heatIslands?: HeatIslandSurfaceTempItem[];
  // Open Data Regione Veneto (dati.veneto.it)
  showLagoonWater?: boolean;
  lagoonWaterQuality?: LagoonWaterQualityItem[];
  showAccommodations?: boolean;
  touristAccommodations?: TouristAccommodationItem[];
  showBikeRoutes?: boolean;
  regionalBikeRoutes?: RegionalBikeRouteItem[];
  showPollenStations?: boolean;
  pollenMonitoringStations?: PollenMonitoringStationItem[];
  showTributaries?: boolean;
  lagoonTributaryRivers?: LagoonTributaryRiverItem[];
  tideLevel?: number;
  simulatedTideLevel?: number | null;
  isDesktopLayerPanelOpen?: boolean;
}

export const MapEngine: React.FC<MapEngineProps> = ({
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
  showCameras = true,
  cameras = [],
  showRealtimeVehicles = false,
  realtimeVehicles = [],
  onSelectCamera,
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
  showEvCharging = true,
  showWifiHotspots = true,
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
  onSelectObject,
  onClearSelection,
  selectedObject = null,
  legend,
  selectedSatellite = null,
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
  windField = null,
  showFiber = false,
  fiberData = null,
  showRecyclingCentres = false,
  recyclingCentres = [],
  showLibraries = false,
  libraries = [],
  showBdapWorks = false,
  bdapWorks = null,
  showCanals = false,
  lagoonNetwork = null,
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
  showLagoonWater = false,
  lagoonWaterQuality = [],
  showAccommodations = false,
  touristAccommodations = [],
  showBikeRoutes = false,
  regionalBikeRoutes = [],
  showPollenStations = false,
  pollenMonitoringStations = [],
  showTributaries = false,
  lagoonTributaryRivers = [],
  tideLevel = 0,
  simulatedTideLevel = null,
  isDesktopLayerPanelOpen = true
}) => {
  const { t } = useTranslation();
  // alias: nel codice di disegno `t` è anche il nome locale dell'ora simulata
  const tr = t;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map coordinate bounds
  const W = GRID.W; // 26194
  const H = GRID.H; // 38701
  const [LON0, LON1, LAT0, LAT1] = GRID.frame;
  const KX = W / (LON1 - LON0);
  const KY = H / (LAT1 - LAT0);

  const mx = useCallback((lon: number) => (lon - LON0) * KX, [LON0, KX]);
  const my = useCallback((lat: number) => (LAT1 - lat) * KY, [LAT1, KY]);
  const fiberIndex = useMemo(() => (fiberData ? indexFiberCells(fiberData) : null), [fiberData]);

  // View Camera State (x0, y0, scale)
  const [camera, setCamera] = useState({ x0: 0, y0: 0, s: 0.02 });
  const [is3DView, setIs3DView] = useState(false);
  // Ridisegno quando arrivano le isole dettagliate
  const [landHiReady, setLandHiReady] = useState(false);

  /** Coordinate dello schermo -> piano della mappa (in 3D il canvas è inclinato via CSS). */
  const toMapPlane = (x: number, y: number, rect: DOMRect) =>
    is3DView ? unprojectFrom3D(x, y, rect.width, rect.height) : { x, y };
  const isDraggingRef = useRef(false);
  // Evidenziazione sulla mappa dell'oggetto aperto nella scheda informativa
  const selectedFlight = selectedObject?.type === 'flight' ? selectedObject.data : null;
  const selectedShipOnMap = selectedObject?.type === 'ship' ? selectedObject.data : null;
  const selectedAlilagunaBoat = selectedObject?.type === 'alilagunaBoat' ? selectedObject.data : null;
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  // Hover & Selection state


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
      const newS = Math.min(1.25, prev.s * factor);
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
    const { x: mouseX, y: mouseY } = toMapPlane(e.clientX - rect.left, e.clientY - rect.top, rect);

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(containerRef.current.clientWidth / W, Math.min(1.25, camera.s * zoomFactor));

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
      const p = toMapPlane(t.clientX - rect.left, t.clientY - rect.top, rect);
      touchStartRef.current = {
        mode: 'pan',
        x1: p.x,
        y1: p.y,
        x2: 0,
        y2: 0,
        dist: 0,
        startScale: camera.s,
        camX: camera.x0,
        camY: camera.y0,
        startTime: e.timeStamp
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const { x: x1, y: y1 } = toMapPlane(t1.clientX - rect.left, t1.clientY - rect.top, rect);
      const { x: x2, y: y2 } = toMapPlane(t2.clientX - rect.left, t2.clientY - rect.top, rect);
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
        startTime: e.timeStamp
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const st = touchStartRef.current;

    if (e.touches.length === 1 && st.mode === 'pan') {
      const t = e.touches[0];
      const { x: currentX, y: currentY } = toMapPlane(t.clientX - rect.left, t.clientY - rect.top, rect);
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
      const { x: x1, y: y1 } = toMapPlane(t1.clientX - rect.left, t1.clientY - rect.top, rect);
      const { x: x2, y: y2 } = toMapPlane(t2.clientX - rect.left, t2.clientY - rect.top, rect);
      const newDist = Math.hypot(x2 - x1, y2 - y1);
      const ratio = newDist / (st.dist || 1);

      const newScale = Math.max(containerRef.current.clientWidth / W, Math.min(1.25, st.startScale * ratio));
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const newX0 = st.camX + midX / st.startScale - midX / newScale;
      const newY0 = st.camY + midY / st.startScale - midY / newScale;

      setCamera({ s: newScale, x0: newX0, y0: newY0 });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const st = touchStartRef.current;
    if (st.mode === 'pan' && e.timeStamp - st.startTime < 320) {
      if (e.changedTouches.length === 1 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const t = e.changedTouches[0];
        const { x: tapX, y: tapY } = toMapPlane(t.clientX - rect.left, t.clientY - rect.top, rect);
        if (Math.hypot(tapX - st.x1, tapY - st.y1) < 14) {
          handlePointClick(tapX, tapY);
        }
      }
    }
    touchStartRef.current.mode = 'none';
  };

  // Unified Point Click handler (used by both Mouse Click and Touch Tap)
  // Palette attiva (fissa o dinamica secondo l'ora simulata)
  const paletteAt = (t: number): ColorScheme =>
    paletteTheme === 'notte' ? NOTTE : paletteTheme === 'carta' ? CARTA : getDynamicPalette(t);

  const handlePointClick = (clickX: number, clickY: number) => {
    const currentTimeSeconds = simClock.get();
    // 0. Hit test Aeroporto di Venezia Marco Polo (VCE / LIPZ)
    const vceX = (mx(12.3519) - camera.x0) * camera.s;
    const vceY = (my(45.5053) - camera.y0) * camera.s;
    if (Math.hypot(clickX - vceX, clickY - vceY) <= Math.max(34, 45 * (camera.s / 0.02))) {
      if (onSelectAirport) {
        onSelectAirport();
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
          onSelectObject?.({
            type: 'flight',
            data: {
            ...f,
            lon: live.lon,
            lat: live.lat,
            trackDegrees: live.heading,
            altitudeMeters: live.alt
            },
          });
          return;
        }
      }
    }

    // 1b. Hit test Ships & Cruise Vessels (with live channel motion)
    if (showShips && ships && ships.length > 0) {
      for (const s of ships) {
        const sxPos = (mx(s.lon) - camera.x0) * camera.s;
        const syPos = (my(s.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - sxPos, clickY - syPos) <= 18) {
          onSelectObject?.({ type: 'ship', data: s });
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
            return;
          }
        }
      }
    }

    // 1d. Hit test Alilaguna Waterbuses (Deterministic Official GTFS Timetable)
    if (showAlilaguna) {
      const scheduledBoats = getScheduledAlilagunaBoats(currentTimeSeconds);
      for (const b of scheduledBoats) {
        const bxPos = (mx(b.lon) - camera.x0) * camera.s;
        const byPos = (my(b.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - bxPos, clickY - byPos) <= 22) {
          onSelectObject?.({ type: 'alilagunaBoat', data: b });
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
            return;
          }
        }
      }
    }

    // 1f. Hit test Venice Cameras & Webcams (Anopticon CCTV & Public Webcams)
    if (showCameras && cameras && cameras.length > 0) {
      for (const cam of cameras) {
        const cx = (mx(cam.lon) - camera.x0) * camera.s;
        const cy = (my(cam.lat) - camera.y0) * camera.s;
        const hitRadius = cam.hasLiveFeed ? 22 : 16;
        if (Math.hypot(clickX - cx, clickY - cy) <= hitRadius) {
          if (onSelectCamera) {
            onSelectCamera(cam);
            return;
          }
        }
      }
    }

    // 1g. Hit test Earth Observation Satellites (ESA / ASI / NASA)
    if (showSatellites && satellites && satellites.length > 0) {
      for (const sat of satellites) {
        const live = getLiveSatellite(sat, currentTimeSeconds);
        const satX = (mx(live.lon) - camera.x0) * camera.s;
        const satY = (my(live.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - satX, clickY - satY) <= 24) {
          onSelectSatellite?.({
            ...sat,
            currentLon: live.lon,
            currentLat: live.lat,
            heading: live.heading
          });
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
            return;
          }
        }
      }
    }

    // 1l. Hit test Colonnine Ricarica EV
    if (showEvCharging && evCharging && evCharging.length > 0) {
      for (const ev of evCharging) {
        const ex = (mx(ev.lon) - camera.x0) * camera.s;
        const ey = (my(ev.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - ex, clickY - ey) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'evCharging', data: ev });
            return;
          }
        }
      }
    }

    // 1m. Hit test Hotspot Wi-Fi VeniceConnected
    if (showWifiHotspots && wifiHotspots && wifiHotspots.length > 0) {
      for (const wf of wifiHotspots) {
        const wx = (mx(wf.lon) - camera.x0) * camera.s;
        const wy = (my(wf.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - wx, clickY - wy) <= 20) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'wifiHotspot', data: wf });
            return;
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
            return;
          }
        }
      }
    }

    // 1s2. Hit test Parcheggi Auto Real-time
    if (showParkings && parkings && parkings.length > 0) {
      for (const p of parkings) {
        const px = (mx(p.lon) - camera.x0) * camera.s;
        const py = (my(p.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - px, clickY - (py - 10)) <= 28) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'parking', data: p });
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
            return;
          }
        }
      }
    }

    // 1ab. Hit test Acque Lagunari ARPAV (Dati Sonda)
    if (showLagoonWater && lagoonWaterQuality && lagoonWaterQuality.length > 0) {
      for (const wq of lagoonWaterQuality) {
        const wx = (mx(wq.lon) - camera.x0) * camera.s;
        const wy = (my(wq.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - wx, clickY - wy) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'lagoonWater', data: wq });
            return;
          }
        }
      }
    }

    // 1ac. Hit test Strutture Ricettive & Overtourism
    if (showAccommodations && touristAccommodations && touristAccommodations.length > 0) {
      for (const acc of touristAccommodations) {
        const ax = (mx(acc.lon) - camera.x0) * camera.s;
        const ay = (my(acc.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - ax, clickY - ay) <= 28) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'accommodation', data: acc });
            return;
          }
        }
      }
    }

    // 1ad. Hit test Ciclovia delle Isole di Venezia
    if (showBikeRoutes && regionalBikeRoutes && regionalBikeRoutes.length > 0) {
      for (const br of regionalBikeRoutes) {
        for (const pt of br.path) {
          const bx = (mx(pt[0]) - camera.x0) * camera.s;
          const by = (my(pt[1]) - camera.y0) * camera.s;
          if (Math.hypot(clickX - bx, clickY - by) <= 20) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'bikeRoute', data: br });
              return;
            }
          }
        }
      }
    }

    // 1ae. Hit test Monitoraggio Pollini ARPAV
    if (showPollenStations && pollenMonitoringStations && pollenMonitoringStations.length > 0) {
      for (const pol of pollenMonitoringStations) {
        const px = (mx(pol.lon) - camera.x0) * camera.s;
        const py = (my(pol.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - px, clickY - py) <= 24) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'pollenStation', data: pol });
            return;
          }
        }
      }
    }

    // 1af. Hit test Fiumi Scolanti & Bacino Laguna
    if (showTributaries && lagoonTributaryRivers && lagoonTributaryRivers.length > 0) {
      for (const riv of lagoonTributaryRivers) {
        const rx = (mx(riv.lon) - camera.x0) * camera.s;
        const ry = (my(riv.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - rx, clickY - ry) <= 26) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'tributaryRiver', data: riv });
            return;
          }
        }
        for (const pt of riv.path) {
          const px = (mx(pt[0]) - camera.x0) * camera.s;
          const py = (my(pt[1]) - camera.y0) * camera.s;
          if (Math.hypot(clickX - px, clickY - py) <= 20) {
            if (onSelectFeature) {
              onSelectFeature({ type: 'tributaryRiver', data: riv });
              return;
            }
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
              return;
            }
          }
        }
      }
    }

    // 1aa. Stazioni qualità dell'aria ARPAV (etichetta disegnata sopra il punto)
    if (showAirQuality && airStations && airStations.length > 0 && onSelectFeature) {
      for (const a of airStations) {
        const ax = (mx(a.lon) - camera.x0) * camera.s;
        const ay = (my(a.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - ax, clickY - (ay - 8)) <= 18) {
          onSelectFeature({ type: 'airStation', data: a });
          return;
        }
      }
    }

    // 1aa. Opere in esecuzione (BDAP)
    if (showBdapWorks && bdapWorks && onSelectFeature) {
      for (const w of bdapWorks) {
        if (w.lat === null || w.lon === null) continue;
        const px = (mx(w.lon) - camera.x0) * camera.s;
        const py = (my(w.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - px, clickY - py) <= Math.max(12, bdapRadius(w.costPlannedEur) + 3)) {
          onSelectFeature({ type: 'bdapWork', data: w });
          return;
        }
      }
    }

    // 1ab0. Ecocentri e biblioteche (OpenStreetMap)
    if (onSelectFeature) {
      const civic = [...(showRecyclingCentres ? recyclingCentres : []), ...(showLibraries ? libraries : [])];
      for (const p of civic) {
        const px = (mx(p.lon) - camera.x0) * camera.s;
        const py = (my(p.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - px, clickY - py) <= 14) {
          onSelectFeature({ type: 'civicPoi', data: p });
          return;
        }
      }
    }

    // 1ab. Hit test Fontanelle Potabili (City Assets - Fountains)
    if (showCityAssets && fountains && fountains.length > 0) {
      for (const f of fountains) {
        const fx = (mx(f.lon) - camera.x0) * camera.s;
        const fy = (my(f.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - fx, clickY - fy) <= 16) {
          if (onSelectFeature) {
            onSelectFeature({ type: 'fountain', data: f });
            return;
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
          return;
        }
      }
    }

    // 4. Hit test Moving Vehicles (ACTV)
    if (showVehicles) {
      const sim = getSimulation();
      const tripsData = sim?.daysTrips[selectedDay];
      if (sim && tripsData) {
        const { tP, t0, t1, count } = tripsData;
        const t = currentTimeSeconds;
        const ptNow: [number, number] = [0, 0];


        for (let i = 0; i < count; i++) {
          if (t0[i] > t || t1[i] < t) continue;
          const prof = sim.profs[tP[i]];
          const rCat: string = prof.route.cat || 'vaporetto';
          if (selectedCategory !== 'all' && rCat !== selectedCategory) continue;

          pointAt(prof.sh, distAt(prof, t - t0[i]), ptNow);
          const vx = (ptNow[0] - camera.x0) * camera.s;
          const vy = (ptNow[1] - camera.y0) * camera.s;

          if (Math.hypot(clickX - vx, clickY - vy) <= 18) {
            // Velocità media secondo l'orario negli ultimi 30 s (1 unità di griglia ≈ 1 m)
            const dtNow = t - t0[i];
            const spanSec = Math.min(30, Math.max(1, dtNow));
            const speedKmh = Math.round(((distAt(prof, dtNow) - distAt(prof, dtNow - spanSec)) / spanSec) * 3.6 * 10) / 10;
            const lineName = prof.route.n || 'ACTV';
            const longName = `${tr('ui.mapLabels.line', { line: lineName })} · ${tr('ui.map.orarioUfficialeActv')}`;
            onSelectObject?.({
              type: 'vehicle',
              data: {
                line: lineName,
                category: rCat.toUpperCase(),
                speedKmh,
                color: paletteAt(currentTimeSeconds).cats[rCat] || '#5cc8ff',
                headsign: longName,
                source: 'schedule',
              },
            });
            return;
          }
        }
      }
    }

    // 5. Hit test posizioni reali GTFS-RT
    if (showRealtimeVehicles && realtimeVehicles.length > 0) {
      for (const v of realtimeVehicles) {
        const vx = (mx(v.lon) - camera.x0) * camera.s;
        const vy = (my(v.lat) - camera.y0) * camera.s;
        if (Math.hypot(clickX - vx, clickY - vy) <= 14) {
          const cat = v.category || 'vaporetto';
          onSelectObject?.({
            type: 'vehicle',
            data: {
              line: v.line || '?',
              category: `${cat.toUpperCase()} · GPS`,
              speedKmh: null,
              color: paletteAt(currentTimeSeconds).cats[cat] || '#34d399',
              headsign: v.line ? `${tr('ui.mapLabels.line', { line: v.line })} · ${tr(v.network === 'navigazione' ? 'ui.mapLabels.networkNav' : 'ui.mapLabels.networkBus')}` : tr('ui.mapLabels.unknownLine', { id: v.label || v.id }),
              source: 'gps',
              updatedAt: v.timestamp,
            },
          });
          return;
        }
      }
    }

    // Briccole e segnalamenti OpenStreetMap: il punto più vicino entro 10 px
    if (showMarineSignals && lagoonNetwork && onSelectFeature) {
      let best: { d: number; m: (typeof lagoonNetwork.markers)[number] } | null = null;
      for (const m of lagoonNetwork.markers) {
        const d = Math.hypot(clickX - (mx(m[0]) - camera.x0) * camera.s, clickY - (my(m[1]) - camera.y0) * camera.s);
        if (d <= 10 && (!best || d < best.d)) best = { d, m };
      }
      if (best) {
        onSelectFeature({ type: 'lagoonMarker', data: { lon: best.m[0], lat: best.m[1], kind: best.m[2], osmId: best.m[3] } });
        return;
      }
    }

    // Canali OpenStreetMap: il tracciato più vicino entro 8 px
    if (showCanals && lagoonNetwork && onSelectFeature) {
      let best: { d: number; c: (typeof lagoonNetwork.canals)[number] } | null = null;
      for (const c of lagoonNetwork.canals) {
        for (let i = 1; i < c.coords.length; i++) {
          const ax = (mx(c.coords[i - 1][0]) - camera.x0) * camera.s;
          const ay = (my(c.coords[i - 1][1]) - camera.y0) * camera.s;
          const bx = (mx(c.coords[i][0]) - camera.x0) * camera.s;
          const by = (my(c.coords[i][1]) - camera.y0) * camera.s;
          const d = pointSegmentDistance(clickX, clickY, ax, ay, bx, by);
          if (d <= 8 && (!best || d < best.d)) best = { d, c };
        }
      }
      if (best) {
        onSelectFeature({ type: 'canal', data: best.c });
        return;
      }
    }

    // Copertura fibra: ultima priorità, si apre la scheda della cella sotto il clic
    if (showFiber && fiberData && fiberIndex && onSelectFeature) {
      const lon = LON0 + (clickX / camera.s + camera.x0) / KX;
      const lat = LAT1 - (clickY / camera.s + camera.y0) / KY;
      const cell = fiberCellAt(fiberData, fiberIndex, lon, lat);
      if (cell) {
        onSelectFeature({ type: 'fiberCell', data: { cell, dataDate: fiberData.dataDate } });
        return;
      }
    }

    // Clic su un punto vuoto: si chiude la scheda aperta
    onClearSelection?.();
  };

  // Mouse click wrapper
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = toMapPlane(e.clientX - rect.left, e.clientY - rect.top, rect);
    handlePointClick(p.x, p.y);
  };

  // Main Render Loop (Canvas 2D)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rendering on demand: con soli layer statici si ridisegna quando l'effetto viene ricreato
    // (camera, selezioni o dati cambiati) e poi una volta al secondo (palette dinamica);
    // con layer animati a ogni frame.
    const hasAnimatedLayers =
      showVehicles || showFlights || showAlilaguna || showSatellites ||
      (showShips && ships.length > 0) ||
      showCameras || showMarineSignals || showOceanStations || showLagoonWater ||
      (showMarineWind && windField !== null);
    let lastDraw = -Infinity;
    // Con layer animati al massimo 30 fotogrammi al secondo: a velocità reale i mezzi si spostano di
    // frazioni di pixel e la differenza non si vede, mentre il consumo di CPU e batteria si dimezza.
    // Trascinamenti e zoom ricreano l'effetto e ridisegnano subito.
    const minInterval = hasAnimatedLayers ? 1000 / 30 : 1000;

    const render = () => {
      const frameTime = performance.now();
      if (frameTime - lastDraw < minInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastDraw = frameTime;
      // Tempo letto dall'orologio di simulazione a ogni frame (non dallo stato React)
      const currentTimeSeconds = simClock.get();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      // Select active palette
      let pal: ColorScheme;
      if (paletteTheme === 'notte') pal = NOTTE;
      else if (paletteTheme === 'carta') pal = CARTA;
      else pal = getDynamicPalette(currentTimeSeconds);

      const isDark = pal.ground !== CARTA.ground;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Coordinate transforms: Virtual Map space -> Screen space
      const sx = (x: number) => (x - camera.x0) * camera.s;
      const sy = (y: number) => (y - camera.y0) * camera.s;

      // 1-2. Acqua e isole: disegnate in una cache e ricopiate finché vista, dimensioni e colori non cambiano.
      // Le isole dettagliate (circa 860 KB) si scaricano solo al primo zoom; nel frattempo resta la versione leggera.
      const zoomed = camera.s / (cw / W) > 1.6;
      if (zoomed && !isLandHiLoaded()) requestLandHi(() => setLandHiReady(true));
      drawBaseMap(ctx, { cw, ch, dpr, camera, pal, is3DView, zoomed: zoomed && isLandHiLoaded(), landLo: LAND_LO });

      // Contesto del frame condiviso dai layer di disegno (components/map/*)
      const rc: RenderContext = {
        t: tr,
        ctx,
        cw,
        ch,
        dpr,
        pal,
        isDark,
        sx,
        sy,
        mx,
        my,
        camera,
        W,
        H,
        KY,
        zoomed,
        currentTimeSeconds,
        selectedFlight,
        selectedShipOnMap,
        selectedAlilagunaBoat,
        selectedSatellite,
        accessibleBridges,
        airStations,
        alilagunaRoutes,
        alilagunaStops,
        bathingWaters,
        bellTowers,
        briccole,
        bridges,
        bufferRadiusMeters,
        cameras,
        canalSpeedLimits,
        cantieri,
        daeList,
        docks,
        emergencyDocks,
        evCharging,
        flights,
        fortressIslands,
        fountains,
        gondolas,
        heatIslands,
        lagoonMorphology,
        lagoonTributaryRivers,
        lagoonWaterQuality,
        liveTrains,
        marineWindStations,
        windField,
        showFiber,
        fiberData,
        showRecyclingCentres,
        recyclingCentres,
        showLibraries,
        libraries,
        showBdapWorks,
        bdapWorks,
        showCanals,
        lagoonNetwork,
        moseGates,
        nizioleti,
        oceanStations,
        paletteTheme,
        parkings,
        passerelle,
        pedestrianFlows,
        pharmacies,
        pollenMonitoringStations,
        realtimeVehicles,
        regionalBikeRoutes,
        satellites,
        selectedCategory,
        selectedDay,
        ships,
        showAccommodations,
        showAirQuality,
        showAlilaguna,
        showBathingWaters,
        showBellTowers,
        showBikeRoutes,
        showBridges,
        showCameras,
        showCanalLimits,
        showCantieri,
        showCityAssets,
        showDae,
        showDocks,
        showEmergencyDocks,
        showFlights,
        showFortresses,
        showGondolas,
        showHeatIslands,
        showLagoonWater,
        showMarineSignals,
        showMarineWind,
        showMorphology,
        showMose,
        showNizioleti,
        showOceanStations,
        showParkings,
        showPasserelle,
        showPedestrianFlows,
        showPharmacies,
        showPollenStations,
        showRealtimeVehicles,
        showRoutes,
        showSatellites,
        showEvCharging,
        showWifiHotspots,
        showShipRoutes,
        showShips,
        showSpatialBuffer,
        showStops,
        showSubsidence,
        showTrains,
        showTrees,
        showTributaries,
        showVehicles,
        showWasteBoats,
        showWells,
        stops,
        subsidencePoints,
        tideLevel: (simulatedTideLevel !== undefined && simulatedTideLevel !== null) ? simulatedTideLevel : tideLevel,
        touristAccommodations,
        trees,
        veritasServices,
        wasteBoats,
        wells,
        wifiHotspots
      };

      // Vento animato sotto tutti gli altri layer, come sfondo
      drawWindFlow(rc);
      drawFiber(rc);
      // Etichette diradate: niente sovrapposizioni e un massimo per frame (vince chi è disegnato prima)
      withLabelGuard(ctx, (unguarded) => {
        drawLagoonNetwork(rc);
        drawRoutes(rc);

        drawSpatialBuffer(rc);

        // Zone allagate (stima indicativa): con il simulatore attivo o con il layer passerelle acceso
        if (simulatedTideLevel != null || showPasserelle) unguarded(() => drawFloodLayer(rc, rc.tideLevel));

        drawVehicles(rc);

        drawRealtimeVehicles(rc);

        drawStops(rc);

        drawCantieri(rc);

        drawFlights(rc);

        drawMose(rc);

        drawShipRoutes(rc);

        drawShips(rc);

        drawCityAssets(rc);
        drawCivicPois(rc);
        drawBdapWorks(rc);

        drawParkings(rc);

        drawAirQuality(rc);

        drawPedestrianFlows(rc);

        drawAlilaguna(rc);

        drawSatellites(rc);

        drawCameras(rc);

        drawPasserelle(rc);

        drawMarineSignals(rc);

        drawOceanStations(rc);

        drawBathingWaters(rc);

        drawTrees(rc);

        drawEvCharging(rc);
        drawWifiHotspots(rc);

        drawCanalLimits(rc);

        drawBridges(rc);

        drawGondolas(rc);

        drawDocks(rc);

        drawSubsidence(rc);

        drawMorphology(rc);

        drawMarineWind(rc);

        drawTrains(rc);

        drawWasteBoats(rc);

        drawNizioleti(rc);

        drawWells(rc);

        drawBellTowers(rc);

        drawFortresses(rc);

        drawEmergencyDocks(rc);

        drawDae(rc);

        drawPharmacies(rc);

        drawHeatIslands(rc);

        drawLagoonWater(rc);

        drawAccommodations(rc);

        drawBikeRoutes(rc);

        drawPollenStations(rc);

        drawTributaries(rc);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    camera,
    KY,
    H,
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
    showCameras,
    showRealtimeVehicles,
    realtimeVehicles,
    cameras,
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
    showEvCharging,
    showWifiHotspots,
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
    windField,
    showFiber,
    fiberData,
    showRecyclingCentres,
    recyclingCentres,
    showLibraries,
    libraries,
    showBdapWorks,
    bdapWorks,
    showCanals,
    lagoonNetwork,
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
    showLagoonWater,
    lagoonWaterQuality,
    showAccommodations,
    touristAccommodations,
    showBikeRoutes,
    regionalBikeRoutes,
    showPollenStations,
    pollenMonitoringStations,
    showTributaries,
    lagoonTributaryRivers,
    tideLevel,
    simulatedTideLevel,
    is3DView,
    landHiReady,
    W,
    mx,
    my,
    tr
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          transform: is3DView ? MAP_3D_CSS_TRANSFORM : 'none',
          transformOrigin: 'center 75%',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />

      {/* Legende impilate in alto al centro: livelli attivi, poi i layer a campo (vento, fibra) */}
      {(legend || (showMarineWind && windField) || (showFiber && fiberData)) && (
      <div className="absolute left-1/2 -translate-x-1/2 top-3 z-20 flex flex-col gap-2 w-[min(20rem,calc(100vw-7rem))]">
      {/* Legenda unica dei livelli accesi */}
      {legend}
      {/* Legenda del vento animato: scala in km/h, fonte e ora di validità della previsione */}
      {showMarineWind && windField && (
        <div className="pointer-events-none glass-panel rounded-xl border border-[var(--rule)] px-3 py-2 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <span className="font-bold text-[var(--ink)] uppercase">{tr('ui.mapLabels.windTitle')}</span>
            <span className="text-[var(--ink-3)]">{tr('ui.mapLabels.windValidAt', { time: windField.validTime.slice(11, 16) })}</span>
          </div>
          <div
            className="h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, ${WIND_COLOR_STOPS.filter(([s]) => s <= 25)
                .map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`)
                .join(', ')})`,
            }}
          />
          <div className="flex justify-between text-[9px] font-mono text-[var(--ink-3)]">
            {/* la scala va da 0 a 25 m/s = 90 km/h: etichette equidistanti */}
            {[0, 30, 60].map((kmh) => (
              <span key={kmh}>{kmh}</span>
            ))}
            <span>90 km/h</span>
          </div>
          <span className="text-[9px] text-[var(--ink-3)]">{tr('ui.mapLabels.windSource')}</span>
        </div>
      )}
      {/* Legenda della copertura fibra (AGCOM, CC BY 4.0: attribuzione e logo obbligatori) */}
      {showFiber && fiberData && (
        <div className="glass-panel rounded-xl border border-[var(--rule)] px-3 py-2 flex flex-col gap-1.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <span className="font-bold text-[var(--ink)] uppercase">{tr('ui.mapLabels.fiberTitle')}</span>
            <span className="text-[var(--ink-3)]">{fiberData.dataDate.split('-').reverse().join('/')}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--ink-2)]">
            {([3, 2, 1] as const).map((cls) => (
              <span key={cls} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: FIBER_COLORS[cls] }} />
                {tr(`ui.mapLabels.fiber_${cls}`)}
              </span>
            ))}
          </div>
          <a
            href="https://maps.agcom.it"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[9px] text-[var(--ink-3)] hover:text-cyan-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cc-by-88x31.png" alt="CC BY 4.0" width={44} height={15} />
            <span>{tr('ui.mapLabels.fiberAttribution')}</span>
          </a>
        </div>
      )}
      </div>
      )}

      {/* Floating map hint (desktop only to prevent clutter on mobile) */}
      {/* <div className="hidden md:flex absolute md:top-4 md:left-[21rem] xl:md:left-[22rem] pointer-events-none glass-panel px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--rule)] text-[11px] sm:text-xs text-[var(--ink-2)] items-center gap-1.5 sm:gap-2 shadow-lg max-w-[calc(100vw-5rem)]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse shrink-0" />
        <span className="truncate">{t('map.clickHint')}</span>
      </div> */}

      {/* On-Map Zoom & Centering Controls (+ / - / Centra / 3D): top-3 on mobile to avoid TimelineControls, bottom-28 on desktop */}
      <div className="absolute right-3 sm:right-5 top-3 sm:top-4 xl:top-auto xl:bottom-36 z-30 flex flex-col items-center gap-1.5 shadow-2xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-[var(--rule)] hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          title={t('map.zoomInTitle')}
          aria-label={t('map.zoomInAria')}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-[var(--rule)] hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          title={t('map.zoomOutTitle')}
          aria-label={t('map.zoomOutAria')}
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border border-[var(--rule)] hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink-2)] hover:text-cyan-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer mt-0.5"
          title={t('map.resetViewTitle')}
          aria-label={t('map.resetViewAria')}
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIs3DView((v) => !v)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-panel border transition-all shadow-lg active:scale-95 cursor-pointer mt-0.5 flex items-center justify-center ${is3DView
              ? 'bg-cyan-500 text-white border-cyan-400 font-semibold'
              : 'border-[var(--rule)] hover:border-cyan-400/50 bg-[var(--ground)]/90 text-[var(--ink-2)] hover:text-cyan-400'
            }`}
          title={is3DView ? t('ui.view3D.mode2D') : t('ui.view3D.mode3D')}
          aria-label={t('ui.view3D.toggle3D')}
        >
          <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

    </div>
  );
};
