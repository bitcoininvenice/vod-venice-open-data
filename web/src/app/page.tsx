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
  WifiHotspotItem
} from '@/lib/types';
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

  // Layer toggles
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [showVehicles, setShowVehicles] = useState<boolean>(true);
  const [showCantieri, setShowCantieri] = useState<boolean>(true);
  const [showSpatialBuffer, setShowSpatialBuffer] = useState<boolean>(true);
  const [showFlights, setShowFlights] = useState<boolean>(true);
  const [showShips, setShowShips] = useState<boolean>(true);
  const [showShipRoutes, setShowShipRoutes] = useState<boolean>(true);
  const [showMose, setShowMose] = useState<boolean>(true);
  const [showCityAssets, setShowCityAssets] = useState<boolean>(true);
  const [showParkings, setShowParkings] = useState<boolean>(true);
  const [showAirQuality, setShowAirQuality] = useState<boolean>(true);
  const [showPedestrianFlows, setShowPedestrianFlows] = useState<boolean>(true);
  const [showAlilaguna, setShowAlilaguna] = useState<boolean>(true);
  const [showSatellites, setShowSatellites] = useState<boolean>(true);
  const [showPasserelle, setShowPasserelle] = useState<boolean>(true);
  const [showMarineSignals, setShowMarineSignals] = useState<boolean>(true);
  const [showOceanStations, setShowOceanStations] = useState<boolean>(true);
  const [showBathingWaters, setShowBathingWaters] = useState<boolean>(true);
  const [showTrees, setShowTrees] = useState<boolean>(true);
  const [showServicesVenice, setShowServicesVenice] = useState<boolean>(true);
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
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

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

    return () => {
      clearInterval(flightInterval);
      clearInterval(alilagunaInterval);
    };
  }, []);

  // Update CSS Variables when palette changes
  useEffect(() => {
    let pal = NOTTE;
    if (paletteTheme === 'carta') pal = CARTA;
    else if (paletteTheme === 'dynamic') pal = getDynamicPalette(currentTimeSeconds);

    const root = document.documentElement;
    root.style.setProperty('--ground', pal.ground);
    root.style.setProperty('--water', pal.water);
    root.style.setProperty('--sea', pal.sea);
    root.style.setProperty('--land', pal.land);
    root.style.setProperty('--coast', pal.coast);
    root.style.setProperty('--ink', pal.ink);
    root.style.setProperty('--ink-2', pal.ink2);
    root.style.setProperty('--ink-3', pal.ink3);
    root.style.setProperty('--rule', pal.rule);
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
        onOpenLayers={() => setIsLayerPanelOpenMobile(true)}
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
        />

        {/* Floating Left: Desktop Layer & Filter Panel */}
        <div className="hidden md:block absolute top-4 left-4 z-20 w-80 max-w-[calc(100vw-2rem)]">
          <LayerPanel
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

        {/* Mobile Floating Action Button (FAB) to open Filters & Layers */}
        <div className="md:hidden absolute top-3 left-3 z-20">
          <button
            type="button"
            onClick={() => setIsLayerPanelOpenMobile(true)}
            className="glass-panel px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs text-[var(--ink)] flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-[11px]">Livelli & Filtri</span>
          </button>
        </div>

        {/* Mobile Bottom Sheet Drawer for LayerPanel */}
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
        <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-2 sm:px-4">
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
    </main>
  );
}
