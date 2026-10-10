/**
 * Ricerca dei numeri civici veneziani ("Cannaregio 3450"): a Venezia la numerazione è per sestiere,
 * non per via (la Giudecca ha la sua). Dati da OpenStreetMap, copertura parziale: se il civico
 * manca si indica il civico noto più vicino dello stesso sestiere, segnalato come approssimato.
 */

export const SESTIERI_CIVICI = ['Cannaregio', 'Castello', 'Dorsoduro', 'Giudecca', 'San Marco', 'San Polo', 'Santa Croce'] as const;
export type SestiereCivico = (typeof SESTIERI_CIVICI)[number];

/** [numero, lettera, lon, lat] */
export type CivicRow = [number, string, number, number];

/** Nomi, sigle e grafie usate per i sestieri (minuscole, senza punti e spazi). */
const NAMES: Record<string, SestiereCivico> = {
  cannaregio: 'Cannaregio', canaregio: 'Cannaregio', cn: 'Cannaregio',
  castello: 'Castello', cs: 'Castello',
  dorsoduro: 'Dorsoduro', dd: 'Dorsoduro', do: 'Dorsoduro',
  giudecca: 'Giudecca', gd: 'Giudecca',
  sanmarco: 'San Marco', smarco: 'San Marco', sm: 'San Marco',
  sanpolo: 'San Polo', spolo: 'San Polo', sp: 'San Polo',
  santacroce: 'Santa Croce', scroce: 'Santa Croce', sc: 'Santa Croce',
};

export interface CivicQuery {
  sestiere: SestiereCivico;
  number: number;
  letter: string;
}

/** "Cannaregio 3450", "CN 3450/b", "s. marco, 1234", "SanPolo1200A" -> sestiere, numero e lettera. */
export function parseCivicQuery(text: string): CivicQuery | null {
  const m = text.trim().match(/^(.+?)[\s,]*(\d{1,5})\s*(?:\/|-)?\s*([a-z])?$/i);
  if (!m) return null;
  const key = m[1].toLowerCase().replace(/[.\s'’-]/g, '');
  const sestiere = NAMES[key];
  if (!sestiere) return null;
  return { sestiere, number: Number(m[2]), letter: (m[3] ?? '').toUpperCase() };
}

export interface CivicMatch {
  match: 'exact' | 'nearest';
  sestiere: SestiereCivico;
  /** civico trovato (uguale alla richiesta se exact) */
  number: number;
  letter: string;
  lon: number;
  lat: number;
  /** distanza in numeri dal civico richiesto (0 se exact) */
  gap: number;
}

/**
 * Civico esatto (con la lettera se indicata, altrimenti il numero senza lettera o la prima lettera),
 * altrimenti il numero noto più vicino nello stesso sestiere. null se il sestiere non ha civici.
 */
export function findCivic(rows: readonly CivicRow[], q: CivicQuery): CivicMatch | null {
  if (rows.length === 0) return null;
  const same = rows.filter((r) => r[0] === q.number);
  const exact = same.find((r) => r[1] === q.letter) ?? (q.letter === '' ? same[0] : undefined);
  const pick = (r: CivicRow, match: CivicMatch['match']): CivicMatch => ({
    match, sestiere: q.sestiere, number: r[0], letter: r[1], lon: r[2], lat: r[3], gap: Math.abs(r[0] - q.number),
  });
  if (exact) return pick(exact, 'exact');
  // stesso numero con un'altra lettera: è lo stesso portone o quello accanto
  if (same.length > 0) return pick(same[0], 'nearest');
  // ricerca binaria del numero più vicino (righe ordinate per numero)
  let lo = 0;
  let hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] < q.number) lo = mid;
    else hi = mid;
  }
  const best = Math.abs(rows[lo][0] - q.number) <= Math.abs(rows[hi][0] - q.number) ? rows[lo] : rows[hi];
  return pick(best, 'nearest');
}

/** Etichetta del civico: "Cannaregio 3450", "San Polo 1200 A". */
export function civicLabel(sestiere: string, number: number, letter = ''): string {
  return `${sestiere} ${number}${letter ? ` ${letter}` : ''}`;
}
