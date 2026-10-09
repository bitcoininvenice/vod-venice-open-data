import type { Dispatch, SetStateAction } from 'react';
import { ALL_LAYER_KEYS, parseLayerParams, type LayerKey } from './urlLayers';

/** Visibilità di tutti i layer della mappa in un unico oggetto. */
export type LayerVisibility = Record<LayerKey, boolean>;

export type MapPreset = 'mobility' | 'lagoon' | 'city' | 'satellites' | 'regional' | 'clean' | 'all';

const MAP_PRESETS: readonly MapPreset[] = ['mobility', 'lagoon', 'city', 'satellites', 'regional', 'clean', 'all'];

export function isMapPreset(value: string | null | undefined): value is MapPreset {
  return !!value && (MAP_PRESETS as readonly string[]).includes(value);
}

export function allLayers(active: boolean): LayerVisibility {
  return Object.fromEntries(ALL_LAYER_KEYS.map((k) => [k, active])) as LayerVisibility;
}

export function layersFrom(active: Partial<Record<LayerKey, boolean>>): LayerVisibility {
  const v = allLayers(false);
  for (const k of ALL_LAYER_KEYS) if (active[k]) v[k] = true;
  return v;
}

export function countActiveLayers(v: LayerVisibility): number {
  return ALL_LAYER_KEYS.reduce((n, k) => n + (v[k] ? 1 : 0), 0);
}

/** Layer accesi da ciascun preset tematico (tutti gli altri restano spenti). */
const PRESET_LAYERS: Record<Exclude<MapPreset, 'clean' | 'all'>, LayerKey[]> = {
  mobility: [
    'showRoutes', 'showStops', 'showVehicles', 'showAlilaguna', 'showShips', 'showShipRoutes', 'showFlights',
    'showCanalLimits', 'showBridges', 'showGondolas', 'showDocks', 'showTrains', 'showWasteBoats',
    'showBikeRoutes', 'showEvCharging', 'showCameras',
  ],
  lagoon: [
    'showMose', 'showPasserelle', 'showMarineSignals', 'showOceanStations', 'showBathingWaters',
    'showSubsidence', 'showMorphology', 'showMarineWind', 'showFortresses', 'showLagoonWater', 'showTributaries',
  ],
  city: [
    'showCityAssets', 'showTrees', 'showWifiHotspots', 'showEvCharging', 'showCameras', 'showParkings',
    'showCantieri', 'showAirQuality', 'showPedestrianFlows', 'showNizioleti', 'showWells', 'showBellTowers',
    'showEmergencyDocks', 'showDae', 'showPharmacies', 'showHeatIslands', 'showAccommodations', 'showPollenStations',
    'showFiber',
  ],
  satellites: ['showSatellites', 'showSubsidence', 'showHeatIslands'],
  regional: ['showLagoonWater', 'showAccommodations', 'showBikeRoutes', 'showPollenStations', 'showTributaries'],
};

export function presetLayers(preset: MapPreset): LayerVisibility {
  if (preset === 'all') return allLayers(true);
  if (preset === 'clean') return allLayers(false);
  return layersFrom(Object.fromEntries(PRESET_LAYERS[preset].map((k) => [k, true])));
}

export type LayerSetters = {
  [K in LayerKey as `set${Capitalize<K>}`]: Dispatch<SetStateAction<boolean>>;
};

/** Setter per singolo layer con la stessa firma di useState (valore o funzione). */
export function makeLayerSetters(setLayers: Dispatch<SetStateAction<LayerVisibility>>): LayerSetters {
  const setters: Record<string, Dispatch<SetStateAction<boolean>>> = {};
  for (const key of ALL_LAYER_KEYS) {
    setters[`set${key[0].toUpperCase()}${key.slice(1)}`] = (action) =>
      setLayers((prev) => {
        const next = typeof action === 'function' ? action(prev[key]) : action;
        return next === prev[key] ? prev : { ...prev, [key]: next };
      });
  }
  return setters as LayerSetters;
}

/**
 * Stato iniziale dei layer dalla query string: ?layers= (o ?layer=) ha la precedenza su ?preset=;
 * un preset sconosciuto è ignorato. null se l'URL non indica nulla.
 */
export function initialLayersFromSearch(search: string): { layers: LayerVisibility; preset: MapPreset | null } | null {
  const parsed = parseLayerParams(search);
  if (parsed.hasLayerParams) return { layers: layersFrom(parsed.activeLayers), preset: null };
  if (isMapPreset(parsed.preset)) return { layers: presetLayers(parsed.preset), preset: parsed.preset };
  return null;
}
