import { track } from '@vercel/analytics';
import { LAYER_SLUG_BY_KEY, type LayerKey } from '@/lib/urlLayers';
import type { VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';
import type { MapObjectSelected } from '@/components/MapObjectPanel';

export function toLayerSlug(layer: LayerKey | string): string {
  if (layer in LAYER_SLUG_BY_KEY) {
    return LAYER_SLUG_BY_KEY[layer as LayerKey];
  }
  return layer;
}

const FEATURE_TO_LAYER_KEY: Record<Exclude<VeniceFeatureSelected['type'], 'civicPoi' | 'civicNumber'>, LayerKey> = {
  passerella: 'showPasserelle',
  briccola: 'showMarineSignals',
  oceanStation: 'showOceanStations',
  bathingWater: 'showBathingWaters',
  urbanTree: 'showTrees',
  evCharging: 'showEvCharging',
  wifiHotspot: 'showWifiHotspots',
  speedLimit: 'showCanalLimits',
  bridgeClearance: 'showBridges',
  gondolaStation: 'showGondolas',
  publicDock: 'showDocks',
  subsidence: 'showSubsidence',
  lagoonMorphology: 'showMorphology',
  marineWind: 'showMarineWind',
  trainLive: 'showTrains',
  wasteBoat: 'showWasteBoats',
  nizioleto: 'showNizioleti',
  veniceWell: 'showWells',
  bellTower: 'showBellTowers',
  fortressIsland: 'showFortresses',
  emergencyDock: 'showEmergencyDocks',
  publicDae: 'showDae',
  pharmacy: 'showPharmacies',
  heatIsland: 'showHeatIslands',
  lagoonWater: 'showLagoonWater',
  accommodation: 'showAccommodations',
  bikeRoute: 'showBikeRoutes',
  pollenStation: 'showPollenStations',
  tributaryRiver: 'showTributaries',
  parking: 'showParkings',
  fountain: 'showCityAssets',
  fiberCell: 'showFiber',
  airStation: 'showAirQuality',
  lagoonMarker: 'showMarineSignals',
  canal: 'showCanals',
  bdapWork: 'showBdapWorks',
  loraGateway: 'showLoraGateways',
  wifiVenue: 'showWifiVenues',
  sportPlace: 'showSports',
  nauticalPlace: 'showNautical',
  parkPlace: 'showParks',
};

export function featureToLayerSlug(feature: VeniceFeatureSelected): string {
  if (feature.type === 'civicNumber') return 'civici';
  if (feature.type === 'civicPoi') return feature.data.kind === 'recycling' ? 'ecocentri' : 'biblioteche';
  const layerKey = FEATURE_TO_LAYER_KEY[feature.type];
  if (layerKey && LAYER_SLUG_BY_KEY[layerKey]) {
    return LAYER_SLUG_BY_KEY[layerKey];
  }
  return feature.type;
}

export function mapObjectToLayerSlug(object: MapObjectSelected): string {
  switch (object.type) {
    case 'ship':
      return 'navi_ais';
    case 'flight':
      return 'voli_vce';
    case 'vehicle':
      return object.data.source === 'gps' ? 'vaporetti_realtime' : 'vaporetti_live';
    case 'alilagunaBoat':
      return 'alilaguna';
  }
}

export function trackLayerToggle(layer: LayerKey | string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const slug = toLayerSlug(layer);
    track('layer_toggle', {
      layer_slug: slug,
      enabled: enabled ? '1' : '0',
    });
  } catch {
    // Non-blocking in dev or restricted environments
  }
}

export function trackLayerOpen(layer: LayerKey | string): void {
  if (typeof window === 'undefined') return;
  try {
    const slug = toLayerSlug(layer);
    track('layer_open', {
      layer_slug: slug,
    });
  } catch {
    // Non-blocking in dev or restricted environments
  }
}

export { track };
