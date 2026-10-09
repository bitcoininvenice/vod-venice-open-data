import { NextResponse } from 'next/server';
import { OPEN_NAUTICAL, OSM_POI_META } from '@/lib/osmPoi';

export const revalidate = 86400;

/** Marine, carburante per barche, scivoli, cantieri, noleggi e ormeggi mappati su OpenStreetMap (ODbL). */
export async function GET() {
  return NextResponse.json({
    success: true,
    count: OPEN_NAUTICAL.length,
    data: OPEN_NAUTICAL,
    meta: {
      kind: 'static-reference',
      source: 'OpenStreetMap (leisure=marina|slipway, waterway=fuel|boatyard, amenity=boat_rental, mooring=*)',
      license: OSM_POI_META.license,
      attribution: '© OpenStreetMap contributors',
      generatedAt: OSM_POI_META.generatedAt,
      note: 'Non sono le concessioni del Comune né le soste a tempo: quei dati sono solo nel Geoportale comunale e non sono pubblicati come open data. Gli ormeggi indicano l’accesso dichiarato su OSM, non verificato.',
    },
  });
}
