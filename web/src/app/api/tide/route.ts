import { NextResponse } from 'next/server';
import { CPSM_LICENSE_META } from '@/lib/cpsmLicense';
import type { MoseGateItem } from '@/lib/types';
import { MOSE_GATES } from '@/lib/moseGates';
import type { TideResponse, TideStation } from '@/lib/contracts/tide';
import { fetchUpstream } from '@/server/upstream';
import {
  REFERENCE_STATION_ID,
  TIDE_FORECAST_URL,
  TIDE_LEVELS_URL,
  parseTideForecast,
  parseTideLevels,
  tideCategory,
  trendFromForecast,
} from '@/server/sources/tide';

export const revalidate = 60;

const SOURCE_NAME = 'Comune di Venezia – Centro Previsioni e Segnalazioni Maree (dati.venezia.it)';

export async function GET() {
  const now = new Date();
  const [firstLevels, forecast] = await Promise.all([
    fetchUpstream(TIDE_LEVELS_URL, parseTideLevels, { revalidate: 60 }),
    fetchUpstream(TIDE_FORECAST_URL, (raw) => parseTideForecast(raw, now), { revalidate: 600 }),
  ]);

  // Se la copia in cache non contiene misure, un secondo tentativo senza cache: il portale
  // del Comune alterna copie aggiornate e copie senza valori.
  const levels =
    firstLevels.ok && firstLevels.data.length > 0
      ? firstLevels
      : await fetchUpstream(`${TIDE_LEVELS_URL}?t=${now.getTime()}`, parseTideLevels, { revalidate: 0 });

  const levelsOk = levels.ok && levels.data.length > 0;
  const stations: TideStation[] = levels.ok ? levels.data : [];
  const byId = new Map(stations.map((s) => [s.id, s]));
  const reference = byId.get(REFERENCE_STATION_ID) ?? null;
  const forecastData = forecast.ok ? forecast.data : null;

  const moseGates: MoseGateItem[] = MOSE_GATES.map(({ seaStationId, lagoonStationId, ...gate }) => ({
    ...gate,
    tideSeaCm: byId.get(seaStationId)?.levelCm ?? null,
    tideLagoonCm: byId.get(lagoonStationId)?.levelCm ?? null,
  }));

  const body: TideResponse = {
    ok: levelsOk,
    data: {
      reference,
      category: reference ? tideCategory(reference.levelCm) : null,
      trend: trendFromForecast(forecastData, now),
      stations,
      forecast: forecastData,
      moseGates,
    },
    meta: {
      levels: {
        kind: 'live',
        source: SOURCE_NAME,
        sourceUrl: TIDE_LEVELS_URL,
        ...CPSM_LICENSE_META,
        fetchedAt: levels.ok ? levels.fetchedAt : undefined,
        observedAt: reference?.observedAt,
        note: levelsOk ? undefined : 'Misure di marea temporaneamente non disponibili dalla fonte',
      },
      forecast: {
        kind: 'live',
        source: SOURCE_NAME,
        sourceUrl: TIDE_FORECAST_URL,
        ...CPSM_LICENSE_META,
        fetchedAt: forecast.ok ? forecast.fetchedAt : undefined,
        observedAt: forecastData?.issuedAt,
        note: forecastData?.stale ? 'La previsione pubblicata non risulta aggiornata nelle ultime 24 ore' : undefined,
      },
      mose: {
        kind: 'static-reference',
        source: 'Anagrafica schiere MOSE (MIT / Consorzio Venezia Nuova)',
        note: 'Lo stato operativo delle paratoie non è pubblicato come open data in tempo reale. Soglia di attivazione indicativa: previsione oltre +110 cm.',
      },
    },
  };

  return NextResponse.json(body, { status: levelsOk ? 200 : 503 });
}
