import { NextResponse } from 'next/server';
import { FUEL_REFRESH_S, fuelStations } from '@/server/sources/mimitFuel';
import { FUEL_KINDS, FUEL_STALE_DAYS, fuelSummary } from '@/lib/fuel';
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
      // statistiche dell'area e per zona per ogni carburante (stesso prezzo usato dai colori della mappa)
      summary: res.ok ? Object.fromEntries(FUEL_KINDS.map((k) => [k, fuelSummary(res.data.stations, k, Date.now(), res.data.listedWithoutPrices)])) : null,
      meta: {
        kind: res.ok ? 'static-reference' : 'unavailable',
        ...providerMeta('mimitFuel'),
        extractedAt: res.ok ? res.data.extractedAt : null,
        // impianti dell'anagrafica senza nessun prezzo: non in data, contati nel riepilogo
        listedWithoutPrices: res.ok ? res.data.listedWithoutPrices.length : null,
        fetchedAt: res.ok ? res.fetchedAt : null,
        refreshSeconds: FUEL_REFRESH_S,
        error: res.ok ? undefined : res.error,
        note: `Prezzi comunicati dai gestori al Ministero (art. 51 L. 99/2009), in vigore alle 8 del giorno dell'estrazione: non sono prezzi in tempo reale. Solo i distributori nell'area della mappa; marchio e indirizzo, senza il nome del gestore. Un prezzo comunicato da oltre ${FUEL_STALE_DAYS} giorni non entra nel confronto della mappa. Gli impianti dell'anagrafica senza nessun prezzo comunicato (spesso doppioni, impianti non aperti al pubblico o forse non più attivi) non sono in data ma sono contati in meta.listedWithoutPrices e nel riepilogo.`,
      },
    },
    { status: res.ok ? 200 : 503 },
  );
}
