import { describe, expect, it } from 'vitest';
import stopsData from '@/data/actv-stops.json';
import { resolvePlace } from '@/server/planning/places';
import { linesAtStops, nextWeekday, waterLines } from '@/server/guides';
import sitemap from '@/app/sitemap';
import { GUIDE_ORIGIN_IDS, GUIDE_PLACES, originsFor, placeBySlug } from './places';
import { allGuidePairs, GUIDE_PATHS, languageAlternates, placePath } from './paths';
import { faqItems, glossaryTerms } from './content';
import { guideMetadata, placeMetadata } from './meta';

const STOP_IDS = new Set((stopsData as { stops: { id: string }[] }).stops.map((s) => s.id));

describe('luoghi delle guide «Come arrivare»', () => {
  it('id e indirizzi unici in entrambe le lingue, solo minuscole e trattini', () => {
    const ids = GUIDE_PLACES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lang of ['it', 'en'] as const) {
      const slugs = GUIDE_PLACES.map((p) => p.slug[lang]);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(placeBySlug('en', 'rialto-bridge')?.id).toBe('rialto');
    expect(placeBySlug('it', 'rialto-bridge')).toBeUndefined();
  });

  it('ogni luogo è riconosciuto dal planner e le sue fermate esistono nel GTFS', () => {
    for (const p of GUIDE_PLACES) {
      expect(resolvePlace(p.target), p.id).not.toBeNull();
      for (const id of p.stopIds) expect(STOP_IDS.has(id), `${p.id}: ${id}`).toBe(true);
      expect(p.toIt).toMatch(/^(a|al|alla|alle|ai|all')\s?\S/);
    }
  });

  it('tre partenze per luogo, mai il luogo stesso', () => {
    for (const p of GUIDE_PLACES) {
      const origins = originsFor(p);
      expect(origins).toHaveLength(3);
      expect(origins.map((o) => o.id)).not.toContain(p.id);
    }
    for (const id of GUIDE_ORIGIN_IDS) expect(GUIDE_PLACES.some((p) => p.id === id)).toBe(true);
  });

  it('linee alle fermate dal GTFS, in ordine naturale e con i capolinea', () => {
    const rialto = linesAtStops(['navigazione:5038', 'navigazione:5138']);
    expect(rialto.lines.map((l) => l.line).slice(0, 3)).toEqual(['1', '2', '2/']);
    expect(rialto.lines.find((l) => l.line === '1')?.terminals).toBe('P.le Roma - Lido S.M.E.');
    const tronchetto = linesAtStops(['peoplemover:6088']);
    expect(tronchetto.lines.map((l) => l.line)).toEqual(['People Mover']);
    const all = waterLines().map((l) => l.line);
    expect(all).toContain('4.1');
    expect(all.indexOf('2')).toBeLessThan(all.indexOf('10'));
  });

  it('il giorno dei percorsi è il prossimo feriale dopo oggi', () => {
    // venerdì 23 ottobre 2026 -> lunedì 26; domenica 25 -> lunedì 26; martedì 20 -> mercoledì 21
    expect(nextWeekday(new Date('2026-10-23T10:00:00Z'))).toBe('2026-10-26');
    expect(nextWeekday(new Date('2026-10-25T10:00:00Z'))).toBe('2026-10-26');
    expect(nextWeekday(new Date('2026-10-20T10:00:00Z'))).toBe('2026-10-21');
  });
});

describe('indirizzi gemelli e hreflang', () => {
  it('ogni guida ha la sua gemella inglese sotto /en', () => {
    const pairs = allGuidePairs();
    expect(pairs).toHaveLength(Object.keys(GUIDE_PATHS).length + GUIDE_PLACES.length);
    for (const pair of pairs) {
      expect(pair.it.startsWith('/en')).toBe(false);
      expect(pair.en.startsWith('/en/')).toBe(true);
    }
    expect(languageAlternates(GUIDE_PATHS.tide)).toEqual({ it: '/marea-venezia', en: '/en/venice-tide', 'x-default': '/marea-venezia' });
  });

  it('metadati: canonico, alternative e titolo breve', () => {
    const m = guideMetadata('tide', 'en');
    expect(m.alternates?.canonical).toBe('/en/venice-tide');
    expect(m.alternates?.languages).toMatchObject({ it: '/marea-venezia', en: '/en/venice-tide' });
    expect(m.openGraph).toMatchObject({ locale: 'en_GB' });
    expect(m.title).toEqual({ absolute: expect.stringMatching(/ \| VOD$/) });
    const airport = placeMetadata(GUIDE_PLACES.find((p) => p.id === 'aeroporto')!, 'it');
    expect((airport.title as { absolute: string }).absolute).toMatch(/^Come arrivare all'Aeroporto Marco Polo/);
    expect(airport.alternates?.canonical).toBe(placePath('it', 'aeroporto-marco-polo'));
  });

  it('la sitemap elenca le guide in entrambe le lingue con le alternative', () => {
    const entries = sitemap();
    const tide = entries.find((e) => e.url.endsWith('/marea-venezia'));
    const tideEn = entries.find((e) => e.url.endsWith('/en/venice-tide'));
    expect(tide?.alternates?.languages).toMatchObject({ en: expect.stringMatching(/\/en\/venice-tide$/) });
    expect(tideEn?.alternates?.languages).toMatchObject({ it: expect.stringMatching(/\/marea-venezia$/) });
    expect(entries.filter((e) => e.url.includes('/come-arrivare/'))).toHaveLength(GUIDE_PLACES.length);
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('FAQ e glossario', () => {
  it('stesse domande e stessi termini in italiano e in inglese', () => {
    expect(faqItems('it')).toHaveLength(faqItems('en').length);
    expect(glossaryTerms('it').map((t) => t.id)).toEqual(glossaryTerms('en').map((t) => t.id));
  });

  it('cifre prese dalle stesse funzioni della mappa', () => {
    const it = faqItems('it').map((f) => f.a).join(' ');
    expect(it).toContain('9,50');
    expect(it).toMatch(/12,2%/); // getFloodedGroundPercentage(110)
  });
});
