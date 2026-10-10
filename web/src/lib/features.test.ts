import { describe, expect, it } from 'vitest';
import { FEATURE_COUNT, FEATURE_GROUPS } from './features';
import { initialLayersFromSearch } from './layerState';
import { itUi } from './i18n/ui.it';
import { enUi } from './i18n/ui.en';

const OPEN_TOOLS = ['planner', 'tide', 'search', 'export', 'spatial', 'tutorial'];

describe('pagina /features', () => {
  it('ogni funzionalità ha titolo e descrizione in italiano e in inglese', () => {
    const it_ = itUi.featuresPage as Record<string, string>;
    const en = enUi.featuresPage as Record<string, string>;
    for (const g of FEATURE_GROUPS) {
      expect(it_[`group_${g.id}`], g.id).toBeTruthy();
      expect(en[`group_${g.id}`], g.id).toBeTruthy();
      for (const f of g.features) {
        for (const k of [`${f.id}_title`, `${f.id}_desc`]) {
          expect(it_[k], k).toBeTruthy();
          expect(en[k], k).toBeTruthy();
        }
      }
    }
    expect(FEATURE_COUNT).toBeGreaterThan(20);
  });

  it('i link «Prova» aprono strumenti esistenti e livelli o scenari validi', () => {
    for (const f of FEATURE_GROUPS.flatMap((g) => g.features)) {
      if (!f.href.startsWith('/?')) continue;
      const params = new URLSearchParams(f.href.slice(1));
      const tool = params.get('open');
      if (tool) expect(OPEN_TOOLS, f.id).toContain(tool);
      if (params.has('layers') || params.has('preset')) {
        const initial = initialLayersFromSearch(f.href.slice(1));
        expect(initial, f.id).not.toBeNull();
        const active = initial!.preset ?? Object.values(initial!.layers).filter(Boolean).length;
        expect(active, f.id).toBeTruthy();
      }
    }
  });

  it('identificativi unici (sono anche le ancore della pagina)', () => {
    const ids = FEATURE_GROUPS.flatMap((g) => g.features.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
