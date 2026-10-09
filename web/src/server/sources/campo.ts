import type { SportPlace } from '@/lib/types';

/**
 * CAMPO: mappa della comunità degli spazi sportivi di Venezia (soprattutto basket di strada),
 * dati rilasciati con licenza CC BY 4.0 come "segnalazioni di comunità".
 * Come per le altre fonti, l'indirizzo è una costante: con il dominio definitivo in HTTPS si cambia solo CAMPO_SITE.
 */
export const CAMPO_SITE = 'http://217.160.143.203';
export const CAMPO_API_URL = `${CAMPO_SITE}/api/v1/markers/geojson`;
export const CAMPO_ATTRIBUTION = '© CAMPO – segnalazioni di comunità (CC BY 4.0)';

/** Sport di CAMPO nelle stesse chiavi usate da OpenStreetMap (sport=*) */
const SPORT_KEYS: Record<string, string> = {
  basketball: 'basketball',
  football: 'soccer',
  soccer: 'soccer',
  free_fitness: 'fitness',
  fitness: 'fitness',
  rowing: 'rowing',
  tennis: 'tennis',
  volleyball: 'volleyball',
  pingpong: 'table_tennis',
  table_tennis: 'table_tennis',
  running: 'running',
  rugby: 'rugby',
  bjj: 'martial_arts',
  padel: 'padel',
};

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

function accessOf(p: Record<string, unknown>): SportPlace['access'] {
  const declared = str(p.access)?.toLowerCase();
  if (declared === 'public' || declared === 'parish' || declared === 'club') return declared;
  if (p.marker_type === 'partner') return 'club';
  // Prima che CAMPO pubblichi il campo `access`: i patronati si riconoscono dagli orari
  if (/patronat|parrocch/i.test(`${str(p.schedule_info) ?? ''} ${str(p.location_name) ?? ''} ${str(p.title) ?? ''}`)) return 'parish';
  return 'public';
}

function kindOf(p: Record<string, unknown>, sport: string): SportPlace['kind'] {
  if (p.marker_type === 'partner') return 'club';
  if (p.marker_type === 'community_hub') return 'hub';
  return sport === 'fitness' ? 'fitness' : 'pitch';
}

export function parseCampo(raw: unknown): SportPlace[] {
  const fc = raw as { type?: string; features?: unknown[] };
  if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error('risposta CAMPO non valida');
  const out: SportPlace[] = [];
  for (const f of fc.features as { geometry?: { type?: string; coordinates?: unknown[] }; properties?: Record<string, unknown> }[]) {
    const c = f.geometry?.type === 'Point' ? f.geometry.coordinates : null;
    const lon = Array.isArray(c) ? Number(c[0]) : NaN;
    const lat = Array.isArray(c) ? Number(c[1]) : NaN;
    const p = f.properties ?? {};
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !str(p.id)) continue;
    const category = str(p.sport_category)?.toLowerCase() ?? 'other';
    const sport = SPORT_KEYS[category] ?? category;
    out.push({
      id: `campo-${str(p.id)}`,
      source: 'CAMPO',
      name: str(p.title),
      sports: [sport],
      kind: kindOf(p, sport),
      access: accessOf(p),
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      area: str(p.sestiere),
      address: [str(p.location_name), str(p.address)].filter(Boolean).join(' · ') || null,
      schedule: str(p.schedule_info),
      description: str(p.description),
      surface: str(p.surface),
      lit: typeof p.lit === 'boolean' ? p.lit : null,
      operator: null,
      sourceUrl: str(p.url) ?? CAMPO_SITE,
    });
  }
  return out;
}
