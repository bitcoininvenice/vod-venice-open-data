import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { track } from '@vercel/analytics';
import {
  toLayerSlug,
  featureToLayerSlug,
  mapObjectToLayerSlug,
  trackLayerToggle,
  trackLayerOpen,
} from './analytics';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

describe('analytics helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps LayerKey to canonical catalog slug', () => {
    expect(toLayerSlug('showRoutes')).toBe('rotte_actv');
    expect(toLayerSlug('showMose')).toBe('mose');
    expect(toLayerSlug('showPasserelle')).toBe('passerelle');
    expect(toLayerSlug('showCantieri')).toBe('cantieri');
    expect(toLayerSlug('showVehicles')).toBe('vaporetti_live');
    expect(toLayerSlug('custom_layer')).toBe('custom_layer');
  });

  it('maps VeniceFeatureSelected to canonical layer slug', () => {
    expect(
      featureToLayerSlug({
        type: 'passerella',
        data: { id: 'p1', name: 'Passerella 1', geometry: [], elevationCm: 110 } as never,
      })
    ).toBe('passerelle');

    expect(
      featureToLayerSlug({
        type: 'civicNumber',
        data: { number: '123' } as never,
      })
    ).toBe('civici');

    expect(
      featureToLayerSlug({
        type: 'civicPoi',
        data: { kind: 'recycling' } as never,
      })
    ).toBe('ecocentri');

    expect(
      featureToLayerSlug({
        type: 'civicPoi',
        data: { kind: 'library' } as never,
      })
    ).toBe('biblioteche');
  });

  it('maps MapObjectSelected to canonical layer slug', () => {
    expect(
      mapObjectToLayerSlug({
        type: 'ship',
        data: { id: 'ship-1', name: 'San Marco' } as never,
      })
    ).toBe('navi_ais');

    expect(
      mapObjectToLayerSlug({
        type: 'flight',
        data: { icao24: 'abc123' } as never,
      })
    ).toBe('voli_vce');

    expect(
      mapObjectToLayerSlug({
        type: 'vehicle',
        data: { source: 'gps' } as never,
      })
    ).toBe('vaporetti_realtime');

    expect(
      mapObjectToLayerSlug({
        type: 'vehicle',
        data: { source: 'schedule' } as never,
      })
    ).toBe('vaporetti_live');

    expect(
      mapObjectToLayerSlug({
        type: 'alilagunaBoat',
        data: {} as never,
      })
    ).toBe('alilaguna');
  });

  it('tracks layer_toggle with layer_slug and enabled "1" or "0" in browser', () => {
    vi.stubGlobal('window', {});

    trackLayerToggle('showMose', true);
    expect(track).toHaveBeenCalledWith('layer_toggle', {
      layer_slug: 'mose',
      enabled: '1',
    });

    trackLayerToggle('showCantieri', false);
    expect(track).toHaveBeenCalledWith('layer_toggle', {
      layer_slug: 'cantieri',
      enabled: '0',
    });
  });

  it('tracks layer_open with layer_slug in browser', () => {
    vi.stubGlobal('window', {});

    trackLayerOpen('showPasserelle');
    expect(track).toHaveBeenCalledWith('layer_open', {
      layer_slug: 'passerelle',
    });

    trackLayerOpen('fermate_actv');
    expect(track).toHaveBeenCalledWith('layer_open', {
      layer_slug: 'fermate_actv',
    });
  });

  it('does not throw when window is undefined', () => {
    expect(() => trackLayerToggle('showMose', true)).not.toThrow();
    expect(() => trackLayerOpen('showMose')).not.toThrow();
    expect(track).not.toHaveBeenCalled();
  });
});
