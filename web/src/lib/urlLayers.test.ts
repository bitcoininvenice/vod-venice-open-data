import { describe, it, expect } from 'vitest';
import {
  parseLayerParams,
  buildLayersParam,
  buildShareUrl,
  LAYER_SLUG_BY_KEY,
  SLUG_TO_LAYER_KEY,
  ALL_LAYER_KEYS
} from './urlLayers';

describe('urlLayers utilities', () => {
  it('parses empty query string correctly', () => {
    const res = parseLayerParams('');
    expect(res.hasLayerParams).toBe(false);
    expect(res.activeLayers).toEqual({});
    expect(res.preset).toBeNull();
  });

  it('parses ?layers=all and activates all known layers', () => {
    const res = parseLayerParams('?layers=all');
    expect(res.hasLayerParams).toBe(true);
    expect(Object.keys(res.activeLayers).length).toBe(ALL_LAYER_KEYS.length);
    for (const key of ALL_LAYER_KEYS) {
      expect(res.activeLayers[key]).toBe(true);
    }
  });

  it('parses ?layers=tutti and ?layer=all aliases correctly', () => {
    const resTutti = parseLayerParams('?layers=tutti');
    expect(resTutti.hasLayerParams).toBe(true);
    expect(resTutti.activeLayers.showRoutes).toBe(true);
    expect(resTutti.activeLayers.showTributaries).toBe(true);

    const resLayerAll = parseLayerParams('?layer=all');
    expect(resLayerAll.hasLayerParams).toBe(true);
    expect(resLayerAll.activeLayers.showCityAssets).toBe(true);
  });

  it('parses ?layers=fountains correctly via alias', () => {
    const res = parseLayerParams('?layers=fountains');
    expect(res.hasLayerParams).toBe(true);
    expect(res.activeLayers.showCityAssets).toBe(true);
  });

  it('parses ?layers=fontanelle_ponti,wifi_hotspots correctly via canonical slugs', () => {
    const res = parseLayerParams('?layers=fontanelle_ponti,wifi_hotspots');
    expect(res.hasLayerParams).toBe(true);
    expect(res.activeLayers.showCityAssets).toBe(true);
    expect(res.activeLayers.showWifiHotspots).toBe(true);
    expect(res.activeLayers.showMose).toBeUndefined();
  });

  it('parses ?layer=wifi single layer query', () => {
    const res = parseLayerParams('?layer=wifi');
    expect(res.hasLayerParams).toBe(true);
    expect(res.activeLayers.showWifiHotspots).toBe(true);
  });

  it('parses ?preset=mobility correctly', () => {
    const res = parseLayerParams('?preset=mobility');
    expect(res.preset).toBe('mobility');
  });

  it('builds canonical comma-separated slugs from active layers', () => {
    const param = buildLayersParam({
      showCityAssets: true,
      showWifiHotspots: true,
      showMose: false,
    });
    expect(param).toContain('fontanelle_ponti');
    expect(param).toContain('wifi_hotspots');
    expect(param).not.toContain('mose');
    expect(param).not.toBe('all');
  });

  it('builds concise ?layers=all when all layers are selected', () => {
    const allActive = Object.fromEntries(ALL_LAYER_KEYS.map((k) => [k, true]));
    const param = buildLayersParam(allActive);
    expect(param).toBe('all');

    const url = buildShareUrl(allActive, 'https://venice.opendata.it/');
    expect(url).toBe('https://venice.opendata.it/?layers=all');
  });

  it('builds full shareable URL with query params', () => {
    const url = buildShareUrl(
      { showCityAssets: true, showWifiHotspots: true },
      'https://venice.opendata.it/'
    );
    expect(url).toContain('https://venice.opendata.it/?layers=');
    expect(url).toContain('fontanelle_ponti');
    expect(url).toContain('wifi_hotspots');
  });

  it('returns clean base URL if no layers are active', () => {
    const url = buildShareUrl({}, 'https://venice.opendata.it/');
    expect(url).toBe('https://venice.opendata.it/');
  });

  it('verifies all LAYER_SLUG_BY_KEY have reciprocal mapping in SLUG_TO_LAYER_KEY', () => {
    for (const [key, slug] of Object.entries(LAYER_SLUG_BY_KEY)) {
      expect(SLUG_TO_LAYER_KEY[slug]).toBe(key);
    }
  });
});
