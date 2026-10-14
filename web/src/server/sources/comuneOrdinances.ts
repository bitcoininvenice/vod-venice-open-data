/**
 * Ordinanze del Comune di Venezia (atti pubblici): elenco dall'API usata dalla pagina "Ordinanze" del sito,
 * validità e allegato dalla pagina di ogni atto, posizione dalla mappa della stessa pagina.
 * Funzioni pure qui; le richieste sono nella route /api/ordinanze.
 */
import { ORDINANCES_PAGE, type OrdinanceKind, type OrdinanceStatus } from '@/lib/contracts/ordinances';

export { ORDINANCES_PAGE };

export const ORDINANCES_API = 'https://gwapi.sad.ve.it/ve/ordinanze/1.0.0';
export const ordinanceUrl = (id: string) => `https://www.comune.venezia.it/it/content/ordinanza?idPratica=${id}`;
export const attachmentUrl = (id: string) => `${ORDINANCES_API}/download/${id}`;

/** Ambiti dell'API (il traffico acqueo è l'unico che colora i canali) */
export const AMBITI = { trafficoAcqueo: '12252' } as const;
/**
 * Luoghi dell'API letti da VOD: tutti tranne la terraferma, con quanti giorni indietro guardare.
 * Gli atti per tutto il territorio (es. impianti termici, limitazioni del traffico) restano in vigore per mesi.
 */
export const LUOGHI: { id: string; name: string; lookbackDays: number }[] = [
  { id: '12255', name: 'Venezia Città Storica', lookbackDays: 90 },
  { id: '12260', name: 'Lido - Pellestrina', lookbackDays: 90 },
  { id: '12261', name: 'Murano', lookbackDays: 180 },
  { id: '12262', name: 'Burano', lookbackDays: 180 },
  { id: '12265', name: 'Intero territorio comunale', lookbackDays: 180 },
  { id: '12263', name: 'Altro', lookbackDays: 180 },
];
/** Luoghi esclusi (terraferma): l'API indica il luogo in chiaro */
const MAINLAND = /mestre|carpenedo|favaro|marghera|chirignago|zelarino|terraferma/i;

export interface RawOrdinance {
  idPratica: string;
  dataRepertorio: string;
  numeroRepertorio: string;
  titolo: string;
  ambito: string;
  luogo: string;
}

/** "29/05/2025" -> "2025-05-29" (null se non valida) */
export function italianDate(s: string | null | undefined): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function parseOrdinanceList(raw: unknown): RawOrdinance[] {
  const d = raw as { status?: string; data?: { elencoOrdinanze?: RawOrdinance[] } };
  if (d?.status !== 'success' || !Array.isArray(d.data?.elencoOrdinanze)) throw new Error('elenco ordinanze non valido');
  return d.data!.elencoOrdinanze!.filter((o) => o && o.idPratica && o.titolo);
}

export const isCityOrIslands = (o: Pick<RawOrdinance, 'luogo'>) => !MAINLAND.test(o.luogo ?? '');

/**
 * Titoli che possono contenere dati personali (persone fisiche, provvedimenti individuali): VOD non li
 * ripubblica, anche se sono sul sito del Comune (minimizzazione, GDPR art. 5).
 */
const PERSONAL_DATA = /\b(sig\.?(?:ra)?|sigg\.|signor[ae]?|nat[oa] a|nat[oa] il|residente|a carico d|intestat|codice fiscale|c\.f\.|ditta individuale|trattamento sanitario|t\.s\.o\.|accertamento sanitario|sgombero dell'alloggio|nucleo familiare|minor[ei])\b/i;
export const mayContainPersonalData = (title: string) => PERSONAL_DATA.test(title);

export interface OrdinanceDetail {
  validFrom: string | null;
  validTo: string | null;
  attachmentId: string | null;
}

/** Validità e primo allegato dalla pagina dell'atto; null se la pagina non è quella attesa (es. verifica anti-bot). */
export function parseOrdinanceDetail(html: string): OrdinanceDetail | null {
  if (!/Dettagli ordinanza/.test(html)) return null;
  const text = html.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');
  const field = (label: string) => {
    const m = new RegExp(`${label}\\s*\\n[\\s\\n]*(\\d{2}\\/\\d{2}\\/\\d{4})`).exec(text);
    return m ? italianDate(m[1]) : null;
  };
  const att = /class="download-link"[^>]*data-id="(\d+)"/.exec(html) ?? /data-id="(\d+)"[^>]*class="download-link"/.exec(html);
  return { validFrom: field('Data Inizio Validit(?:à|&agrave;)'), validTo: field('Data Fine Validit(?:à|&agrave;)'), attachmentId: att ? att[1] : null };
}

/** Punti della mappa nella pagina "Ordinanze": idPratica -> [lon, lat] */
export function parseOrdinancePoints(html: string): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  for (const m of html.matchAll(/var polygonsData = (\[[\s\S]*?\]);/g)) {
    try {
      for (const p of JSON.parse(m[1]) as { id: string; coords: [number, number] }[]) {
        if (p?.id && Array.isArray(p.coords) && p.coords.length === 2) out.set(String(p.id), [p.coords[0], p.coords[1]]);
      }
    } catch {
      // blocco commentato o non valido: si ignora
    }
  }
  return out;
}

/** Tipo dell'ordinanza dal titolo (indicativo) */
export function ordinanceKind(title: string): OrdinanceKind {
  const t = title.toLowerCase();
  if (/chiusura|interdizion|interdett|divieto|vietat|sospension|esclusione dal servizio/.test(t)) return 'closure';
  if (/manifestazion|regata|evento|corteo|festa|competizion|partit|ripres[ae] (?:film|cinematograf)|spettacol/.test(t)) return 'event';
  if (/cantier|lavor|intervent|restaur|manutenzion|scavo|rifaciment|opere|installazion|rimozion/.test(t)) return 'works';
  return 'other';
}

/** Stato rispetto a oggi (YYYY-MM-DD, ora di Venezia). Senza validità: "da verificare" se l'atto è recente. */
export function ordinanceStatus(
  validFrom: string | null,
  validTo: string | null,
  actDate: string,
  today: string,
  upcomingDays = 7,
  unverifiedDays = 21,
): OrdinanceStatus | null {
  const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  if (validFrom || validTo) {
    if (validTo && validTo < today) return null;
    if (validFrom && validFrom > today) return validFrom <= addDays(today, upcomingDays) ? 'upcoming' : null;
    return 'active';
  }
  return actDate >= addDays(today, -unverifiedDays) ? 'unverified' : null;
}

const norm = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’`]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Canale citato nel titolo: il nome di canale OSM più lungo contenuto nel titolo
 * (solo rii, canali e bacini, almeno 8 caratteri, per evitare corrispondenze casuali).
 */
export function matchCanal(title: string, canalNames: string[]): string | null {
  const t = ` ${norm(title)} `;
  let best: string | null = null;
  for (const name of canalNames) {
    if (!/^(rio|canal|canale|bacino|rielo)\b/i.test(name)) continue;
    const n = norm(name);
    if (n.length < 8) continue;
    if (t.includes(` ${n} `) && (!best || n.length > norm(best).length)) best = name;
  }
  return best;
}

/** Normalizzazione tollerante per i toponimi veneziani: "della" = "de la", doppie semplificate, abbreviazioni sciolte */
const loose = (s: string) =>
  norm(s)
    .replace(/\bf ta\b/g, 'fondamenta')
    .replace(/\bf te\b/g, 'fondamente')
    .replace(/\bc po\b/g, 'campo')
    .replace(/\bde (la|le|l|i|lo)\b/g, 'de$1')
    .replace(/([a-z])\1+/g, '$1');

const PLACE_PREFIX = /^(ponte|fondamenta|fondamente|campo|campiello|campazzo|calle|calletta|salizada|salizzada|riva|rio ter[aà]|ramo|corte|sotoportego|sottoportico|piscina|ruga|rughetta|lista|crosera|piazza|piazzale|piazzetta|via|viale|gran viale|strada|lungomare|borgo|sacca|merceria|marzaria|zattere|rivo|chiovere)\b/i;

type Box = [minLon: number, minLat: number, maxLon: number, maxLat: number];
/** Zone indicate dal campo "luogo" dell'atto */
const ZONES: [RegExp, Box[]][] = [
  [/citt[aà] storica|venezia centro|centro storico/i, [[12.29, 45.415, 12.375, 45.456]]],
  [/lido|pellestrina/i, [[12.355, 45.36, 12.44, 45.43], [12.25, 45.22, 12.36, 45.40]]],
  [/burano|mazzorbo|torcello/i, [[12.40, 45.475, 12.43, 45.50]]],
  [/murano/i, [[12.33, 45.45, 12.37, 45.465]]],
  [/sant.?erasmo|vignole/i, [[12.37, 45.44, 12.44, 45.475]]],
];

const inBoxes = ([lon, lat]: [number, number], boxes: Box[]) =>
  boxes.some(([a, b, c, d]) => lon >= a && lon <= c && lat >= b && lat <= d);

const far = (a: [number, number], b: [number, number]) =>
  Math.hypot((a[0] - b[0]) * 78000, (a[1] - b[1]) * 110540) > 300;

type PlaceIndex = { key: string; name: string; points: [number, number][] }[];
const indexCache = new WeakMap<object, PlaceIndex>();

/** Nomi di luogo normalizzati; le grafie che coincidono ("Strada comunale"/"Strada Comunale") sono unite. */
function placeIndex(toponyms: Record<string, [number, number][]>): PlaceIndex {
  const cached = indexCache.get(toponyms);
  if (cached) return cached;
  const byKey = new Map<string, { key: string; name: string; points: [number, number][] }>();
  for (const [name, points] of Object.entries(toponyms)) {
    if (!PLACE_PREFIX.test(name)) continue;
    const key = loose(name);
    if (key.length < 10) continue;
    const e = byKey.get(key) ?? { key, name, points: [] };
    for (const p of points) if (e.points.every((q) => far(p, q))) e.points.push(p);
    byKey.set(key, e);
  }
  const out = [...byKey.values()].sort((a, b) => b.key.length - a.key.length);
  indexCache.set(toponyms, out);
  return out;
}

/** Varianti del titolo: "S." può essere San o Santa, "SS." Santi */
function titleVariants(title: string): string[] {
  const t = loose(title);
  // dopo la semplificazione delle doppie "SS." e "S." diventano entrambi "s "
  const out = new Set([t, ...['san', 'santa', 'sant', 'santi'].map((w) => t.replace(/\bs (?=[a-z])/g, `${w} `))]);
  return [...out].map((v) => ` ${v} `);
}

/**
 * Luogo citato nel titolo (calle, fondamenta, ponte, campo, via…) con la sua posizione dai toponimi OSM.
 * Si prova dal nome più lungo; un nome che resta ambiguo nella zona dell'atto (es. "Calle del Forno") è scartato.
 */
export function matchPlace(
  title: string,
  luogo: string,
  toponyms: Record<string, [number, number][]>,
): { name: string; point: [number, number] } | null {
  const variants = titleVariants(title);
  const zone = ZONES.find(([re]) => re.test(luogo))?.[1] ?? null;
  for (const e of placeIndex(toponyms)) {
    if (!variants.some((v) => v.includes(` ${e.key} `))) continue;
    const points = zone ? e.points.filter((p) => inBoxes(p, zone)) : e.points;
    if (points.length === 1) return { name: e.name, point: points[0] };
  }
  return null;
}
