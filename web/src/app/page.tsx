'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { MapEngine } from '@/components/MapEngine';
import { TimelineControls } from '@/components/TimelineControls';
import { LayerPanel } from '@/components/LayerPanel';
import { StopDetailModal } from '@/components/StopDetailModal';
import { CantiereDetailModal } from '@/components/CantiereDetailModal';
import { SpatialAnalysisModal } from '@/components/SpatialAnalysisModal';
import { StatsModal } from '@/components/StatsModal';
import { AirportDetailModal } from '@/components/AirportDetailModal';
import { ShipDetailModal } from '@/components/ShipDetailModal';
import { MoseDetailModal } from '@/components/MoseDetailModal';
import { AlilagunaDetailModal } from '@/components/AlilagunaDetailModal';
import { SatelliteDetailModal } from '@/components/SatelliteDetailModal';
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
import {
  OPEN_CANAL_SPEED_LIMITS,
  OPEN_BRIDGE_CLEARANCES,
  OPEN_GONDOLA_STATIONS,
  OPEN_PUBLIC_DOCKS,
  OPEN_SUBSIDENCE_INSAR,
  OPEN_LAGOON_MORPHOLOGY,
  OPEN_METEO_MARINE_WIND,
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
import { MOCK_CANTIERI, MOCK_STOPS } from '@/lib/db';
import { NOTTE, CARTA, getDynamicPalette } from '@/lib/solar';

export default function HomePage() {
  // Timeline and simulation state - DEFAULT TO "ORA LIVE" (Current wall-clock time in Venice, 1:1 speed)
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // Default 1x Reale for live mode
  const [selectedDay, setSelectedDay] = useState<DayType>(() => {
    const day = new Date().getDay();
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
  });
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true); // Default ORA LIVE active on initial load
  const [isLayerPanelOpenMobile, setIsLayerPanelOpenMobile] = useState<boolean>(false);
  const [isDesktopLayerPanelOpen, setIsDesktopLayerPanelOpen] = useState<boolean>(true);

  const handleSyncLiveTime = () => {
    const now = new Date();
    const currentLiveSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    setCurrentTimeSeconds(currentLiveSeconds);
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
  const [showServicesVenice, setShowServicesVenice] = useState<boolean>(false);

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

  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<number>(200);
  const [selectedCategory, setSelectedCategory] = useState<TransportModeCategory | 'all'>('all');

  // Data collections
  const [cantieri, setCantieri] = useState<CantiereItem[]>(MOCK_CANTIERI);
  const [stops, setStops] = useState<StopItem[]>(MOCK_STOPS);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [ships, setShips] = useState<ShipItem[]>([]);
  const [moseGates, setMoseGates] = useState<MoseGateItem[]>([]);
  const [cpsmStations, setCpsmStations] = useState<any[]>([]);
  const [fountains, setFountains] = useState<CityAssetItem[]>([]);
  const [accessibleBridges, setAccessibleBridges] = useState<CityAssetItem[]>([]);
  const [veritasServices, setVeritasServices] = useState<CityAssetItem[]>([]);
  const [parkings, setParkings] = useState<ParkingItem[]>([]);
  const [airStations, setAirStations] = useState<AirQualityItem[]>([]);
  const [pedestrianFlows, setPedestrianFlows] = useState<PedestrianFlowItem[]>([]);
  const [alilagunaRoutes, setAlilagunaRoutes] = useState<AlilagunaRoute[]>([]);
  const [alilagunaStops, setAlilagunaStops] = useState<AlilagunaStop[]>([]);
  const [alilagunaBoats, setAlilagunaBoats] = useState<AlilagunaBoat[]>([]);
  const [satellites, setSatellites] = useState<SatelliteItem[]>([]);
  const [passerelle, setPasserelle] = useState<PasserellaItem[]>([]);
  const [briccole, setBriccole] = useState<BriccolaSignalItem[]>([]);
  const [oceanStations, setOceanStations] = useState<OceanStationItem[]>([]);
  const [bathingWaters, setBathingWaters] = useState<BathingWaterItem[]>([]);
  const [trees, setTrees] = useState<UrbanTreeItem[]>([]);
  const [evCharging, setEvCharging] = useState<EvChargingItem[]>([]);
  const [wifiHotspots, setWifiHotspots] = useState<WifiHotspotItem[]>([]);

  // 17 New Open Data Collections
  const [canalSpeedLimits, setCanalSpeedLimits] = useState<CanalSpeedLimitItem[]>(OPEN_CANAL_SPEED_LIMITS);
  const [bridges, setBridges] = useState<BridgeClearanceItem[]>(OPEN_BRIDGE_CLEARANCES);
  const [gondolas, setGondolas] = useState<GondolaStationItem[]>(OPEN_GONDOLA_STATIONS);
  const [docks, setDocks] = useState<PublicDockItem[]>(OPEN_PUBLIC_DOCKS);
  const [subsidencePoints, setSubsidencePoints] = useState<SubsidenceInSARItem[]>(OPEN_SUBSIDENCE_INSAR);
  const [lagoonMorphology, setLagoonMorphology] = useState<LagoonMorphologyItem[]>(OPEN_LAGOON_MORPHOLOGY);
  const [marineWindStations, setMarineWindStations] = useState<MeteoMarineWindItem[]>(OPEN_METEO_MARINE_WIND);
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

  const [tideLevel, setTideLevel] = useState<number>(76);

  // Active selections & Modals
  const [selectedStop, setSelectedStop] = useState<StopItem | null>(null);
  const [selectedCantiere, setSelectedCantiere] = useState<CantiereItem | null>(null);
  const [selectedShip, setSelectedShip] = useState<ShipItem | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteItem | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<VeniceFeatureSelected | null>(null);
  const [isMoseModalOpen, setIsMoseModalOpen] = useState<boolean>(false);
  const [isAlilagunaModalOpen, setIsAlilagunaModalOpen] = useState<boolean>(false);
  const [isSpatialModalOpen, setIsSpatialModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isAirportModalOpen, setIsAirportModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Check onboarding tutorial completion on first load
  useEffect(() => {
    try {
      const completed = localStorage.getItem('vod_onboarding_completed');
      if (!completed) {
        setIsTutorialOpen(true);
      }
    } catch {
      // In private browsing or non-window contexts
    }
  }, []);

  const turnAllLayers = (active: boolean) => {
    setShowRoutes(active);
    setShowStops(active);
    setShowVehicles(active);
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
    setShowServicesVenice(active);
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
  };

  const applyPreset = (preset: MapPresetType) => {
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
    } else if (preset === 'city') {
      setShowCityAssets(true);
      setShowTrees(true);
      setShowServicesVenice(true);
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
    } else if (preset === 'satellites') {
      setShowSatellites(true);
      setShowSubsidence(true);
      setShowHeatIslands(true);
    }
  };

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

    // Fetch Tide and MOSE data
    fetch('/api/tide')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.data?.livelloCm !== undefined) setTideLevel(data.data.livelloCm);
          if (data.moseGates) setMoseGates(data.moseGates);
          if (data.stations) setCpsmStations(data.stations);
        }
      })
      .catch((err) => console.warn('Using fallback tide:', err));

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
        if (data.success && data.airStations) setAirStations(data.airStations);
      })
      .catch((err) => console.warn('Using fallback environment:', err));

    // Fetch Pedestrian Flows (Smart Control Room)
    fetch('/api/pedestrian-flows')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pedestrianFlows) setPedestrianFlows(data.pedestrianFlows);
      })
      .catch((err) => console.warn('Using fallback pedestrian flows:', err));

    // Fetch Flights and refresh periodically
    const loadFlights = () => {
      fetch('/api/flights')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) setFlights(data.data);
        })
        .catch((err) => console.warn('Using fallback flights:', err));
    };

    loadFlights();
    const flightInterval = setInterval(loadFlights, 12000);

    // Fetch Alilaguna (Transitland feed f-u20f-alilagunaspa)
    const loadAlilaguna = () => {
      fetch('/api/alilaguna')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.routes) setAlilagunaRoutes(data.routes);
            if (data.stops) setAlilagunaStops(data.stops);
            if (data.boats) setAlilagunaBoats(data.boats);
          }
        })
        .catch((err) => console.warn('Using fallback alilaguna:', err));
    };

    loadAlilaguna();
    const alilagunaInterval = setInterval(loadAlilaguna, 8000);

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

    // 1. Waterways & Canals (Speed limits, bridges, gondolas, docks)
    fetch('/api/waterways')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.canalSpeedLimits) setCanalSpeedLimits(data.data.canalSpeedLimits);
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
          if (data.data.marineWindStations) setMarineWindStations(data.data.marineWindStations);
        }
      })
      .catch((err) => console.warn('Using fallback lagoon morphology:', err));

    // 3. Rail & Logistics (Viaggiatreno/RFI trains, Veritas waste boats)
    fetch('/api/rail-logistics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.liveTrains) setLiveTrains(data.data.liveTrains);
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
          if (data.data.daeList) setDaeList(data.data.daeList);
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

    return () => {
      clearInterval(flightInterval);
      clearInterval(alilagunaInterval);
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

  // Simulation loop ticker: synced to exact real-time wall-clock when isLiveSynced is true
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let frameId: number;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (isPlaying) {
        if (isLiveSynced && speed === 1) {
          const d = new Date();
          const exactSec = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
          setCurrentTimeSeconds(exactSec);
        } else {
          setCurrentTimeSeconds((prev) => (prev + dt * speed) % 86400);
        }
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
        activeVehiclesCount={302}
        activeCantieriCount={cantieri.filter((c) => c.stato === 'In corso').length}
        tideLevel={tideLevel}
        activeShipsCount={ships.length}
        activeFlightsCount={flights.length}
        activeSatellitesCount={satellites.length}
      />

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapEngine
          currentTimeSeconds={currentTimeSeconds}
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
          cantieri={cantieri}
          stops={stops}
          showAlilaguna={showAlilaguna}
          alilagunaRoutes={alilagunaRoutes}
          alilagunaStops={alilagunaStops}
          alilagunaBoats={alilagunaBoats}
          onSelectAlilaguna={() => setIsAlilagunaModalOpen(true)}
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
          showServicesVenice={showServicesVenice}
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
          tideLevel={tideLevel}
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
              showVehicles={showVehicles}
              onToggleVehicles={() => setShowVehicles((p) => !p)}
              showAlilaguna={showAlilaguna}
              onToggleAlilaguna={() => setShowAlilaguna((p) => !p)}
              alilagunaBoatsCount={alilagunaBoats.length}
              showCantieri={showCantieri}
              onToggleCantieri={() => setShowCantieri((p) => !p)}
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
              showServicesVenice={showServicesVenice}
              onToggleServicesVenice={() => setShowServicesVenice((p) => !p)}
              servicesVeniceCount={evCharging.length + wifiHotspots.length}
              showCityAssets={showCityAssets}
              onToggleCityAssets={() => setShowCityAssets((p) => !p)}
              showParkings={showParkings}
              onToggleParkings={() => setShowParkings((p) => !p)}
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
              title="Apri Livelli & Filtri"
            >
              <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold">Livelli & Filtri</span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">40</span>
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
                showVehicles={showVehicles}
                onToggleVehicles={() => setShowVehicles((p) => !p)}
                showAlilaguna={showAlilaguna}
                onToggleAlilaguna={() => setShowAlilaguna((p) => !p)}
                alilagunaBoatsCount={alilagunaBoats.length}
                showCantieri={showCantieri}
                onToggleCantieri={() => setShowCantieri((p) => !p)}
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
                showServicesVenice={showServicesVenice}
                onToggleServicesVenice={() => setShowServicesVenice((p) => !p)}
                servicesVeniceCount={evCharging.length + wifiHotspots.length}
                showCityAssets={showCityAssets}
                onToggleCityAssets={() => setShowCityAssets((p) => !p)}
                showParkings={showParkings}
                onToggleParkings={() => setShowParkings((p) => !p)}
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
              ? 'left-1/2 -translate-x-1/2 md:left-[calc(50%+9.5rem)] xl:md:left-[calc(50%+10.5rem)] md:-translate-x-1/2 max-w-4xl md:max-w-[calc(100vw-21rem)] lg:max-w-3xl xl:max-w-4xl'
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
            totalActiveVehicles={302}
            peakCount={348}
            peakTime="07:45"
            onSyncLiveTime={handleSyncLiveTime}
            isLiveSynced={isLiveSynced}
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

      <VeniceFeatureDetailModal
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        currentTideLevelCm={tideLevel}
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
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onSelectPreset={applyPreset}
      />
    </main>
  );
}
