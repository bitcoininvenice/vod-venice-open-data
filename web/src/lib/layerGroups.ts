/**
 * Struttura del pannello dei livelli: gruppi, sottogruppi e voci.
 * Ogni LayerKey compare una sola volta (verificato da layerGroups.test.ts);
 * la natura del dato arriva da LAYER_CATALOG tramite lo slug.
 */
import { LAYER_CATALOG, type LayerDocItem } from './layerCatalog';
import { LAYER_SLUG_BY_KEY, type LayerKey } from './urlLayers';

export type LayerRegime = LayerDocItem['regime'];
export type LayerGroupId = 'mobility' | 'lagoon' | 'city';

/** Colori delle voci: nomi chiusi perché Tailwind generi solo classi scritte per intero. */
export type LayerTone =
  | 'cyan' | 'emerald' | 'sky' | 'blue' | 'amber' | 'purple' | 'indigo' | 'red' | 'lime' | 'teal'
  | 'stone' | 'rose' | 'orange' | 'green' | 'violet' | 'neutral' | 'fuchsia';

export type LayerIconName =
  | 'navigation' | 'radio' | 'circleDot' | 'anchor' | 'waves' | 'gauge' | 'ship' | 'compass' | 'plane'
  | 'train' | 'trash' | 'car' | 'bike' | 'shieldAlert' | 'wind' | 'lifeBuoy' | 'trees' | 'layers'
  | 'droplets' | 'gitBranch' | 'flower' | 'thermometer' | 'pill' | 'heartPulse' | 'wifi' | 'cable'
  | 'recycle' | 'library' | 'zap' | 'construction' | 'sliders' | 'camera' | 'footprints' | 'landmark'
  | 'bell' | 'satellite' | 'building';

export interface LayerEntry {
  key: LayerKey;
  /** Percorso i18n dell'etichetta */
  label: string;
  icon: LayerIconName;
  tone: LayerTone;
}

export interface LayerSubgroup {
  id: string;
  label: string;
  icon: LayerIconName;
  tone: LayerTone;
  layers: LayerEntry[];
}

export interface LayerGroup {
  id: LayerGroupId;
  label: string;
  icon: LayerIconName;
  tone: LayerTone;
  subgroups: LayerSubgroup[];
}

const e = (key: LayerKey, label: string, icon: LayerIconName, tone: LayerTone): LayerEntry => ({ key, label, icon, tone });

export const LAYER_GROUPS: LayerGroup[] = [
  {
    id: 'mobility',
    label: 'layers.catMobility',
    icon: 'ship',
    tone: 'sky',
    subgroups: [
      {
        id: 'publicTransit', label: 'layers.subPublicTransit', icon: 'navigation', tone: 'cyan',
        layers: [
          e('showRealtimeVehicles', 'layers.layerRealtimeVehicles', 'radio', 'emerald'),
          e('showVehicles', 'layers.layerVaporetti', 'navigation', 'cyan'),
          e('showRoutes', 'layers.layerRoutes', 'circleDot', 'cyan'),
          e('showStops', 'layers.layerStops', 'anchor', 'cyan'),
          e('showAlilaguna', 'layers.layerAlilaguna', 'waves', 'blue'),
        ],
      },
      {
        id: 'canalTraffic', label: 'layers.subCanalTraffic', icon: 'gauge', tone: 'amber',
        layers: [
          e('showCanals', 'ui.layerPanel.canals', 'waves', 'sky'),
          e('showCanalLimits', 'layers.layerCanalLimits', 'gauge', 'amber'),
          e('showBridges', 'layers.layerBridgeClearance', 'navigation', 'cyan'),
          e('showGondolas', 'layers.layerGondolas', 'waves', 'purple'),
          e('showDocks', 'layers.layerPublicDocks', 'anchor', 'blue'),
        ],
      },
      {
        id: 'regionalLogistics', label: 'layers.subRegionalLogistics', icon: 'compass', tone: 'indigo',
        layers: [
          e('showShips', 'layers.layerShips', 'ship', 'indigo'),
          e('showShipRoutes', 'ui.layerPanel.rotteCanaliMarittimi', 'compass', 'amber'),
          e('showFlights', 'layers.layerFlights', 'plane', 'sky'),
          e('showTrains', 'layers.layerTrains', 'train', 'red'),
          e('showWasteBoats', 'layers.layerWasteBoats', 'trash', 'lime'),
        ],
      },
      {
        id: 'roadBike', label: 'layers.subRoadBike', icon: 'car', tone: 'teal',
        layers: [
          e('showParkings', 'layers.layerParkings', 'car', 'teal'),
          e('showBikeRoutes', 'layers.layerBikeRoutes', 'bike', 'emerald'),
        ],
      },
    ],
  },
  {
    id: 'lagoon',
    label: 'layers.catLagoon',
    icon: 'waves',
    tone: 'blue',
    subgroups: [
      {
        id: 'tideDefense', label: 'layers.subTideDefense', icon: 'waves', tone: 'blue',
        layers: [
          e('showMose', 'layers.layerMose', 'waves', 'blue'),
          e('showPasserelle', 'layers.layerPasserelle', 'shieldAlert', 'amber'),
        ],
      },
      {
        id: 'openSea', label: 'layers.subOpenSea', icon: 'compass', tone: 'cyan',
        layers: [
          e('showOceanStations', 'layers.layerOceanStations', 'compass', 'cyan'),
          e('showMarineWind', 'layers.layerMarineWind', 'wind', 'teal'),
          e('showBathingWaters', 'layers.layerBathingWaters', 'lifeBuoy', 'sky'),
        ],
      },
      {
        id: 'marineSignals', label: 'layers.subMarineSignals', icon: 'anchor', tone: 'emerald',
        layers: [
          e('showMarineSignals', 'layers.layerMarineSignals', 'anchor', 'emerald'),
          e('showFortresses', 'layers.layerFortresses', 'shieldAlert', 'stone'),
        ],
      },
      {
        id: 'morphologyWater', label: 'layers.subMorphologyWater', icon: 'gitBranch', tone: 'teal',
        layers: [
          e('showLagoonWater', 'layers.layerLagoonWater', 'droplets', 'cyan'),
          e('showMorphology', 'layers.layerMorphology', 'trees', 'emerald'),
          e('showSubsidence', 'layers.layerSubsidence', 'layers', 'rose'),
          e('showTributaries', 'layers.layerTributaries', 'gitBranch', 'sky'),
        ],
      },
      {
        id: 'environmentClimate', label: 'layers.subEnvironmentClimate', icon: 'trees', tone: 'emerald',
        layers: [
          e('showAirQuality', 'layers.layerAirQuality', 'wind', 'emerald'),
          e('showPollenStations', 'layers.layerPollenStations', 'flower', 'lime'),
          e('showTrees', 'layers.layerTrees', 'trees', 'emerald'),
          e('showHeatIslands', 'layers.layerHeatIslands', 'thermometer', 'orange'),
        ],
      },
    ],
  },
  {
    id: 'city',
    label: 'layers.catCity',
    icon: 'landmark',
    tone: 'emerald',
    subgroups: [
      {
        id: 'health', label: 'layers.subHealth', icon: 'heartPulse', tone: 'rose',
        layers: [
          e('showPharmacies', 'layers.layerPharmacies', 'pill', 'green'),
          e('showDae', 'layers.layerDae', 'heartPulse', 'emerald'),
          e('showEmergencyDocks', 'layers.layerEmergencyDocks', 'heartPulse', 'red'),
        ],
      },
      {
        id: 'cityServices', label: 'layers.subCityServices', icon: 'droplets', tone: 'cyan',
        layers: [
          e('showCityAssets', 'layers.layerCityAssets', 'droplets', 'cyan'),
          e('showWifiHotspots', 'layers.layerWifiHotspots', 'wifi', 'indigo'),
          e('showWifiVenues', 'ui.layerPanel.wifiVenues', 'wifi', 'teal'),
          e('showFiber', 'ui.layerPanel.fiber', 'cable', 'green'),
          e('showLoraGateways', 'ui.layerPanel.loraGateways', 'radio', 'violet'),
          e('showRecyclingCentres', 'ui.layerPanel.recyclingCentres', 'recycle', 'green'),
          e('showLibraries', 'ui.layerPanel.libraries', 'library', 'violet'),
          e('showEvCharging', 'layers.layerEvCharging', 'zap', 'amber'),
          e('showCameras', 'layers.layerCameras', 'camera', 'cyan'),
          e('showCantieri', 'layers.layerCantieri', 'construction', 'amber'),
          e('showBdapWorks', 'ui.layerPanel.bdapWorks', 'construction', 'orange'),
          e('showSpatialBuffer', 'ui.layerPanel.bufferSpazialeCantieri', 'sliders', 'amber'),
          e('showPedestrianFlows', 'layers.layerPedestrianFlows', 'footprints', 'rose'),
        ],
      },
      {
        id: 'heritage', label: 'layers.subHeritage', icon: 'landmark', tone: 'amber',
        layers: [
          e('showNizioleti', 'layers.layerNizioleti', 'landmark', 'neutral'),
          e('showWells', 'layers.layerWells', 'landmark', 'amber'),
          e('showBellTowers', 'layers.layerBellTowers', 'bell', 'orange'),
        ],
      },
      {
        id: 'territory', label: 'ui.layerPanel.subTerritory', icon: 'building', tone: 'fuchsia',
        layers: [
          e('showSatellites', 'layers.layerSatellites', 'satellite', 'fuchsia'),
          e('showAccommodations', 'layers.layerAccommodations', 'building', 'fuchsia'),
        ],
      },
    ],
  },
];

const REGIME_BY_SLUG = new Map(LAYER_CATALOG.map((l) => [l.id, l.regime]));
const CATALOG_BY_SLUG = new Map(LAYER_CATALOG.map((l) => [l.id, l]));

/** Natura del dato di un layer (live, simulato, dataset, da verificare). */
export function layerRegime(key: LayerKey): LayerRegime {
  return REGIME_BY_SLUG.get(LAYER_SLUG_BY_KEY[key]) ?? 'static';
}

export function isCuratedLayer(key: LayerKey): boolean {
  return layerRegime(key) === 'curated';
}

/** Tutte le voci, nell'ordine del pannello. */
export const LAYER_ENTRIES: LayerEntry[] = LAYER_GROUPS.flatMap((g) => g.subgroups.flatMap((s) => s.layers));

export const LAYER_ENTRY_BY_KEY = new Map(LAYER_ENTRIES.map((en) => [en.key, en]));

export function groupLayerKeys(group: LayerGroup): LayerKey[] {
  return group.subgroups.flatMap((s) => s.layers.map((l) => l.key));
}

/** Testo normalizzato per la ricerca: minuscole, senza accenti. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Vero se la voce corrisponde alla ricerca: etichetta tradotta, nomi IT/EN del catalogo,
 * istituzione e slug. Ogni parola della ricerca deve comparire.
 */
export function layerMatches(key: LayerKey, label: string, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const doc = CATALOG_BY_SLUG.get(LAYER_SLUG_BY_KEY[key]);
  const hay = normalizeSearch(
    [label, LAYER_SLUG_BY_KEY[key].replace(/_/g, ' '), doc?.nameIt, doc?.nameEn, doc?.institution].filter(Boolean).join(' ')
  );
  return q.split(/\s+/).every((w) => hay.includes(w));
}
