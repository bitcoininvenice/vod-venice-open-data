import { describe, expect, it } from 'vitest';
import { groupLayerKeys, isCuratedLayer, LAYER_ENTRIES, LAYER_GROUPS, layerMatches, layerRegime, normalizeSearch } from './layerGroups';
import { ALL_LAYER_KEYS } from './urlLayers';

describe('layerGroups', () => {
  it('ogni layer compare una sola volta nel pannello', () => {
    const keys = LAYER_ENTRIES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual([...ALL_LAYER_KEYS].sort());
  });

  it('i gruppi sono i tre del catalogo', () => {
    expect([...LAYER_GROUPS.map((g) => g.id)].sort()).toEqual(['city', 'lagoon', 'mobility']);
    expect(LAYER_GROUPS.reduce((n, g) => n + groupLayerKeys(g).length, 0)).toBe(ALL_LAYER_KEYS.length);
  });

  it('la natura del dato arriva dal catalogo', () => {
    expect(layerRegime('showShips')).toBe('realtime');
    expect(layerRegime('showVehicles')).toBe('simulated');
    expect(layerRegime('showPharmacies')).toBe('static');
    expect(isCuratedLayer('showWells')).toBe(true);
    expect(isCuratedLayer('showMose')).toBe(false);
  });

  it('la ricerca ignora maiuscole e accenti e usa anche il catalogo', () => {
    expect(normalizeSearch('  Qualità ')).toBe('qualita');
    expect(layerMatches('showPharmacies', 'Farmacie', 'farmac')).toBe(true);
    expect(layerMatches('showPharmacies', 'Farmacie', 'pharmac')).toBe(true); // nome inglese
    expect(layerMatches('showAirQuality', "Qualità dell'aria", 'qualita aria')).toBe(true);
    expect(layerMatches('showShips', 'Navi', 'ais')).toBe(true); // slug navi_ais
    expect(layerMatches('showShips', 'Navi', 'farmacia')).toBe(false);
    expect(layerMatches('showShips', 'Navi', '')).toBe(true);
  });
});
