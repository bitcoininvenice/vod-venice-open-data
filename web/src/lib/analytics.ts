import { track } from '@vercel/analytics';
import { LAYER_SLUG_BY_KEY, type LayerKey } from '@/lib/urlLayers';
import type { VeniceFeatureSelected } from '@/components/VeniceFeatureDetailModal';
import type { MapObjectSelected } from '@/components/MapObjectPanel';
import { featureLayer } from '@/lib/featureLayer';

export function toLayerSlug(layer: LayerKey | string): string {
  if (layer in LAYER_SLUG_BY_KEY) {
    return LAYER_SLUG_BY_KEY[layer as LayerKey];
  }
  return layer;
}

export function featureToLayerSlug(feature: VeniceFeatureSelected): string {
  // i numeri civici non hanno un layer: la scheda nasce dalla ricerca
  if (feature.type === 'civicNumber') return 'civici';
  const layerKey = featureLayer(feature);
  return layerKey ? LAYER_SLUG_BY_KEY[layerKey] : feature.type;
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
