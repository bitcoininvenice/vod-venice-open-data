import { NextResponse } from 'next/server';
import { CPSM_LICENSE_META } from '@/lib/cpsmLicense';
import { METEO_MARINE_WIND_STATIONS } from '@/lib/weatherWindData';
import type { MeteoMarineWindItem } from '@/lib/types';
import { fetchUpstream } from '@/server/upstream';
import { LIPZ_METAR_URL, parseLipzMetar } from '@/server/sources/metar';
import { buildWindStations, cityAirTemperature, CPSM_METEO_URLS, parseCpsmFeed, type CpsmFeedName } from '@/server/sources/cpsmMeteo';
import { PROVIDERS, providerMeta } from '@/lib/provenance/providers';

export const revalidate = 300;

const CPSM_FEEDS: CpsmFeedName[] = ['vento', 'ondeMare', 'ondeLaguna', 'tempAria', 'pressione', 'umidita', 'livello'];

export async function GET() {
  const [metar, ...cpsm] = await Promise.all([
    fetchUpstream(LIPZ_METAR_URL, parseLipzMetar, { revalidate: 300 }),
    ...CPSM_FEEDS.map((name) => fetchUpstream(CPSM_METEO_URLS[name], parseCpsmFeed, { revalidate: 300 })),
  ]);

  const feeds = Object.fromEntries(
    CPSM_FEEDS.flatMap((name, i) => {
      const r = cpsm[i];
      return r.ok ? [[name, r.data]] : [];
    }),
  );
  const cpsmStations = buildWindStations(feeds);
  // Temperatura del centro storico (Palazzo Cavalli e riserve), mostrata nella barra dell'orario
  const cityTemp = feeds.tempAria ? cityAirTemperature(feeds.tempAria, feeds.umidita) : null;

  // Stazione aeroportuale: anagrafica + METAR reale (se disponibile)
  const lipzBase = METEO_MARINE_WIND_STATIONS.find((s) => s.id === 'WIND_LIPZ_AERONAUTICA');
  const lipz: MeteoMarineWindItem[] =
    lipzBase && metar.ok
      ? [{
          ...lipzBase,
          metar: metar.data,
          windDirectionDeg: metar.data.windDirectionDeg,
          windSpeedKmh: metar.data.windSpeedKmh,
          windSpeedKnots: metar.data.windSpeedKnots,
          gustSpeedKnots: metar.data.gustSpeedKnots ?? metar.data.windSpeedKnots,
          gustSpeedKmh: Math.round((metar.data.gustSpeedKnots ?? metar.data.windSpeedKnots) * 1.852 * 10) / 10,
          waveHeightMeters: null,
          airTempCelsius: metar.data.temperatureCelsius,
          pressureHpa: metar.data.qnhHpa,
          humidityPercent: metar.data.relativeHumidityPercent,
          windTypeDescription: `METAR LIPZ: ${metar.data.rawMetar}`,
          observedAt: metar.data.observationTime,
        }]
      : [];

  return NextResponse.json({
    ok: metar.ok || cpsmStations.length > 0,
    success: true,
    data: {
      metar: metar.ok ? metar.data : null,
      windStations: [...lipz, ...cpsmStations],
      cityTemp,
    },
    meta: {
      metar: {
        kind: 'live',
        ...providerMeta('noaa', 'METAR ICAO LIPZ – NOAA Aviation Weather Center'),
        sourceUrl: `${PROVIDERS.noaa.url}/data/metar/?ids=LIPZ`,
        fetchedAt: metar.ok ? metar.fetchedAt : undefined,
        observedAt: metar.ok ? metar.data.observationTime : undefined,
        note: metar.ok ? undefined : 'METAR temporaneamente non disponibile',
      },
      windStations: {
        kind: 'live',
        source: 'Comune di Venezia – CPSM, rete meteo-marina (dati.venezia.it)',
        sourceUrl: PROVIDERS.cpsm.datasetUrl,
        ...CPSM_LICENSE_META,
        fetchedAt: new Date().toISOString(),
        note: `${cpsmStations.length} stazioni CPSM con coordinate pubblicate; misure aggiornate ogni 5 minuti.`,
      },
      cityTemp: {
        kind: cityTemp ? 'live' : 'unavailable',
        source: 'Comune di Venezia – CPSM, temperatura e umidità dell’aria (dati.venezia.it)',
        sourceUrl: 'https://dati.venezia.it/sites/default/files/dataset/opendata/temparia.json',
        ...CPSM_LICENSE_META,
        note: 'Prima stazione del centro storico con una misura delle ultime 2 ore: Palazzo Cavalli, poi San Giorgio, poi Misericordia. L’umidità è della stessa stazione.',
      },
    },
  });
}
