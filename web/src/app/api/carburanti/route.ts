import { NextResponse } from 'next/server';
import { FUEL_REFRESH_S, fuelStations } from '@/server/sources/mimitFuel';
import { FUEL_STALE_DAYS } from '@/lib/fuel';
import { providerMeta } from '@/lib/provenance/providers';

// Il Ministero pubblica una volta al giorno: la risposta si rigenera al massimo ogni 6 ore
export const revalidate = 21600;
export const maxDuration = 60;

export async function GET() {
  const res = await fuelStations();
  return NextResponse.json(
    {
      success: res.ok,
      count: res.ok ? res.data.stations.length : 0,
      data: res.ok ? res.data.stations : [],
      meta: {
        kind: res.ok ? 'static-reference' : 'unavailable',
        ...providerMeta('mimitFuel'),
        extractedAt: res.ok ? res.data.extractedAt : null,
        fetchedAt: res.ok ? res.fetchedAt : null,
        refreshSeconds: FUEL_REFRESH_S,
        error: res.ok ? undefined : res.error,
        note: `Prezzi comunicati dai gestori al Ministero (art. 51 L. 99/2009), in vigore alle 8 del giorno dell'estrazione: non sono prezzi in tempo reale. Solo i distributori nell'area della mappa; marchio e indirizzo, senza il nome del gestore. Un prezzo comunicato da oltre ${FUEL_STALE_DAYS} giorni non entra nel confronto della mappa.`,
      },
    },
    { status: res.ok ? 200 : 503 },
  );
}
