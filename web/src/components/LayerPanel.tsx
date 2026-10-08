'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Construction,
  Anchor,
  Navigation,
  CircleDot,
  SlidersHorizontal,
  Plane,
  X,
  Ship,
  Waves,
  Droplets,
  Car,
  Wind,
  Footprints,
  Compass,
  Satellite,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trees,
  Wifi,
  Zap,
  LifeBuoy,
  ShieldAlert,
  Gauge,
  Train,
  Trash2,
  Landmark,
  Bell,
  HeartPulse,
  Pill,
  ThermometerSun,
  Building2,
  Bike,
  Flower2,
  GitBranch,
  Camera,
  Radio,
} from 'lucide-react';
import { TransportModeCategory } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface LayerPanelProps {
  onTurnAllOff?: () => void;
  onTurnAllOn?: () => void;
  onApplyPreset?: (preset: 'mobility' | 'lagoon' | 'city' | 'satellites' | 'regional' | 'clean' | 'all') => void;
  showRoutes: boolean;
  onToggleRoutes: () => void;
  showStops: boolean;
  onToggleStops: () => void;
  stopsCount?: number;
  showVehicles: boolean;
  onToggleVehicles: () => void;
  showRealtimeVehicles?: boolean;
  onToggleRealtimeVehicles?: () => void;
  realtimeVehiclesCount?: number;
  showCantieri: boolean;
  onToggleCantieri: () => void;
  cantieriCount?: number;
  showCameras?: boolean;
  onToggleCameras?: () => void;
  camerasCount?: number;
  liveWebcamsCount?: number;
  showFlights?: boolean;
  onToggleFlights?: () => void;
  flightsCount?: number;
  showShips: boolean;
  onToggleShips: () => void;
  shipsCount?: number;
  showShipRoutes?: boolean;
  onToggleShipRoutes?: () => void;
  showAlilaguna?: boolean;
  onToggleAlilaguna?: () => void;
  alilagunaBoatsCount?: number;
  showMose: boolean;
  onToggleMose: () => void;
  showPasserelle?: boolean;
  onTogglePasserelle?: () => void;
  passerelleCount?: number;
  showMarineSignals?: boolean;
  onToggleMarineSignals?: () => void;
  briccoleCount?: number;
  showOceanStations?: boolean;
  onToggleOceanStations?: () => void;
  oceanStationsCount?: number;
  showBathingWaters?: boolean;
  onToggleBathingWaters?: () => void;
  bathingWatersCount?: number;
  showTrees?: boolean;
  onToggleTrees?: () => void;
  treesCount?: number;
  showServicesVenice?: boolean;
  onToggleServicesVenice?: () => void;
  servicesVeniceCount?: number;
  showCityAssets: boolean;
  onToggleCityAssets: () => void;
  showParkings: boolean;
  onToggleParkings: () => void;
  parkingsCount?: number;
  showAirQuality: boolean;
  onToggleAirQuality: () => void;
  showPedestrianFlows: boolean;
  onTogglePedestrianFlows: () => void;
  showSatellites?: boolean;
  onToggleSatellites?: () => void;
  satellitesCount?: number;
  // 1. Viabilità Acquea & Canali
  showCanalLimits?: boolean;
  onToggleCanalLimits?: () => void;
  canalLimitsCount?: number;
  showBridges?: boolean;
  onToggleBridges?: () => void;
  bridgesCount?: number;
  showGondolas?: boolean;
  onToggleGondolas?: () => void;
  gondolasCount?: number;
  showDocks?: boolean;
  onToggleDocks?: () => void;
  docksCount?: number;
  // 2. Idrografia, Subsidenza & Morfologia
  showSubsidence?: boolean;
  onToggleSubsidence?: () => void;
  subsidenceCount?: number;
  showMorphology?: boolean;
  onToggleMorphology?: () => void;
  morphologyCount?: number;
  showMarineWind?: boolean;
  onToggleMarineWind?: () => void;
  marineWindCount?: number;
  // 3. Ferrovia & Logistica
  showTrains?: boolean;
  onToggleTrains?: () => void;
  trainsCount?: number;
  showWasteBoats?: boolean;
  onToggleWasteBoats?: () => void;
  wasteBoatsCount?: number;
  // 4. Patrimonio Storico & Nizioleti
  showNizioleti?: boolean;
  onToggleNizioleti?: () => void;
  nizioletiCount?: number;
  showWells?: boolean;
  onToggleWells?: () => void;
  wellsCount?: number;
  showBellTowers?: boolean;
  onToggleBellTowers?: () => void;
  bellTowersCount?: number;
  showFortresses?: boolean;
  onToggleFortresses?: () => void;
  fortressesCount?: number;
  // 5. Salute Pubblica & SUEM 118
  showEmergencyDocks?: boolean;
  onToggleEmergencyDocks?: () => void;
  emergencyDocksCount?: number;
  showDae?: boolean;
  onToggleDae?: () => void;
  daeCount?: number;
  showPharmacies?: boolean;
  onTogglePharmacies?: () => void;
  pharmaciesCount?: number;
  // 6. Microclima & Isole Calore
  showHeatIslands?: boolean;
  onToggleHeatIslands?: () => void;
  heatIslandsCount?: number;
  // 7. Open Data Regione Veneto (dati.veneto.it)
  showLagoonWater?: boolean;
  onToggleLagoonWater?: () => void;
  lagoonWaterCount?: number;
  showAccommodations?: boolean;
  onToggleAccommodations?: () => void;
  accommodationsCount?: number;
  showBikeRoutes?: boolean;
  onToggleBikeRoutes?: () => void;
  bikeRoutesCount?: number;
  showPollenStations?: boolean;
  onTogglePollenStations?: () => void;
  pollenStationsCount?: number;
  showTributaries?: boolean;
  onToggleTributaries?: () => void;
  tributariesCount?: number;
  showSpatialBuffer: boolean;
  onToggleSpatialBuffer: () => void;
  bufferRadiusMeters: number;
  onBufferRadiusChange: (radius: number) => void;
  selectedCategory: TransportModeCategory | 'all';
  onSelectCategory: (cat: TransportModeCategory | 'all') => void;
  categoryCounts: Record<string, number>;
  categoryColors: Record<string, string>;
  onClose?: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  onTurnAllOff,
  onTurnAllOn,
  onApplyPreset,
  showRoutes,
  onToggleRoutes,
  showStops,
  onToggleStops,
  stopsCount = 0,
  showVehicles,
  onToggleVehicles,
  showRealtimeVehicles = false,
  onToggleRealtimeVehicles,
  realtimeVehiclesCount = 0,
  showCantieri,
  onToggleCantieri,
  cantieriCount = 0,
  showCameras = false,
  onToggleCameras,
  camerasCount = 0,
  liveWebcamsCount = 0,
  showFlights = true,
  onToggleFlights,
  flightsCount = 0,
  showShips,
  onToggleShips,
  shipsCount = 0,
  showShipRoutes = true,
  onToggleShipRoutes,
  showAlilaguna = true,
  onToggleAlilaguna,
  alilagunaBoatsCount = 0,
  showMose,
  onToggleMose,
  showPasserelle = true,
  onTogglePasserelle,
  passerelleCount = 0,
  showMarineSignals = true,
  onToggleMarineSignals,
  briccoleCount = 0,
  showOceanStations = true,
  onToggleOceanStations,
  oceanStationsCount = 0,
  showBathingWaters = true,
  onToggleBathingWaters,
  bathingWatersCount = 0,
  showTrees = true,
  onToggleTrees,
  treesCount = 0,
  showServicesVenice = true,
  onToggleServicesVenice,
  servicesVeniceCount = 0,
  showCityAssets,
  onToggleCityAssets,
  showParkings,
  onToggleParkings,
  parkingsCount = 0,
  showAirQuality,
  onToggleAirQuality,
  showPedestrianFlows,
  onTogglePedestrianFlows,
  showSatellites = true,
  onToggleSatellites,
  satellitesCount = 0,
  showCanalLimits = false,
  onToggleCanalLimits,
  canalLimitsCount = 0,
  showBridges = false,
  onToggleBridges,
  bridgesCount = 0,
  showGondolas = false,
  onToggleGondolas,
  gondolasCount = 0,
  showDocks = false,
  onToggleDocks,
  docksCount = 0,
  showSubsidence = false,
  onToggleSubsidence,
  subsidenceCount = 0,
  showMorphology = false,
  onToggleMorphology,
  morphologyCount = 0,
  showMarineWind = false,
  onToggleMarineWind,
  marineWindCount = 0,
  showTrains = false,
  onToggleTrains,
  trainsCount = 0,
  showWasteBoats = false,
  onToggleWasteBoats,
  wasteBoatsCount = 0,
  showNizioleti = false,
  onToggleNizioleti,
  nizioletiCount = 0,
  showWells = false,
  onToggleWells,
  wellsCount = 0,
  showBellTowers = false,
  onToggleBellTowers,
  bellTowersCount = 0,
  showFortresses = false,
  onToggleFortresses,
  fortressesCount = 0,
  showEmergencyDocks = false,
  onToggleEmergencyDocks,
  emergencyDocksCount = 0,
  showDae = false,
  onToggleDae,
  daeCount = 0,
  showPharmacies = false,
  onTogglePharmacies,
  pharmaciesCount = 0,
  showHeatIslands = false,
  onToggleHeatIslands,
  heatIslandsCount = 0,
  showLagoonWater = false,
  onToggleLagoonWater,
  lagoonWaterCount = 0,
  showAccommodations = false,
  onToggleAccommodations,
  accommodationsCount = 0,
  showBikeRoutes = false,
  onToggleBikeRoutes,
  bikeRoutesCount = 0,
  showPollenStations = false,
  onTogglePollenStations,
  pollenStationsCount = 0,
  showTributaries = false,
  onToggleTributaries,
  tributariesCount = 0,
  showSpatialBuffer,
  onToggleSpatialBuffer,
  bufferRadiusMeters,
  onBufferRadiusChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoryColors,
  onClose
}) => {
  const { language, t } = useTranslation();
  const [sectionOpen, setSectionOpen] = useState({
    mobility: false,
    lagoon: false,
    city: false,
    actv: false
  });

  const presetContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (!presetContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = presetContainerRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollButtons]);

  const handleScrollPresets = (direction: 'left' | 'right') => {
    if (!presetContainerRef.current) return;
    const delta = direction === 'left' ? -100 : 100;
    presetContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 220);
  };

  const toggleSection = (section: keyof typeof sectionOpen) => {
    setSectionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const CATEGORIES: { key: TransportModeCategory; label: string }[] = [
    { key: 'vaporetto', label: 'Vaporetto' },
    { key: 'motoscafo', label: language === 'it' ? 'Motoscafo' : 'Motorboat' },
    { key: 'motonave', label: language === 'it' ? 'Motonave' : 'Motorship' },
    { key: 'ferry', label: 'Ferry-boat' },
    { key: 'tram', label: 'Tram T1/T2' },
    { key: 'bus', label: language === 'it' ? 'Bus Terraferma' : 'Mainland Bus' },
    { key: 'island', label: language === 'it' ? 'Bus Isole' : 'Island Bus' },
  ];

  return (
    <aside className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col gap-3.5 max-h-[calc(100vh-13.5rem)] overflow-y-auto">
      {/* Mobile grab handle */}
      <div className="w-10 h-1 bg-[var(--rule)]/80 rounded-full mx-auto md:hidden" />

      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            {t('layers.panelTitle')}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            title={t('layers.hidePanel')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex flex-col gap-2 pb-2.5 border-b border-[var(--rule)]">
        <div className="flex items-center justify-between gap-1.5 text-xs">
          {onTurnAllOff && (
            <button
              type="button"
              onClick={() => {
                onTurnAllOff();
                setSectionOpen({ mobility: false, lagoon: false, city: false, actv: false });
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title={language === 'it' ? 'Disattiva tutti i livelli per una mappa pulita' : 'Turn off all layers for a clean map'}
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('layers.presetClean')}</span>
            </button>
          )}
          {onTurnAllOn && (
            <button
              type="button"
              onClick={() => {
                onTurnAllOn();
                setSectionOpen({ mobility: true, lagoon: true, city: true, actv: false });
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[11px] flex items-center justify-center gap-1.5 border border-cyan-500/20 transition-all cursor-pointer"
              title={language === 'it' ? 'Attiva tutti i livelli contemporaneamente' : 'Turn on all layers simultaneously'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('layers.presetAll')}</span>
            </button>
          )}
        </div>

        {onApplyPreset && (
          <div className="flex items-center gap-1 pt-0.5 w-full relative">
            <span className="text-[10px] text-[var(--ink-3)] font-mono uppercase shrink-0 font-semibold select-none">
              {language === 'it' ? 'Preset:' : 'Presets:'}
            </span>

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollPresets('left')}
                className="p-1 rounded-md bg-[var(--rule)]/70 hover:bg-cyan-500/20 text-[var(--ink-2)] hover:text-cyan-400 border border-[var(--rule)] transition-all cursor-pointer shrink-0 shadow-sm active:scale-90"
                title={language === 'it' ? 'Scorri preset a sinistra' : 'Scroll presets left'}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}

            <div
              ref={presetContainerRef}
              onScroll={updateScrollButtons}
              onWheel={(e) => {
                if (e.deltaY !== 0 && presetContainerRef.current) {
                  presetContainerRef.current.scrollLeft += e.deltaY;
                  updateScrollButtons();
                }
              }}
              className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('mobility');
                  setSectionOpen({ mobility: true, lagoon: false, city: false, actv: false });
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--rule)]/30 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-[10px] font-mono whitespace-nowrap border border-[var(--rule)] hover:border-sky-500/30 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <Navigation className="w-3 h-3" />
                <span>{t('layers.presetMobility')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('lagoon');
                  setSectionOpen({ mobility: false, lagoon: true, city: false, actv: false });
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--rule)]/30 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-[10px] font-mono whitespace-nowrap border border-[var(--rule)] hover:border-blue-500/30 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <Waves className="w-3 h-3" />
                <span>{t('layers.presetLagoon')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('city');
                  setSectionOpen({ mobility: false, lagoon: false, city: true, actv: false });
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--rule)]/30 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono whitespace-nowrap border border-[var(--rule)] hover:border-emerald-500/30 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <Landmark className="w-3 h-3" />
                <span>{t('layers.presetCity')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('satellites');
                  setSectionOpen({ mobility: false, lagoon: false, city: true, actv: false });
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--rule)]/30 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-[10px] font-mono whitespace-nowrap border border-[var(--rule)] hover:border-purple-500/30 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <Satellite className="w-3 h-3" />
                <span>{t('layers.presetSatellites')}</span>
              </button>
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollPresets('right')}
                className="p-1 rounded-md bg-[var(--rule)]/70 hover:bg-cyan-500/20 text-[var(--ink-2)] hover:text-cyan-400 border border-[var(--rule)] transition-all cursor-pointer shrink-0 shadow-sm active:scale-90"
                title={language === 'it' ? 'Scorri preset a destra' : 'Scroll presets right'}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1: Mobilità & Trasporti */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleSection('mobility')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Ship className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('layers.catMobility')}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] lowercase">
              {[showVehicles, showRealtimeVehicles, showRoutes, showStops, showShips, showShipRoutes, showAlilaguna, showFlights, showParkings, showCanalLimits, showBridges, showGondolas, showDocks, showTrains, showWasteBoats, showBikeRoutes].filter(Boolean).length}/16
            </span>
            {sectionOpen.mobility ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {sectionOpen.mobility && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {/* 1. Vehicles */}
            <button
              type="button"
              onClick={onToggleVehicles}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showVehicles
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5" />
                <span>{t('layers.layerVaporetti')}</span>
              </div>
              {showVehicles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* 1b. Posizioni reali GTFS-RT */}
            {onToggleRealtimeVehicles && (
              <button
                type="button"
                onClick={onToggleRealtimeVehicles}
                aria-pressed={showRealtimeVehicles}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showRealtimeVehicles
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('layers.layerRealtimeVehicles')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {showRealtimeVehicles && realtimeVehiclesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {realtimeVehiclesCount}
                    </span>
                  )}
                  {showRealtimeVehicles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* 2. Routes (Shapes) */}
            <button
              type="button"
              onClick={onToggleRoutes}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showRoutes
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <CircleDot className="w-3.5 h-3.5" />
                <span>{t('layers.layerRoutes')}</span>
              </div>
              {showRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* 3. Stops */}
            <button
              type="button"
              onClick={onToggleStops}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showStops
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5" />
                <span>{t('layers.layerStops')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {stopsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {stopsCount}
                  </span>
                )}
                {showStops ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* 4. Ships & Cruise Vessels (Tronchetto / Marittima AIS) */}
            <button
              type="button"
              onClick={onToggleShips}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showShips
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Ship className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('layers.layerShips')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {shipsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    {shipsCount}
                  </span>
                )}
                {showShips ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* 4b. Maritime Navigational Routes */}
            {onToggleShipRoutes && (
              <button
                type="button"
                onClick={onToggleShipRoutes}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showShipRoutes
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'it' ? 'Rotte & Canali Marittimi' : 'Maritime Shipping Routes'}</span>
                </div>
                {showShipRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* 4c. Alilaguna S.p.A. Transitland Feed */}
            {onToggleAlilaguna && (
              <button
                type="button"
                onClick={onToggleAlilaguna}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showAlilaguna
                    ? 'bg-blue-600/15 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerAlilaguna')}</span>
                    <span className="text-[9px] font-mono text-cyan-400">GTFS f-u20f-alilagunaspa</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {alilagunaBoatsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                      {alilagunaBoatsCount}
                    </span>
                  )}
                  {showAlilaguna ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* 5. Airplanes / ADS-B Flights */}
            {onToggleFlights && (
              <button
                type="button"
                onClick={onToggleFlights}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showFlights
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('layers.layerFlights')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {flightsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {flightsCount}
                    </span>
                  )}
                  {showFlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* 6. Parkings Live (Piazzale Roma, Tronchetto & Terraferma) */}
            <button
              type="button"
              onClick={onToggleParkings}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showParkings
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('layers.layerParkings')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {parkingsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                    {parkingsCount}
                  </span>
                )}
                {showParkings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Limiti Velocità & Barcavelox */}
            {onToggleCanalLimits && (
              <button
                type="button"
                onClick={onToggleCanalLimits}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showCanalLimits
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('layers.layerCanalLimits')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {canalLimitsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {canalLimitsCount}
                    </span>
                  )}
                  {showCanalLimits ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Franchi di Tiro Ponti vs Marea */}
            {onToggleBridges && (
              <button
                type="button"
                onClick={onToggleBridges}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showBridges
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('layers.layerBridgeClearance')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {bridgesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {bridgesCount}
                    </span>
                  )}
                  {showBridges ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Traghetti da Parada & Stazi Gondole */}
            {onToggleGondolas && (
              <button
                type="button"
                onClick={onToggleGondolas}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showGondolas
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t('layers.layerGondolas')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {gondolasCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                      {gondolasCount}
                    </span>
                  )}
                  {showGondolas ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Rive Merci & Taxi Acquei */}
            {onToggleDocks && (
              <button
                type="button"
                onClick={onToggleDocks}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showDocks
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Anchor className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('layers.layerPublicDocks')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {docksCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                      {docksCount}
                    </span>
                  )}
                  {showDocks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Treni Live Ponte della Libertà (RFI) */}
            {onToggleTrains && (
              <button
                type="button"
                onClick={onToggleTrains}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showTrains
                    ? 'bg-red-500/15 text-red-300 border-red-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Train className="w-3.5 h-3.5 text-red-400" />
                  <span>{t('layers.layerTrains')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {trainsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                      {trainsCount}
                    </span>
                  )}
                  {showTrains ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Battelli Raccolta Veritas */}
            {onToggleWasteBoats && (
              <button
                type="button"
                onClick={onToggleWasteBoats}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showWasteBoats
                    ? 'bg-lime-500/15 text-lime-300 border-lime-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-lime-400" />
                  <span>{t('layers.layerWasteBoats')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {wasteBoatsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-lime-500/20 text-lime-300 font-bold">
                      {wasteBoatsCount}
                    </span>
                  )}
                  {showWasteBoats ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Ciclovie Isole del Veneto (dati.veneto.it) */}
            {onToggleBikeRoutes && (
              <button
                type="button"
                onClick={onToggleBikeRoutes}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showBikeRoutes
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Bike className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerBikeRoutes')}</span>
                    <span className="text-[9px] font-mono text-teal-400">dati.veneto.it</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {bikeRoutesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {bikeRoutesCount}
                    </span>
                  )}
                  {showBikeRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: Laguna & Maree */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
        <button
          type="button"
          onClick={() => toggleSection('lagoon')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Waves className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('layers.catLagoon')}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] lowercase">
              {[showMose, showPasserelle, showMarineSignals, showOceanStations, showBathingWaters, showSubsidence, showMorphology, showMarineWind, showFortresses, showSpatialBuffer, showLagoonWater, showTributaries].filter(Boolean).length}/12
            </span>
            {sectionOpen.lagoon ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {sectionOpen.lagoon && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-150">
            {/* Barriere MOSE & Rete CPSM */}
            <button
              type="button"
              onClick={onToggleMose}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showMose
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('layers.layerMose')}</span>
              </div>
              {showMose ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Passerelle Acqua Alta CPSM */}
            {onTogglePasserelle && (
              <button
                type="button"
                onClick={onTogglePasserelle}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showPasserelle
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('layers.layerPasserelle')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passerelleCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {passerelleCount}
                    </span>
                  )}
                  {showPasserelle ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Briccole & Fanali Canale */}
            {onToggleMarineSignals && (
              <button
                type="button"
                onClick={onToggleMarineSignals}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showMarineSignals
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('layers.layerMarineSignals')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {briccoleCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {briccoleCount}
                    </span>
                  )}
                  {showMarineSignals ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Piattaforma CNR & Boe Ondametriche */}
            {onToggleOceanStations && (
              <button
                type="button"
                onClick={onToggleOceanStations}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showOceanStations
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('layers.layerOceanStations')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {oceanStationsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {oceanStationsCount}
                    </span>
                  )}
                  {showOceanStations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Spiagge & Acque Balneazione ARPAV */}
            {onToggleBathingWaters && (
              <button
                type="button"
                onClick={onToggleBathingWaters}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showBathingWaters
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('layers.layerBathingWaters')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {bathingWatersCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {bathingWatersCount}
                    </span>
                  )}
                  {showBathingWaters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Subsidenza InSAR (Copernicus EGMS) */}
            {onToggleSubsidence && (
              <button
                type="button"
                onClick={onToggleSubsidence}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showSubsidence
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('layers.layerSubsidence')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {subsidenceCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                      {subsidenceCount}
                    </span>
                  )}
                  {showSubsidence ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Morfologia Barene & Velme (Natura 2000) */}
            {onToggleMorphology && (
              <button
                type="button"
                onClick={onToggleMorphology}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showMorphology
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('layers.layerMorphology')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {morphologyCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {morphologyCount}
                    </span>
                  )}
                  {showMorphology ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Stazioni Vento Meteomarine (Scirocco/Bora) */}
            {onToggleMarineWind && (
              <button
                type="button"
                onClick={onToggleMarineWind}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showMarineWind
                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t('layers.layerMarineWind')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {marineWindCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                      {marineWindCount}
                    </span>
                  )}
                  {showMarineWind ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Fortezze Lagunari & Isole Storiche */}
            {onToggleFortresses && (
              <button
                type="button"
                onClick={onToggleFortresses}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showFortresses
                    ? 'bg-stone-500/15 text-stone-300 border-stone-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('layers.layerFortresses')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {fortressesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-500/20 text-stone-300 font-bold">
                      {fortressesCount}
                    </span>
                  )}
                  {showFortresses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Sonde Qualità Acque Lagunari ARPAV (dati.veneto.it) */}
            {onToggleLagoonWater && (
              <button
                type="button"
                onClick={onToggleLagoonWater}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showLagoonWater
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerLagoonWater')}</span>
                    <span className="text-[9px] font-mono text-teal-400">ARPAV · dati.veneto.it</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {lagoonWaterCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {lagoonWaterCount}
                    </span>
                  )}
                  {showLagoonWater ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Fiumi Immissari in Laguna (dati.veneto.it) */}
            {onToggleTributaries && (
              <button
                type="button"
                onClick={onToggleTributaries}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showTributaries
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerTributaries')}</span>
                    <span className="text-[9px] font-mono text-teal-400">dati.veneto.it</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {tributariesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {tributariesCount}
                    </span>
                  )}
                  {showTributaries ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Spatial Buffer PostGIS */}
            <div className="flex flex-col gap-1.5 bg-[var(--rule)]/30 p-2.5 rounded-xl border border-[var(--rule)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" /> {language === 'it' ? 'Buffer Spaziale Cantieri' : 'Worksite Spatial Buffer'}
                </span>
                <button
                  type="button"
                  onClick={onToggleSpatialBuffer}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer ${showSpatialBuffer
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-[var(--rule)] text-[var(--ink-2)]'
                    }`}
                >
                  {showSpatialBuffer ? t('common.active') : t('common.inactive')}
                </button>
              </div>

              {showSpatialBuffer && (
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--ink-2)]">{language === 'it' ? 'Raggio impatto:' : 'Impact radius:'}</span>
                    <span className="font-mono font-bold text-amber-400">{bufferRadiusMeters} {t('common.meters')}</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={25}
                    value={bufferRadiusMeters}
                    onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
                    className="w-full h-1.5"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Città & Ambiente */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
        <button
          type="button"
          onClick={() => toggleSection('city')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('layers.catCity')}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] lowercase">
              {[showCantieri, showCameras, showCityAssets, showTrees, showServicesVenice, showAirQuality, showPedestrianFlows, showSatellites, showNizioleti, showWells, showBellTowers, showEmergencyDocks, showDae, showPharmacies, showHeatIslands, showAccommodations, showPollenStations].filter(Boolean).length}/17
            </span>
            {sectionOpen.city ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {sectionOpen.city && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {/* Cantieri */}
            <button
              type="button"
              onClick={onToggleCantieri}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showCantieri
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Construction className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('layers.layerCantieri')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {cantieriCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {cantieriCount}
                  </span>
                )}
                {showCantieri ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Telecamere & Webcam (Anopticon + Live Webcams) */}
            {onToggleCameras && (
              <button
                type="button"
                onClick={onToggleCameras}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showCameras
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerCameras')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {camerasCount > 0 && (
                    <div className="flex items-center gap-1">
                      {liveWebcamsCount > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          {liveWebcamsCount} live
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-500/20 text-slate-300 font-bold">
                        {camerasCount}
                      </span>
                    </div>
                  )}
                  {showCameras ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Fontanelle & Ponti Accessibili */}
            <button
              type="button"
              onClick={onToggleCityAssets}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showCityAssets
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('layers.layerCityAssets')}</span>
              </div>
              {showCityAssets ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Verde Urbano & Alberi Monumentali */}
            {onToggleTrees && (
              <button
                type="button"
                onClick={onToggleTrees}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showTrees
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('layers.layerTrees')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {treesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {treesCount}
                    </span>
                  )}
                  {showTrees ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Ricarica EV & Wi-Fi VeniceConnected */}
            {onToggleServicesVenice && (
              <button
                type="button"
                onClick={onToggleServicesVenice}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showServicesVenice
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('layers.layerServicesVenice')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {servicesVeniceCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {servicesVeniceCount}
                    </span>
                  )}
                  {showServicesVenice ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Qualità Aria ARPAV */}
            <button
              type="button"
              onClick={onToggleAirQuality}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showAirQuality
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('layers.layerAirQuality')}</span>
              </div>
              {showAirQuality ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Flussi Pedonali Smart Control Room */}
            <button
              type="button"
              onClick={onTogglePedestrianFlows}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showPedestrianFlows
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Footprints className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('layers.layerPedestrianFlows')}</span>
              </div>
              {showPedestrianFlows ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Satelliti & Radar SAR (Copernicus / ASI) */}
            <button
              type="button"
              onClick={onToggleSatellites}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showSatellites
                  ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
            >
              <div className="flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>{t('layers.layerSatellites')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {satellitesCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300">
                    {satellitesCount}
                  </span>
                )}
                {showSatellites ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* I Nizioleti & Civici Tradizionali */}
            {onToggleNizioleti && (
              <button
                type="button"
                onClick={onToggleNizioleti}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showNizioleti
                    ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{t('layers.layerNizioleti')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {nizioletiCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-700 text-neutral-200 font-bold">
                      {nizioletiCount}
                    </span>
                  )}
                  {showNizioleti ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Vere da Pozzo Storiche */}
            {onToggleWells && (
              <button
                type="button"
                onClick={onToggleWells}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showWells
                    ? 'bg-amber-600/15 text-amber-300 border-amber-600/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('layers.layerWells')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {wellsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {wellsCount}
                    </span>
                  )}
                  {showWells ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Campanili & Torri Pendenti */}
            {onToggleBellTowers && (
              <button
                type="button"
                onClick={onToggleBellTowers}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showBellTowers
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('layers.layerBellTowers')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {bellTowersCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                      {bellTowersCount}
                    </span>
                  )}
                  {showBellTowers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Pontili Idroambulanze SUEM 118 */}
            {onToggleEmergencyDocks && (
              <button
                type="button"
                onClick={onToggleEmergencyDocks}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showEmergencyDocks
                    ? 'bg-red-500/15 text-red-300 border-red-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                  <span>{t('layers.layerEmergencyDocks')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {emergencyDocksCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                      {emergencyDocksCount}
                    </span>
                  )}
                  {showEmergencyDocks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Defibrillatori Pubblici DAE H24 */}
            {onToggleDae && (
              <button
                type="button"
                onClick={onToggleDae}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showDae
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('layers.layerDae')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {daeCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {daeCount}
                    </span>
                  )}
                  {showDae ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Farmacie di Turno Live */}
            {onTogglePharmacies && (
              <button
                type="button"
                onClick={onTogglePharmacies}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showPharmacies
                    ? 'bg-green-500/15 text-green-300 border-green-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-green-400" />
                  <span>{t('layers.layerPharmacies')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pharmaciesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-green-500/20 text-green-300 font-bold">
                      {pharmaciesCount}
                    </span>
                  )}
                  {showPharmacies ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Isole di Calore & LST Satellitare */}
            {onToggleHeatIslands && (
              <button
                type="button"
                onClick={onToggleHeatIslands}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showHeatIslands
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ThermometerSun className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('layers.layerHeatIslands')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {heatIslandsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                      {heatIslandsCount}
                    </span>
                  )}
                  {showHeatIslands ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Pressione Turistica & Alloggi (dati.veneto.it) */}
            {onToggleAccommodations && (
              <button
                type="button"
                onClick={onToggleAccommodations}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showAccommodations
                    ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerAccommodations')}</span>
                    <span className="text-[9px] font-mono text-teal-400">dati.veneto.it</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {accommodationsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold">
                      {accommodationsCount}
                    </span>
                  )}
                  {showAccommodations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Bollettino Pollini ARPAV (dati.veneto.it) */}
            {onTogglePollenStations && (
              <button
                type="button"
                onClick={onTogglePollenStations}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${showPollenStations
                    ? 'bg-lime-500/15 text-lime-300 border-lime-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Flower2 className="w-3.5 h-3.5 text-lime-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{t('layers.layerPollenStations')}</span>
                    <span className="text-[9px] font-mono text-teal-400">ARPAV · dati.veneto.it</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {pollenStationsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-lime-500/20 text-lime-300 font-bold">
                      {pollenStationsCount}
                    </span>
                  )}
                  {showPollenStations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 4: Filtri Mezzi ACTV (Visibile solo se il layer Flotta ACTV Live è attivo) */}
      {showVehicles && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
          <button
            type="button"
            onClick={() => toggleSection('actv')}
            className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'it' ? 'Flotta ACTV per Tipo' : 'ACTV Fleet by Vessel Type'}</span>
            </span>
            {sectionOpen.actv ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.actv && (
            <div className="flex flex-col gap-1 animate-in fade-in duration-150">
              {selectedCategory !== 'all' && (
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    {language === 'it' ? 'Mostra tutti i tipi' : 'Show all types'}
                  </button>
                </div>
              )}
              {CATEGORIES.map((c) => {
                const count = categoryCounts[c.key] || 0;
                const color = categoryColors[c.key] || '#5cc8ff';
                const isSelected = selectedCategory === c.key;

                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? 'all' : c.key)}
                    className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${isSelected
                        ? 'bg-[var(--rule)] text-[var(--ink)] font-bold ring-1 ring-cyan-500'
                        : 'text-[var(--ink-2)] hover:bg-[var(--rule)]/50 hover:text-[var(--ink)]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span>{c.label}</span>
                    </div>
                    <span className="font-mono text-[11px] tabular text-[var(--ink-3)]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
