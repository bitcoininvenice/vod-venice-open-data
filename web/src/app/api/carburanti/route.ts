import { NextResponse } from 'next/server';
import { FUEL_REFRESH_S, fuelStations } from '@/server/sources/mimitFuel';
import { FUEL_KINDS, FUEL_STALE_DAYS, fuelSummary, stationFromOsm, withOsmDetails, type OsmFuelRecord } from '@/lib/fuel';
import { providerMeta } from '@/lib/provenance/providers';
import osmFuel from '@/data/osm-fuel.json';

const OSM_STATIONS = osmFuel.stations as OsmFuelRecord[];
/** Senza i prezzi del Ministero la risposta di riserva resta poco in cache: appena tornano disponibili si vedono */
const FALLBACK_CACHE_S = 900;

// Dinamica, non generata durante la build: un errore del Ministero in quel momento resterebbe in cache per ore.
// Le risposte riuscite restano 6 ore nella cache del CDN (il Ministero pubblica una volta al giorno), gli errori mai.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Il sito del Ministero è dietro un firewall che può rifiutare le richieste dai data center fuori Europa:
// la funzione gira a Francoforte (scelta della regione di Vercel, nessun aggiramento del filtro)
export const preferredRegion = 'fra1';

export async function GET() {
  const res = await fuelStations();
  // Prezzi del Ministero non raggiungibili: i distributori di OpenStreetMap, senza prezzi e dichiarati come tali
  if (!res.ok) {
    return NextResponse.json(
      {
        success: true,
        count: OSM_STATIONS.length,
        data: OSM_STATIONS.map(stationFromOsm),
        summary: null,
        meta: {
          kind: 'static-reference',
          pricesAvailable: false,
          ...providerMeta('osm', 'OpenStreetMap contributors – distributori (amenity=fuel)'),
          generatedAt: osmFuel.generatedAt,
          pricesSource: providerMeta('mimitFuel'),
          pricesError: res.error,
          note: 'I prezzi del Ministero non sono raggiungibili in questo momento: si mostrano i distributori mappati su OpenStreetMap, senza prezzi, con marchio, carburanti, orari e distributori per barche se indicati. Nessun nome del gestore.',
        },
      },
      { headers: { 'Cache-Control': `public, s-maxage=${FALLBACK_CACHE_S}` } },
    );
  }
  const stations = withOsmDetails(res.data.stations, OSM_STATIONS);
  return NextResponse.json(
    {
      success: res.ok,
      count: stations.length,
      data: stations,
      // statistiche dell'area e per zona per ogni carburante (stesso prezzo usato dai colori della mappa)
      summary: Object.fromEntries(FUEL_KINDS.map((k) => [k, fuelSummary(stations, k, Date.now(), res.data.listedWithoutPrices)])),
      meta: {
        kind: 'static-reference',
        pricesAvailable: true,
        ...providerMeta('mimitFuel'),
        extractedAt: res.data.extractedAt,
        // impianti dell'anagrafica senza nessun prezzo: non in data, contati nel riepilogo
        listedWithoutPrices: res.data.listedWithoutPrices.length,
        fetchedAt: res.fetchedAt,
        refreshSeconds: FUEL_REFRESH_S,
        note: `Prezzi comunicati dai gestori al Ministero (art. 51 L. 99/2009), in vigore alle 8 del giorno dell'estrazione: non sono prezzi in tempo reale. Solo i distributori nell'area della mappa; marchio e indirizzo, senza il nome del gestore. Un prezzo comunicato da oltre ${FUEL_STALE_DAYS} giorni non entra nel confronto della mappa. Gli impianti dell'anagrafica senza nessun prezzo comunicato (spesso doppioni, impianti non aperti al pubblico o forse non più attivi) non sono in data ma sono contati in meta.listedWithoutPrices e nel riepilogo.`,
      },
    },
    { headers: { 'Cache-Control': `public, s-maxage=${FUEL_REFRESH_S}, stale-while-revalidate=86400` } },
  );
}
