import { describe, expect, it } from 'vitest';
import { THEME_BOOT_SCRIPT } from './themeBoot';
import { isDaylightTheme } from './solar';

/** Esegue lo script con un orologio e uno storage finti e restituisce il tema applicato. */
function runBoot(now: Date, saved: string | null): string | undefined {
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      super(...(args.length ? args : [now.getTime()]) as [number]);
    }
  }
  const fn = new Function('document', 'localStorage', 'Date', THEME_BOOT_SCRIPT);
  fn({ documentElement: root }, { getItem: () => saved }, FakeDate);
  return root.dataset.theme;
}

const romeSeconds = (d: Date) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d);
  const v = (k: string) => Number(p.find((x) => x.type === k)?.value);
  return v('hour') * 3600 + v('minute') * 60 + v('second');
};

describe('tema iniziale', () => {
  it('senza preferenza segue il giorno e la notte di Venezia', () => {
    expect(runBoot(new Date('2026-06-21T10:00:00Z'), null)).toBe('carta'); // mezzogiorno estivo
    expect(runBoot(new Date('2026-12-21T22:00:00Z'), null)).toBe('notte'); // notte invernale
  });

  it('rispetta la scelta salvata', () => {
    expect(runBoot(new Date('2026-06-21T10:00:00Z'), 'notte')).toBe('notte');
    expect(runBoot(new Date('2026-12-21T22:00:00Z'), 'carta')).toBe('carta');
  });

  it('coincide con la regola del tema dinamico della pagina lungo tutto il giorno', () => {
    for (const day of ['2026-03-20', '2026-03-29', '2026-06-21', '2026-10-09', '2026-10-25', '2026-12-21']) {
      for (let m = 0; m < 24 * 60; m += 7) {
        const now = new Date(`${day}T00:00:00Z`);
        now.setUTCMinutes(m);
        const s = romeSeconds(now);
        const expected = isDaylightTheme(s, now) ? 'carta' : 'notte';
        // a un minuto dai bordi la differenza di arrotondamento è ammessa
        const nearEdge = [s - 60, s + 60].some((x) => isDaylightTheme(x, now) !== (expected === 'carta'));
        if (!nearEdge) expect(runBoot(now, null), now.toISOString()).toBe(expected);
      }
    }
  });
});
