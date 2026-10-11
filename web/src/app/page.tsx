'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { MapEngine } from '@/components/MapEngine';
import { TimelineControls } from '@/components/TimelineControls';
import { LayerPanel } from '@/components/LayerPanel';
import { buildLayersParam, buildShareUrl, type LayerKey } from '@/lib/urlLayers';
import { allLayers, countActiveLayers, DEFAULT_PRESET, initialLayersFromSearch, makeLayerSetters, presetLayers, type LayerVisibility, type MapPreset } from '@/lib/layerState';
import { copyToClipboard } from '@/lib/dataExport';
import { layerCounts as countLayerItems, neededResources } from '@/lib/cityData';
import { useCityData } from '@/lib/useCityData';
import { StopDetailModal } from '@/components/StopDetailModal';
import { CantiereDetailModal } from '@/components/CantiereDetailModal';
import { MapObjectPanel, type MapObjectSelected } from '@/components/MapObjectPanel';
import { TripPlannerPanel, type PickTarget } from '@/components/TripPlannerPanel';
import type { Itinerary, PlannerPoint } from '@/lib/tripPlanner';
import type { SportFilter } from '@/lib/sports';
import { ActiveLayersLegend } from '@/components/ActiveLayersLegend';
import type { VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';
import type { SearchResultItem } from '@/components/GlobalSearchModal';
import { Layers, Waves, X, Play, Pause, Plus, Minus } from 'lucide-react';
import { getFloodedGroundPercentage } from '@/lib/flood';
import { isLocated, type CameraViewPreset, type PaletteTheme, type DayType, type TransportModeCategory, type StopItem, type CantiereItem, type SatelliteItem, type VeniceCameraItem } from '@/lib/types';
import { NOTTE, CARTA, getDynamicPalette, isDaylightTheme } from '@/lib/solar';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { useTranslation } from '@/lib/i18n';
import { romeDayType, romeSecondsOfDay, formatSignedCm } from '@/lib/time';
import { activeTripsAt, activeTripsByCategory, dayActivity } from '@/lib/gtfsActivity';
import { useSimulation } from '@/lib/simulationModel';
import { simClock } from '@/lib/simClock';
import { readPreference, usePreference, writePreference, THEME_PREFERENCE_KEY } from '@/lib/localPreference';
import { track } from '@vercel/analytics';
import { trackLayerToggle, trackLayerOpen, featureToLayerSlug, mapObjectToLayerSlug } from '@/lib/analytics';

// Finestre e schede meno frequenti: il loro codice si scarica solo quando si aprono
const SpatialAnalysisModal = dynamic(() => import('@/components/SpatialAnalysisModal').then((m) => m.SpatialAnalysisModal));
const AirportDetailModal = dynamic(() => import('@/components/AirportDetailModal').then((m) => m.AirportDetailModal));
const MoseDetailModal = dynamic(() => import('@/components/MoseDetailModal').then((m) => m.MoseDetailModal));
const AlilagunaDetailModal = dynamic(() => import('@/components/AlilagunaDetailModal').then((m) => m.AlilagunaDetailModal));
const SatelliteDetailModal = dynamic(() => import('@/components/SatelliteDetailModal').then((m) => m.SatelliteDetailModal));
const CameraDetailModal = dynamic(() => import('@/components/CameraDetailModal').then((m) => m.CameraDetailModal));
const OnboardingTutorialModal = dynamic(() => import('@/components/OnboardingTutorialModal').then((m) => m.OnboardingTutorialModal));
const TideFloodModal = dynamic(() => import('@/components/TideFloodModal').then((m) => m.TideFloodModal));
const DataExportModal = dynamic(() => import('@/components/DataExportModal').then((m) => m.DataExportModal));
const VeniceFeatureDetailModal = dynamic(() => import('@/components/VeniceFeatureDetailModal').then((m) => m.VeniceFeatureDetailModal));
const GlobalSearchModal = dynamic(() => import('@/components/GlobalSearchModal').then((m) => m.GlobalSearchModal));

const ONBOARDING_KEY = 'vod_onboarding_completed';


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
  const { showRoutes, showVehicles, showMose, showAlilaguna, showPasserelle } = layers;
  const { setShowPasserelle } = useMemo(() => makeLayerSetters(setLayers), []);

  // 1. Viabilità Acquea & Canali
  // 2. Idrografia, Subsidenza & Morfologia
  // 3. Ferrovia & Logistica
  // 4. Patrimonio Storico & Nizioleti
  // 5. Salute Pubblica & SUEM 118
  // 6. Microclima & Isole Calore
  // 7. Open Data Regione Veneto (dati.veneto.it)

  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<number>(200);
  const [selectedCategory, setSelectedCategory] = useState<TransportModeCategory | 'all'>('all');

  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  // Flotta Alilaguna dall'orario GTFS ufficiale, sincronizzata con l'ora della simulazione
  const alilagunaBoats = useMemo(() => getScheduledAlilagunaBoats(currentTimeSeconds), [currentTimeSeconds]);

  // Active selections & Modals
  const [selectedStop, setSelectedStop] = useState<StopItem | null>(null);
  const [selectedCantiere, setSelectedCantiere] = useState<CantiereItem | null>(null);
  const [selectedObject, setSelectedObject] = useState<MapObjectSelected | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteItem | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<VeniceFeatureSelected | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<VeniceCameraItem | null>(null);
  const [isMoseModalOpen, setIsMoseModalOpen] = useState<boolean>(false);
  const [isAlilagunaModalOpen, setIsAlilagunaModalOpen] = useState<boolean>(false);
  const [isSpatialModalOpen, setIsSpatialModalOpen] = useState<boolean>(false);
  const [isAirportModalOpen, setIsAirportModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isTideModalOpen, setIsTideModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [simulatedTideLevel, setSimulatedTideLevel] = useState<number | null>(null);
  const [isTideCyclePlaying, setIsTideCyclePlaying] = useState<boolean>(false);
  const [isMoseProtected, setIsMoseProtected] = useState<boolean>(true);

  useEffect(() => {
    if (!isTideCyclePlaying) return;
    const interval = setInterval(() => {
      // Ciclo sinusoidale fluido tra +75 cm e +195 cm (include gli estremi storici del 2019 e 1966)
      const val = Math.round(75 + 120 * ((1 - Math.cos(Date.now() / 2800)) / 2));
      setSimulatedTideLevel(val);
    }, 60);
    return () => clearInterval(interval);
  }, [isTideCyclePlaying]);

  // Dati della mappa: ogni API parte solo quando serve (livello acceso, ricerca, esportazione, schede),
  // le statiche una volta per sessione, quelle live con aggiornamento periodico (vedi lib/cityData.ts)
  const needs = useMemo(
    () =>
      neededResources(layers, {
        lists: isSearchOpen || isExportModalOpen,
        alilagunaModal: isAlilagunaModalOpen,
        airportModal: isAirportModalOpen,
        tideModal: isTideModalOpen,
        tideSimulated: simulatedTideLevel !== null,
      }),
    [layers, isSearchOpen, isExportModalOpen, isAlilagunaModalOpen, isAirportModalOpen, isTideModalOpen, simulatedTideLevel]
  );
  const data = useCityData(needs);
  const locatedCantieri = useMemo(() => data.cantieri.filter(isLocated), [data.cantieri]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K for Global Search
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

  // Scheda informativa unica: aprirne una chiude le altre
  const clearDetails = useCallback(() => {
    setSelectedStop(null);
    setSelectedCantiere(null);
    setSelectedSatellite(null);
    setSelectedFeature(null);
    setSelectedCamera(null);
    setSelectedObject(null);
    setIsAirportModalOpen(false);
    setIsMoseModalOpen(false);
    setIsAlilagunaModalOpen(false);
  }, []);
  // Trip planner: luoghi scelti, eventuale scelta di un punto sulla mappa, itinerario da disegnare
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerFrom, setPlannerFrom] = useState<PlannerPoint | null>(null);
  const [plannerTo, setPlannerTo] = useState<PlannerPoint | null>(null);
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const setPlannerPoint = useCallback((which: PickTarget, p: PlannerPoint | null) => (which === 'from' ? setPlannerFrom(p) : setPlannerTo(p)), []);
  const openPlanner = useCallback((to?: PlannerPoint) => {
    clearDetails();
    if (to) setPlannerTo(to);
    setIsPlannerOpen(true);
  }, [clearDetails]);

  const showDetail = useCallback((open: () => void) => {
    clearDetails();
    // una scheda e il planner occupano lo stesso spazio: il planner si chiude (i luoghi scelti restano)
    setIsPlannerOpen(false);
    open();
  }, [clearDetails]);

  // Center camera and focus element from search results
  const handleSelectSearchResult = useCallback((item: SearchResultItem) => {
    setFocusedCoordinates({ lat: item.lat, lon: item.lon });
    clearDetails();

    // Accende il layer del risultato (senza toccare gli altri)
    const key = item.layerKey;
    if (key) {
      setLayers((prev) => {
        if (!prev[key]) {
          trackLayerToggle(key, true);
          return { ...prev, [key]: true };
        }
        return prev;
      });
    }

    if (item.type === 'stop') {
      trackLayerOpen('fermate_actv');
      setSelectedStop(item.rawItem);
    } else if (item.type === 'cantiere') {
      trackLayerOpen('cantieri');
      setSelectedCantiere(item.rawItem);
    } else if (item.type === 'camera') {
      trackLayerOpen('telecamere_webcam');
      setSelectedCamera(item.rawItem);
    } else if (item.type === 'mose') {
      trackLayerOpen('mose');
      setIsMoseModalOpen(true);
    } else if (item.type === 'nizioleto') {
      trackLayerOpen('nizioleti');
      setSelectedFeature({ type: 'nizioleto', data: item.rawItem });
    } else if (item.type === 'well') {
      trackLayerOpen('vere_da_pozzo');
      setSelectedFeature({ type: 'veniceWell', data: item.rawItem });
    } else if (item.type === 'bell_tower') {
      trackLayerOpen('campanili_pendenti');
      setSelectedFeature({ type: 'bellTower', data: item.rawItem });
    } else if (item.type === 'pharmacy') {
      trackLayerOpen('farmacie');
      setSelectedFeature({ type: 'pharmacy', data: item.rawItem });
    } else if (item.type === 'dae') {
      trackLayerOpen('dae_pubblici');
      setSelectedFeature({ type: 'publicDae', data: item.rawItem });
    } else if (item.type === 'emergency_dock') {
      trackLayerOpen('idroambulanze');
      setSelectedFeature({ type: 'emergencyDock', data: item.rawItem });
    } else if (item.type === 'fountain') {
      trackLayerOpen('fontanelle_ponti');
      setSelectedFeature({ type: 'fountain', data: item.rawItem });
    } else if (item.type === 'parking') {
      trackLayerOpen('parcheggi');
      setSelectedFeature({ type: 'parking', data: item.rawItem });
    } else if (item.type === 'civico') {
      trackLayerOpen('civici');
      setSelectedFeature({ type: 'civicNumber', data: item.rawItem });
    }
  }, [clearDetails]);

  // Tutorial mostrato alla prima visita: lato server si assume già visto per evitare un flash
  const onboardingDone = usePreference(ONBOARDING_KEY, 'true') !== null;
  const showTutorial = isTutorialOpen || !onboardingDone;
  const closeTutorial = () => {
    writePreference(ONBOARDING_KEY, 'true');
    setIsTutorialOpen(false);
  };

  const toggleLayer = useCallback((key: LayerKey) => {
    setLayers((prev) => {
      const next = !prev[key];
      trackLayerToggle(key, next);
      return { ...prev, [key]: next };
    });
  }, []);

  const setLayerGroup = useCallback(
    (keys: LayerKey[], active: boolean) => {
      setLayers((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, active])) }));
      for (const k of keys) {
        trackLayerToggle(k, active);
      }
    },
    []
  );

  const applyPreset = useCallback((preset: MapPreset) => {
    setLayers(presetLayers(preset));
    if (typeof window !== 'undefined') {
      try {
        track('preset_apply', { preset });
      } catch {}
    }
  }, []);

  // Track initial mount load from URL
  const hasLoadedUrlParamsRef = useRef(false);

  // Stato iniziale dei layer dall'URL (?layers= ha la precedenza su ?preset=);
  // alla prima visita, senza indicazioni nell'URL, si parte dal preset predefinito
  useEffect(() => {
    const initial = initialLayersFromSearch(window.location.search);
    if (initial?.preset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura una tantum dell'URL dopo l'idratazione
      applyPreset(initial.preset);
    } else if (initial) {
      setLayers(initial.layers);
    } else if (readPreference(ONBOARDING_KEY) === null) {
      applyPreset(DEFAULT_PRESET);
    }
    // ?open=… apre uno strumento (link «Prova» della pagina /features); ?q= precompila la ricerca
    const params = new URLSearchParams(window.location.search);
    const tool = params.get('open');
    if (tool) {
      // chi arriva da un link diretto a uno strumento non vede il tutorial sopra lo strumento
      writePreference(ONBOARDING_KEY, 'true');
      if (tool === 'planner') openPlanner();
      else if (tool === 'tide') {
        trackLayerOpen('marea');
        setIsTideModalOpen(true);
      }
      else if (tool === 'export') setIsExportModalOpen(true);
      else if (tool === 'spatial') setIsSpatialModalOpen(true);
      else if (tool === 'tutorial') setIsTutorialOpen(true);
      else if (tool === 'search') {
        setSearchInitialQuery(params.get('q')?.slice(0, 60) ?? '');
        setIsSearchOpen(true);
      }
    }
    hasLoadedUrlParamsRef.current = true;
  }, [applyPreset, openPlanner]);

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
    // lo strumento aperto da un link non resta nell'URL condiviso
    url.searchParams.delete('open');
    url.searchParams.delete('q');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [layers]);

  // Copia negli appunti l'URL con i layer attivi; l'esito è mostrato dal pulsante
  const handleShare = useCallback(() => copyToClipboard(buildShareUrl(layers)), [layers]);

  // Conteggio dei layer attualmente attivi per abilitare il bottone di condivisione
  const activeLayersCount = useMemo(() => countActiveLayers(layers), [layers]);

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
    // Testi, bordi e fondo dell'interfaccia seguono il tema chiaro/scuro (valori in globals.css), non la
    // palette sfumata della mappa: nelle ore di passaggio (alba, ora d'oro) il testo sfumato su pannelli
    // già scuri o ancora chiari risultava illeggibile. La mappa usa la palette dinamica direttamente.
    for (const v of ['--ground', '--ink', '--ink-2', '--ink-3', '--rule']) root.style.removeProperty(v);

    root.style.setProperty('--c-vaporetto', pal.cats.vaporetto);
    root.style.setProperty('--c-motoscafo', pal.cats.motoscafo);
    root.style.setProperty('--c-motonave', pal.cats.motonave);
    root.style.setProperty('--c-ferry', pal.cats.ferry);
    root.style.setProperty('--c-tram', pal.cats.tram);
    root.style.setProperty('--c-bus', pal.cats.bus);
    root.style.setProperty('--c-island', pal.cats.island);
  }, [paletteTheme, currentTimeSeconds]);

  // Ticker della simulazione: avanza simClock a ogni frame (letto dalla mappa) e aggiorna lo stato
  // React una volta al secondo a velocità reale, al massimo 4 volte al secondo alle altre velocità.
  // In modalità live segue l'ora e il giorno reali di Venezia.
  const lastTimeRef = useRef<number>(0);
  const lastCommitRef = useRef<number>(0);
  const lastSecondRef = useRef<number>(-1);
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

      // A velocità reale l'ora mostrata cambia una volta al secondo: si aggiorna lo stato (e quindi
      // la pagina) solo al cambio del secondo intero; alle velocità più alte 4 volte al secondo.
      const t = simClock.get();
      const due = speed === 1 ? Math.floor(t) !== lastSecondRef.current : now - lastCommitRef.current >= 250;
      if (due) {
        lastCommitRef.current = now;
        lastSecondRef.current = Math.floor(t);
        setCurrentTimeSecondsState(speed === 1 ? Math.floor(t) : t);
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
  // Corse ACTV in servizio per tipo di mezzo (ricalcolate una volta al minuto)
  // La simulazione da orario (circa 220 KB compressi) si scarica solo con mezzi o rotte ACTV accesi
  const simulation = useSimulation(showVehicles || showRoutes);
  const currentMinute = Math.floor(currentTimeSeconds / 60);
  const categoryCounts = useMemo(
    () => (simulation ? activeTripsByCategory(selectedDay, currentMinute * 60 + 30) : {}),
    [simulation, selectedDay, currentMinute]
  );

  // Elementi caricati per layer, mostrati nel pannello accanto ai layer accesi
  const layerCounts = useMemo(
    () => countLayerItems(data, { scheduledVehicles: Object.values(categoryCounts).reduce((a, b) => a + b, 0), alilagunaBoats: alilagunaBoats.length }),
    [data, categoryCounts, alilagunaBoats]
  );
  const liveWebcamsCount = useMemo(() => data.cameras.filter((c) => c.hasLiveFeed).length, [data.cameras]);

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
        onOpenTripPlanner={() => openPlanner()}
        onOpenTideModal={() => {
          trackLayerOpen('marea');
          setIsTideModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        activeCantieriCount={locatedCantieri.length}
        tideLevel={data.tideLevel}
        tideObservedAt={data.tideInfo.observedAt}
        tideTrend={data.tideInfo.trend}
      />

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapEngine
          layers={layers}
          data={data}
          selectedDay={selectedDay}
          paletteTheme={paletteTheme}
          currentView={currentView}
          bufferRadiusMeters={bufferRadiusMeters}
          selectedCategory={selectedCategory}
          alilagunaBoats={alilagunaBoats}
          onSelectAlilaguna={() => {
            trackLayerOpen('alilaguna');
            showDetail(() => setIsAlilagunaModalOpen(true));
          }}
          onSelectCamera={(c) => {
            trackLayerOpen('telecamere_webcam');
            showDetail(() => setSelectedCamera(c));
          }}
          onSelectSatellite={(sat) => {
            trackLayerOpen('satelliti_copernicus');
            showDetail(() => setSelectedSatellite(sat));
          }}
          onSelectFeature={(f) => {
            trackLayerOpen(featureToLayerSlug(f));
            showDetail(() => setSelectedFeature(f));
          }}
          onSelectStop={(st) => {
            trackLayerOpen('fermate_actv');
            showDetail(() => setSelectedStop(st));
          }}
          onSelectCantiere={(c) => {
            trackLayerOpen('cantieri');
            showDetail(() => setSelectedCantiere(c));
          }}
          onSelectAirport={() => {
            trackLayerOpen('voli_vce');
            showDetail(() => setIsAirportModalOpen(true));
          }}
          onSelectObject={(o) => {
            trackLayerOpen(mapObjectToLayerSlug(o));
            showDetail(() => setSelectedObject(o));
          }}
          onClearSelection={clearDetails}
          legend={<ActiveLayersLegend layers={layers} counts={layerCounts} onHideLayer={toggleLayer} />}
          selectedObject={selectedObject}
          selectedSatellite={selectedSatellite}
          onSelectMose={() => {
            trackLayerOpen('mose');
            showDetail(() => setIsMoseModalOpen(true));
          }}
          focusedCoordinates={focusedCoordinates}
          sportFilter={sportFilter}
          simulatedTideLevel={simulatedTideLevel}
          isMoseProtected={isMoseProtected}
          isDesktopLayerPanelOpen={isDesktopLayerPanelOpen}
          pickMode={pickTarget !== null}
          onPickPoint={(lon, lat) => {
            if (!pickTarget) return;
            setPlannerPoint(pickTarget, { lon, lat, label: t('ui.planner.mapPoint', { lat: lat.toFixed(5), lon: lon.toFixed(5) }) });
            setPickTarget(null);
          }}
          itinerary={isPlannerOpen ? itinerary : null}
          pin={
            selectedFeature?.type === 'civicNumber'
              ? { lat: selectedFeature.data.lat, lon: selectedFeature.data.lon, approximate: selectedFeature.data.match !== 'exact' }
              : null
          }
        />

        {/* Floating Simulated Tide Alert Pill on Map */}
        {simulatedTideLevel !== null && (
          <div className="absolute top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-16 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-xs font-mono shadow-2xl flex-wrap justify-between sm:justify-start max-w-full">
              <div className="flex items-center gap-1.5 shrink-0">
                <Waves className="w-4 h-4 text-cyan-400 motion-safe:animate-pulse shrink-0" />
                <span className="text-slate-300">
                  <span className="hidden sm:inline">{t('ui.floodModal.simPill')}: </span>
                  <strong className={simulatedTideLevel >= 110 ? 'text-rose-400' : 'text-cyan-300'}>
                    {formatSignedCm(simulatedTideLevel)}
                  </strong>
                  <span className="text-[10px] text-slate-400 ml-1 opacity-80 whitespace-nowrap">
                    {simulatedTideLevel >= 110 && isMoseProtected
                      ? `(~${getFloodedGroundPercentage(85)}% · MOSE)`
                      : `(~${getFloodedGroundPercentage(simulatedTideLevel)}%)`}
                  </span>
                </span>
              </div>

              {/* Controlli passo marea (-5 / +5 cm fino a +200 cm) */}
              <div className="flex items-center gap-1 border-l border-slate-700/60 pl-1.5 sm:pl-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsTideCyclePlaying(false);
                    setSimulatedTideLevel((prev) => Math.max(50, (prev ?? 80) - 5));
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer active:scale-95"
                  title="-5 cm"
                  aria-label="-5 cm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTideCyclePlaying(false);
                    setSimulatedTideLevel((prev) => Math.min(200, (prev ?? 80) + 5));
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer active:scale-95"
                  title="+5 cm"
                  aria-label="+5 cm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Riproduzione ciclo marea sinusoidale (aumento/diminuzione fluido) */}
              <button
                type="button"
                onClick={() => setIsTideCyclePlaying((p) => !p)}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border transition-colors cursor-pointer shrink-0 ${
                  isTideCyclePlaying
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
                title={isTideCyclePlaying ? 'Pausa ciclo sinusoidale' : 'Avvia ciclo marea'}
              >
                {isTideCyclePlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isTideCyclePlaying ? 'Pausa' : 'Ciclo'}</span>
              </button>

              {/* Toggle Difesa MOSE quando la marea supera la soglia di allerta (>= 110 cm) */}
              {simulatedTideLevel >= 110 && (
                <button
                  type="button"
                  onClick={() => setIsMoseProtected((p) => !p)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border transition-colors cursor-pointer shrink-0 ${
                    isMoseProtected
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                  }`}
                  title={
                    isMoseProtected
                      ? 'MOSE attivo: paratie alzate, laguna protetta a +85cm. Clicca per disattivare e vedere la citta allagata'
                      : 'MOSE disattivato: paratie abbassate, marea entra in citta. Clicca per attivare la difesa'
                  }
                >
                  {isMoseProtected ? 'MOSE: Difesa Attiva' : 'MOSE: Disattivato'}
                </button>
              )}

              <div className="flex items-center gap-1 ml-auto sm:ml-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTideModalOpen(true)}
                  className="px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer text-[10px] sm:text-[11px]"
                  title={t('ui.floodModal.simAdjustTitle')}
                >
                  {t('ui.floodModal.simAdjust')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTideCyclePlaying(false);
                    setSimulatedTideLevel(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t('ui.floodModal.simReset')}
                  aria-label={t('ui.floodModal.simReset')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Left: Desktop Layer & Filter Panel or Minimized Toggle */}
        {isDesktopLayerPanelOpen ? (
          <div className="hidden md:block absolute top-4 left-4 z-20 w-80 xl:w-84 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-200">
            <LayerPanel
              onClose={() => setIsDesktopLayerPanelOpen(false)}
              layers={layers}
              onToggleLayer={toggleLayer}
              onSetLayers={setLayerGroup}
              onApplyPreset={applyPreset}
              counts={layerCounts}
              sportFilter={sportFilter}
              onSportFilterChange={setSportFilter}
              liveWebcamsCount={liveWebcamsCount}
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
              {activeLayersCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono tabular">{activeLayersCount}</span>}
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
                onClose={() => setIsLayerPanelOpenMobile(false)}
                layers={layers}
                onToggleLayer={toggleLayer}
                onSetLayers={setLayerGroup}
                onApplyPreset={applyPreset}
                counts={layerCounts}
                sportFilter={sportFilter}
                onSportFilterChange={setSportFilter}
                liveWebcamsCount={liveWebcamsCount}
                bufferRadiusMeters={bufferRadiusMeters}
                onBufferRadiusChange={setBufferRadiusMeters}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categoryCounts={categoryCounts}
                categoryColors={activePalette.cats}
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
            actvTripsCount={simulation ? activeTripsAt(selectedDay, currentTimeSeconds) : undefined}
            alilagunaBoatsCount={alilagunaBoats.length}
            peakCount={simulation ? dayActivity(selectedDay).peakCount : undefined}
            peakTime={simulation ? dayActivity(selectedDay).peakTime : undefined}
            showTide={showMose || showPasserelle}
            tideLevel={data.tideLevel}
            airTemp={data.cityTemp}
            onSyncLiveTime={handleSyncLiveTime}
            isLiveSynced={isLiveSynced}
            onShare={handleShare}
            hasActiveLayers={activeLayersCount > 0}
            onOpenTideModal={() => {
              trackLayerOpen('marea');
              setIsTideModalOpen(true);
            }}
          />
        </div>
          {/* Scheda informativa unica (agganciata a destra su desktop, cassetto su mobile) */}
        <StopDetailModal
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
          currentTimeSeconds={currentTimeSeconds}
          onPlanTo={openPlanner}
        />

        <CantiereDetailModal
          cantiere={selectedCantiere}
          onClose={() => setSelectedCantiere(null)}
        />

        {isAirportModalOpen && (
          <AirportDetailModal
            isOpen={isAirportModalOpen}
            onClose={() => setIsAirportModalOpen(false)}
            flights={data.flights}
            metar={data.metarData}
          />
        )}

        <TripPlannerPanel
          open={isPlannerOpen}
          onClose={() => {
            setIsPlannerOpen(false);
            setPickTarget(null);
          }}
          from={plannerFrom}
          to={plannerTo}
          onChange={setPlannerPoint}
          onPick={(which) => setPickTarget((cur) => (cur === which ? null : which))}
          picking={pickTarget}
          onItinerary={setItinerary}
        />
        <MapObjectPanel
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
          onOpenAirport={() => {
            trackLayerOpen('voli_vce');
            showDetail(() => setIsAirportModalOpen(true));
          }}
          onOpenAlilaguna={() => {
            trackLayerOpen('alilaguna');
            showDetail(() => setIsAlilagunaModalOpen(true));
          }}
          timeSeconds={currentTimeSeconds}
        />

        {isMoseModalOpen && (
          <MoseDetailModal
            isOpen={isMoseModalOpen}
            onClose={() => setIsMoseModalOpen(false)}
            moseGates={data.moseGates}
            stations={data.cpsmStations}
            tideLevel={data.tideLevel}
            tideInfo={data.tideInfo}
          />
        )}

        {isAlilagunaModalOpen && (
          <AlilagunaDetailModal
            isOpen={isAlilagunaModalOpen}
            onClose={() => setIsAlilagunaModalOpen(false)}
            routes={data.alilagunaRoutes}
            stops={data.alilagunaStops}
            boats={alilagunaBoats}
          />
        )}

        {selectedSatellite && (
          <SatelliteDetailModal
            satellite={selectedSatellite}
            onClose={() => setSelectedSatellite(null)}
          />
        )}

        {selectedCamera && (
          <CameraDetailModal
            camera={selectedCamera}
            onClose={() => setSelectedCamera(null)}
          />
        )}

        {selectedFeature && (
          <VeniceFeatureDetailModal
            feature={selectedFeature}
            onClose={() => setSelectedFeature(null)}
            currentTideLevelCm={data.tideLevel ?? undefined}
            onPlanTo={openPlanner}
          />
        )}
      </div>

      {/* Finestre degli strumenti (centrate, modali) */}
      {isSpatialModalOpen && (
        <SpatialAnalysisModal
          isOpen={isSpatialModalOpen}
          onClose={() => setIsSpatialModalOpen(false)}
          onFocusLocation={(lat: number, lon: number) => setFocusedCoordinates({ lat, lon })}
        />
      )}

      {showTutorial && (
        <OnboardingTutorialModal
          isOpen={showTutorial}
          onClose={closeTutorial}
          onSelectPreset={applyPreset}
        />
      )}

      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchInitialQuery('');
          }}
          onSelectResult={handleSelectSearchResult}
          initialQuery={searchInitialQuery}
          data={data}
        />
      )}

      {isTideModalOpen && (
        <TideFloodModal
          isOpen={isTideModalOpen}
          onClose={() => setIsTideModalOpen(false)}
          liveTideLevel={data.tideLevel}
          onActivatePasserelle={() => {
            trackLayerToggle('showPasserelle', true);
            setShowPasserelle(true);
          }}
          simulatedTideLevel={simulatedTideLevel}
          onSimulatedTideChange={setSimulatedTideLevel}
          isMoseProtected={isMoseProtected}
          onToggleMoseProtection={() => setIsMoseProtected((p) => !p)}
          forecast={data.tideInfo.forecast}
          marineWindStations={data.marineWindStations}
        />
      )}

      {isExportModalOpen && (
        <DataExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={data}
        />
      )}
    </main>
  );
}
