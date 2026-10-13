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

  it('?layers=all e ?layers=tutti non accendono tutto: rimandano al preset predefinito', () => {
    for (const q of ['?layers=all', '?layers=tutti', '?layer=all']) {
      const res = parseLayerParams(q);
      expect(res.hasLayerParams).toBe(false);
      expect(res.activeLayers).toEqual({});
      expect(res.preset).toBe('all');
    }
    // un preset esplicito resta valido
    expect(parseLayerParams('?preset=ambiente&layers=all').preset).toBe('ambiente');
  });

  it('parses ?layers=fountains correctly via alias', () => {
    const res = parseLayerParams('?layers=fountains');
    expect(res.hasLayerParams).toBe(true);
    expect(res.activeLayers.showCityAssets).toBe(true);
  });

  it('parses ?layers=fontanelle_ponti,wifi_hotspots (slug precedente, ancora valido)', () => {
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
    expect(param).toContain('fontanelle');
    expect(param).toContain('wifi_hotspots');
    expect(param).not.toContain('mose');
    expect(param).not.toBe('all');
  });

  it('con tutti i layer attivi elenca gli slug (niente forma compatta all)', () => {
    const allActive = Object.fromEntries(ALL_LAYER_KEYS.map((k) => [k, true]));
    const param = buildLayersParam(allActive);
    expect(param).not.toBe('all');
    expect(param.split(',').length).toBe(ALL_LAYER_KEYS.length);
  });

  it('builds full shareable URL with query params', () => {
    const url = buildShareUrl(
      { showCityAssets: true, showWifiHotspots: true },
      'https://venice.opendata.it/'
    );
    expect(url).toContain('https://venice.opendata.it/?layers=');
    expect(url).toContain('fontanelle');
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

  it('i ponti accessibili sono un livello separato dalle fontanelle', () => {
    const res = parseLayerParams('?layers=ponti_accessibili');
    expect(res.activeLayers.showAccessibleBridges).toBe(true);
    expect(res.activeLayers.showCityAssets).toBeFalsy();
  });
});
