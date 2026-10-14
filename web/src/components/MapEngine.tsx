'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Minus, Maximize2, Box } from 'lucide-react';
import { isLocated, type AlilagunaBoat, type CameraViewPreset, type CantiereItem, type PaletteTheme, type SatelliteItem, type StopItem, type TransportModeCategory, type VeniceCameraItem } from '@/lib/types';
import type { VeniceFeatureSelected } from './VeniceFeatureDetailModal';
import type { MapObjectSelected } from './MapObjectPanel';
import { matchesSportFilter, type SportFilter } from '@/lib/sports';
import { filterFountains, type FountainFilter } from '@/lib/fountainFilter';
import { isPlacedOrdinance, ordinancesByCanal } from '@/lib/canalOrdinances';
import type { OrdinanceItem } from '@/lib/contracts/ordinances';
import { GRID, LAND_LO } from '@/lib/simulation-data';
import { drawBaseMap, isLandHiLoaded, requestLandHi, isStreetsLoaded, requestStreets } from './map/baseMap';
import { getDynamicPalette, NOTTE, CARTA, ColorScheme } from '@/lib/solar';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { useTranslation } from '@/lib/i18n';
import { simClock } from '@/lib/simClock';
import { getLiveFlight, getLiveSatellite } from './map/mapHelpers';
import type { RenderContext } from './map/renderContext';
import { freshDelay, inService, isLiveView, networkOfSimCategory, MAX_EARLY_S, MAX_LATE_S, mergedThisFrame, realtimeByTrip, shownDistance, tripKey } from './map/liveFleet';
import { drawItinerary, drawRoutes, drawSelectedTrip, drawSpatialBuffer, drawVehicles, drawRealtimeVehicles, drawStops, drawCantieri, drawScheduleSpeed, drawBusStops, drawActvNotices, drawFlixbus, flixbusThisFrame, SHUTTLE_LAYOVER_S } from './map/transitLayers';
import { drawFlights } from './map/airLayers';
import { drawMose, drawPasserelle } from './map/tideLayers';
import { drawCurrentFlow } from './map/currentFlow';
import { drawShipRoutes, drawShips, drawAlilaguna } from './map/vesselLayers';
import { drawMarineSignals, drawCanalLimits, drawBridges, drawGondolas, drawDocks } from './map/waterwayLayers';
import { drawOceanStations, drawMarineWind } from './map/marineLayers';
import { bdapRadius, drawPin, drawParks, drawBdapWorks, drawLoraGateways, drawWifiVenues, drawSports, drawNautical, MOORINGS_MIN_SCALE, drawCivicPois, drawCityAssets, drawAccessibleBridges, drawVeritasServices, drawParkings, drawAirQuality, drawPedestrianFlows, drawCameras, drawBathingWaters, drawTrees, drawEvCharging, drawWifiHotspots, drawTrains, drawWasteBoats, drawNizioleti, drawWells, drawBellTowers, drawFortresses, drawEmergencyDocks, drawDae, drawPharmacies, drawOrdinances } from './map/cityLayers';
import { drawSatellites, drawSubsidence, drawMorphology, drawHeatIslands, drawLagoonWater, drawAccommodations, drawBikeRoutes, drawPollenStations, drawTributaries } from './map/environmentLayers';
import { drawFloodLayer } from './map/floodLayer';
import { resolveTideState } from '@/lib/tideCurve';
import { drawWindFlow, WIND_COLOR_STOPS } from './map/windLayer';
import { drawFiber } from './map/fiberLayer';
import { drawLagoonNetwork } from './map/lagoonNetworkLayer';
import { withLabelGuard } from './map/labelGuard';
import { firstHit, hitTester, pointInRing, type Hit } from './map/hitTest';
import { lineColor } from '@/lib/actvLines';
import type { Itinerary } from '@/lib/tripPlanner';
import type { CityData } from '@/lib/cityData';
import type { LayerVisibility } from '@/lib/layerState';
import { pointSegmentDistance, type LagoonNetwork } from '@/lib/lagoonNetwork';
import { FIBER_COLORS, fiberCellAt, indexFiberCells } from '@/lib/fiber';
import { MAP_3D_CSS_TRANSFORM, unprojectFrom3D } from '@/lib/map3d';


import { distAt, getSimulation, pointAt, useSimulation } from '@/lib/simulationModel';
import { resolveTrip } from '@/lib/tripView';
import { romeSecondsOfDay } from '@/lib/time';

export interface MapEngineProps {
  /** Livelli accesi */
  layers: LayerVisibility;
  /** Dati caricati (vedi lib/cityData.ts) */
  data: CityData;
  selectedDay: 'weekday' | 'saturday' | 'sunday';
  paletteTheme: PaletteTheme;
  currentView: CameraViewPreset;
  alilagunaBoats?: AlilagunaBoat[];
  onSelectAlilaguna?: () => void;
  onSelectCamera?: (camera: VeniceCameraItem) => void;
  onSelectSatellite?: (satellite: SatelliteItem) => void;
  onSelectFeature?: (feature: VeniceFeatureSelected) => void;
  bufferRadiusMeters: number;
  selectedCategory: TransportModeCategory | 'all';
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
  sportFilter?: SportFilter;
  /** Fonte delle fontanelle mostrate */
  fountainFilter?: FountainFilter;
  simulatedTideLevel?: number | null;
  /** Se il MOSE protegge la laguna quando la marea supera 110 cm (default true) */
  isMoseProtected?: boolean;
  isDesktopLayerPanelOpen?: boolean;
  /** scelta di un punto per il planner: il prossimo clic sulla mappa restituisce le coordinate */
  pickMode?: boolean;
  onPickPoint?: (lon: number, lat: number) => void;
  /** itinerario del planner da disegnare */
  itinerary?: Itinerary | null;
  /** segnaposto di un luogo cercato (es. numero civico); approximate: posizione del civico noto più vicino */
  pin?: { lat: number; lon: number; approximate: boolean } | null;
  /** Se true, nasconde la legenda fluttuante del vento in alto perché ospitata nella dashboard in basso */
  hideFloatingWindLegend?: boolean;
}

/** Livello in città oltre il quale l'allagamento compare anche senza layer marea attivi */
const AUTO_FLOOD_CM = 90;

export const MapEngine: React.FC<MapEngineProps> = ({
  layers,
  data,
  selectedDay,
  paletteTheme,
  currentView,
  alilagunaBoats = [],
  onSelectAlilaguna,
  onSelectCamera,
  onSelectSatellite,
  onSelectFeature,
  bufferRadiusMeters,
  selectedCategory,
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
  sportFilter = 'all',
  fountainFilter = 'all',
  simulatedTideLevel = null,
  isMoseProtected = true,
  isDesktopLayerPanelOpen = true,
  pin = null,
  pickMode = false,
  onPickPoint,
  itinerary = null,
  hideFloatingWindLegend = false
}) => {
  const { t } = useTranslation();
  // fontanelle della fonte scelta (con "tutte", senza i doppioni OSM di Venice Tap Water)
  const visibleFountains = useMemo(() => filterFountains(data.fountains, fountainFilter), [data.fountains, fountainFilter]);
  // canali con ordinanze temporanee del Comune (disegnati in giallo nel livello canali)
  const canalOrdinances = useMemo(
    () => (data.lagoonNetwork ? ordinancesByCanal(data.lagoonNetwork.canals, data.ordinances) : new Map<number, OrdinanceItem[]>()),
    [data.lagoonNetwork, data.ordinances],
  );
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
  const { fiberData, windField } = data;
  const { showMarineWind, showFiber } = layers;
  const fiberIndex = useMemo(() => (fiberData ? indexFiberCells(fiberData) : null), [fiberData]);
  // Solo opere pubbliche con posizione
  const cantieri = useMemo(() => data.cantieri.filter(isLocated), [data.cantieri]);

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
  // Corsa del mezzo ACTV selezionato: evidenziata sulla mappa con le sue fermate (l'orario si scarica se serve)
  const selectedVehicle = selectedObject?.type === 'vehicle' ? selectedObject.data : null;
  const simForTrip = useSimulation(Boolean(selectedVehicle?.trip));
  const selectedTrip = useMemo(() => resolveTrip(simForTrip, selectedVehicle?.trip), [simForTrip, selectedVehicle]);
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
  // Interfaccia sovrapposta alla mappa (legende, controlli): clic, pressioni, rotella e tocchi restano lì e
  // non arrivano alla mappa sotto (altrimenti si aprirebbe la scheda del punto coperto o partirebbe un trascinamento).
  // Il rilascio del mouse non viene fermato, così un trascinamento iniziato sulla mappa finisce sempre.
  const stopMapGestures = {
    onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
    onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
    onWheel: (e: React.SyntheticEvent) => e.stopPropagation(),
    onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
    onTouchMove: (e: React.SyntheticEvent) => e.stopPropagation(),
    onTouchEnd: (e: React.SyntheticEvent) => e.stopPropagation(),
  };

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
    // Scelta di un punto per il planner: il clic restituisce le coordinate e non seleziona nulla
    if (pickMode && onPickPoint) {
      onPickPoint(LON0 + (clickX / camera.s + camera.x0) / KX, LAT1 - (clickY / camera.s + camera.y0) / KY);
      return;
    }
    const currentTimeSeconds = simClock.get();
    const screen = (lon: number, lat: number) => [(mx(lon) - camera.x0) * camera.s, (my(lat) - camera.y0) * camera.s] as const;
    const target = hitTester(screen);
    const L = layers;
    const D = data;
    /** Apre la scheda del punto nel pannello informativo. */
    const feature =
      <K extends VeniceFeatureSelected['type']>(type: K) =>
      (item: Extract<VeniceFeatureSelected, { type: K }>['data']) =>
        onSelectFeature?.({ type, data: item } as VeniceFeatureSelected);
    const path = (p: { path: readonly (readonly number[])[] }) => p.path;
    const noPoint = () => null;

    // Aeroporto di Venezia Marco Polo (VCE / LIPZ): sempre cliccabile, area più ampia da vicino
    const airport: Hit = (x, y) => {
      const [ax, ay] = screen(12.3519, 45.5053);
      return onSelectAirport && Math.hypot(x - ax, y - ay) <= Math.max(34, 45 * (camera.s / 0.02)) ? onSelectAirport : null;
    };

    // Mezzi ACTV simulati dall'orario: posizione al secondo corrente lungo il tracciato
    const scheduledVehicles: Hit = (x, y) => {
      const sim = getSimulation();
      const tripsData = sim?.daysTrips[selectedDay];
      if (!sim || !tripsData) return null;
      const { tP, t0, t1, count } = tripsData;
      const t = currentTimeSeconds;
      const ptNow: [number, number] = [0, 0];
      const live = isLiveView(t, selectedDay, Date.now());
      const gpsByTrip = live ? realtimeByTrip(D.realtimeVehicles) : null;
      for (let i = 0; i < count; i++) {
        const prof = sim.profs[tP[i]];
        const rCat: string = prof.route.cat || 'vaporetto';
        const layover = SHUTTLE_LAYOVER_S[rCat] ?? 0;
        if (t0[i] > t + (live ? MAX_EARLY_S : 0) || t1[i] + Math.max(layover, live ? MAX_LATE_S : 0) < t) continue;
        if (selectedCategory !== 'all' && rCat !== selectedCategory) continue;
        const key = tripKey(prof.route.n, t0[i], networkOfSimCategory(rCat));
        const gps = gpsByTrip?.get(key);
        const delay = gps ? freshDelay(gps) : null;
        if (t0[i] > t && delay === null) continue;
        if (t1[i] < t && delay === null && t - t1[i] >= layover) continue;
        // stessa posizione disegnata: per le corse con GPS quella spostata del ritardo reale
        pointAt(prof.sh, delay !== null ? (shownDistance(key) ?? distAt(prof, t - t0[i] - delay)) : distAt(prof, t - t0[i]), ptNow);
        if (Math.hypot(x - (ptNow[0] - camera.x0) * camera.s, y - (ptNow[1] - camera.y0) * camera.s) > 18) continue;
        if (gps && delay !== null) {
          const line = prof.route.n;
          return () =>
            onSelectObject?.({
              type: 'vehicle',
              data: {
                line,
                category: `${rCat.toUpperCase()} · GPS`,
                speedKmh: null,
                color: lineColor(line, rCat) ?? paletteAt(currentTimeSeconds).cats[rCat] ?? '#5cc8ff',
                headsign: `${tr('ui.mapLabels.line', { line })} · ${tr(gps.network === 'navigazione' ? 'ui.mapLabels.networkNav' : 'ui.mapLabels.networkBus')}`,
                source: 'gps',
                updatedAt: gps.timestamp,
                delay: gps.delay ?? null,
                delayConflict: gps.delayConflict ?? false,
                trip: { line, profileIndex: tP[i], departure: t0[i], day: selectedDay },
                vehicleId: gps.id,
                vehicleName: gps.label,
                network: gps.network,
              },
            });
        }
        // Velocità media secondo l'orario negli ultimi 30 s (1 unità di griglia ≈ 1 m)
        const dtNow = t - t0[i];
        const spanSec = Math.min(30, Math.max(1, dtNow));
        const speedKmh = Math.round(((distAt(prof, dtNow) - distAt(prof, dtNow - spanSec)) / spanSec) * 3.6 * 10) / 10;
        const lineName = prof.route.n || 'ACTV';
        return () =>
          onSelectObject?.({
            type: 'vehicle',
            data: {
              line: lineName,
              category: rCat.toUpperCase(),
              speedKmh,
              color: lineColor(lineName, rCat) ?? paletteAt(currentTimeSeconds).cats[rCat] ?? '#5cc8ff',
              headsign: `${tr('ui.mapLabels.line', { line: lineName })} · ${tr('ui.map.orarioUfficialeActv')}`,
              source: 'schedule',
              trip: { line: lineName, profileIndex: tP[i], departure: t0[i], day: selectedDay },
              network: networkOfSimCategory(rCat),
            },
          });
      }
      return null;
    };

    // Briccole e segnalamenti OpenStreetMap: il punto più vicino entro 10 px
    const lagoonMarkers: Hit = (x, y) => {
      if (!D.lagoonNetwork) return null;
      let best: { d: number; m: LagoonNetwork['markers'][number] } | null = null;
      for (const m of D.lagoonNetwork.markers) {
        const [px, py] = screen(m[0], m[1]);
        const d = Math.hypot(x - px, y - py);
        if (d <= 10 && (!best || d < best.d)) best = { d, m };
      }
      const m = best?.m;
      return m ? () => feature('lagoonMarker')({ lon: m[0], lat: m[1], kind: m[2], osmId: m[3] }) : null;
    };

    // Canali OpenStreetMap: il tracciato più vicino entro 8 px
    const canals: Hit = (x, y) => {
      if (!D.lagoonNetwork) return null;
      let best: { d: number; c: LagoonNetwork['canals'][number] } | null = null;
      for (const c of D.lagoonNetwork.canals) {
        for (let i = 1; i < c.coords.length; i++) {
          const [ax, ay] = screen(c.coords[i - 1][0], c.coords[i - 1][1]);
          const [bx, by] = screen(c.coords[i][0], c.coords[i][1]);
          const d = pointSegmentDistance(x, y, ax, ay, bx, by);
          if (d <= 8 && (!best || d < best.d)) best = { d, c };
        }
      }
      const c = best?.c;
      return c ? () => feature('canal')(c) : null;
    };

    // Parchi e giardini: l'area sotto il clic (prima le più piccole, disegnate sopra), oppure il punto entro 10 px
    const parks: Hit = (x, y) => {
      const lon = LON0 + (x / camera.s + camera.x0) / KX;
      const lat = LAT1 - (y / camera.s + camera.y0) / KY;
      for (let i = D.parkPlaces.length - 1; i >= 0; i--) {
        const p = D.parkPlaces[i];
        const hit =
          p.rings.length > 0
            ? p.rings.some((r) => pointInRing(lon, lat, r))
            : Math.hypot(x - screen(p.lon, p.lat)[0], y - screen(p.lon, p.lat)[1]) <= 10;
        if (hit) return () => feature('parkPlace')(p);
      }
      return null;
    };

    // Copertura fibra: si apre la scheda della cella sotto il clic
    const fiberCell: Hit = (x, y) => {
      if (!D.fiberData || !fiberIndex) return null;
      const lon = LON0 + (x / camera.s + camera.x0) / KX;
      const lat = LAT1 - (y / camera.s + camera.y0) / KY;
      const cell = fiberCellAt(D.fiberData, fiberIndex, lon, lat);
      const dataDate = D.fiberData.dataDate;
      return cell ? () => feature('fiberCell')({ cell, dataDate }) : null;
    };

    // Ordine = priorità: oggetti in movimento, poi punti, poi tracciati e aree
    const action = firstHit(
      [
        airport,
        L.showFlights &&
          target({
            items: D.flights.map((f) => ({ f, live: getLiveFlight(f, currentTimeSeconds) })),
            at: ({ live }) => [live.lon, live.lat],
            radius: 24,
            select: ({ f, live }) =>
              onSelectObject?.({ type: 'flight', data: { ...f, lon: live.lon, lat: live.lat, trackDegrees: live.heading, altitudeMeters: live.alt } }),
          }),
        L.showShips && target({ items: D.ships, radius: 18, select: (s) => onSelectObject?.({ type: 'ship', data: s }) }),
        L.showMose && target({ items: D.moseGates, radius: 30, select: () => onSelectMose?.() }),
        L.showAlilaguna &&
          target({ items: getScheduledAlilagunaBoats(currentTimeSeconds), radius: 22, select: (b) => onSelectObject?.({ type: 'alilagunaBoat', data: b }) }),
        L.showAlilaguna && target({ items: D.alilagunaStops, radius: 18, select: () => onSelectAlilaguna?.() }),
        L.showCameras && target({ items: D.cameras, radius: (c) => (c.hasLiveFeed ? 22 : 16), select: (c) => onSelectCamera?.(c) }),
        L.showSatellites &&
          target({
            items: D.satellites.map((sat) => ({ sat, live: getLiveSatellite(sat, currentTimeSeconds) })),
            at: ({ live }) => [live.lon, live.lat],
            radius: 24,
            select: ({ sat, live }) => onSelectSatellite?.({ ...sat, currentLon: live.lon, currentLat: live.lat, heading: live.heading }),
          }),
        L.showOceanStations && target({ items: D.oceanStations, radius: 24, select: feature('oceanStation') }),
        L.showMarineSignals && target({ items: D.briccole, radius: 20, select: feature('briccola') }),
        L.showPasserelle && target({ items: D.passerelle, at: noPoint, path, radius: 18, select: feature('passerella') }),
        L.showLagoonCurrents && target({ items: D.lagoonCurrents, radius: 22, select: feature('lagoonCurrent') }),
        L.showLagoonCurrents && target({ items: D.lagoonCurrents, at: noPoint, path: (c) => c.coordinates, radius: 16, select: feature('lagoonCurrent') }),
        L.showBathingWaters && target({ items: D.bathingWaters, radius: 22, select: feature('bathingWater') }),
        L.showTrees && target({ items: D.trees, radius: 20, select: feature('urbanTree') }),
        L.showEvCharging && target({ items: D.evCharging, radius: 20, select: feature('evCharging') }),
        L.showWifiHotspots && target({ items: D.wifiHotspots, radius: 20, select: feature('wifiHotspot') }),
        L.showBridges && target({ items: D.bridges, radius: 22, select: feature('bridgeClearance') }),
        L.showGondolas && target({ items: D.gondolas, radius: 20, select: feature('gondolaStation') }),
        L.showDocks && target({ items: D.docks, radius: 20, select: feature('publicDock') }),
        L.showSubsidence && target({ items: D.subsidencePoints, radius: 22, select: feature('subsidence') }),
        L.showMorphology && target({ items: D.lagoonMorphology, at: (m) => [m.center[0], m.center[1]], radius: 26, select: feature('lagoonMorphology') }),
        L.showMarineWind && target({ items: D.marineWindStations, radius: 24, select: feature('marineWind') }),
        L.showTrains && target({ items: D.liveTrains, radius: 24, select: feature('trainLive') }),
        L.showParkings && target({ items: D.parkings, radius: 28, dy: -10, select: feature('parking') }),
        L.showWasteBoats && target({ items: D.wasteBoats, radius: 20, select: feature('wasteBoat') }),
        L.showNizioleti && target({ items: D.nizioleti, radius: 20, select: feature('nizioleto') }),
        L.showWells && target({ items: D.wells, radius: 20, select: feature('veniceWell') }),
        L.showBellTowers && target({ items: D.bellTowers, radius: 24, select: feature('bellTower') }),
        L.showFortresses && target({ items: D.fortressIslands, radius: 26, select: feature('fortressIsland') }),
        L.showEmergencyDocks && target({ items: D.emergencyDocks, radius: 22, select: feature('emergencyDock') }),
        L.showDae && target({ items: D.daeList, radius: 20, select: feature('publicDae') }),
        L.showPharmacies && target({ items: D.pharmacies, radius: 20, select: feature('pharmacy') }),
        L.showHeatIslands && target({ items: D.heatIslands, radius: 26, select: feature('heatIsland') }),
        L.showLagoonWater && target({ items: D.lagoonWaterQuality, radius: 24, select: feature('lagoonWater') }),
        L.showAccommodations && target({ items: D.touristAccommodations, radius: 28, select: feature('accommodation') }),
        L.showBikeRoutes && target({ items: D.regionalBikeRoutes, at: noPoint, path, radius: 20, select: feature('bikeRoute') }),
        L.showPollenStations && target({ items: D.pollenMonitoringStations, radius: 24, select: feature('pollenStation') }),
        // Fiumi: il punto della foce con raggio più ampio, poi i vertici del corso
        L.showTributaries && target({ items: D.lagoonTributaryRivers, radius: 26, select: feature('tributaryRiver') }),
        L.showTributaries && target({ items: D.lagoonTributaryRivers, at: noPoint, path, radius: 20, select: feature('tributaryRiver') }),
        L.showScheduleSpeed && target({ items: [...D.scheduleSpeed.filter((x) => x.verdict !== 'partial'), ...D.scheduleSpeed.filter((x) => x.verdict === 'partial')], at: noPoint, path, radius: 12, select: feature('scheduleSpeed') }),
        L.showCanalLimits && target({ items: D.canalSpeedLimits, at: noPoint, path, radius: 18, select: feature('speedLimit') }),
        // Stazioni dell'aria: etichetta disegnata sopra il punto
        L.showAirQuality && target({ items: D.airStations, radius: 18, dy: -8, select: feature('airStation') }),
        // Nautica: gli ormeggi solo quando sono disegnati, cioè da vicino
        L.showNautical &&
          target({
            items: camera.s <= MOORINGS_MIN_SCALE ? D.nauticalPlaces.filter((p) => p.kind !== 'mooring') : D.nauticalPlaces,
            radius: (p) => (p.kind === 'mooring' ? 7 : 12),
            select: feature('nauticalPlace'),
          }),
        // Sport: le segnalazioni CAMPO hanno la precedenza perché sono le prime dell'elenco
        L.showSports && target({ items: D.sportPlaces.filter((p) => matchesSportFilter(p, sportFilter)), radius: 12, select: feature('sportPlace') }),
        L.showWifiVenues && target({ items: D.wifiVenues, radius: 11, select: feature('wifiVenue') }),
        L.showLoraGateways && target({ items: D.loraGateways, radius: 16, select: feature('loraGateway') }),
        L.showBdapWorks &&
          target({
            items: D.bdapWorks ?? [],
            at: (w) => (w.lat === null || w.lon === null ? null : [w.lon, w.lat]),
            radius: (w) => Math.max(12, bdapRadius(w.costPlannedEur) + 3),
            select: feature('bdapWork'),
          }),
        L.showRecyclingCentres && target({ items: D.recyclingCentres, radius: 14, select: feature('civicPoi') }),
        L.showLibraries && target({ items: D.libraries, radius: 14, select: feature('civicPoi') }),
        L.showCityAssets && target({ items: filterFountains(D.fountains, fountainFilter), radius: 16, select: feature('fountain') }),
        L.showActvNotices &&
          target({
            items: D.actvNotices.flatMap((n) => n.stops.map((s) => ({ n, s }))),
            at: (x) => [x.s.lon, x.s.lat],
            dy: -11,
            radius: 14,
            select: (x) => feature('actvNotice')(x.n),
          }),
        L.showOrdinances && target({ items: D.ordinances.filter(isPlacedOrdinance), radius: 16, select: feature('ordinance') }),
        L.showCantieri && target({ items: cantieri, radius: 18, select: onSelectCantiere }),
        L.showFlixbus && target({ items: flixbusThisFrame, radius: 14, select: (b) => onSelectObject?.({ type: 'flixbus', data: b }) }),
        L.showStops && target({ items: D.stops, radius: 15, select: onSelectStop }),
        L.showBusStops && target({ items: D.busStops, radius: 10, select: onSelectStop }),
        L.showVehicles && scheduledVehicles,
        L.showRealtimeVehicles &&
          target({
            // i mezzi già disegnati come corsa dell'orario si cliccano lì
            items: D.realtimeVehicles.filter((v) => !(L.showVehicles && mergedThisFrame.has(v.id))),
            radius: 14,
            select: (v) => {
              const cat = v.category || 'vaporetto';
              onSelectObject?.({
                type: 'vehicle',
                data: {
                  line: v.line || '–',
                  category: inService(v) ? `${cat.toUpperCase()} · GPS` : tr('ui.mapLabels.noTripCategory'),
                  speedKmh: null,
                  color: inService(v) ? (lineColor(v.line, cat) ?? paletteAt(currentTimeSeconds).cats[cat] ?? '#34d399') : '#94a3b8',
                  headsign: v.line
                    ? `${tr('ui.mapLabels.line', { line: v.line })} · ${tr(v.network === 'navigazione' ? 'ui.mapLabels.networkNav' : 'ui.mapLabels.networkBus')}`
                    : tr('ui.mapLabels.unknownLine', { id: v.label || v.id }),
                  source: 'gps',
                  updatedAt: v.timestamp,
                  delay: v.delay ?? null,
                  delayConflict: v.delayConflict ?? false,
                  trip: v.line ? { line: v.line, startTime: v.startTime, startDate: v.startDate, network: v.network } : undefined,
                  vehicleId: v.id,
                  vehicleName: v.label,
                  network: v.network,
                },
              });
            },
          }),
        L.showMarineSignals && lagoonMarkers,
        L.showCanals && canals,
        // Aree verdi: dopo punti e linee, perché coprono superfici ampie
        L.showParks && parks,
        // Copertura fibra: ultima priorità
        L.showFiber && fiberCell,
      ],
      clickX,
      clickY,
    );

    // Clic su un punto vuoto: si chiude la scheda aperta
    if (action) action();
    else onClearSelection?.();
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
      layers.showVehicles || layers.showFlights || layers.showAlilaguna || layers.showSatellites ||
      (layers.showShips && data.ships.length > 0) ||
      layers.showCameras || layers.showMarineSignals || layers.showOceanStations || layers.showLagoonWater || layers.showLagoonCurrents ||
      (layers.showMarineWind && data.windField !== null);
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
      // Le isole dettagliate (circa 860 KB) e le calli si scaricano al primo zoom ravvicinato.
      const zoomFactor = camera.s / (cw / W);
      const zoomed = zoomFactor > 1.6;
      if (zoomed && !isLandHiLoaded()) requestLandHi(() => setLandHiReady(true));

      const tideState = resolveTideState({
        simulatedTideLevel,
        isMoseProtected,
        timelineSeconds: currentTimeSeconds,
        forecast: data.tideInfo?.forecast,
        liveTideLevel: data.tideLevel,
        liveObservedAt: data.tideInfo?.observedAt,
        moseGates: data.moseGates,
      });

      // Livello in città: misura CPSM vicino all'ora attuale, previsione più avanti, simulatore se attivo
      const effectiveTideLevel = tideState.lagoonTideCm ?? 0;
      const isTideContextActive = simulatedTideLevel != null || layers.showPasserelle || layers.showMose || layers.showOceanStations;
      // Durante un evento reale l'allagamento compare da solo: da +90 cm (sotto la curva CPSM è quasi nulla)
      const shouldRenderFlood = effectiveTideLevel >= 80 && (isTideContextActive || effectiveTideLevel >= AUTO_FLOOD_CM);

      if ((zoomed || shouldRenderFlood) && !isStreetsLoaded()) {
        requestStreets(() => setLandHiReady((prev) => !prev));
      }
      drawBaseMap(ctx, { cw, ch, dpr, camera, pal, is3DView, zoomed: zoomed && isLandHiLoaded(), landLo: LAND_LO, zoomFactor });

      // Contesto del frame condiviso dai layer di disegno (components/map/*)
      const rc: RenderContext = {
        ...layers,
        ...data,
        cantieri,
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
        bufferRadiusMeters,
        selectedCategory,
        selectedDay,
        paletteTheme,
        sportFilter,
        fountains: visibleFountains,
        canalOrdinances,
        tideLevel: effectiveTideLevel,
        tide: tideState,
        pin,
        itinerary,
        selectedTrip: selectedTrip && selectedVehicle
          ? {
              ...selectedTrip,
              color: selectedVehicle.color,
              delaySeconds: selectedVehicle.delay?.seconds ?? 0,
              // mezzi GPS: ora reale; mezzi da orario: ora della simulazione
              now: selectedVehicle.source === 'gps' ? romeSecondsOfDay() : currentTimeSeconds,
            }
          : null,
      };

      // Vento animato sotto tutti gli altri layer, come sfondo
      drawWindFlow(rc);
      drawFiber(rc);
      // Etichette diradate: niente sovrapposizioni e un massimo per frame (vince chi è disegnato prima)
      withLabelGuard(ctx, (unguarded) => {
        // Aree verdi per prime: sotto canali, linee e simboli
        drawParks(rc);
        drawLagoonNetwork(rc);
        drawRoutes(rc);
        drawSelectedTrip(rc);

        drawSpatialBuffer(rc);

        // Zone allagate (stima indicativa): con un contesto di marea attivo da +80 cm, sempre da +90 cm
        if (shouldRenderFlood) unguarded(() => drawFloodLayer(rc, rc.tideLevel));

        drawVehicles(rc);

        drawRealtimeVehicles(rc);

        drawFlixbus(rc);

        drawScheduleSpeed(rc);

        drawBusStops(rc);

        drawStops(rc);

        drawCantieri(rc);

        drawFlights(rc);

        drawMose(rc);

        drawShipRoutes(rc);

        drawShips(rc);

        drawCityAssets(rc);

        drawAccessibleBridges(rc);

        drawVeritasServices(rc);
        drawCivicPois(rc);
        drawBdapWorks(rc);
        drawLoraGateways(rc);
        drawWifiVenues(rc);
        drawSports(rc);
        drawNautical(rc);

        drawParkings(rc);

        drawAirQuality(rc);

        drawPedestrianFlows(rc);

        drawAlilaguna(rc);

        drawSatellites(rc);

        drawCameras(rc);

        drawPasserelle(rc);

        drawCurrentFlow(rc);

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

        // Avvisi del Comune e di ACTV sopra gli altri livelli
        drawOrdinances(rc);
        drawActvNotices(rc);
      });
      // Itinerario del planner e segnaposto del luogo cercato, sopra a tutto
      drawItinerary(rc);
      drawPin(rc);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    camera, KY, H, W, mx, my, tr, layers, data, cantieri, selectedDay, paletteTheme, bufferRadiusMeters, selectedCategory,
    sportFilter, visibleFountains, canalOrdinances, simulatedTideLevel, isMoseProtected, selectedFlight, selectedShipOnMap, selectedAlilagunaBoat, selectedSatellite,
    alilagunaBoats, is3DView, landHiReady, selectedTrip, selectedVehicle, pin, itinerary,
]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${pickMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
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
      {(legend || (!hideFloatingWindLegend && showMarineWind && windField) || (showFiber && fiberData)) && (
      <div {...stopMapGestures} className="absolute left-1/2 -translate-x-1/2 top-3 z-20 flex flex-col gap-2 w-[min(20rem,calc(100vw-7rem))]">
      {/* Legenda unica dei livelli accesi */}
      {legend}
      {/* Legenda del vento animato: scala in km/h, fonte e ora di validità della previsione */}
      {!hideFloatingWindLegend && showMarineWind && windField && (
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
      <div {...stopMapGestures} className="absolute right-3 sm:right-5 top-3 sm:top-4 xl:top-auto xl:bottom-36 z-30 flex flex-col items-center gap-1.5 shadow-2xl">
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
