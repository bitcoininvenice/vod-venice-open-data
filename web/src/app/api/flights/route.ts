import { NextResponse } from 'next/server';
import { openSkyFlights, OPENSKY_REFRESH_S } from '@/server/sources/openskyClient';

// Una lettura OpenSky ogni 30 s condivisa da tutti i client (quota giornaliera: vedi openskyClient)
export const revalidate = 30;

export async function GET() {
  const result = await openSkyFlights();
  const meta = {
    kind: 'live' as const,
    source: 'OpenSky Network (ADS-B)',
    sourceUrl: 'https://opensky-network.org',
    license: 'Uso non commerciale / ricerca – termini OpenSky Network',
    usage: 'Dati per la sola visualizzazione nella mappa di VOD (progetto senza fini di lucro): non ridistribuire. Per altri usi vedere i termini di OpenSky Network.',
    citation: 'Matthias Schäfer, Martin Strohmeier, Vincent Lenders, Ivan Martinovic, Matthias Wilhelm: "Bringing Up OpenSky: A Large-scale ADS-B Sensor Network for Research", IPSN 2014. https://opensky-network.org',
    fetchedAt: result.fetchedAt ?? undefined,
    refreshSeconds: OPENSKY_REFRESH_S,
  };

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      success: true,
      count: 0,
      data: [],
      meta: {
        ...meta,
        note: result.quotaUntil
          ? `Quota giornaliera di OpenSky esaurita: nuovo tentativo dopo le ${result.quotaUntil}. Nessun volo mostrato.`
          : 'OpenSky non raggiungibile: nessun volo mostrato.',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    success: true,
    count: result.flights.length,
    data: result.flights,
    meta: result.stale
      ? { ...meta, note: `Ultima posizione nota delle ${result.fetchedAt}: OpenSky ${result.quotaUntil ? 'ha esaurito la quota giornaliera' : 'non risponde'} in questo momento.` }
      : result.flights.length === 0
      ? { ...meta, note: 'Nessun transponder rilevato nell\'area in questo momento (es. chiusura notturna dell\'aeroporto).' }
      : meta,
  });
}
