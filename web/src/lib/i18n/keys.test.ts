import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { itTranslations } from './it';
import { enTranslations } from './en';

/** File sorgente del sito (esclusi i dizionari) */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return name === 'i18n' ? [] : sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

const resolve = (root: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((cur, k) => (cur && typeof cur === 'object' && k in cur ? (cur as Record<string, unknown>)[k] : undefined), root);

describe('traduzioni', () => {
  const srcDir = path.join(__dirname, '..', '..');
  const code = sources(srcDir).map((f) => readFileSync(f, 'utf8')).join('\n');
  // chiamate con chiave letterale: t('ui.planner.title'), tr('header.metrics')…
  const literal = [...new Set([...code.matchAll(/\bt[rp]?\(\s*'((?:[a-zA-Z]+)(?:\.[\w-]+)+)'/g)].map((m) => m[1]))];

  it('ogni testo usato dal sito esiste in italiano e in inglese', () => {
    expect(literal.length).toBeGreaterThan(300);
    const missing = literal.filter((k) => typeof resolve(itTranslations, k) !== 'string' || typeof resolve(enTranslations, k) !== 'string');
    expect(missing).toEqual([]);
  });
});
