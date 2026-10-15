import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const README = readFileSync(path.join(ROOT, 'README.md'), 'utf8');

/** Percorsi delle route API (`/api/realtime/vehicles`), con `[id]` scritto `<id>` come nel README */
function apiRoutes(dir: string, prefix = '/api'): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (!statSync(p).isDirectory()) return name === 'route.ts' ? [prefix] : [];
    return apiRoutes(p, `${prefix}/${name.replace(/^\[(.+)\]$/, '<$1>')}`);
  });
}

describe('README', () => {
  it('documenta ogni route API', () => {
    const missing = apiRoutes(path.join(ROOT, 'web/src/app/api')).filter((r) => !README.includes(`\`${r}`) && !README.includes(` ${r}\``));
    expect(missing).toEqual([]);
  });

  it('documenta ogni script della pipeline', () => {
    const scripts = readdirSync(path.join(ROOT, 'pipeline')).filter((n) => n.endsWith('.py'));
    expect(scripts.filter((s) => !README.includes(s))).toEqual([]);
  });
});
