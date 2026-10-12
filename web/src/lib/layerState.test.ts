import { describe, expect, it } from 'vitest';
import { allLayers, countActiveLayers, DEFAULT_PRESET, hasActiveTemporalLayers, initialLayersFromSearch, isMapPreset, layersFrom, makeLayerSetters, matchingPreset, PRESET_LAYERS, presetLayers, resolvePreset, SCENARIO_PRESETS, type LayerVisibility } from './layerState';
import { ALL_LAYER_KEYS, LAYER_SLUG_BY_KEY } from './urlLayers';
import { LAYER_CATALOG } from './layerCatalog';

describe('layerState', () => {
  it('allLayers copre tutte le chiavi', () => {
    expect(countActiveLayers(allLayers(true))).toBe(ALL_LAYER_KEYS.length);
    expect(countActiveLayers(allLayers(false))).toBe(0);
  });

  it('i preset accendono solo i propri layer (da 3 a 6)', () => {
    for (const p of SCENARIO_PRESETS) {
      const v = presetLayers(p);
      expect(countActiveLayers(v)).toBe(PRESET_LAYERS[p].length);
      expect(PRESET_LAYERS[p].length).toBeGreaterThanOrEqual(3);
      expect(PRESET_LAYERS[p].length).toBeLessThanOrEqual(6);
      expect(matchingPreset(v)).toBe(p);
    }
    expect(countActiveLayers(presetLayers('clean'))).toBe(0);
    expect(matchingPreset(presetLayers('clean'))).toBe('clean');
    expect(matchingPreset(layersFrom({ showDae: true }))).toBeNull();
  });

  it('nei preset non entrano i layer da verificare', () => {
    const regime = new Map(LAYER_CATALOG.map((l) => [l.id, l.regime]));
    for (const keys of Object.values(PRESET_LAYERS)) {
      for (const k of keys) expect(regime.get(LAYER_SLUG_BY_KEY[k]), k).not.toBe('curated');
    }
  });

  it('isMapPreset rifiuta valori sconosciuti', () => {
    expect(isMapPreset('muoversi')).toBe(true);
    expect(isMapPreset('all')).toBe(false);
    expect(isMapPreset('hack')).toBe(false);
    expect(isMapPreset(null)).toBe(false);
  });

  it('i vecchi nomi dei preset restano validi', () => {
    expect(resolvePreset('mobility')).toBe('muoversi');
    expect(resolvePreset('lagoon')).toBe('acqua-alta');
    expect(resolvePreset('city')).toBe('servizi');
    expect(resolvePreset('satellites')).toBe('ambiente');
    expect(resolvePreset('regional')).toBe('ambiente');
    expect(resolvePreset('all')).toBe(DEFAULT_PRESET);
    expect(resolvePreset('Acqua-Alta')).toBe('acqua-alta');
    expect(resolvePreset('xyz')).toBeNull();
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
    const r = initialLayersFromSearch('?preset=ambiente&layers=dae');
    expect(r?.preset).toBeNull();
    expect(countActiveLayers(r!.layers)).toBe(1);
    expect(r!.layers.showDae).toBe(true);
  });

  it('applica un preset valido e ignora quelli sconosciuti', () => {
    const r = initialLayersFromSearch('?preset=lagoon');
    expect(r?.preset).toBe('acqua-alta');
    expect(r!.layers.showMose).toBe(true);
    expect(r!.layers.showPasserelle).toBe(true);
    expect(initialLayersFromSearch('?layers=all')?.preset).toBe(DEFAULT_PRESET);
    expect(initialLayersFromSearch('?preset=xyz')).toBeNull();
    expect(initialLayersFromSearch('')).toBeNull();
  });

  it('hasActiveTemporalLayers rileva correttamente layer temporali vs statici', () => {
    // Solo layer statici: falso
    const staticOnly = layersFrom({ showDae: true, showCityAssets: true, showTrees: true });
    expect(hasActiveTemporalLayers(staticOnly, false)).toBe(false);

    // Con simulatore marea: sempre vero anche senza layer attivi
    expect(hasActiveTemporalLayers(allLayers(false), true)).toBe(true);

    // Con vaporetti ACTV
    const withActv = layersFrom({ showVehicles: true });
    expect(hasActiveTemporalLayers(withActv, false)).toBe(true);

    // Con Alilaguna
    const withAli = layersFrom({ showAlilaguna: true });
    expect(hasActiveTemporalLayers(withAli, false)).toBe(true);

    // Con MOSE
    const withMose = layersFrom({ showMose: true });
    expect(hasActiveTemporalLayers(withMose, false)).toBe(true);

    // Con Passerelle
    const withPass = layersFrom({ showPasserelle: true });
    expect(hasActiveTemporalLayers(withPass, false)).toBe(true);
  });
});

