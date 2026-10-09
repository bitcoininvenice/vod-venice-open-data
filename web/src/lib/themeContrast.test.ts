import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * I testi dell'interfaccia usano i colori del tema (globals.css), mai la palette sfumata della mappa:
 * qui si verifica che restino leggibili sui pannelli in entrambi i temi (WCAG AA, 4,5:1).
 */
const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');

function block(selector: string): string {
  const i = css.indexOf(`${selector} {`);
  return css.slice(i, css.indexOf('}', i));
}
function token(b: string, name: string): string {
  const m = b.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} mancante`);
  return m[1].trim();
}
function rgb(c: string): [number, number, number, number] {
  if (c.startsWith('#')) return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  const [r, g, b, a = '1'] = c.replace(/rgba?\(|\)/g, '').split(',').map((x) => x.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}
const lum = ([r, g, b]: number[]) =>
  0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function lin(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function contrast(fg: string, panel: string, ground: string): number {
  // pannello semitrasparente sopra lo sfondo
  const [pr, pg, pb, pa] = rgb(panel);
  const [gr, gg, gb] = rgb(ground);
  const bg = [pr * pa + gr * (1 - pa), pg * pa + gg * (1 - pa), pb * pa + gb * (1 - pa)];
  const [l1, l2] = [lum(rgb(fg)), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('contrasto dei testi dell’interfaccia', () => {
  for (const [name, selector] of [['scuro', ':root'], ['chiaro', '[data-theme="carta"]']] as const) {
    it(`tema ${name}: testi principali e secondari leggibili sui pannelli`, () => {
      const b = block(selector);
      const panel = token(b, '--panel-bg');
      const ground = token(b, '--ground');
      for (const ink of ['--ink', '--ink-2', '--ink-3']) {
        expect(contrast(token(b, ink), panel, ground), `${ink} nel tema ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
