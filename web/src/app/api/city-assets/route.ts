import { NextResponse } from 'next/server';
import fountainsDataset from '@/data/fountains.json';
import { OPEN_CITY_ASSETS, OPEN_FOUNTAINS, OPEN_LIBRARIES, OPEN_PARKINGS, OPEN_RECYCLING_CENTRES, OSM_POI_META } from '@/lib/osmPoi';

// Fontanelle e parcheggi da OpenStreetMap (ODbL); ponti accessibili e punti Veritas da elenco curato
export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    totalAssets: OPEN_CITY_ASSETS.length,
    totalFountains: OPEN_FOUNTAINS.length,
    fountainMetadata: fountainsDataset.metadata,
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
    data: {
      assets: OPEN_CITY_ASSETS,
      parkings: OPEN_PARKINGS
    }
  });
}
