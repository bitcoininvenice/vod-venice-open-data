import { GRID } from '@/lib/simulation-data';
import { romeLocalToDate } from '@/lib/time';
import type { FuelPrice, FuelStation, OsmFuelRecord } from '@/lib/fuel';
import { withOsmDetails } from '@/lib/fuel';
import osmFuel from '@/data/osm-fuel.json';

export const MIMIT_PRICES_CSV_URL = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';
export const MIMIT_STATIONS_CSV_URL = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';

export const CLIENT_FUEL_STORAGE_KEY = 'vod_client_fuel_prices_v1';

const [LON0, LON1, LAT0, LAT1] = GRID.frame;
const AREA_COMUNI = new Set([
  'VENEZIA', 'CHIOGGIA', 'CAVALLINO-TREPORTI', 'MIRA', 'SPINEA', 'MIRANO', 'MARCON', 'MARTELLAGO', 'SALZANO', 'SCORZÈ',
  'MOGLIANO VENETO', 'PREGANZIOL', "QUARTO D'ALTINO", 'CAMPAGNA LUPIA', 'CODEVIGO', 'DOLO', 'NOALE',
]);

/** Estrae la data dalla riga iniziale "Estrazione del YYYY-MM-DD" */
export function extractDateFromCsv(text: string): string | null {
  return text.slice(0, 120).match(/Estrazione del (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

/** Converte la stringa della data comunicazione "DD/MM/YYYY HH:MM:SS" in stringa ISO */
export function parseCommunicatedAt(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/);
  return m ? romeLocalToDate(`${m[3]}-${m[2]}-${m[1]} ${m[4]}`).toISOString() : null;
}

/** Righe del CSV come oggetti: gestisce separatori pipe "|" e punto e virgola ";" */
export function parseCsvRows(text: string, idField: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const headerAt = lines.findIndex((l) => l.startsWith(idField));
  if (headerAt < 0) return [];
  const sep = lines[headerAt].includes('|') ? '|' : ';';
  const header = lines[headerAt].split(sep).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = headerAt + 1; i < lines.length; i++) {
    const cells = lines[i].split(sep);
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = (cells[c] ?? '').trim();
    }
    rows.push(obj);
  }
  return rows;
}

export interface ClientPricesResult {
  stations: FuelStation[];
  extractedAt: string | null;
  matchedStationsCount: number;
  totalPricesCount: number;
}

/**
 * Aggiorna i distributori correnti associando i prezzi estratti dal file prezzo_alle_8.csv.
 * I distributori vengono associati tramite id, mimitId o osm.mimitId.
 */
export function parseClientPricesCsv(pricesCsvText: string, currentStations: FuelStation[]): ClientPricesResult {
  const extractedAt = extractDateFromCsv(pricesCsvText);
  const rows = parseCsvRows(pricesCsvText, 'idImpianto');

  // Mappa di puntamento per lookup immediato O(1)
  const stationMap = new Map<string, FuelStation>();
  const clonedStations: FuelStation[] = currentStations.map((s) => ({
    ...s,
    prices: [],
  }));

  for (const s of clonedStations) {
    if (s.id) stationMap.set(s.id, s);
    if (s.mimitId) stationMap.set(s.mimitId, s);
    if (s.osm && 'mimitId' in s.osm && typeof (s.osm as { mimitId?: string }).mimitId === 'string') {
      const mId = (s.osm as { mimitId?: string }).mimitId;
      if (mId) stationMap.set(mId, s);
    }
  }

  let totalPricesCount = 0;
  for (const r of rows) {
    const id = r.idImpianto;
    if (!id) continue;
    const target = stationMap.get(id);
    if (!target) continue;

    const priceNum = Number(r.prezzo);
    if (!r.descCarburante || !Number.isFinite(priceNum) || priceNum <= 0) continue;

    const p: FuelPrice = {
      fuel: r.descCarburante,
      self: r.isSelf === '1',
      price: priceNum,
      communicatedAt: parseCommunicatedAt(r.dtComu ?? ''),
    };

    target.prices.push(p);
    totalPricesCount++;
  }

  // Ordina i prezzi per ogni distributore
  let matchedStationsCount = 0;
  for (const s of clonedStations) {
    if (s.prices.length > 0) {
      matchedStationsCount++;
      s.prices.sort((a, b) => a.fuel.localeCompare(b.fuel) || Number(b.self) - Number(a.self));
    }
  }

  return {
    stations: clonedStations,
    extractedAt,
    matchedStationsCount,
    totalPricesCount,
  };
}

/**
 * Parsifica sia anagrafica che prezzi nel browser (client-side), identico alla logica del server,
 * associando anche i dettagli di OpenStreetMap.
 */
export function parseClientFullDataset(stationsCsvText: string, pricesCsvText: string): ClientPricesResult {
  const extractedAt = extractDateFromCsv(pricesCsvText) ?? extractDateFromCsv(stationsCsvText);
  const anagRows = parseCsvRows(stationsCsvText, 'idImpianto');
  const stations = new Map<string, FuelStation>();

  for (const r of anagRows) {
    const lat = Number(r.Latitudine);
    const lon = Number(r.Longitudine);
    if (!r.idImpianto || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < LAT0 || lat > LAT1 || lon < LON0 || lon > LON1) continue;
    const comuneUpper = (r.Comune ?? '').trim().toUpperCase();
    if (!AREA_COMUNI.has(comuneUpper)) continue;

    stations.set(r.idImpianto, {
      id: r.idImpianto,
      mimitId: r.idImpianto,
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      brand: r.Bandiera || 'Pompe Bianche',
      address: (r.Indirizzo ?? '').replace(/\s+/g, ' ').replace(/\s*\b30\d{3}\s*$/, '').trim(),
      comune: r.Comune ?? '',
      highway: /autostrad/i.test(r['Tipo Impianto'] ?? ''),
      prices: [],
    });
  }

  const priceRows = parseCsvRows(pricesCsvText, 'idImpianto');
  let totalPricesCount = 0;
  for (const r of priceRows) {
    const s = stations.get(r.idImpianto);
    const priceNum = Number(r.prezzo);
    if (!s || !r.descCarburante || !Number.isFinite(priceNum) || priceNum <= 0) continue;
    const p: FuelPrice = {
      fuel: r.descCarburante,
      self: r.isSelf === '1',
      price: priceNum,
      communicatedAt: parseCommunicatedAt(r.dtComu ?? ''),
    };
    s.prices.push(p);
    totalPricesCount++;
  }

  const allStations = [...stations.values()].sort((a, b) => b.lat - a.lat);
  for (const s of allStations) {
    s.prices.sort((a, b) => a.fuel.localeCompare(b.fuel) || Number(b.self) - Number(a.self));
  }

  const withOsm = withOsmDetails(allStations, osmFuel.stations as OsmFuelRecord[]);
  const matchedStationsCount = withOsm.filter((s) => s.prices.length > 0).length;

  return {
    stations: withOsm,
    extractedAt,
    matchedStationsCount,
    totalPricesCount,
  };
}

export interface ClientFuelCacheEntry {
  stations: FuelStation[];
  extractedAt: string | null;
  savedAt: number;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

export function saveClientFuelCache(stations: FuelStation[], extractedAt: string | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const entry: ClientFuelCacheEntry = {
      stations,
      extractedAt,
      savedAt: Date.now(),
    };
    storage.setItem(CLIENT_FUEL_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Spazio esaurito o storage disabilitato: ignora silenziosamente
  }
}

export function loadClientFuelCache(): ClientFuelCacheEntry | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(CLIENT_FUEL_STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as ClientFuelCacheEntry;
    if (entry && Array.isArray(entry.stations) && entry.stations.length > 0) {
      return entry;
    }
  } catch {
    // Dati corrotti: ignora
  }
  return null;
}

export function clearClientFuelCache(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(CLIENT_FUEL_STORAGE_KEY);
  } catch {
    // Ignora
  }
}
