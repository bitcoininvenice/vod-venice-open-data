import { z } from 'zod';
import type {
  TideCategory,
  TideForecast,
  TideForecastExtreme,
  TideStation,
  TideTrend,
} from '@/lib/contracts/tide';
import { romeLocalToDate } from '@/lib/time';

export const TIDE_LEVELS_URL = 'https://dati.venezia.it/sites/default/files/dataset/opendata/livello.json';
export const TIDE_FORECAST_URL = 'https://dati.venezia.it/sites/default/files/dataset/opendata/previsione.json';

/** Punta Salute Canal Grande: stazione di riferimento storica del CPSM. */
export const REFERENCE_STATION_ID = '1025';

/** Una previsione emessa da più di 24 ore viene segnalata come non aggiornata. */
const FORECAST_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

// Il Comune a volte pubblica l'elenco stazioni senza misure (campi data/valore assenti):
// quelle righe vengono scartate invece di invalidare l'intero file.
const RawLevels = z.array(
  z.object({
    ID_stazione: z.string(),
    stazione: z.string(),
    latDDN: z.coerce.number(),
    lonDDE: z.coerce.number(),
    data: z.string().optional(),
    valore: z.string().optional(),
  }),
);

const RawForecast = z.array(
  z.object({
    DATA_PREVISIONE: z.string(),
    DATA_ESTREMALE: z.string(),
    TIPO_ESTREMALE: z.string(),
    VALORE: z.coerce.number(),
  }),
);

/** "0.17 m" -> 17 ; restituisce null se il valore non è numerico. */
export function metersStringToCm(value: string): number | null {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function parseTideLevels(raw: unknown): TideStation[] {
  return RawLevels.parse(raw).flatMap((s) => {
    if (!s.valore || !s.data) return [];
    const levelCm = metersStringToCm(s.valore);
    if (levelCm === null) return [];
    return [{ id: s.ID_stazione, name: s.stazione, lat: s.latDDN, lon: s.lonDDE, levelCm, observedAt: s.data }];
  });
}

// Spostata in lib/time.ts perché serve anche lato client; riesportata per gli import esistenti.
export { romeLocalToDate };

export function parseTideForecast(raw: unknown, now: Date = new Date()): TideForecast | null {
  const rows = RawForecast.parse(raw);
  if (rows.length === 0) return null;

  const issuedAt = rows.map((r) => r.DATA_PREVISIONE).sort().at(-1)!;
  const extremes: TideForecastExtreme[] = rows
    .filter((r) => r.TIPO_ESTREMALE === 'max' || r.TIPO_ESTREMALE === 'min')
    .map((r) => ({ at: r.DATA_ESTREMALE, type: r.TIPO_ESTREMALE as 'max' | 'min', levelCm: Math.round(r.VALORE) }))
    .sort((a, b) => a.at.localeCompare(b.at));

  const stale = now.getTime() - romeLocalToDate(issuedAt).getTime() > FORECAST_STALE_AFTER_MS;
  return { issuedAt, stale, extremes };
}

/** Prossimo estremale dopo `now`, oppure null se la previsione non copre il futuro. */
export function nextExtreme(forecast: TideForecast | null, now: Date = new Date()): TideForecastExtreme | null {
  if (!forecast) return null;
  return forecast.extremes.find((e) => romeLocalToDate(e.at).getTime() > now.getTime()) ?? null;
}

/** Tendenza ricavata dal prossimo estremale previsto: se il prossimo è un massimo la marea sta crescendo. */
export function trendFromForecast(forecast: TideForecast | null, now: Date = new Date()): TideTrend | null {
  const next = nextExtreme(forecast, now);
  if (!next) return null;
  return next.type === 'max' ? 'IN_AUMENTO' : 'IN_CALO';
}

/** Classificazione CPSM del livello di marea a Punta Salute. */
export function tideCategory(levelCm: number): TideCategory {
  if (levelCm >= 140) return 'ECCEZIONALE';
  if (levelCm >= 110) return 'MOLTO_SOSTENUTA';
  if (levelCm >= 80) return 'SOSTENUTA';
  return 'NORMALE';
}
