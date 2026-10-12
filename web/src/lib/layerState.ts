import type { Dispatch, SetStateAction } from 'react';
import { ALL_LAYER_KEYS, parseLayerParams, type LayerKey } from './urlLayers';

/** Visibilità di tutti i layer della mappa in un unico oggetto. */
export type LayerVisibility = Record<LayerKey, boolean>;

/**
 * Preset per scenario d'uso: pochi layer (3-6) per una domanda precisa.
 * Gli id sono anche i valori di ?preset= nell'URL.
 */
export type MapPreset = 'muoversi' | 'acqua-alta' | 'ambiente' | 'servizi' | 'citta' | 'clean';

/** Preset mostrati nell'interfaccia, in ordine. */
export const SCENARIO_PRESETS = ['citta', 'muoversi', 'acqua-alta', 'ambiente', 'servizi'] as const satisfies readonly MapPreset[];

/** Preset applicato alla prima visita, quando l'URL non indica layer. */
export const DEFAULT_PRESET: MapPreset = 'citta';

const MAP_PRESETS: readonly MapPreset[] = [...SCENARIO_PRESETS, 'clean'];

/** Nomi dei vecchi preset (link già condivisi) verso i preset attuali. */
const PRESET_ALIASES: Record<string, MapPreset> = {
  mobility: 'muoversi',
  lagoon: 'acqua-alta',
  city: 'servizi',
  satellites: 'ambiente',
  regional: 'ambiente',
  all: DEFAULT_PRESET,
  acquaalta: 'acqua-alta',
  acqua_alta: 'acqua-alta',
  mobilita: 'muoversi',
  environment: 'ambiente',
  services: 'servizi',
};

export function isMapPreset(value: string | null | undefined): value is MapPreset {
  return !!value && (MAP_PRESETS as readonly string[]).includes(value);
}

/** Preset attuale da un valore di ?preset=, accettando anche i vecchi nomi; null se sconosciuto. */
export function resolvePreset(value: string | null | undefined): MapPreset | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (isMapPreset(v)) return v;
  return PRESET_ALIASES[v] ?? null;
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

/**
 * Layer accesi da ciascun preset (tutti gli altri restano spenti).
 * Solo dati verificati: i layer "da verificare" (regime curated) non entrano nei preset.
 */
export const PRESET_LAYERS: Record<Exclude<MapPreset, 'clean'>, LayerKey[]> = {
  muoversi: ['showVehicles', 'showRealtimeVehicles', 'showStops', 'showAlilaguna', 'showShips'],
  'acqua-alta': ['showMose', 'showOceanStations', 'showMarineWind', 'showCanals'],
  ambiente: ['showAirQuality', 'showPollenStations', 'showLagoonWater', 'showMarineWind', 'showParks'],
  servizi: ['showPharmacies', 'showDae', 'showCityAssets', 'showRecyclingCentres', 'showWifiHotspots'],
  citta: ['showLibraries', 'showCameras', 'showCantieri', 'showBdapWorks', 'showTrees', 'showCanals'],
};

export function presetLayers(preset: MapPreset): LayerVisibility {
  if (preset === 'clean') return allLayers(false);
  return layersFrom(Object.fromEntries(PRESET_LAYERS[preset].map((k) => [k, true])));
}

/** Preset che corrisponde esattamente ai layer accesi, se c'è. */
export function matchingPreset(v: LayerVisibility): MapPreset | null {
  return MAP_PRESETS.find((p) => ALL_LAYER_KEYS.every((k) => presetLayers(p)[k] === v[k])) ?? null;
}

/** Oltre questa soglia la mappa diventa difficile da leggere: l'interfaccia lo segnala. */
export const CROWDED_LAYER_THRESHOLD = 12;

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
 * i vecchi nomi dei preset sono convertiti, quelli sconosciuti ignorati. null se l'URL non indica nulla.
 */
export function initialLayersFromSearch(search: string): { layers: LayerVisibility; preset: MapPreset | null } | null {
  const parsed = parseLayerParams(search);
  if (parsed.hasLayerParams) return { layers: layersFrom(parsed.activeLayers), preset: null };
  const preset = resolvePreset(parsed.preset);
  if (preset) return { layers: presetLayers(preset), preset };
  return null;
}

/**
 * Restituisce true se almeno un layer attivo dipende dallo scorrimento temporale o dagli orari,
 * oppure se e attivo il simulatore di marea.
 */
export function hasActiveTemporalLayers(layers: LayerVisibility, hasSimulator = false): boolean {
  if (hasSimulator) return true;
  return Boolean(
    layers.showVehicles ||
    layers.showRealtimeVehicles ||
    layers.showAlilaguna ||
    layers.showMose ||
    layers.showPasserelle
  );
}

