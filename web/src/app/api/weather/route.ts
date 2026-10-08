import { NextResponse } from 'next/server';
import { METEO_MARINE_WIND_STATIONS } from '@/lib/weatherWindData';
import { fetchUpstream } from '@/server/upstream';
import { LIPZ_METAR_URL, parseLipzMetar } from '@/server/sources/metar';

export const revalidate = 300;

export async function GET() {
  const metar = await fetchUpstream(LIPZ_METAR_URL, parseLipzMetar, { revalidate: 300 });

  // Solo la stazione aeroportuale viene aggiornata con il METAR reale; le altre restano valori di riferimento.
  const windStations = METEO_MARINE_WIND_STATIONS.map((st) => {
    if (st.id !== 'WIND_LIPZ_AERONAUTICA') return st;
    if (!metar.ok) return { ...st, metar: undefined };
    const m = metar.data;
    return {
      ...st,
      metar: m,
      windSpeedKmh: m.windSpeedKmh,
      windSpeedKnots: m.windSpeedKnots,
      gustSpeedKnots: m.gustSpeedKnots ?? m.windSpeedKnots,
      windDirectionDeg: m.windDirectionDeg,
      airTempCelsius: m.temperatureCelsius,
      pressureHpa: m.qnhHpa,
      humidityPercent: m.relativeHumidityPercent,
    };
  });

  return NextResponse.json({
    ok: metar.ok,
    success: true,
    data: {
      metar: metar.ok ? metar.data : null,
      windStations,
    },
    meta: {
      metar: {
        kind: 'live',
        source: 'METAR ICAO LIPZ – NOAA Aviation Weather Center',
        sourceUrl: 'https://aviationweather.gov/data/metar/?ids=LIPZ',
        license: 'Pubblico dominio (US Government)',
        fetchedAt: metar.ok ? metar.fetchedAt : undefined,
        observedAt: metar.ok ? metar.data.observationTime : undefined,
        note: metar.ok ? undefined : 'METAR temporaneamente non disponibile',
      },
      windStations: {
        kind: 'static-reference',
        source: 'Anagrafica stazioni meteo-marine (CNR-ISMAR, CPSM, ISPRA, ARPAV)',
        note: 'Ad eccezione di LIPZ, i valori di vento e onda sono di riferimento e non aggiornati in tempo reale.',
      },
    },
  });
}
