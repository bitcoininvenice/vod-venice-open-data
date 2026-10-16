import 'server-only';
import { GRID } from '@/lib/simulation-data';
import { romeLocalToDate } from '@/lib/time';
import type { FuelPrice, FuelStation } from '@/lib/fuel';
import { USER_AGENT } from '@/server/upstream';

/**
 * Prezzi dei carburanti dal dataset aperto del MIMIT (IODL 2.0): due CSV pubblicati ogni giorno con i prezzi
 * in vigore alle 8, anagrafica degli impianti e prezzi. Insieme pesano circa 7,5 MB per tutta Italia: si
 * leggono al massimo ogni FUEL_REFRESH_S per istanza del server, una volta sola per route e stato delle fonti,
 * e si tiene solo l'area della mappa. Il sito in tempo reale dell'Osservatorio non si interroga: la sua API
 * non è pubblicata come open data.
 */
export const FUEL_STATIONS_URL = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
export const FUEL_PRICES_URL = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';
export const FUEL_REFRESH_S = 6 * 3600;
/** Sotto questa soglia di impianti in Italia il file è incompleto: si tiene l'ultima lettura valida */
const MIN_STATIONS_ITALY = 15_000;

const [LON0, LON1, LAT0, LAT1] = GRID.frame;
/**
 * Comuni il cui territorio cade nell'area della mappa. Un impianto di un altro comune con coordinate qui è un
 * errore del dato del Ministero (es. un distributore di Treviso o di Cossato collocato a Venezia): si scarta.
 */
const AREA_COMUNI = new Set([
  'VENEZIA', 'CHIOGGIA', 'CAVALLINO-TREPORTI', 'MIRA', 'SPINEA', 'MIRANO', 'MARCON', 'MARTELLAGO', 'SALZANO', 'SCORZÈ',
  'MOGLIANO VENETO', 'PREGANZIOL', "QUARTO D'ALTINO", 'CAMPAGNA LUPIA', 'CODEVIGO', 'DOLO', 'NOALE',
]);

/** Riga «Estrazione del YYYY-MM-DD» in testa ai file */
function extractionDate(text: string): string | null {
  return text.slice(0, 80).match(/Estrazione del (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

/** Righe del CSV come oggetti: dal 10/02/2026 il separatore è «|», prima era «;» */
function rows(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const headerAt = lines.findIndex((l) => l.startsWith('idImpianto'));
  if (headerAt < 0) throw new Error('intestazione idImpianto mancante');
  const sep = lines[headerAt].includes('|') ? '|' : ';';
  const header = lines[headerAt].split(sep).map((h) => h.trim());
  return lines.slice(headerAt + 1).map((line) => {
    const cells = line.split(sep);
    return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

/** «castello n. 71  71 30122» -> «castello n. 71 71»: spazi doppi e CAP finale tolti */
function cleanAddress(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\s*\b30\d{3}\s*$/, '').trim();
}

/** «13/10/2026 20:00:07» (ora di Venezia) -> ISO */
function communicatedAt(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/);
  return m ? romeLocalToDate(`${m[3]}-${m[2]}-${m[1]} ${m[4]}`).toISOString() : null;
}

export interface FuelDataset {
  /** data dell'estrazione del Ministero (prezzi in vigore alle 8 di quel giorno) */
  extractedAt: string | null;
  stationsItaly: number;
  stations: FuelStation[];
}

/** Distributori dell'area della mappa con i loro prezzi. Mai il nome del gestore né quello dell'impianto. */
export function parseFuel(stationsCsv: string, pricesCsv: string, minStationsItaly = MIN_STATIONS_ITALY): FuelDataset {
  const anag = rows(stationsCsv);
  if (anag.length < minStationsItaly) throw new Error(`anagrafica incompleta: ${anag.length} impianti`);
  const stations = new Map<string, FuelStation>();
  for (const r of anag) {
    const lat = Number(r.Latitudine);
    const lon = Number(r.Longitudine);
    if (!r.idImpianto || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < LAT0 || lat > LAT1 || lon < LON0 || lon > LON1) continue;
    if (!AREA_COMUNI.has((r.Comune ?? '').trim().toUpperCase())) continue;
    stations.set(r.idImpianto, {
      id: r.idImpianto,
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      brand: r.Bandiera || 'Pompe Bianche',
      address: cleanAddress(r.Indirizzo ?? ''),
      comune: r.Comune ?? '',
      highway: /autostrad/i.test(r['Tipo Impianto'] ?? ''),
      prices: [],
    });
  }
  for (const r of rows(pricesCsv)) {
    const s = stations.get(r.idImpianto);
    const price = Number(r.prezzo);
    if (!s || !r.descCarburante || !Number.isFinite(price) || price <= 0) continue;
    const p: FuelPrice = { fuel: r.descCarburante, self: r.isSelf === '1', price, communicatedAt: communicatedAt(r.dtComu ?? '') };
    s.prices.push(p);
  }
  const list = [...stations.values()].filter((s) => s.prices.length > 0);
  for (const s of list) s.prices.sort((a, b) => a.fuel.localeCompare(b.fuel) || Number(b.self) - Number(a.self));
  return { extractedAt: extractionDate(pricesCsv) ?? extractionDate(stationsCsv), stationsItaly: anag.length, stations: list.sort((a, b) => b.lat - a.lat) };
}

export type FuelResult = { ok: true; data: FuelDataset; fetchedAt: string } | { ok: false; error: string };

let last: { data: FuelDataset; at: number } | null = null;
let inflight: Promise<FuelResult> | null = null;

async function readText(url: string, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { 'User-Agent': USER_AGENT },
    // Next non salva in cache le risposte oltre 2 MB (lo segnala nei log): vale la cache in memoria qui sotto.
    // revalidate, e non no-store, lascia statiche le route che leggono i carburanti (rigenerate a intervalli).
    next: { revalidate: FUEL_REFRESH_S },
  });
  if (!res.ok) throw new Error(`upstream_http_${res.status}`);
  return res.text();
}

async function load(fetchImpl: typeof fetch, now: number): Promise<FuelResult> {
  try {
    const [stationsCsv, pricesCsv] = await Promise.all([readText(FUEL_STATIONS_URL, fetchImpl), readText(FUEL_PRICES_URL, fetchImpl)]);
    const data = parseFuel(stationsCsv, pricesCsv);
    last = { data, at: now };
    return { ok: true, data, fetchedAt: new Date(now).toISOString() };
  } catch (err) {
    console.warn(`[carburanti] ${err instanceof Error ? err.message : String(err)}`);
    // l'ultima lettura valida resta buona finché il Ministero non pubblica la successiva
    if (last) return { ok: true, data: last.data, fetchedAt: new Date(last.at).toISOString() };
    return { ok: false, error: 'upstream_unavailable' };
  }
}

/** Distributori e prezzi dell'area: una lettura ogni FUEL_REFRESH_S condivisa da route e stato delle fonti. */
export function fuelStations(fetchImpl: typeof fetch = fetch, now: number = Date.now()): Promise<FuelResult> {
  if (last && now - last.at < FUEL_REFRESH_S * 1000) {
    return Promise.resolve({ ok: true, data: last.data, fetchedAt: new Date(last.at).toISOString() });
  }
  inflight ??= load(fetchImpl, now).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Solo per i test */
export function resetFuelCache(): void {
  last = null;
  inflight = null;
}
