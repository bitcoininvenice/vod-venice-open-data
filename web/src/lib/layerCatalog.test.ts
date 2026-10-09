import { describe, expect, it } from 'vitest';
import { LAYER_CATALOG } from './layerCatalog';
import { ALL_LAYER_KEYS, LAYER_SLUG_BY_KEY } from './urlLayers';

describe('catalogo dei layer', () => {
  it('ha una voce per ogni layer della mappa, e solo quelle', () => {
    const catalogIds = LAYER_CATALOG.map((l) => l.id).sort();
    const mapSlugs = Object.values(LAYER_SLUG_BY_KEY).sort();
    expect(catalogIds).toEqual(mapSlugs);
    expect(LAYER_CATALOG).toHaveLength(ALL_LAYER_KEYS.length);
  });

  it('non ha id duplicati', () => {
    const ids = LAYER_CATALOG.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
