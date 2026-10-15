import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FEEDS, feedSummary, type FeedId } from './feeds';
import { LICENSES } from './licenses';
import { PROVIDERS, providerLicense, providerMeta, providersLicense } from './providers';

const SRC = path.resolve(__dirname, '../..');

/** File sorgente del sito, esclusi il registro e i test */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return p === __dirname ? [] : sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe('registro delle fonti', () => {
  it('ogni fornitore ha nome, link https e licenza nota', () => {
    for (const [id, p] of Object.entries(PROVIDERS)) {
      expect(p.name, id).not.toBe('');
      expect(LICENSES[p.license], id).toBeDefined();
      // CAMPO non ha ancora un dominio in HTTPS (vedi server/sources/campo.ts)
      if (id !== 'campo') expect(p.url, id).toMatch(/^https:\/\//);
    }
  });

  it('compone licenze e meta dal fornitore', () => {
    expect(providerLicense('osm')).toBe('ODbL 1.0 – © OpenStreetMap contributors');
    expect(providersLicense(['cpsm', 'noaa'])).toMatch(/^CPSM: CC BY-SA 3\.0 .*; NOAA: Pubblico dominio/);
    expect(providerMeta('opensky')).toMatchObject({ source: PROVIDERS.opensky.name, sourceUrl: PROVIDERS.opensky.url });
  });

  it('ogni flusso di /sources è controllato da /api/health', () => {
    const health = readFileSync(path.join(SRC, 'app/api/health/route.ts'), 'utf8');
    const missing = (Object.keys(FEEDS) as FeedId[]).filter((id) => !health.includes(`assess('${id}'`));
    expect(missing).toEqual([]);
  });

  it('un flusso senza licenza dichiarata è segnalato come tale', () => {
    expect(feedSummary('alilaguna-gtfs').licenseUndeclared).toBe(true);
    expect(feedSummary('tide').licenseUndeclared).toBe(false);
  });

  it('link dei fornitori e licenze non sono riscritti a mano fuori dal registro', () => {
    // l'indirizzo di VOD nasce in lib/site.ts (SITE_URL)
    const urls = Object.entries(PROVIDERS).filter(([id]) => id !== 'vod').map(([, p]) => p).flatMap((p) => [p.url, 'datasetUrl' in p ? p.datasetUrl : null]).filter((u): u is string => !!u);
    const found: string[] = [];
    for (const file of sources(SRC)) {
      const text = readFileSync(file, 'utf8');
      const rel = path.relative(SRC, file);
      for (const u of urls) {
        if (["'", '"', '`'].some((q) => text.includes(`${q}${u}${q}`))) found.push(`${rel}: ${u}`);
      }
      // una licenza si scrive con le funzioni del registro, mai come testo
      for (const m of text.matchAll(/\blicense: *['"][^'"]+['"]/g)) found.push(`${rel}: ${m[0]}`);
    }
    expect(found).toEqual([]);
  });
});
