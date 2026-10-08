'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MapEngine } from '@/components/MapEngine';
import { TimelineControls } from '@/components/TimelineControls';
import { LayerPanel } from '@/components/LayerPanel';
import { parseLayerParams, buildLayersParam, buildShareUrl, LayerKey, ALL_LAYER_KEYS } from '@/lib/urlLayers';
import { StopDetailModal } from '@/components/StopDetailModal';
import { CantiereDetailModal } from '@/components/CantiereDetailModal';
import { SpatialAnalysisModal } from '@/components/SpatialAnalysisModal';
import { StatsModal } from '@/components/StatsModal';
import { AirportDetailModal } from '@/components/AirportDetailModal';
import { ShipDetailModal } from '@/components/ShipDetailModal';
import { MoseDetailModal } from '@/components/MoseDetailModal';
import { AlilagunaDetailModal } from '@/components/AlilagunaDetailModal';
import { SatelliteDetailModal } from '@/components/SatelliteDetailModal';
import { CameraDetailModal } from '@/components/CameraDetailModal';
import { VeniceFeatureDetailModal, VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';
import { OnboardingTutorialModal, MapPresetType } from '@/components/OnboardingTutorialModal';
import { Layers } from 'lucide-react';
import {
  CameraViewPreset,
  PaletteTheme,
  DayType,
  TransportModeCategory,
  StopItem,
  CantiereItem,
  FlightItem,
  ShipItem,
  MoseGateItem,
  CityAssetItem,
  ParkingItem,
  AirQualityItem,
  PedestrianFlowItem,
  AlilagunaRoute,
  AlilagunaStop,
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
  HeatIslandSurfaceTempItem,
  LagoonWaterQualityItem,
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem,
  AirportMetarData,
  VeniceCameraItem
} from '@/lib/types';
import { isLocated } from '@/lib/types';
import {
  REGIONAL_LAGOON_WATER_QUALITY,
  REGIONAL_TOURIST_ACCOMMODATIONS,
  REGIONAL_BIKE_ROUTES,
  REGIONAL_POLLEN_STATIONS,
  REGIONAL_TRIBUTARY_RIVERS
} from '@/lib/regionalVenetoData';
import {
  OPEN_CANAL_SPEED_LIMITS,
  OPEN_BRIDGE_CLEARANCES,
  OPEN_GONDOLA_STATIONS,
  OPEN_PUBLIC_DOCKS,
  OPEN_SUBSIDENCE_INSAR,
  OPEN_LAGOON_MORPHOLOGY,
  OPEN_LIVE_TRAINS,
  OPEN_VERITAS_WASTE_BOATS,
  OPEN_NIZIOLETI_CIVICI,
  OPEN_VENICE_WELLS,
  OPEN_BELL_TOWERS,
  OPEN_LAGOON_FORTRESS_ISLANDS,
  OPEN_EMERGENCY_WATER_DOCKS,
  OPEN_PUBLIC_DAE,
  OPEN_PHARMACY_DUTY,
  OPEN_HEAT_ISLAND_LST
} from '@/lib/open-data-catalog';
import { CANTIERI_REFERENCE, ACTV_STOPS_REFERENCE } from '@/lib/db';
import { VENICE_CAMERAS } from '@/lib/cameras-data';
import { NOTTE, CARTA, getDynamicPalette } from '@/lib/solar';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { useTranslation } from '@/lib/i18n';
import { romeDayType, romeSecondsOfDay } from '@/lib/time';
import { activeTripsAt, dayActivity } from '@/lib/gtfsActivity';
import { simClock } from '@/lib/simClock';
import { usePreference, writePreference } from '@/lib/localPreference';

const ONBOARDING_KEY = 'vod_onboarding_completed';
import type { TideResponse, TideStation, TideForecast, TideTrend, TideCategory } from '@/lib/contracts/tide';
import type { RealtimeVehicleDto } from '@/lib/contracts/realtime';

export default function HomePage() {
  const { t } = useTranslation();
  // Timeline and simulation state - DEFAULT TO "ORA LIVE" (Current wall-clock time in Venice, 1:1 speed)
  // Valori iniziali deterministici (identici tra prerender e client): l'ora reale viene impostata dal
  // ticker al primo frame. Evita il mismatch di idratazione dovuto all'ora della build.
  const [currentTimeSeconds, setCurrentTimeSecondsState] = useState<number>(0);
  const setCurrentTimeSeconds = (value: number) => {
    simClock.set(value);
    setCurrentTimeSecondsState(simClock.get());
  };
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // Default 1x Reale for live mode
  const [selectedDay, setSelectedDay] = useState<DayType>('weekday');
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true); // Default ORA LIVE active on initial load
  const [isLayerPanelOpenMobile, setIsLayerPanelOpenMobile] = useState<boolean>(false);
  const [isDesktopLayerPanelOpen, setIsDesktopLayerPanelOpen] = useState<boolean>(true);

  const handleSyncLiveTime = () => {
    setCurrentTimeSeconds(Math.floor(romeSecondsOfDay()));
    setSpeed(1); // Set to 1x real time
    setIsPlaying(true);
    setIsLiveSynced(true);
  };

  // Theme & Views
  const [paletteTheme, setPaletteTheme] = useState<PaletteTheme>('notte');
  const [currentView, setCurrentView] = useState<CameraViewPreset>('lagoon');

  // Layer toggles (Default to false on clean map startup)
  const [showRoutes, setShowRoutes] = useState<boolean>(false);
  const [showStops, setShowStops] = useState<boolean>(false);
  const [showVehicles, setShowVehicles] = useState<boolean>(false);
  const [showCantieri, setShowCantieri] = useState<boolean>(false);
  const [showSpatialBuffer, setShowSpatialBuffer] = useState<boolean>(false);
  const [showFlights, setShowFlights] = useState<boolean>(false);
  const [showShips, setShowShips] = useState<boolean>(false);
  const [showShipRoutes, setShowShipRoutes] = useState<boolean>(false);
  const [showMose, setShowMose] = useState<boolean>(false);
  const [showCityAssets, setShowCityAssets] = useState<boolean>(false);
  const [showParkings, setShowParkings] = useState<boolean>(false);
  const [showAirQuality, setShowAirQuality] = useState<boolean>(false);
  const [showPedestrianFlows, setShowPedestrianFlows] = useState<boolean>(false);
  const [showAlilaguna, setShowAlilaguna] = useState<boolean>(false);
  const [showSatellites, setShowSatellites] = useState<boolean>(false);
  const [showPasserelle, setShowPasserelle] = useState<boolean>(false);
  const [showMarineSignals, setShowMarineSignals] = useState<boolean>(false);
  const [showOceanStations, setShowOceanStations] = useState<boolean>(false);
  const [showBathingWaters, setShowBathingWaters] = useState<boolean>(false);
  const [showTrees, setShowTrees] = useState<boolean>(false);
  const [showWifiHotspots, setShowWifiHotspots] = useState<boolean>(false);
  const [showEvCharging, setShowEvCharging] = useState<boolean>(false);
  const [showCameras, setShowCameras] = useState<boolean>(false);
  const [showRealtimeVehicles, setShowRealtimeVehicles] = useState<boolean>(false);
  const [realtimeVehicles, setRealtimeVehicles] = useState<RealtimeVehicleDto[]>([]);

  // 1. Viabilità Acquea & Canali
  const [showCanalLimits, setShowCanalLimits] = useState<boolean>(false);
  const [showBridges, setShowBridges] = useState<boolean>(false);
  const [showGondolas, setShowGondolas] = useState<boolean>(false);
  const [showDocks, setShowDocks] = useState<boolean>(false);
  // 2. Idrografia, Subsidenza & Morfologia
  const [showSubsidence, setShowSubsidence] = useState<boolean>(false);
  const [showMorphology, setShowMorphology] = useState<boolean>(false);
  const [showMarineWind, setShowMarineWind] = useState<boolean>(false);
  // 3. Ferrovia & Logistica
  const [showTrains, setShowTrains] = useState<boolean>(false);
  const [showWasteBoats, setShowWasteBoats] = useState<boolean>(false);
  // 4. Patrimonio Storico & Nizioleti
  const [showNizioleti, setShowNizioleti] = useState<boolean>(false);
  const [showWells, setShowWells] = useState<boolean>(false);
  const [showBellTowers, setShowBellTowers] = useState<boolean>(false);
  const [showFortresses, setShowFortresses] = useState<boolean>(false);
  // 5. Salute Pubblica & SUEM 118
  const [showEmergencyDocks, setShowEmergencyDocks] = useState<boolean>(false);
  const [showDae, setShowDae] = useState<boolean>(false);
  const [showPharmacies, setShowPharmacies] = useState<boolean>(false);
  // 6. Microclima & Isole Calore
  const [showHeatIslands, setShowHeatIslands] = useState<boolean>(false);
  // 7. Open Data Regione Veneto (dati.veneto.it)
  const [showLagoonWater, setShowLagoonWater] = useState<boolean>(false);
  const [showAccommodations, setShowAccommodations] = useState<boolean>(false);
  const [showBikeRoutes, setShowBikeRoutes] = useState<boolean>(false);
  const [showPollenStations, setShowPollenStations] = useState<boolean>(false);
  const [showTributaries, setShowTributaries] = useState<boolean>(false);

  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<number>(200);
  const [selectedCategory, setSelectedCategory] = useState<TransportModeCategory | 'all'>('all');

  // Data collections
  const [cantieri, setCantieri] = useState<CantiereItem[]>(CANTIERI_REFERENCE);
  const locatedCantieri = useMemo(() => cantieri.filter(isLocated), [cantieri]);
  const [stops, setStops] = useState<StopItem[]>(ACTV_STOPS_REFERENCE);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [ships, setShips] = useState<ShipItem[]>([]);
  const [moseGates, setMoseGates] = useState<MoseGateItem[]>([]);
  const [cpsmStations, setCpsmStations] = useState<TideStation[]>([]);
  const [fountains, setFountains] = useState<CityAssetItem[]>([]);
  const [accessibleBridges, setAccessibleBridges] = useState<CityAssetItem[]>([]);
  const [veritasServices, setVeritasServices] = useState<CityAssetItem[]>([]);
  const [parkings, setParkings] = useState<ParkingItem[]>([]);
  const [airStations, setAirStations] = useState<AirQualityItem[]>([]);
  const [pedestrianFlows, setPedestrianFlows] = useState<PedestrianFlowItem[]>([]);
  const [alilagunaRoutes, setAlilagunaRoutes] = useState<AlilagunaRoute[]>([]);
  const [alilagunaStops, setAlilagunaStops] = useState<AlilagunaStop[]>([]);
  // Deterministic official GTFS Timetable fleet for Alilaguna: synchronized with currentTimeSeconds
  const alilagunaBoats = useMemo(() => {
    return getScheduledAlilagunaBoats(currentTimeSeconds);
  }, [currentTimeSeconds]);
  const [satellites, setSatellites] = useState<SatelliteItem[]>([]);
  const [passerelle, setPasserelle] = useState<PasserellaItem[]>([]);
  const [briccole, setBriccole] = useState<BriccolaSignalItem[]>([]);
  const [oceanStations, setOceanStations] = useState<OceanStationItem[]>([]);
  const [bathingWaters, setBathingWaters] = useState<BathingWaterItem[]>([]);
  const [trees, setTrees] = useState<UrbanTreeItem[]>([]);
  const [evCharging, setEvCharging] = useState<EvChargingItem[]>([]);
  const [wifiHotspots, setWifiHotspots] = useState<WifiHotspotItem[]>([]);
  const [cameras, setCameras] = useState<VeniceCameraItem[]>(VENICE_CAMERAS);

  // 17 New Open Data Collections
  const [canalSpeedLimits, setCanalSpeedLimits] = useState<CanalSpeedLimitItem[]>(OPEN_CANAL_SPEED_LIMITS);
  const [bridges, setBridges] = useState<BridgeClearanceItem[]>(OPEN_BRIDGE_CLEARANCES);
  const [gondolas, setGondolas] = useState<GondolaStationItem[]>(OPEN_GONDOLA_STATIONS);
  const [docks, setDocks] = useState<PublicDockItem[]>(OPEN_PUBLIC_DOCKS);
  const [subsidencePoints, setSubsidencePoints] = useState<SubsidenceInSARItem[]>(OPEN_SUBSIDENCE_INSAR);
  const [lagoonMorphology, setLagoonMorphology] = useState<LagoonMorphologyItem[]>(OPEN_LAGOON_MORPHOLOGY);
  // Stazioni meteo-marine reali (METAR LIPZ + rete CPSM) da /api/weather
  const [marineWindStations, setMarineWindStations] = useState<MeteoMarineWindItem[]>([]);
  const [metarData, setMetarData] = useState<AirportMetarData | null>(null);
  const [liveTrains, setLiveTrains] = useState<TrainLiveItem[]>(OPEN_LIVE_TRAINS);
  const [wasteBoats, setWasteBoats] = useState<VeritasWasteBoatItem[]>(OPEN_VERITAS_WASTE_BOATS);
  const [nizioleti, setNizioleti] = useState<NizioletoCivicoItem[]>(OPEN_NIZIOLETI_CIVICI);
  const [wells, setWells] = useState<VeniceWellItem[]>(OPEN_VENICE_WELLS);
  const [bellTowers, setBellTowers] = useState<BellTowerItem[]>(OPEN_BELL_TOWERS);
  const [fortressIslands, setFortressIslands] = useState<LagoonFortressIslandItem[]>(OPEN_LAGOON_FORTRESS_ISLANDS);
  const [emergencyDocks, setEmergencyDocks] = useState<EmergencyWaterDockItem[]>(OPEN_EMERGENCY_WATER_DOCKS);
  const [daeList, setDaeList] = useState<PublicDaeItem[]>(OPEN_PUBLIC_DAE);
  const [pharmacies, setPharmacies] = useState<PharmacyDutyItem[]>(OPEN_PHARMACY_DUTY);
  const [heatIslands, setHeatIslands] = useState<HeatIslandSurfaceTempItem[]>(OPEN_HEAT_ISLAND_LST);

  // 5 Open Data Regione Veneto collections (dati.veneto.it)
  const [lagoonWaterQuality, setLagoonWaterQuality] = useState<LagoonWaterQualityItem[]>(REGIONAL_LAGOON_WATER_QUALITY);
  const [touristAccommodations, setTouristAccommodations] = useState<TouristAccommodationItem[]>(REGIONAL_TOURIST_ACCOMMODATIONS);
  const [regionalBikeRoutes, setRegionalBikeRoutes] = useState<RegionalBikeRouteItem[]>(REGIONAL_BIKE_ROUTES);
  const [pollenMonitoringStations, setPollenMonitoringStations] = useState<PollenMonitoringStationItem[]>(REGIONAL_POLLEN_STATIONS);
  const [lagoonTributaryRivers, setLagoonTributaryRivers] = useState<LagoonTributaryRiverItem[]>(REGIONAL_TRIBUTARY_RIVERS);

  // Marea reale CPSM (Punta Salute): null finché la fonte non risponde
  const [tideLevel, setTideLevel] = useState<number | null>(null);
  const [tideInfo, setTideInfo] = useState<{
    observedAt: string | null;
    trend: TideTrend | null;
    category: TideCategory | null;
    forecast: TideForecast | null;
  }>({ observedAt: null, trend: null, category: null, forecast: null });

  // Active selections & Modals
  const [selectedStop, setSelectedStop] = useState<StopItem | null>(null);
  const [selectedCantiere, setSelectedCantiere] = useState<CantiereItem | null>(null);
  const [selectedShip, setSelectedShip] = useState<ShipItem | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteItem | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<VeniceFeatureSelected | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<VeniceCameraItem | null>(null);
  const [isMoseModalOpen, setIsMoseModalOpen] = useState<boolean>(false);
  const [isAlilagunaModalOpen, setIsAlilagunaModalOpen] = useState<boolean>(false);
  const [isSpatialModalOpen, setIsSpatialModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isAirportModalOpen, setIsAirportModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Tutorial mostrato alla prima visita: lato server si assume già visto per evitare un flash
  const onboardingDone = usePreference(ONBOARDING_KEY, 'true') !== null;
  const showTutorial = isTutorialOpen || !onboardingDone;
  const closeTutorial = () => {
    writePreference(ONBOARDING_KEY, 'true');
    setIsTutorialOpen(false);
  };

  // Posizioni reali ACTV (GTFS-RT): lette solo quando il layer è attivo, ogni 20 s (cache server condivisa)
  useEffect(() => {
    if (!showRealtimeVehicles) return;
    let cancelled = false;
    const load = () => {
      fetch('/api/realtime/vehicles')
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled && Array.isArray(json.data)) setRealtimeVehicles(json.data);
        })
        .catch((err) => console.warn('GTFS-RT unavailable:', err));
    };
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [showRealtimeVehicles]);

  const turnAllLayers = useCallback((active: boolean) => {
    setShowRoutes(active);
    setShowStops(active);
    setShowVehicles(active);
    setShowRealtimeVehicles(active);
    setShowCantieri(active);
    setShowSpatialBuffer(active);
    setShowFlights(active);
    setShowShips(active);
    setShowShipRoutes(active);
    setShowMose(active);
    setShowCityAssets(active);
    setShowParkings(active);
    setShowAirQuality(active);
    setShowPedestrianFlows(active);
    setShowAlilaguna(active);
    setShowSatellites(active);
    setShowPasserelle(active);
    setShowMarineSignals(active);
    setShowOceanStations(active);
    setShowBathingWaters(active);
    setShowTrees(active);
    setShowWifiHotspots(active);
    setShowEvCharging(active);
    setShowCameras(active);
    // 1. Viabilità Acquea & Canali
    setShowCanalLimits(active);
    setShowBridges(active);
    setShowGondolas(active);
    setShowDocks(active);
    // 2. Idrografia, Subsidenza & Morfologia
    setShowSubsidence(active);
    setShowMorphology(active);
    setShowMarineWind(active);
    // 3. Ferrovia & Logistica
    setShowTrains(active);
    setShowWasteBoats(active);
    // 4. Patrimonio Storico & Nizioleti
    setShowNizioleti(active);
    setShowWells(active);
    setShowBellTowers(active);
    setShowFortresses(active);
    // 5. Salute Pubblica & SUEM 118
    setShowEmergencyDocks(active);
    setShowDae(active);
    setShowPharmacies(active);
    // 6. Microclima & Isole Calore
    setShowHeatIslands(active);
    // 7. Open Data Regione Veneto (dati.veneto.it)
    setShowLagoonWater(active);
    setShowAccommodations(active);
    setShowBikeRoutes(active);
    setShowPollenStations(active);
    setShowTributaries(active);
  }, []);

  const applyPreset = useCallback((preset: MapPresetType) => {
    // Reset all layers first to ensure a crisp, dedicated preset
    turnAllLayers(false);

    if (preset === 'clean') {
      return;
    }
    if (preset === 'all') {
      turnAllLayers(true);
      return;
    }
    if (preset === 'mobility') {
      setShowRoutes(true);
      setShowStops(true);
      setShowVehicles(true);
      setShowAlilaguna(true);
      setShowShips(true);
      setShowShipRoutes(true);
      setShowFlights(true);
      setShowCanalLimits(true);
      setShowBridges(true);
      setShowGondolas(true);
      setShowDocks(true);
      setShowTrains(true);
      setShowWasteBoats(true);
      setShowBikeRoutes(true);
      setShowEvCharging(true);
      setShowCameras(true);
    } else if (preset === 'lagoon') {
      setShowMose(true);
      setShowPasserelle(true);
      setShowMarineSignals(true);
      setShowOceanStations(true);
      setShowBathingWaters(true);
      setShowSubsidence(true);
      setShowMorphology(true);
      setShowMarineWind(true);
      setShowFortresses(true);
      setShowLagoonWater(true);
      setShowTributaries(true);
    } else if (preset === 'city') {
      setShowCityAssets(true);
      setShowTrees(true);
      setShowWifiHotspots(true);
      setShowEvCharging(true);
      setShowCameras(true);
      setShowParkings(true);
      setShowCantieri(true);
      setShowAirQuality(true);
      setShowPedestrianFlows(true);
      setShowNizioleti(true);
      setShowWells(true);
      setShowBellTowers(true);
      setShowEmergencyDocks(true);
      setShowDae(true);
      setShowPharmacies(true);
      setShowHeatIslands(true);
      setShowAccommodations(true);
      setShowPollenStations(true);
    } else if (preset === 'satellites') {
      setShowSatellites(true);
      setShowSubsidence(true);
      setShowHeatIslands(true);
    } else if (preset === 'regional') {
      setShowLagoonWater(true);
      setShowAccommodations(true);
      setShowBikeRoutes(true);
      setShowPollenStations(true);
      setShowTributaries(true);
      setCurrentView('lagoon');
    }
  }, [turnAllLayers]);

  // Activate specific layers mapped from query params
  const applyLayerKeyMap = useCallback((activeLayers: Partial<Record<LayerKey, boolean>>) => {
    if (ALL_LAYER_KEYS.every((k) => activeLayers[k])) {
      turnAllLayers(true);
      return;
    }
    turnAllLayers(false);
    if (activeLayers.showRoutes) setShowRoutes(true);
    if (activeLayers.showStops) setShowStops(true);
    if (activeLayers.showVehicles) setShowVehicles(true);
    if (activeLayers.showRealtimeVehicles) setShowRealtimeVehicles(true);
    if (activeLayers.showCantieri) setShowCantieri(true);
    if (activeLayers.showSpatialBuffer) setShowSpatialBuffer(true);
    if (activeLayers.showFlights) setShowFlights(true);
    if (activeLayers.showShips) setShowShips(true);
    if (activeLayers.showShipRoutes) setShowShipRoutes(true);
    if (activeLayers.showMose) setShowMose(true);
    if (activeLayers.showCityAssets) setShowCityAssets(true);
    if (activeLayers.showParkings) setShowParkings(true);
    if (activeLayers.showAirQuality) setShowAirQuality(true);
    if (activeLayers.showPedestrianFlows) setShowPedestrianFlows(true);
    if (activeLayers.showAlilaguna) setShowAlilaguna(true);
    if (activeLayers.showSatellites) setShowSatellites(true);
    if (activeLayers.showPasserelle) setShowPasserelle(true);
    if (activeLayers.showMarineSignals) setShowMarineSignals(true);
    if (activeLayers.showOceanStations) setShowOceanStations(true);
    if (activeLayers.showBathingWaters) setShowBathingWaters(true);
    if (activeLayers.showTrees) setShowTrees(true);
    if (activeLayers.showWifiHotspots) setShowWifiHotspots(true);
    if (activeLayers.showEvCharging) setShowEvCharging(true);
    if (activeLayers.showCameras) setShowCameras(true);
    if (activeLayers.showCanalLimits) setShowCanalLimits(true);
    if (activeLayers.showBridges) setShowBridges(true);
    if (activeLayers.showGondolas) setShowGondolas(true);
    if (activeLayers.showDocks) setShowDocks(true);
    if (activeLayers.showSubsidence) setShowSubsidence(true);
    if (activeLayers.showMorphology) setShowMorphology(true);
    if (activeLayers.showMarineWind) setShowMarineWind(true);
    if (activeLayers.showTrains) setShowTrains(true);
    if (activeLayers.showWasteBoats) setShowWasteBoats(true);
    if (activeLayers.showNizioleti) setShowNizioleti(true);
    if (activeLayers.showWells) setShowWells(true);
    if (activeLayers.showBellTowers) setShowBellTowers(true);
    if (activeLayers.showFortresses) setShowFortresses(true);
    if (activeLayers.showEmergencyDocks) setShowEmergencyDocks(true);
    if (activeLayers.showDae) setShowDae(true);
    if (activeLayers.showPharmacies) setShowPharmacies(true);
    if (activeLayers.showHeatIslands) setShowHeatIslands(true);
    if (activeLayers.showLagoonWater) setShowLagoonWater(true);
    if (activeLayers.showAccommodations) setShowAccommodations(true);
    if (activeLayers.showBikeRoutes) setShowBikeRoutes(true);
    if (activeLayers.showPollenStations) setShowPollenStations(true);
    if (activeLayers.showTributaries) setShowTributaries(true);
  }, [turnAllLayers]);

  // Track initial mount load from URL
  const hasLoadedUrlParamsRef = useRef(false);

  // Load initial layer state or preset from URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    if (search) {
      const parsed = parseLayerParams(search);
      if (parsed.preset) {
        applyPreset(parsed.preset as MapPresetType);
      } else if (parsed.hasLayerParams) {
        applyLayerKeyMap(parsed.activeLayers);
      }
    }
    hasLoadedUrlParamsRef.current = true;
  }, [applyPreset, applyLayerKeyMap]);

  // Synchronize active layers to URL search params in address bar (clean GIS history replaceState)
  useEffect(() => {
    if (!hasLoadedUrlParamsRef.current || typeof window === 'undefined') return;
    const currentMap: Partial<Record<LayerKey, boolean>> = {
      showRoutes,
      showStops,
      showVehicles,
      showRealtimeVehicles,
      showCantieri,
      showSpatialBuffer,
      showFlights,
      showShips,
      showShipRoutes,
      showMose,
      showCityAssets,
      showParkings,
      showAirQuality,
      showPedestrianFlows,
      showAlilaguna,
      showSatellites,
      showPasserelle,
      showMarineSignals,
      showOceanStations,
      showBathingWaters,
      showTrees,
      showWifiHotspots,
      showEvCharging,
      showCameras,
      showCanalLimits,
      showBridges,
      showGondolas,
      showDocks,
      showSubsidence,
      showMorphology,
      showMarineWind,
      showTrains,
      showWasteBoats,
      showNizioleti,
      showWells,
      showBellTowers,
      showFortresses,
      showEmergencyDocks,
      showDae,
      showPharmacies,
      showHeatIslands,
      showLagoonWater,
      showAccommodations,
      showBikeRoutes,
      showPollenStations,
      showTributaries,
    };
    const slugs = buildLayersParam(currentMap);
    const url = new URL(window.location.href);
    if (slugs) {
      url.searchParams.set('layers', slugs);
    } else {
      url.searchParams.delete('layers');
    }
    url.searchParams.delete('layer');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [
    showRoutes, showStops, showVehicles, showRealtimeVehicles, showCantieri,
    showSpatialBuffer, showFlights, showShips, showShipRoutes, showMose,
    showCityAssets, showParkings, showAirQuality, showPedestrianFlows, showAlilaguna,
    showSatellites, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters,
    showTrees, showWifiHotspots, showEvCharging, showCameras, showCanalLimits,
    showBridges, showGondolas, showDocks, showSubsidence, showMorphology,
    showMarineWind, showTrains, showWasteBoats, showNizioleti, showWells,
    showBellTowers, showFortresses, showEmergencyDocks, showDae, showPharmacies,
    showHeatIslands, showLagoonWater, showAccommodations, showBikeRoutes, showPollenStations,
    showTributaries
  ]);

  // Share active layers URL (copia ESCLUSIVAMENTE l'URL negli appunti)
  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const currentMap: Partial<Record<LayerKey, boolean>> = {
      showRoutes,
      showStops,
      showVehicles,
      showRealtimeVehicles,
      showCantieri,
      showSpatialBuffer,
      showFlights,
      showShips,
      showShipRoutes,
      showMose,
      showCityAssets,
      showParkings,
      showAirQuality,
      showPedestrianFlows,
      showAlilaguna,
      showSatellites,
      showPasserelle,
      showMarineSignals,
      showOceanStations,
      showBathingWaters,
      showTrees,
      showWifiHotspots,
      showEvCharging,
      showCameras,
      showCanalLimits,
      showBridges,
      showGondolas,
      showDocks,
      showSubsidence,
      showMorphology,
      showMarineWind,
      showTrains,
      showWasteBoats,
      showNizioleti,
      showWells,
      showBellTowers,
      showFortresses,
      showEmergencyDocks,
      showDae,
      showPharmacies,
      showHeatIslands,
      showLagoonWater,
      showAccommodations,
      showBikeRoutes,
      showPollenStations,
      showTributaries,
    };
    const shareUrl = buildShareUrl(currentMap);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
  }, [
    showRoutes, showStops, showVehicles, showRealtimeVehicles, showCantieri,
    showSpatialBuffer, showFlights, showShips, showShipRoutes, showMose,
    showCityAssets, showParkings, showAirQuality, showPedestrianFlows, showAlilaguna,
    showSatellites, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters,
    showTrees, showWifiHotspots, showEvCharging, showCameras, showCanalLimits,
    showBridges, showGondolas, showDocks, showSubsidence, showMorphology,
    showMarineWind, showTrains, showWasteBoats, showNizioleti, showWells,
    showBellTowers, showFortresses, showEmergencyDocks, showDae, showPharmacies,
    showHeatIslands, showLagoonWater, showAccommodations, showBikeRoutes, showPollenStations,
    showTributaries
  ]);

  // Conteggio dei layer attualmente attivi per abilitare il bottone di condivisione
  const activeLayersCount = useMemo(() => {
    return [
      showRoutes, showStops, showVehicles, showRealtimeVehicles, showCantieri,
      showSpatialBuffer, showFlights, showShips, showShipRoutes, showMose,
      showCityAssets, showParkings, showAirQuality, showPedestrianFlows, showAlilaguna,
      showSatellites, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters,
      showTrees, showWifiHotspots, showEvCharging, showCameras, showCanalLimits,
      showBridges, showGondolas, showDocks, showSubsidence, showMorphology,
      showMarineWind, showTrains, showWasteBoats, showNizioleti, showWells,
      showBellTowers, showFortresses, showEmergencyDocks, showDae, showPharmacies,
      showHeatIslands, showLagoonWater, showAccommodations, showBikeRoutes, showPollenStations,
      showTributaries
    ].filter(Boolean).length;
  }, [
    showRoutes, showStops, showVehicles, showRealtimeVehicles, showCantieri,
    showSpatialBuffer, showFlights, showShips, showShipRoutes, showMose,
    showCityAssets, showParkings, showAirQuality, showPedestrianFlows, showAlilaguna,
    showSatellites, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters,
    showTrees, showWifiHotspots, showEvCharging, showCameras, showCanalLimits,
    showBridges, showGondolas, showDocks, showSubsidence, showMorphology,
    showMarineWind, showTrains, showWasteBoats, showNizioleti, showWells,
    showBellTowers, showFortresses, showEmergencyDocks, showDae, showPharmacies,
    showHeatIslands, showLagoonWater, showAccommodations, showBikeRoutes, showPollenStations,
    showTributaries
  ]);

  // Fetch initial data from APIs (including Flights, Ships, City Assets, Tide, Environment, Flows)
  useEffect(() => {
    fetch('/api/cantieri')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) setCantieri(data.data);
      })
      .catch((err) => console.warn('Using fallback cantieri:', err));

    fetch('/api/stops')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) setStops(data.data);
      })
      .catch((err) => console.warn('Using fallback stops:', err));

    // Marea reale (CPSM) + anagrafica MOSE con livelli delle stazioni più vicine
    const loadTide = () => {
      fetch('/api/tide')
        .then((res) => res.json() as Promise<TideResponse>)
        .then(({ data }) => {
          setTideLevel(data.reference?.levelCm ?? null);
          setTideInfo({
            observedAt: data.reference?.observedAt ?? null,
            trend: data.trend,
            category: data.category,
            forecast: data.forecast,
          });
          setCpsmStations(data.stations);
          setMoseGates(data.moseGates);
        })
        .catch((err) => console.warn('Tide source unavailable:', err));
    };
    loadTide();
    const tideInterval = setInterval(loadTide, 5 * 60 * 1000);

    // Fetch Ships (AIS Maritime Traffic & Cruise Ships)
    fetch('/api/ships')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setShips(data.data);
      })
      .catch((err) => console.warn('Using fallback ships:', err));

    // Fetch City Assets (Fountains, Bridges, Veritas, Parkings)
    fetch('/api/city-assets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.fountains) setFountains(data.fountains);
          if (data.accessibleBridges) setAccessibleBridges(data.accessibleBridges);
          if (data.veritasServices) setVeritasServices(data.veritasServices);
          if (data.parkings) setParkings(data.parkings);
        }
      })
      .catch((err) => console.warn('Using fallback city assets:', err));

    // Fetch Environment (ARPAV air quality)
    fetch('/api/environment')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.airStations) setAirStations(data.data.airStations);
      })
      .catch((err) => console.warn('Using fallback environment:', err));

    // Fetch Pedestrian Flows (Smart Control Room)
    fetch('/api/pedestrian-flows')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.sensors) setPedestrianFlows(data.data.sensors);
      })
      .catch((err) => console.warn('Using fallback pedestrian flows:', err));

    // Fetch Flights and refresh periodically
    const loadFlights = () => {
      fetch('/api/flights')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.data)) setFlights(data.data);
        })
        .catch((err) => console.warn('Using fallback flights:', err));
    };

    loadFlights();
    const flightInterval = setInterval(loadFlights, 15000);

    // Alilaguna: rotte e fermate sono anagrafica statica (le barche sono simulate da orario lato client)
    fetch('/api/alilaguna')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.routes) setAlilagunaRoutes(data.routes);
          if (data.stops) setAlilagunaStops(data.stops);
        }
      })
      .catch((err) => console.warn('Alilaguna data unavailable:', err));

    // Fetch Earth Observation Satellites over Venice (Copernicus / ASI / NASA)
    fetch('/api/satellites')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setSatellites(data.data);
      })
      .catch((err) => console.warn('Using fallback satellites:', err));

    // Fetch Passerelle per Acqua Alta (CPSM)
    fetch('/api/passerelle')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setPasserelle(data.data);
      })
      .catch((err) => console.warn('Using fallback passerelle:', err));

    // Fetch Marine Sensors & Briccole (CNR-ISMAR / ISPRA)
    fetch('/api/marine-sensors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.oceanStations) setOceanStations(data.data.oceanStations);
          if (data.data.briccole) setBriccole(data.data.briccole);
        }
      })
      .catch((err) => console.warn('Using fallback marine sensors:', err));

    // Fetch Venice Assets (Bathing, Trees, EV, WiFi)
    fetch('/api/venice-assets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.bathingWaters) setBathingWaters(data.data.bathingWaters);
          if (data.data.urbanTrees) setTrees(data.data.urbanTrees);
          if (data.data.evCharging) setEvCharging(data.data.evCharging);
          if (data.data.wifiHotspots) setWifiHotspots(data.data.wifiHotspots);
        }
      })
      .catch((err) => console.warn('Using fallback venice assets:', err));

    // Fetch Venice Cameras & Webcams (Anopticon CCTV + SkylineWebcams / CNR Live Feeds)
    fetch('/api/cameras')
      .then((res) => res.json())
      .then((data) => {
        const list = data.data;
        if (data.success && Array.isArray(list) && list.length > 0) setCameras(list);
      })
      .catch((err) => console.warn('Using fallback cameras:', err));

    // 1. Waterways & Canals (Speed limits, bridges, gondolas, docks)
    fetch('/api/waterways')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.speedLimits) setCanalSpeedLimits(data.data.speedLimits);
          if (data.data.bridges) setBridges(data.data.bridges);
          if (data.data.gondolas) setGondolas(data.data.gondolas);
          if (data.data.docks) setDocks(data.data.docks);
        }
      })
      .catch((err) => console.warn('Using fallback waterways:', err));

    // 2. Lagoon Morphology & InSAR Subsidence (Copernicus EGMS, Natura 2000, ISPRA)
    fetch('/api/lagoon-morphology')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.subsidencePoints) setSubsidencePoints(data.data.subsidencePoints);
          if (data.data.lagoonMorphology) setLagoonMorphology(data.data.lagoonMorphology);
        }
      })
      .catch((err) => console.warn('Using fallback lagoon morphology:', err));

    // Weather & Wind (Aeronautica Militare LIPZ METAR, CNR-ISMAR offshore, CPSM anemometers)
    fetch('/api/weather')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetarData(data.data.metar ?? null);
          if (data.data.windStations) setMarineWindStations(data.data.windStations);
        }
      })
      .catch((err) => console.warn('Using fallback weather data:', err));

    // 3. Rail & Logistics (Viaggiatreno/RFI trains, Veritas waste boats)
    fetch('/api/rail-logistics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.trains) setLiveTrains(data.data.trains);
          if (data.data.wasteBoats) setWasteBoats(data.data.wasteBoats);
        }
      })
      .catch((err) => console.warn('Using fallback rail/logistics:', err));

    // 4. Historical Heritage & Toponymy (Nizioleti, Pozzi, Campanili, Forti)
    fetch('/api/heritage')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.nizioleti) setNizioleti(data.data.nizioleti);
          if (data.data.wells) setWells(data.data.wells);
          if (data.data.bellTowers) setBellTowers(data.data.bellTowers);
          if (data.data.fortressIslands) setFortressIslands(data.data.fortressIslands);
        }
      })
      .catch((err) => console.warn('Using fallback heritage:', err));

    // 5. Emergency & Healthcare (SUEM 118 docks, DAE, Pharmacies)
    fetch('/api/emergency-health')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.emergencyDocks) setEmergencyDocks(data.data.emergencyDocks);
          if (data.data.dae) setDaeList(data.data.dae);
          if (data.data.pharmacies) setPharmacies(data.data.pharmacies);
        }
      })
      .catch((err) => console.warn('Using fallback emergency health:', err));

    // 6. Urban Microclimate (Copernicus LST Urban Heat Islands)
    fetch('/api/urban-microclimate')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.heatIslands) setHeatIslands(data.data.heatIslands);
        }
      })
      .catch((err) => console.warn('Using fallback urban microclimate:', err));

    // 7. Open Data Regione Veneto (dati.veneto.it)
    fetch('/api/regional-data')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.waterQuality) setLagoonWaterQuality(data.data.waterQuality);
          if (data.data.accommodations) setTouristAccommodations(data.data.accommodations);
          if (data.data.bikeRoutes) setRegionalBikeRoutes(data.data.bikeRoutes);
          if (data.data.pollenStations) setPollenMonitoringStations(data.data.pollenStations);
          if (data.data.tributaryRivers) setLagoonTributaryRivers(data.data.tributaryRivers);
        }
      })
      .catch((err) => console.warn('Using fallback regional data:', err));

    return () => {
      clearInterval(flightInterval);
      clearInterval(tideInterval);
    };
  }, []);

  // Update CSS Variables when palette changes
  useEffect(() => {
    let pal = NOTTE;
    let isLight = false;
    if (paletteTheme === 'carta') {
      pal = CARTA;
      isLight = true;
    } else if (paletteTheme === 'dynamic') {
      pal = getDynamicPalette(currentTimeSeconds);
      isLight = pal.ground === CARTA.ground;
    }

    const root = document.documentElement;
    root.dataset.theme = isLight ? 'carta' : 'notte';
    root.style.colorScheme = isLight ? 'light' : 'dark';

    root.style.setProperty('--ground', pal.ground);
    root.style.setProperty('--surface', isLight ? '#f4eee0' : '#141d24');
    root.style.setProperty('--surface-card', isLight ? '#f9f5eb' : '#18232c');
    root.style.setProperty('--panel-bg', isLight ? 'rgba(247, 243, 232, 0.94)' : 'rgba(14, 21, 26, 0.88)');
    root.style.setProperty('--panel-border', isLight ? 'rgba(125, 107, 85, 0.30)' : 'rgba(255, 255, 255, 0.10)');
    root.style.setProperty('--panel-shadow', isLight ? '0 12px 36px 0 rgba(70, 50, 30, 0.16)' : '0 12px 36px 0 rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--track-bg', isLight ? 'rgba(60, 45, 30, 0.22)' : 'rgba(255, 255, 255, 0.15)');

    root.style.setProperty('--water', pal.water);
    root.style.setProperty('--sea', pal.sea);
    root.style.setProperty('--land', pal.land);
    root.style.setProperty('--coast', pal.coast);
    root.style.setProperty('--ink', pal.ink);
    root.style.setProperty('--ink-2', pal.ink2);
    root.style.setProperty('--ink-3', pal.ink3);
    root.style.setProperty('--rule', pal.rule);

    root.style.setProperty('--c-vaporetto', pal.cats.vaporetto);
    root.style.setProperty('--c-motoscafo', pal.cats.motoscafo);
    root.style.setProperty('--c-motonave', pal.cats.motonave);
    root.style.setProperty('--c-ferry', pal.cats.ferry);
    root.style.setProperty('--c-tram', pal.cats.tram);
    root.style.setProperty('--c-bus', pal.cats.bus);
    root.style.setProperty('--c-island', pal.cats.island);
  }, [paletteTheme, currentTimeSeconds]);

  // Ticker della simulazione: avanza simClock a ogni frame (letto dalla mappa) e aggiorna lo stato
  // React al massimo 4 volte al secondo. In modalità live segue l'ora e il giorno reali di Venezia.
  const lastTimeRef = useRef<number>(0);
  const lastCommitRef = useRef<number>(0);
  useEffect(() => {
    let frameId: number;
    lastTimeRef.current = performance.now();
    lastCommitRef.current = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      const live = isLiveSynced && speed === 1;

      if (isPlaying) {
        simClock.set(live ? romeSecondsOfDay() : simClock.get() + dt * speed);
      }

      if (now - lastCommitRef.current >= 250) {
        lastCommitRef.current = now;
        setCurrentTimeSecondsState(simClock.get());
        if (live) setSelectedDay(romeDayType());
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, speed, isLiveSynced]);

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active category counts and colors
  const activePalette = paletteTheme === 'carta' ? CARTA : paletteTheme === 'dynamic' ? getDynamicPalette(currentTimeSeconds) : NOTTE;
  const categoryCounts = {
    vaporetto: 84,
    motoscafo: 42,
    motonave: 18,
    ferry: 6,
    tram: 24,
    bus: 112,
    island: 16
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex flex-col bg-[var(--ground)]">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setFocusedCoordinates(null);
        }}
        palette={paletteTheme}
        onSelectPalette={setPaletteTheme}
        onOpenSpatialModal={() => setIsSpatialModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenLayers={() => {
          setIsLayerPanelOpenMobile(true);
          setIsDesktopLayerPanelOpen(true);
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        activeCantieriCount={locatedCantieri.length}
        tideLevel={tideLevel}
        tideObservedAt={tideInfo.observedAt}
        activeShipsCount={ships.length}
        activeSatellitesCount={satellites.length}
      />

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapEngine
          selectedDay={selectedDay}
          paletteTheme={paletteTheme}
          currentView={currentView}
          showRoutes={showRoutes}
          showStops={showStops}
          showVehicles={showVehicles}
          showCantieri={showCantieri}
          showSpatialBuffer={showSpatialBuffer}
          showFlights={showFlights}
          flights={flights}
          showShips={showShips}
          showShipRoutes={showShipRoutes}
          ships={ships}
          showMose={showMose}
          moseGates={moseGates}
          showCityAssets={showCityAssets}
          fountains={fountains}
          accessibleBridges={accessibleBridges}
          veritasServices={veritasServices}
          showParkings={showParkings}
          parkings={parkings}
          showAirQuality={showAirQuality}
          airStations={airStations}
          showPedestrianFlows={showPedestrianFlows}
          pedestrianFlows={pedestrianFlows}
          bufferRadiusMeters={bufferRadiusMeters}
          selectedCategory={selectedCategory}
          cantieri={locatedCantieri}
          stops={stops}
          showAlilaguna={showAlilaguna}
          alilagunaRoutes={alilagunaRoutes}
          alilagunaStops={alilagunaStops}
          alilagunaBoats={alilagunaBoats}
          onSelectAlilaguna={() => setIsAlilagunaModalOpen(true)}
          showCameras={showCameras}
          cameras={cameras}
          showRealtimeVehicles={showRealtimeVehicles}
          realtimeVehicles={realtimeVehicles}
          onSelectCamera={setSelectedCamera}
          showSatellites={showSatellites}
          satellites={satellites}
          onSelectSatellite={setSelectedSatellite}
          showPasserelle={showPasserelle}
          passerelle={passerelle}
          showMarineSignals={showMarineSignals}
          briccole={briccole}
          showOceanStations={showOceanStations}
          oceanStations={oceanStations}
          showBathingWaters={showBathingWaters}
          bathingWaters={bathingWaters}
          showTrees={showTrees}
          trees={trees}
          showWifiHotspots={showWifiHotspots}
          showEvCharging={showEvCharging}
          evCharging={evCharging}
          wifiHotspots={wifiHotspots}
          onSelectFeature={setSelectedFeature}
          onSelectStop={setSelectedStop}
          onSelectCantiere={setSelectedCantiere}
          onSelectAirport={() => setIsAirportModalOpen(true)}
          onSelectShip={setSelectedShip}
          onSelectMose={() => setIsMoseModalOpen(true)}
          focusedCoordinates={focusedCoordinates}
          // 1. Viabilità Acquea & Canali
          showCanalLimits={showCanalLimits}
          canalSpeedLimits={canalSpeedLimits}
          showBridges={showBridges}
          bridges={bridges}
          showGondolas={showGondolas}
          gondolas={gondolas}
          showDocks={showDocks}
          docks={docks}
          // 2. Idrografia, Subsidenza & Morfologia
          showSubsidence={showSubsidence}
          subsidencePoints={subsidencePoints}
          showMorphology={showMorphology}
          lagoonMorphology={lagoonMorphology}
          showMarineWind={showMarineWind}
          marineWindStations={marineWindStations}
          // 3. Ferrovia & Logistica
          showTrains={showTrains}
          liveTrains={liveTrains}
          showWasteBoats={showWasteBoats}
          wasteBoats={wasteBoats}
          // 4. Patrimonio Storico & Nizioleti
          showNizioleti={showNizioleti}
          nizioleti={nizioleti}
          showWells={showWells}
          wells={wells}
          showBellTowers={showBellTowers}
          bellTowers={bellTowers}
          showFortresses={showFortresses}
          fortressIslands={fortressIslands}
          // 5. Salute Pubblica & SUEM 118
          showEmergencyDocks={showEmergencyDocks}
          emergencyDocks={emergencyDocks}
          showDae={showDae}
          daeList={daeList}
          showPharmacies={showPharmacies}
          pharmacies={pharmacies}
          // 6. Microclima & Isole Calore
          showHeatIslands={showHeatIslands}
          heatIslands={heatIslands}
          // 7. Open Data Regione Veneto (dati.veneto.it)
          showLagoonWater={showLagoonWater}
          lagoonWaterQuality={lagoonWaterQuality}
          showAccommodations={showAccommodations}
          touristAccommodations={touristAccommodations}
          showBikeRoutes={showBikeRoutes}
          regionalBikeRoutes={regionalBikeRoutes}
          showPollenStations={showPollenStations}
          pollenMonitoringStations={pollenMonitoringStations}
          showTributaries={showTributaries}
          lagoonTributaryRivers={lagoonTributaryRivers}
          tideLevel={tideLevel ?? 0}
          isDesktopLayerPanelOpen={isDesktopLayerPanelOpen}
        />

        {/* Floating Left: Desktop Layer & Filter Panel or Minimized Toggle */}
        {isDesktopLayerPanelOpen ? (
          <div className="hidden md:block absolute top-4 left-4 z-20 w-80 xl:w-84 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-200">
            <LayerPanel
              onClose={() => setIsDesktopLayerPanelOpen(false)}
              onTurnAllOff={() => turnAllLayers(false)}
              onTurnAllOn={() => turnAllLayers(true)}
              onApplyPreset={applyPreset}
              showRoutes={showRoutes}
              onToggleRoutes={() => setShowRoutes((p) => !p)}
              showStops={showStops}
              onToggleStops={() => setShowStops((p) => !p)}
              stopsCount={stops.length}
              showVehicles={showVehicles}
              onToggleVehicles={() => setShowVehicles((p) => !p)}
              showRealtimeVehicles={showRealtimeVehicles}
              onToggleRealtimeVehicles={() => setShowRealtimeVehicles((p) => !p)}
              realtimeVehiclesCount={realtimeVehicles.length}
              showAlilaguna={showAlilaguna}
              onToggleAlilaguna={() => setShowAlilaguna((p) => !p)}
              alilagunaBoatsCount={alilagunaBoats.length}
              showCantieri={showCantieri}
              onToggleCantieri={() => setShowCantieri((p) => !p)}
              cantieriCount={cantieri.length}
              showCameras={showCameras}
              onToggleCameras={() => setShowCameras((p) => !p)}
              camerasCount={cameras.length}
              liveWebcamsCount={cameras.filter((c) => c.hasLiveFeed).length}
              showFlights={showFlights}
              onToggleFlights={() => setShowFlights((p) => !p)}
              flightsCount={flights.length}
              showShips={showShips}
              onToggleShips={() => setShowShips((p) => !p)}
              shipsCount={ships.length}
              showShipRoutes={showShipRoutes}
              onToggleShipRoutes={() => setShowShipRoutes((p) => !p)}
              showMose={showMose}
              onToggleMose={() => setShowMose((p) => !p)}
              showPasserelle={showPasserelle}
              onTogglePasserelle={() => setShowPasserelle((p) => !p)}
              passerelleCount={passerelle.length}
              showMarineSignals={showMarineSignals}
              onToggleMarineSignals={() => setShowMarineSignals((p) => !p)}
              briccoleCount={briccole.length}
              showOceanStations={showOceanStations}
              onToggleOceanStations={() => setShowOceanStations((p) => !p)}
              oceanStationsCount={oceanStations.length}
              showBathingWaters={showBathingWaters}
              onToggleBathingWaters={() => setShowBathingWaters((p) => !p)}
              bathingWatersCount={bathingWaters.length}
              showTrees={showTrees}
              onToggleTrees={() => setShowTrees((p) => !p)}
              treesCount={trees.length}
              showWifiHotspots={showWifiHotspots}
              onToggleWifiHotspots={() => setShowWifiHotspots((p) => !p)}
              wifiHotspotsCount={wifiHotspots.length}
              showEvCharging={showEvCharging}
              onToggleEvCharging={() => setShowEvCharging((p) => !p)}
              evChargingCount={evCharging.length}
              showCityAssets={showCityAssets}
              onToggleCityAssets={() => setShowCityAssets((p) => !p)}
              showParkings={showParkings}
              onToggleParkings={() => setShowParkings((p) => !p)}
              parkingsCount={parkings.length}
              showAirQuality={showAirQuality}
              onToggleAirQuality={() => setShowAirQuality((p) => !p)}
              showPedestrianFlows={showPedestrianFlows}
              onTogglePedestrianFlows={() => setShowPedestrianFlows((p) => !p)}
              showSatellites={showSatellites}
              onToggleSatellites={() => setShowSatellites((p) => !p)}
              satellitesCount={satellites.length}
              // 1. Viabilità Acquea & Canali
              showCanalLimits={showCanalLimits}
              onToggleCanalLimits={() => setShowCanalLimits((p) => !p)}
              canalLimitsCount={canalSpeedLimits.length}
              showBridges={showBridges}
              onToggleBridges={() => setShowBridges((p) => !p)}
              bridgesCount={bridges.length}
              showGondolas={showGondolas}
              onToggleGondolas={() => setShowGondolas((p) => !p)}
              gondolasCount={gondolas.length}
              showDocks={showDocks}
              onToggleDocks={() => setShowDocks((p) => !p)}
              docksCount={docks.length}
              // 2. Idrografia, Subsidenza & Morfologia
              showSubsidence={showSubsidence}
              onToggleSubsidence={() => setShowSubsidence((p) => !p)}
              subsidenceCount={subsidencePoints.length}
              showMorphology={showMorphology}
              onToggleMorphology={() => setShowMorphology((p) => !p)}
              morphologyCount={lagoonMorphology.length}
              showMarineWind={showMarineWind}
              onToggleMarineWind={() => setShowMarineWind((p) => !p)}
              marineWindCount={marineWindStations.length}
              // 3. Ferrovia & Logistica
              showTrains={showTrains}
              onToggleTrains={() => setShowTrains((p) => !p)}
              trainsCount={liveTrains.length}
              showWasteBoats={showWasteBoats}
              onToggleWasteBoats={() => setShowWasteBoats((p) => !p)}
              wasteBoatsCount={wasteBoats.length}
              // 4. Patrimonio Storico & Nizioleti
              showNizioleti={showNizioleti}
              onToggleNizioleti={() => setShowNizioleti((p) => !p)}
              nizioletiCount={nizioleti.length}
              showWells={showWells}
              onToggleWells={() => setShowWells((p) => !p)}
              wellsCount={wells.length}
              showBellTowers={showBellTowers}
              onToggleBellTowers={() => setShowBellTowers((p) => !p)}
              bellTowersCount={bellTowers.length}
              showFortresses={showFortresses}
              onToggleFortresses={() => setShowFortresses((p) => !p)}
              fortressesCount={fortressIslands.length}
              // 5. Salute Pubblica & SUEM 118
              showEmergencyDocks={showEmergencyDocks}
              onToggleEmergencyDocks={() => setShowEmergencyDocks((p) => !p)}
              emergencyDocksCount={emergencyDocks.length}
              showDae={showDae}
              onToggleDae={() => setShowDae((p) => !p)}
              daeCount={daeList.length}
              showPharmacies={showPharmacies}
              onTogglePharmacies={() => setShowPharmacies((p) => !p)}
              pharmaciesCount={pharmacies.length}
              // 6. Microclima & Isole Calore
              showHeatIslands={showHeatIslands}
              onToggleHeatIslands={() => setShowHeatIslands((p) => !p)}
              heatIslandsCount={heatIslands.length}
              // 7. Open Data Regione Veneto (dati.veneto.it)
              showLagoonWater={showLagoonWater}
              onToggleLagoonWater={() => setShowLagoonWater((p) => !p)}
              lagoonWaterCount={lagoonWaterQuality.length}
              showAccommodations={showAccommodations}
              onToggleAccommodations={() => setShowAccommodations((p) => !p)}
              accommodationsCount={touristAccommodations.length}
              showBikeRoutes={showBikeRoutes}
              onToggleBikeRoutes={() => setShowBikeRoutes((p) => !p)}
              bikeRoutesCount={regionalBikeRoutes.length}
              showPollenStations={showPollenStations}
              onTogglePollenStations={() => setShowPollenStations((p) => !p)}
              pollenStationsCount={pollenMonitoringStations.length}
              showTributaries={showTributaries}
              onToggleTributaries={() => setShowTributaries((p) => !p)}
              tributariesCount={lagoonTributaryRivers.length}
              showSpatialBuffer={showSpatialBuffer}
              onToggleSpatialBuffer={() => setShowSpatialBuffer((p) => !p)}
              bufferRadiusMeters={bufferRadiusMeters}
              onBufferRadiusChange={setBufferRadiusMeters}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
              categoryColors={activePalette.cats}
            />
          </div>
        ) : (
          <div className="hidden md:block absolute top-4 left-4 z-20 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setIsDesktopLayerPanelOpen(true)}
              className="glass-panel px-3.5 py-2 rounded-2xl border border-cyan-500/30 text-xs font-mono text-[var(--ink)] flex items-center gap-2 shadow-2xl hover:border-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
              title={t('layers.openPanelTitle')}
            >
              <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold">{t('layers.panelTitle')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">44</span>
            </button>
          </div>
        )}

        {/* Mobile Bottom Sheet Drawer for LayerPanel (triggered by Header [Filtri] button) */}
        {isLayerPanelOpenMobile && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
            onClick={() => setIsLayerPanelOpenMobile(false)}
          >
            <div
              className="w-full max-h-[85vh] p-2 animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <LayerPanel
                onTurnAllOff={() => turnAllLayers(false)}
                onTurnAllOn={() => turnAllLayers(true)}
                onApplyPreset={applyPreset}
                showRoutes={showRoutes}
                onToggleRoutes={() => setShowRoutes((p) => !p)}
                showStops={showStops}
                onToggleStops={() => setShowStops((p) => !p)}
                stopsCount={stops.length}
                showVehicles={showVehicles}
                onToggleVehicles={() => setShowVehicles((p) => !p)}
                showRealtimeVehicles={showRealtimeVehicles}
                onToggleRealtimeVehicles={() => setShowRealtimeVehicles((p) => !p)}
                realtimeVehiclesCount={realtimeVehicles.length}
                showAlilaguna={showAlilaguna}
                onToggleAlilaguna={() => setShowAlilaguna((p) => !p)}
                alilagunaBoatsCount={alilagunaBoats.length}
                showCantieri={showCantieri}
                onToggleCantieri={() => setShowCantieri((p) => !p)}
                cantieriCount={cantieri.length}
                showCameras={showCameras}
                onToggleCameras={() => setShowCameras((p) => !p)}
                camerasCount={cameras.length}
                liveWebcamsCount={cameras.filter((c) => c.hasLiveFeed).length}
                showFlights={showFlights}
                onToggleFlights={() => setShowFlights((p) => !p)}
                flightsCount={flights.length}
                showShips={showShips}
                onToggleShips={() => setShowShips((p) => !p)}
                shipsCount={ships.length}
                showShipRoutes={showShipRoutes}
                onToggleShipRoutes={() => setShowShipRoutes((p) => !p)}
                showMose={showMose}
                onToggleMose={() => setShowMose((p) => !p)}
                showPasserelle={showPasserelle}
                onTogglePasserelle={() => setShowPasserelle((p) => !p)}
                passerelleCount={passerelle.length}
                showMarineSignals={showMarineSignals}
                onToggleMarineSignals={() => setShowMarineSignals((p) => !p)}
                briccoleCount={briccole.length}
                showOceanStations={showOceanStations}
                onToggleOceanStations={() => setShowOceanStations((p) => !p)}
                oceanStationsCount={oceanStations.length}
                showBathingWaters={showBathingWaters}
                onToggleBathingWaters={() => setShowBathingWaters((p) => !p)}
                bathingWatersCount={bathingWaters.length}
                showTrees={showTrees}
                onToggleTrees={() => setShowTrees((p) => !p)}
                treesCount={trees.length}
                showWifiHotspots={showWifiHotspots}
                onToggleWifiHotspots={() => setShowWifiHotspots((p) => !p)}
                wifiHotspotsCount={wifiHotspots.length}
                showEvCharging={showEvCharging}
                onToggleEvCharging={() => setShowEvCharging((p) => !p)}
                evChargingCount={evCharging.length}
                showCityAssets={showCityAssets}
                onToggleCityAssets={() => setShowCityAssets((p) => !p)}
                showParkings={showParkings}
                onToggleParkings={() => setShowParkings((p) => !p)}
                parkingsCount={parkings.length}
                showAirQuality={showAirQuality}
                onToggleAirQuality={() => setShowAirQuality((p) => !p)}
                showPedestrianFlows={showPedestrianFlows}
                onTogglePedestrianFlows={() => setShowPedestrianFlows((p) => !p)}
                showSatellites={showSatellites}
                onToggleSatellites={() => setShowSatellites((p) => !p)}
                satellitesCount={satellites.length}
                // 1. Viabilità Acquea & Canali
                showCanalLimits={showCanalLimits}
                onToggleCanalLimits={() => setShowCanalLimits((p) => !p)}
                canalLimitsCount={canalSpeedLimits.length}
                showBridges={showBridges}
                onToggleBridges={() => setShowBridges((p) => !p)}
                bridgesCount={bridges.length}
                showGondolas={showGondolas}
                onToggleGondolas={() => setShowGondolas((p) => !p)}
                gondolasCount={gondolas.length}
                showDocks={showDocks}
                onToggleDocks={() => setShowDocks((p) => !p)}
                docksCount={docks.length}
                // 2. Idrografia, Subsidenza & Morfologia
                showSubsidence={showSubsidence}
                onToggleSubsidence={() => setShowSubsidence((p) => !p)}
                subsidenceCount={subsidencePoints.length}
                showMorphology={showMorphology}
                onToggleMorphology={() => setShowMorphology((p) => !p)}
                morphologyCount={lagoonMorphology.length}
                showMarineWind={showMarineWind}
                onToggleMarineWind={() => setShowMarineWind((p) => !p)}
                marineWindCount={marineWindStations.length}
                // 3. Ferrovia & Logistica
                showTrains={showTrains}
                onToggleTrains={() => setShowTrains((p) => !p)}
                trainsCount={liveTrains.length}
                showWasteBoats={showWasteBoats}
                onToggleWasteBoats={() => setShowWasteBoats((p) => !p)}
                wasteBoatsCount={wasteBoats.length}
                // 4. Patrimonio Storico & Nizioleti
                showNizioleti={showNizioleti}
                onToggleNizioleti={() => setShowNizioleti((p) => !p)}
                nizioletiCount={nizioleti.length}
                showWells={showWells}
                onToggleWells={() => setShowWells((p) => !p)}
                wellsCount={wells.length}
                showBellTowers={showBellTowers}
                onToggleBellTowers={() => setShowBellTowers((p) => !p)}
                bellTowersCount={bellTowers.length}
                showFortresses={showFortresses}
                onToggleFortresses={() => setShowFortresses((p) => !p)}
                fortressesCount={fortressIslands.length}
                // 5. Salute Pubblica & SUEM 118
                showEmergencyDocks={showEmergencyDocks}
                onToggleEmergencyDocks={() => setShowEmergencyDocks((p) => !p)}
                emergencyDocksCount={emergencyDocks.length}
                showDae={showDae}
                onToggleDae={() => setShowDae((p) => !p)}
                daeCount={daeList.length}
                showPharmacies={showPharmacies}
                onTogglePharmacies={() => setShowPharmacies((p) => !p)}
                pharmaciesCount={pharmacies.length}
                // 6. Microclima & Isole Calore
                showHeatIslands={showHeatIslands}
                onToggleHeatIslands={() => setShowHeatIslands((p) => !p)}
                heatIslandsCount={heatIslands.length}
                // 7. Open Data Regione Veneto (dati.veneto.it)
                showLagoonWater={showLagoonWater}
                onToggleLagoonWater={() => setShowLagoonWater((p) => !p)}
                lagoonWaterCount={lagoonWaterQuality.length}
                showAccommodations={showAccommodations}
                onToggleAccommodations={() => setShowAccommodations((p) => !p)}
                accommodationsCount={touristAccommodations.length}
                showBikeRoutes={showBikeRoutes}
                onToggleBikeRoutes={() => setShowBikeRoutes((p) => !p)}
                bikeRoutesCount={regionalBikeRoutes.length}
                showPollenStations={showPollenStations}
                onTogglePollenStations={() => setShowPollenStations((p) => !p)}
                pollenStationsCount={pollenMonitoringStations.length}
                showTributaries={showTributaries}
                onToggleTributaries={() => setShowTributaries((p) => !p)}
                tributariesCount={lagoonTributaryRivers.length}
                showSpatialBuffer={showSpatialBuffer}
                onToggleSpatialBuffer={() => setShowSpatialBuffer((p) => !p)}
                bufferRadiusMeters={bufferRadiusMeters}
                onBufferRadiusChange={setBufferRadiusMeters}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categoryCounts={categoryCounts}
                categoryColors={activePalette.cats}
                onClose={() => setIsLayerPanelOpenMobile(false)}
              />
            </div>
          </div>
        )}

        {/* Floating Bottom: 24h Timeline Scrubber & Speed Controls */}
        <div
          className={`absolute bottom-2 sm:bottom-4 md:bottom-6 z-20 w-full px-2 sm:px-4 transition-all duration-300 ${
            isDesktopLayerPanelOpen
              ? // Spostata a destra del pannello livelli (w-80 + margine) solo quando c'è spazio
                'left-1/2 -translate-x-1/2 max-w-4xl lg:left-[calc(50%+10.5rem)] lg:max-w-[min(56rem,calc(100vw-23rem))]'
              : 'left-1/2 -translate-x-1/2 max-w-4xl'
          }`}
        >
          <TimelineControls
            currentTimeSeconds={currentTimeSeconds}
            onTimeChange={(val) => {
              setCurrentTimeSeconds(val);
              setIsLiveSynced(false);
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            speed={speed}
            onSpeedChange={(s) => {
              setSpeed(s);
              if (s !== 1) setIsLiveSynced(false);
            }}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            showVehicles={showVehicles}
            showAlilaguna={showAlilaguna}
            actvTripsCount={activeTripsAt(selectedDay, currentTimeSeconds)}
            alilagunaBoatsCount={alilagunaBoats.length}
            peakCount={dayActivity(selectedDay).peakCount}
            peakTime={dayActivity(selectedDay).peakTime}
            totalActiveVehicles={activeTripsAt(selectedDay, currentTimeSeconds)}
            showTide={showMose || showPasserelle}
            tideLevel={tideLevel}
            onSyncLiveTime={handleSyncLiveTime}
            isLiveSynced={isLiveSynced}
            onShare={handleShare}
            hasActiveLayers={activeLayersCount > 0}
          />
        </div>
      </div>

      {/* Modals */}
      <StopDetailModal
        stop={selectedStop}
        onClose={() => setSelectedStop(null)}
        currentTimeSeconds={currentTimeSeconds}
      />

      <CantiereDetailModal
        cantiere={selectedCantiere}
        onClose={() => setSelectedCantiere(null)}
      />

      <AirportDetailModal
        isOpen={isAirportModalOpen}
        onClose={() => setIsAirportModalOpen(false)}
        flights={flights}
        metar={metarData}
      />

      <ShipDetailModal
        ship={selectedShip}
        onClose={() => setSelectedShip(null)}
      />

      <MoseDetailModal
        isOpen={isMoseModalOpen}
        onClose={() => setIsMoseModalOpen(false)}
        moseGates={moseGates}
        stations={cpsmStations}
        tideLevel={tideLevel}
        tideInfo={tideInfo}
      />

      <AlilagunaDetailModal
        isOpen={isAlilagunaModalOpen}
        onClose={() => setIsAlilagunaModalOpen(false)}
        routes={alilagunaRoutes}
        stops={alilagunaStops}
        boats={alilagunaBoats}
      />

      <SatelliteDetailModal
        satellite={selectedSatellite}
        onClose={() => setSelectedSatellite(null)}
      />

      <CameraDetailModal
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />

      <VeniceFeatureDetailModal
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        currentTideLevelCm={tideLevel ?? undefined}
      />

      <SpatialAnalysisModal
        isOpen={isSpatialModalOpen}
        onClose={() => setIsSpatialModalOpen(false)}
        onFocusLocation={(lat, lon) => setFocusedCoordinates({ lat, lon })}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      <OnboardingTutorialModal
        isOpen={showTutorial}
        onClose={closeTutorial}
        onSelectPreset={applyPreset}
      />
    </main>
  );
}
