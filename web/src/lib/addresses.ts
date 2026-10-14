/**
 * Ricerca di indirizzi veneziani (calli, campi, fondamenta, ponti…) sul gazzettiere dei toponimi di
 * OpenStreetMap già in VOD (pipeline/import_osm_toponyms.py), senza chiamate a servizi esterni: il
 * Nominatim pubblico non ammette l'autocompletamento. "cannaregio calle minestra" cerca "calle minestra"
 * e mette prima i risultati del sestiere indicato.
 */
import { SESTIERI_CIVICI, type CivicRow } from './civici';

export interface AddressHit {
  name: string;
  /** sestiere, isola o zona (stima: civico più vicino o area geografica) */
  area: string | null;
  lon: number;
  lat: number;
}

interface IndexEntry extends AddressHit {
  tokens: string[];
  norm: string;
}

/** Parole che non distinguono un indirizzo (articoli e preposizioni, anche in veneziano) */
const STOP = new Set(['de', 'del', 'dei', 'dela', 'della', 'delle', 'degli', 'dele', 'di', 'da', 'la', 'le', 'el', 'il', 'lo', 'al', 'ai', 'alla', 'a', 'd', 'e']);

/** Zone riconosciute nella ricerca, con le grafie usate (dopo la normalizzazione) */
const AREA_WORDS: [string, string][] = [
  ['santa croce', 'Santa Croce'], ['san marco', 'San Marco'], ['san polo', 'San Polo'],
  ['cannaregio', 'Cannaregio'], ['canaregio', 'Cannaregio'], ['castello', 'Castello'], ['dorsoduro', 'Dorsoduro'],
  ['giudecca', 'Giudecca'], ['murano', 'Murano'], ['burano', 'Burano'], ['mazzorbo', 'Mazzorbo'], ['torcello', 'Torcello'],
  ['lido', 'Lido'], ['pellestrina', 'Pellestrina'], ['sant erasmo', "Sant'Erasmo"], ['mestre', 'Mestre e terraferma'],
  ['marghera', 'Mestre e terraferma'],
];

/** Isole e terraferma per area geografica [lon0, lon1, lat0, lat1] (i sestieri vengono dai civici) */
const AREA_BOXES: [string, [number, number, number, number]][] = [
  ['Murano', [12.343, 12.366, 45.448, 45.464]],
  ['Mazzorbo', [12.398, 12.41, 45.484, 45.492]],
  ['Burano', [12.41, 12.425, 45.48, 45.492]],
  ['Torcello', [12.41, 12.425, 45.492, 45.503]],
  ["Sant'Erasmo", [12.39, 12.435, 45.437, 45.47]],
  ['Pellestrina', [12.28, 12.33, 45.26, 45.34]],
  ['Lido', [12.33, 12.4, 45.34, 45.43]],
  ['Mestre e terraferma', [12.13, 12.295, 45.43, 45.56]],
];

/** Un civico entro questa distanza (m) indica il sestiere del luogo */
const CIVIC_RADIUS_M = 150;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Grafie equivalenti dei nomi veneziani, ricondotte a una sola */
const SAME: Record<string, string> = {
  fondamente: 'fondamenta', fond: 'fondamenta', fta: 'fondamenta', fte: 'fondamenta',
  salizzada: 'salizada', sottoportego: 'sotoportego', sottoportico: 'sotoportego', terra: 'tera',
  nuove: 'nove', cl: 'calle', c: 'calle', s: 'san', ss: 'santi', sta: 'santa',
};

const tokensOf = (norm: string) =>
  norm
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .map((t) => SAME[t] ?? t);

const metersBetween = (lon1: number, lat1: number, lon2: number, lat2: number) => {
  const k = Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180) * 111320;
  return Math.hypot((lon2 - lon1) * k, (lat2 - lat1) * 110540);
};

/** Sestiere dal civico più vicino, altrimenti isola o terraferma dall'area, altrimenti null. */
export function areaOf(lon: number, lat: number, civici: Partial<Record<string, readonly CivicRow[]>>): string | null {
  let best: { d: number; s: string } | null = null;
  for (const s of SESTIERI_CIVICI) {
    for (const r of civici[s] ?? []) {
      if (Math.abs(r[3] - lat) > 0.002 || Math.abs(r[2] - lon) > 0.003) continue;
      const d = metersBetween(lon, lat, r[2], r[3]);
      if (d <= CIVIC_RADIUS_M && (!best || d < best.d)) best = { d, s };
    }
  }
  if (best) return best.s;
  for (const [name, [x0, x1, y0, y1]] of AREA_BOXES) if (lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1) return name;
  return null;
}

/** Indice dei toponimi: un elemento per ogni centro di un nome (i nomi ripetuti in zone diverse restano separati). */
export function buildAddressIndex(names: Record<string, [number, number][]>, civici: Partial<Record<string, readonly CivicRow[]>>): IndexEntry[] {
  const out: IndexEntry[] = [];
  for (const [name, centers] of Object.entries(names)) {
    // numeri isolati ("8", "10") e sigle di una lettera non sono indirizzi
    if (!/[a-z]{3}/i.test(name)) continue;
    const norm = normalize(name);
    const tokens = tokensOf(norm);
    for (const [lon, lat] of centers) out.push({ name, area: areaOf(lon, lat, civici), lon, lat, norm, tokens });
  }
  return out;
}

/** Zona indicata nella ricerca (all'inizio o alla fine) e parole restanti. */
export function parseAddressQuery(text: string): { area: string | null; tokens: string[] } {
  let norm = ` ${normalize(text)} `;
  let area: string | null = null;
  for (const [word, name] of AREA_WORDS) {
    if (norm.startsWith(` ${word} `) || norm.endsWith(` ${word} `)) {
      area = name;
      norm = norm.startsWith(` ${word} `) ? norm.slice(word.length + 1) : norm.slice(0, norm.length - word.length - 1);
      break;
    }
  }
  return { area, tokens: tokensOf(norm.trim()) };
}

/**
 * Indirizzi che contengono tutte le parole cercate (anche come inizio di parola: "calle mines" trova
 * Calle Minestra). Prima quelli della zona indicata, poi i nomi che iniziano come la ricerca, poi i più corti.
 */
export function searchAddresses(index: readonly IndexEntry[], text: string, limit = 8): AddressHit[] {
  const { area, tokens } = parseAddressQuery(text);
  if (tokens.length === 0 || tokens.join('').length < 3) return [];
  const phrase = tokens.join(' ');
  const scored: { e: IndexEntry; score: number }[] = [];
  for (const e of index) {
    if (!tokens.every((q) => e.tokens.some((t) => t.startsWith(q)))) continue;
    let score = 0;
    if (area && e.area === area) score += 100;
    if (e.tokens.join(' ').startsWith(phrase)) score += 20;
    if (tokens.every((q) => e.tokens.includes(q))) score += 10;
    score -= e.name.length / 100;
    scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name, 'it'));
  return scored.slice(0, limit).map(({ e }) => ({ name: e.name, area: e.area, lon: e.lon, lat: e.lat }));
}

/** Etichetta per il planner e la ricerca: «Calle Minestra, Cannaregio» */
export const addressLabel = (h: AddressHit) => (h.area ? `${h.name}, ${h.area}` : h.name);
