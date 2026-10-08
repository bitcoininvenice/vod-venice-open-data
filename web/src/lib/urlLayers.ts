export type LayerKey =
  | 'showRoutes'
  | 'showStops'
  | 'showVehicles'
  | 'showRealtimeVehicles'
  | 'showCantieri'
  | 'showSpatialBuffer'
  | 'showFlights'
  | 'showShips'
  | 'showShipRoutes'
  | 'showMose'
  | 'showCityAssets'
  | 'showParkings'
  | 'showAirQuality'
  | 'showPedestrianFlows'
  | 'showAlilaguna'
  | 'showSatellites'
  | 'showPasserelle'
  | 'showMarineSignals'
  | 'showOceanStations'
  | 'showBathingWaters'
  | 'showTrees'
  | 'showWifiHotspots'
  | 'showEvCharging'
  | 'showCameras'
  | 'showCanalLimits'
  | 'showBridges'
  | 'showGondolas'
  | 'showDocks'
  | 'showSubsidence'
  | 'showMorphology'
  | 'showMarineWind'
  | 'showTrains'
  | 'showWasteBoats'
  | 'showNizioleti'
  | 'showWells'
  | 'showBellTowers'
  | 'showFortresses'
  | 'showEmergencyDocks'
  | 'showDae'
  | 'showPharmacies'
  | 'showHeatIslands'
  | 'showLagoonWater'
  | 'showAccommodations'
  | 'showBikeRoutes'
  | 'showPollenStations'
  | 'showTributaries';

/**
 * Mapping from LayerKey to canonical Open Data catalog slug (matching /layers page IDs)
 */
export const LAYER_SLUG_BY_KEY: Record<LayerKey, string> = {
  showRoutes: 'rotte_actv',
  showStops: 'fermate_actv',
  showVehicles: 'vaporetti_live',
  showRealtimeVehicles: 'vaporetti_realtime',
  showCantieri: 'cantieri',
  showSpatialBuffer: 'buffer_spaziale',
  showFlights: 'voli_vce',
  showShips: 'navi_ais',
  showShipRoutes: 'rotte_marittime',
  showMose: 'mose',
  showCityAssets: 'fontanelle_ponti',
  showParkings: 'parcheggi',
  showAirQuality: 'qualita_aria',
  showPedestrianFlows: 'flussi_pedonali',
  showAlilaguna: 'alilaguna',
  showSatellites: 'satelliti_copernicus',
  showPasserelle: 'passerelle',
  showMarineSignals: 'briccole',
  showOceanStations: 'piattaforma_cnr',
  showBathingWaters: 'acque_balneazione',
  showTrees: 'verde_urbano',
  showWifiHotspots: 'wifi_hotspots',
  showEvCharging: 'colonnine_ev',
  showCameras: 'telecamere_webcam',
  showCanalLimits: 'limiti_velocita',
  showBridges: 'franchi_ponti',
  showGondolas: 'gondole',
  showDocks: 'rive_merci',
  showSubsidence: 'subsidenza_insar',
  showMorphology: 'morfologia_barene',
  showMarineWind: 'stazioni_vento',
  showTrains: 'treni_ponte',
  showWasteBoats: 'battelli_veritas',
  showNizioleti: 'nizioleti',
  showWells: 'vere_da_pozzo',
  showBellTowers: 'campanili_pendenti',
  showFortresses: 'fortezze_lagunari',
  showEmergencyDocks: 'idroambulanze',
  showDae: 'dae_pubblici',
  showPharmacies: 'farmacie_turno',
  showHeatIslands: 'isole_calore',
  showLagoonWater: 'sonde_arpav',
  showAccommodations: 'strutture_ricettive',
  showBikeRoutes: 'ciclovie_veneto',
  showPollenStations: 'pollini_arpav',
  showTributaries: 'fiumi_tributari',
};

/**
 * Mapping of canonical slugs AND user-friendly aliases back to LayerKey
 */
export const SLUG_TO_LAYER_KEY: Record<string, LayerKey> = {
  // Canonical IDs
  rotte_actv: 'showRoutes',
  fermate_actv: 'showStops',
  vaporetti_live: 'showVehicles',
  vaporetti_realtime: 'showRealtimeVehicles',
  cantieri: 'showCantieri',
  buffer_spaziale: 'showSpatialBuffer',
  voli_vce: 'showFlights',
  navi_ais: 'showShips',
  rotte_marittime: 'showShipRoutes',
  mose: 'showMose',
  fontanelle_ponti: 'showCityAssets',
  parcheggi: 'showParkings',
  qualita_aria: 'showAirQuality',
  flussi_pedonali: 'showPedestrianFlows',
  alilaguna: 'showAlilaguna',
  satelliti_copernicus: 'showSatellites',
  passerelle: 'showPasserelle',
  briccole: 'showMarineSignals',
  piattaforma_cnr: 'showOceanStations',
  acque_balneazione: 'showBathingWaters',
  verde_urbano: 'showTrees',
  wifi_hotspots: 'showWifiHotspots',
  colonnine_ev: 'showEvCharging',
  telecamere_webcam: 'showCameras',
  limiti_velocita: 'showCanalLimits',
  franchi_ponti: 'showBridges',
  gondole: 'showGondolas',
  rive_merci: 'showDocks',
  subsidenza_insar: 'showSubsidence',
  morfologia_barene: 'showMorphology',
  stazioni_vento: 'showMarineWind',
  treni_ponte: 'showTrains',
  battelli_veritas: 'showWasteBoats',
  nizioleti: 'showNizioleti',
  vere_da_pozzo: 'showWells',
  campanili_pendenti: 'showBellTowers',
  fortezze_lagunari: 'showFortresses',
  idroambulanze: 'showEmergencyDocks',
  dae_pubblici: 'showDae',
  farmacie_turno: 'showPharmacies',
  isole_calore: 'showHeatIslands',
  sonde_arpav: 'showLagoonWater',
  strutture_ricettive: 'showAccommodations',
  ciclovie_veneto: 'showBikeRoutes',
  pollini_arpav: 'showPollenStations',
  fiumi_tributari: 'showTributaries',

  // Convenient aliases
  fountains: 'showCityAssets',
  fontanelle: 'showCityAssets',
  servizi: 'showCityAssets',
  city_assets: 'showCityAssets',
  wifi: 'showWifiHotspots',
  hotspots: 'showWifiHotspots',
  ev: 'showEvCharging',
  colonnine: 'showEvCharging',
  charging: 'showEvCharging',
  vaporetti: 'showVehicles',
  actv: 'showVehicles',
  vehicles: 'showVehicles',
  routes: 'showRoutes',
  rotte: 'showRoutes',
  stops: 'showStops',
  fermate: 'showStops',
  flights: 'showFlights',
  voli: 'showFlights',
  ships: 'showShips',
  navi: 'showShips',
  trees: 'showTrees',
  alberi: 'showTrees',
  cameras: 'showCameras',
  telecamere: 'showCameras',
  webcam: 'showCameras',
  bridges: 'showBridges',
  ponti: 'showBridges',
  satellites: 'showSatellites',
  satelliti: 'showSatellites',
  air: 'showAirQuality',
  aria: 'showAirQuality',
  parking: 'showParkings',
  pedonali: 'showPedestrianFlows',
  flows: 'showPedestrianFlows',
  trains: 'showTrains',
  treni: 'showTrains',
  waste: 'showWasteBoats',
  veritas: 'showWasteBoats',
  wells: 'showWells',
  pozzi: 'showWells',
  bell_towers: 'showBellTowers',
  campanili: 'showBellTowers',
  dae: 'showDae',
  pharmacies: 'showPharmacies',
  farmacie: 'showPharmacies',
  heat: 'showHeatIslands',
  calore: 'showHeatIslands',
  bike: 'showBikeRoutes',
  bici: 'showBikeRoutes',
  tributaries: 'showTributaries',
  tributari: 'showTributaries',
  suem: 'showEmergencyDocks',
};

export const ALL_LAYER_KEYS: LayerKey[] = Object.keys(LAYER_SLUG_BY_KEY) as LayerKey[];

export interface ParsedLayerParams {
  activeLayers: Partial<Record<LayerKey, boolean>>;
  hasLayerParams: boolean;
  preset: string | null;
}

/**
 * Parses query string (?layers=all, ?layers=fountains,wifi or ?layer=fountains or ?preset=mobility)
 */
export function parseLayerParams(search: string): ParsedLayerParams {
  const result: ParsedLayerParams = {
    activeLayers: {},
    hasLayerParams: false,
    preset: null,
  };

  if (!search) return result;

  const clean = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(clean);

  // Check preset
  const presetParam = params.get('preset');
  if (presetParam) {
    result.preset = presetParam.toLowerCase().trim();
  }

  // Check layers or layer param
  const rawLayers = params.get('layers') || params.get('layer');
  if (rawLayers) {
    const tokens = rawLayers.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    // If 'all' or 'tutti' is specified, activate all known layers
    if (tokens.includes('all') || tokens.includes('tutti')) {
      for (const key of ALL_LAYER_KEYS) {
        result.activeLayers[key] = true;
      }
      result.hasLayerParams = true;
      return result;
    }

    for (const token of tokens) {
      const layerKey = SLUG_TO_LAYER_KEY[token];
      if (layerKey) {
        result.activeLayers[layerKey] = true;
        result.hasLayerParams = true;
      }
    }
  }

  return result;
}

/**
 * Builds a comma-separated slug string from active LayerKey states.
 * If all layers are active, returns 'all' for clean and compact URLs.
 */
export function buildLayersParam(activeLayers: Partial<Record<LayerKey, boolean>>): string {
  const activeKeys = ALL_LAYER_KEYS.filter((key) => activeLayers[key]);

  if (activeKeys.length === 0) {
    return '';
  }

  // Se tutti i livelli sono selezionati, l'URL usa la forma compatta ?layers=all
  if (activeKeys.length === ALL_LAYER_KEYS.length) {
    return 'all';
  }

  const slugs: string[] = [];
  for (const key of activeKeys) {
    const slug = LAYER_SLUG_BY_KEY[key];
    if (slug && !slugs.includes(slug)) {
      slugs.push(slug);
    }
  }
  return slugs.join(',');
}

/**
 * Constructs a full shareable URL with the active layer slugs
 */
export function buildShareUrl(
  activeLayers: Partial<Record<LayerKey, boolean>>,
  baseUrl?: string
): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const slugString = buildLayersParam(activeLayers);

  if (!slugString) {
    return base;
  }

  return `${base}?layers=${slugString}`;
}
