import { describe, expect, it } from 'vitest';
import { allLayers, countActiveLayers, initialLayersFromSearch, isMapPreset, layersFrom, makeLayerSetters, presetLayers, type LayerVisibility } from './layerState';
import { ALL_LAYER_KEYS } from './urlLayers';

describe('layerState', () => {
  it('allLayers copre tutte le chiavi', () => {
    expect(countActiveLayers(allLayers(true))).toBe(ALL_LAYER_KEYS.length);
    expect(countActiveLayers(allLayers(false))).toBe(0);
  });

  it('i preset accendono solo i propri layer', () => {
    const sat = presetLayers('satellites');
    expect(sat.showSatellites && sat.showSubsidence && sat.showHeatIslands).toBe(true);
    expect(countActiveLayers(sat)).toBe(3);
    expect(countActiveLayers(presetLayers('clean'))).toBe(0);
    expect(countActiveLayers(presetLayers('all'))).toBe(ALL_LAYER_KEYS.length);
  });

  it('isMapPreset rifiuta valori sconosciuti', () => {
    expect(isMapPreset('mobility')).toBe(true);
    expect(isMapPreset('hack')).toBe(false);
    expect(isMapPreset(null)).toBe(false);
  });

  it('layersFrom ignora le chiavi non attive', () => {
    const v = layersFrom({ showDae: true, showStops: false });
    expect(countActiveLayers(v)).toBe(1);
    expect(v.showDae).toBe(true);
  });

  it('i setter accettano valori e funzioni come useState', () => {
    let state: LayerVisibility = allLayers(false);
    const set = makeLayerSetters((action) => {
      state = typeof action === 'function' ? action(state) : action;
    });
    set.setShowDae(true);
    expect(state.showDae).toBe(true);
    set.setShowDae((v) => !v);
    expect(state.showDae).toBe(false);
    const before = state;
    set.setShowDae(false);
    expect(state).toBe(before); // nessun nuovo oggetto se il valore non cambia
  });

  it("?layers= ha la precedenza su ?preset=", () => {
    const r = initialLayersFromSearch('?preset=satellites&layers=dae');
    expect(r?.preset).toBeNull();
    expect(countActiveLayers(r!.layers)).toBe(1);
    expect(r!.layers.showDae).toBe(true);
  });

  it('applica un preset valido e ignora quelli sconosciuti', () => {
    const r = initialLayersFromSearch('?preset=lagoon');
    expect(r?.preset).toBe('lagoon');
    expect(r!.layers.showMose).toBe(true);
    expect(initialLayersFromSearch('?preset=xyz')).toBeNull();
    expect(initialLayersFromSearch('')).toBeNull();
  });
});
