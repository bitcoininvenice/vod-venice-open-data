import { NextResponse } from 'next/server';
import fountainsDataset from '@/data/fountains.json';
import { OPEN_CITY_ASSETS, OPEN_FOUNTAINS, OPEN_LIBRARIES, OPEN_PARKINGS, OPEN_RECYCLING_CENTRES, OPEN_WIFI_VENUES, OSM_POI_META, VENICE_TAP_WATER_META } from '@/lib/osmPoi';

// Fontanelle da Venice Tap Water (fonte primaria, con stato) e OpenStreetMap (ODbL); parcheggi OSM; ponti accessibili e punti Veritas da elenco curato
export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    totalAssets: OPEN_CITY_ASSETS.length,
    totalFountains: OPEN_FOUNTAINS.length,
    fountainMetadata: fountainsDataset.metadata,
    // Fontane di Venice Tap Water: citare sempre la fonte con link a venicetapwater.org
    veniceTapWaterMetadata: VENICE_TAP_WATER_META,
    totalParkings: OPEN_PARKINGS.length,
    parkingMetadata: {
      source: 'OpenStreetMap (amenity=parking con capienza ≥ 100) + elenco curato del progetto da verificare',
      license: OSM_POI_META.license,
      generatedAt: OSM_POI_META.generatedAt,
      notes: 'Nessuna fonte aperta pubblica i posti liberi in tempo reale: la disponibilità non è mostrata. Tariffe e capienze dell\'elenco curato non sono verificate.'
    },
    fountains: OPEN_FOUNTAINS,
    accessibleBridges: OPEN_CITY_ASSETS.filter((a) => a.type === 'ACCESSIBLE_BRIDGE'),
    veritasServices: OPEN_CITY_ASSETS.filter((a) => a.type === 'VERITAS_WASTE' || a.type === 'VERITAS_BOAT'),
    parkings: OPEN_PARKINGS,
    // Ecocentri e biblioteche da OpenStreetMap (ODbL)
    recyclingCentres: OPEN_RECYCLING_CENTRES,
    libraries: OPEN_LIBRARIES,
    // Luoghi con Wi-Fi mappati su OpenStreetMap (ODbL), con tipo di accesso dichiarato; nessuna password
    wifiVenues: OPEN_WIFI_VENUES,
    data: {
      assets: OPEN_CITY_ASSETS,
      parkings: OPEN_PARKINGS
    }
  });
}
