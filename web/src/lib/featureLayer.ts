import type { LayerKey } from '@/lib/urlLayers';
import type { VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';

/** Layer della mappa da cui proviene ciascun tipo di scheda (usato da schede e analytics). */
export const FEATURE_LAYER: Record<Exclude<VeniceFeatureSelected['type'], 'civicPoi' | 'civicNumber'>, LayerKey> = {
  passerella: 'showPasserelle', briccola: 'showMarineSignals', oceanStation: 'showOceanStations',
  bathingWater: 'showBathingWaters', urbanTree: 'showTrees', evCharging: 'showEvCharging',
  wifiHotspot: 'showWifiHotspots', speedLimit: 'showCanalLimits', bridgeClearance: 'showBridges',
  gondolaStation: 'showGondolas', publicDock: 'showDocks', subsidence: 'showSubsidence',
  lagoonMorphology: 'showMorphology', marineWind: 'showMarineWind', trainLive: 'showTrains',
  wasteBoat: 'showWasteBoats', nizioleto: 'showNizioleti', veniceWell: 'showWells', bellTower: 'showBellTowers',
  fortressIsland: 'showFortresses', emergencyDock: 'showEmergencyDocks', publicDae: 'showDae',
  pharmacy: 'showPharmacies', heatIsland: 'showHeatIslands', lagoonWater: 'showLagoonWater', lagoonCurrent: 'showLagoonCurrents',
  accommodation: 'showAccommodations', bikeRoute: 'showBikeRoutes', pollenStation: 'showPollenStations',
  tributaryRiver: 'showTributaries', parking: 'showParkings', fountain: 'showCityAssets', fiberCell: 'showFiber',
  airStation: 'showAirQuality', lagoonMarker: 'showMarineSignals', canal: 'showCanals', bdapWork: 'showBdapWorks', loraGateway: 'showLoraGateways', wifiVenue: 'showWifiVenues', sportPlace: 'showSports', nauticalPlace: 'showNautical', parkPlace: 'showParks', ordinance: 'showOrdinances',
};

export function featureLayer(feature: VeniceFeatureSelected): LayerKey | undefined {
  if (feature.type === 'civicNumber') return undefined;
  if (feature.type === 'civicPoi') return feature.data.kind === 'recycling' ? 'showRecyclingCentres' : 'showLibraries';
  return FEATURE_LAYER[feature.type];
}
