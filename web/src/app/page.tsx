'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MapEngine } from '@/components/MapEngine';
import { TimelineControls } from '@/components/TimelineControls';
import { LayerPanel } from '@/components/LayerPanel';
import { buildLayersParam, buildShareUrl } from '@/lib/urlLayers';
import { allLayers, countActiveLayers, initialLayersFromSearch, makeLayerSetters, presetLayers, type LayerVisibility } from '@/lib/layerState';
import { copyToClipboard } from '@/lib/dataExport';
import { StopDetailModal } from '@/components/StopDetailModal';
import { CantiereDetailModal } from '@/components/CantiereDetailModal';
import { SpatialAnalysisModal } from '@/components/SpatialAnalysisModal';
import { AirportDetailModal } from '@/components/AirportDetailModal';
import { ShipDetailModal } from '@/components/ShipDetailModal';
import { MoseDetailModal } from '@/components/MoseDetailModal';
import { AlilagunaDetailModal } from '@/components/AlilagunaDetailModal';
import { SatelliteDetailModal } from '@/components/SatelliteDetailModal';
import { CameraDetailModal } from '@/components/CameraDetailModal';
import { VeniceFeatureDetailModal, VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';
import { OnboardingTutorialModal, MapPresetType } from '@/components/OnboardingTutorialModal';
import { GlobalSearchModal, SearchResultItem } from '@/components/GlobalSearchModal';
import { TideFloodModal } from '@/components/TideFloodModal';
import { DataExportModal } from '@/components/DataExportModal';
import { Layers, Waves, X } from 'lucide-react';
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
  AirportMetarData,
  VeniceCameraItem
} from '@/lib/types';
import { isLocated } from '@/lib/types';
import {
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
  OPEN_BELL_TOWERS,
  OPEN_LAGOON_FORTRESS_ISLANDS,
  OPEN_EMERGENCY_WATER_DOCKS,
  OPEN_HEAT_ISLAND_LST
} from '@/lib/open-data-catalog';
import { CANTIERI_REFERENCE, ACTV_STOPS_REFERENCE } from '@/lib/db';
import { OPEN_PUBLIC_DAE } from '@/lib/dae-data';
import { OPEN_PHARMACIES } from '@/lib/pharmacies-data';
import { VENICE_CAMERAS } from '@/lib/cameras-data';
import { NOTTE, CARTA, getDynamicPalette, isDaylightTheme } from '@/lib/solar';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import type { FiberDataset } from '@/lib/fiber';
import type { LagoonNetwork } from '@/lib/lagoonNetwork';
import { useTranslation } from '@/lib/i18n';
import { romeDayType, romeSecondsOfDay, formatSignedCm } from '@/lib/time';
import { activeTripsAt, dayActivity } from '@/lib/gtfsActivity';
import { simClock } from '@/lib/simClock';
import { usePreference, writePreference, THEME_PREFERENCE_KEY } from '@/lib/localPreference';

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

  // Theme & Views: persistenza del tema in localStorage per ricaricamenti successivi
  // Predefinito: tema dinamico che segue alba e tramonto a Venezia
  const savedPalette = usePreference(THEME_PREFERENCE_KEY, 'dynamic');
  const paletteTheme: PaletteTheme =
    savedPalette === 'carta' || savedPalette === 'dynamic' || savedPalette === 'notte'
      ? (savedPalette as PaletteTheme)
      : 'dynamic';
  const handleSelectPalette = useCallback((theme: PaletteTheme) => {
    writePreference(THEME_PREFERENCE_KEY, theme);
  }, []);
  const [currentView, setCurrentView] = useState<CameraViewPreset>('lagoon');

  // Layer toggles (Default to false on clean map startup)
  const [layers, setLayers] = useState<LayerVisibility>(() => allLayers(false));
  const { showRoutes, showStops, showVehicles, showRealtimeVehicles, showCantieri, showSpatialBuffer, showFlights, showShips, showShipRoutes, showMose, showCityAssets, showParkings, showAirQuality, showPedestrianFlows, showAlilaguna, showSatellites, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters, showTrees, showWifiHotspots, showEvCharging, showCameras, showCanalLimits, showBridges, showGondolas, showDocks, showSubsidence, showMorphology, showMarineWind, showTrains, showWasteBoats, showNizioleti, showWells, showBellTowers, showFortresses, showEmergencyDocks, showDae, showPharmacies, showHeatIslands, showLagoonWater, showAccommodations, showBikeRoutes, showPollenStations, showTributaries, showFiber, showRecyclingCentres, showLibraries, showCanals } = layers;
  const { setShowRoutes, setShowStops, setShowVehicles, setShowRealtimeVehicles, setShowCantieri, setShowSpatialBuffer, setShowFlights, setShowShips, setShowShipRoutes, setShowMose, setShowCityAssets, setShowParkings, setShowAirQuality, setShowPedestrianFlows, setShowAlilaguna, setShowSatellites, setShowPasserelle, setShowMarineSignals, setShowOceanStations, setShowBathingWaters, setShowTrees, setShowWifiHotspots, setShowEvCharging, setShowCameras, setShowCanalLimits, setShowBridges, setShowGondolas, setShowDocks, setShowSubsidence, setShowMorphology, setShowMarineWind, setShowTrains, setShowWasteBoats, setShowNizioleti, setShowWells, setShowBellTowers, setShowFortresses, setShowEmergencyDocks, setShowDae, setShowPharmacies, setShowHeatIslands, setShowLagoonWater, setShowAccommodations, setShowBikeRoutes, setShowPollenStations, setShowTributaries, setShowFiber, setShowRecyclingCentres, setShowLibraries, setShowCanals } = useMemo(() => makeLayerSetters(setLayers), []);
  const [realtimeVehicles, setRealtimeVehicles] = useState<RealtimeVehicleDto[]>([]);

  // 1. Viabilità Acquea & Canali
  // 2. Idrografia, Subsidenza & Morfologia
  // 3. Ferrovia & Logistica
  // 4. Patrimonio Storico & Nizioleti
  // 5. Salute Pubblica & SUEM 118
  // 6. Microclima & Isole Calore
  // 7. Open Data Regione Veneto (dati.veneto.it)

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
  // Campo di vento previsto (Open-Meteo) per l'animazione del layer vento: caricato solo quando serve
  const [windField, setWindField] = useState<WindField | null>(null);
  // Copertura della rete fissa (AGCOM): ~150 KB, caricata solo alla prima attivazione del layer
  const [fiberData, setFiberData] = useState<FiberDataset | null>(null);
  // Ecocentri e biblioteche (OpenStreetMap) da /api/city-assets
  const [recyclingCentres, setRecyclingCentres] = useState<CivicPoiItem[]>([]);
  const [libraries, setLibraries] = useState<CivicPoiItem[]>([]);
  // Briccole, segnalamenti e canali da OpenStreetMap (~450 KB): caricati alla prima attivazione
  const [lagoonNetwork, setLagoonNetwork] = useState<LagoonNetwork | null>(null);
  const [metarData, setMetarData] = useState<AirportMetarData | null>(null);
  const [liveTrains, setLiveTrains] = useState<TrainLiveItem[]>(OPEN_LIVE_TRAINS);
  const [wasteBoats, setWasteBoats] = useState<VeritasWasteBoatItem[]>(OPEN_VERITAS_WASTE_BOATS);
  const [nizioleti, setNizioleti] = useState<NizioletoCivicoItem[]>(OPEN_NIZIOLETI_CIVICI);
  const [wells, setWells] = useState<VeniceWellItem[]>([]);
  const [bellTowers, setBellTowers] = useState<BellTowerItem[]>(OPEN_BELL_TOWERS);
  const [fortressIslands, setFortressIslands] = useState<LagoonFortressIslandItem[]>(OPEN_LAGOON_FORTRESS_ISLANDS);
  const [emergencyDocks, setEmergencyDocks] = useState<EmergencyWaterDockItem[]>(OPEN_EMERGENCY_WATER_DOCKS);
  const [daeList, setDaeList] = useState<PublicDaeItem[]>(OPEN_PUBLIC_DAE);
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>(OPEN_PHARMACIES);
  const [heatIslands, setHeatIslands] = useState<HeatIslandSurfaceTempItem[]>(OPEN_HEAT_ISLAND_LST);

  // 5 Open Data Regione Veneto collections (dati.veneto.it)
  const [lagoonWaterQuality, setLagoonWaterQuality] = useState<LagoonWaterQualityItem[]>([]);
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
  const [isAirportModalOpen, setIsAirportModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTideModalOpen, setIsTideModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [simulatedTideLevel, setSimulatedTideLevel] = useState<number | null>(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K for Global Search
  // Navi AIS reali: caricate quando il layer è attivo e aggiornate ogni minuto
  useEffect(() => {
    if (!showShips) return;
    const load = () =>
      fetch('/api/ships')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) setShips(data.data);
        })
        .catch((err) => console.warn('Navi AIS non disponibili:', err));
    void load();
    const id = setInterval(load, 60 * 1000);
    return () => clearInterval(id);
  }, [showShips]);

  useEffect(() => {
    if ((!showMarineSignals && !showCanals) || lagoonNetwork) return;
    fetch('/api/lagoon-network')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setLagoonNetwork(json.data as LagoonNetwork);
      })
      .catch((err) => console.warn('Rete lagunare non disponibile:', err));
  }, [showMarineSignals, showCanals, lagoonNetwork]);

  useEffect(() => {
    if (!showFiber || fiberData) return;
    fetch('/api/fiber')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setFiberData(json.data as FiberDataset);
      })
      .catch((err) => console.warn('Copertura fibra non disponibile:', err));
  }, [showFiber, fiberData]);

  useEffect(() => {
    if (!showMarineWind) return;
    const load = () =>
      fetch('/api/wind-field')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) setWindField(json.data as WindField);
        })
        .catch((err) => console.warn('Campo di vento non disponibile:', err));
    void load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [showMarineWind]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Center camera and focus element from search results
  const handleSelectSearchResult = useCallback((item: SearchResultItem) => {
    setFocusedCoordinates({ lat: item.lat, lon: item.lon });

    // Accende il layer del risultato (senza toccare gli altri)
    const key = item.layerKey;
    if (key) setLayers((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

    if (item.type === 'stop') setSelectedStop(item.rawItem);
    else if (item.type === 'cantiere') setSelectedCantiere(item.rawItem);
    else if (item.type === 'camera') setSelectedCamera(item.rawItem);
    else if (item.type === 'mose') setIsMoseModalOpen(true);
    else if (item.type === 'nizioleto') setSelectedFeature({ type: 'nizioleto', data: item.rawItem });
    else if (item.type === 'well') setSelectedFeature({ type: 'veniceWell', data: item.rawItem });
    else if (item.type === 'bell_tower') setSelectedFeature({ type: 'bellTower', data: item.rawItem });
    else if (item.type === 'pharmacy') setSelectedFeature({ type: 'pharmacy', data: item.rawItem });
    else if (item.type === 'dae') setSelectedFeature({ type: 'publicDae', data: item.rawItem });
    else if (item.type === 'emergency_dock') setSelectedFeature({ type: 'emergencyDock', data: item.rawItem });
    else if (item.type === 'fountain') setSelectedFeature({ type: 'fountain', data: item.rawItem });
    else if (item.type === 'parking') setSelectedFeature({ type: 'parking', data: item.rawItem });
  }, []);

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

  const turnAllLayers = useCallback((active: boolean) => setLayers(allLayers(active)), []);

  const applyPreset = useCallback((preset: MapPresetType) => {
    setLayers(presetLayers(preset));
    if (preset === 'regional') setCurrentView('lagoon');
  }, []);

  // Track initial mount load from URL
  const hasLoadedUrlParamsRef = useRef(false);

  // Stato iniziale dei layer dall'URL: ?layers= ha la precedenza su ?preset=
  useEffect(() => {
    const initial = initialLayersFromSearch(window.location.search);
    if (initial?.preset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura una tantum dell'URL dopo l'idratazione
      applyPreset(initial.preset);
    } else if (initial) {
      setLayers(initial.layers);
    }
    hasLoadedUrlParamsRef.current = true;
  }, [applyPreset]);

  // Sincronizza i layer attivi nell'URL (replaceState, senza voci di cronologia)
  useEffect(() => {
    if (!hasLoadedUrlParamsRef.current) return;
    const slugs = buildLayersParam(layers);
    const url = new URL(window.location.href);
    if (slugs) url.searchParams.set('layers', slugs);
    else url.searchParams.delete('layers');
    // Il preset è già tradotto in layer: lasciarlo nell'URL farebbe perdere le modifiche al reload
    url.searchParams.delete('layer');
    url.searchParams.delete('preset');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [layers]);

  // Copia negli appunti l'URL con i layer attivi; l'esito è mostrato dal pulsante
  const handleShare = useCallback(() => copyToClipboard(buildShareUrl(layers)), [layers]);

  // Conteggio dei layer attualmente attivi per abilitare il bottone di condivisione
  const activeLayersCount = useMemo(() => countActiveLayers(layers), [layers]);

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

    // Fetch City Assets (Fountains, Bridges, Veritas, Parkings)
    fetch('/api/city-assets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.fountains) setFountains(data.fountains);
          if (data.accessibleBridges) setAccessibleBridges(data.accessibleBridges);
          if (data.veritasServices) setVeritasServices(data.veritasServices);
          if (data.parkings) setParkings(data.parkings);
          if (data.recyclingCentres) setRecyclingCentres(data.recyclingCentres);
          if (data.libraries) setLibraries(data.libraries);
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
      isLight = isDaylightTheme(currentTimeSeconds);
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
        onSelectPalette={handleSelectPalette}
        onOpenSpatialModal={() => setIsSpatialModalOpen(true)}
        onOpenLayers={() => {
          setIsLayerPanelOpenMobile(true);
          setIsDesktopLayerPanelOpen(true);
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTideModal={() => setIsTideModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        activeCantieriCount={locatedCantieri.length}
        tideLevel={tideLevel}
        tideObservedAt={tideInfo.observedAt}
        tideTrend={tideInfo.trend}
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
          windField={windField}
          showFiber={showFiber}
          fiberData={fiberData}
          showRecyclingCentres={showRecyclingCentres}
          recyclingCentres={recyclingCentres}
          showLibraries={showLibraries}
          libraries={libraries}
          showCanals={showCanals}
          lagoonNetwork={lagoonNetwork}
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
          simulatedTideLevel={simulatedTideLevel}
          isDesktopLayerPanelOpen={isDesktopLayerPanelOpen}
        />

        {/* Floating Simulated Tide Alert Pill on Map */}
        {simulatedTideLevel !== null && (
          <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-xs font-mono shadow-2xl">
              <Waves className="w-4 h-4 text-cyan-400 motion-safe:animate-pulse" />
              <span className="text-slate-300">
                {t('ui.floodModal.simPill')}: <strong className={simulatedTideLevel >= 110 ? 'text-rose-400' : 'text-cyan-300'}>{formatSignedCm(simulatedTideLevel)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsTideModalOpen(true)}
                className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                title={t('ui.floodModal.simAdjustTitle')}
              >
                {t('ui.floodModal.simAdjust')}
              </button>
              <button
                type="button"
                onClick={() => setSimulatedTideLevel(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={t('ui.floodModal.simReset')}
                aria-label={t('ui.floodModal.simReset')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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
              briccoleCount={briccole.length + (lagoonNetwork?.markers.length ?? 0)}
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
              showFiber={showFiber}
              onToggleFiber={() => setShowFiber((p) => !p)}
              showRecyclingCentres={showRecyclingCentres}
              onToggleRecyclingCentres={() => setShowRecyclingCentres((p) => !p)}
              recyclingCentresCount={recyclingCentres.length}
              showLibraries={showLibraries}
              onToggleLibraries={() => setShowLibraries((p) => !p)}
              librariesCount={libraries.length}
              showCanals={showCanals}
              onToggleCanals={() => setShowCanals((p) => !p)}
              canalsCount={lagoonNetwork?.canals.length ?? 0}
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
                briccoleCount={briccole.length + (lagoonNetwork?.markers.length ?? 0)}
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
              showFiber={showFiber}
              onToggleFiber={() => setShowFiber((p) => !p)}
              showRecyclingCentres={showRecyclingCentres}
              onToggleRecyclingCentres={() => setShowRecyclingCentres((p) => !p)}
              recyclingCentresCount={recyclingCentres.length}
              showLibraries={showLibraries}
              onToggleLibraries={() => setShowLibraries((p) => !p)}
              librariesCount={libraries.length}
              showCanals={showCanals}
              onToggleCanals={() => setShowCanals((p) => !p)}
              canalsCount={lagoonNetwork?.canals.length ?? 0}
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
            showTide={showMose || showPasserelle}
            tideLevel={tideLevel}
            onSyncLiveTime={handleSyncLiveTime}
            isLiveSynced={isLiveSynced}
            onShare={handleShare}
            hasActiveLayers={activeLayersCount > 0}
            onOpenTideModal={() => setIsTideModalOpen(true)}
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

      <OnboardingTutorialModal
        isOpen={showTutorial}
        onClose={closeTutorial}
        onSelectPreset={applyPreset}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
        stops={stops}
        pharmacies={pharmacies}
        daeList={daeList}
        emergencyDocks={emergencyDocks}
        fountains={fountains}
        cantieri={locatedCantieri}
        cameras={cameras}
        parkings={parkings}
        nizioleti={nizioleti}
        wells={wells}
        bellTowers={bellTowers}
        moseGates={moseGates}
        oceanStations={oceanStations}
      />

      <TideFloodModal
        isOpen={isTideModalOpen}
        onClose={() => setIsTideModalOpen(false)}
        liveTideLevel={tideLevel}
        onActivatePasserelle={() => setShowPasserelle(true)}
        simulatedTideLevel={simulatedTideLevel}
        onSimulatedTideChange={setSimulatedTideLevel}
        forecast={tideInfo.forecast}
        marineWindStations={marineWindStations}
      />

      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        stops={stops}
        pharmacies={pharmacies}
        daeList={daeList}
        emergencyDocks={emergencyDocks}
        fountains={fountains}
        cantieri={locatedCantieri}
        cameras={cameras}
        parkings={parkings}
        nizioleti={nizioleti}
        wells={wells}
        bellTowers={bellTowers}
        moseGates={moseGates}
        oceanStations={oceanStations}
        briccole={briccole}
      />
    </main>
  );
}
