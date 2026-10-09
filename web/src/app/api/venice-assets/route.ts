import { NextResponse } from 'next/server';
import { BATHING_WATERS_DATA, WIFI_HOTSPOTS_DATA } from '@/lib/urbanAssetsVeniceData';
import { OPEN_EV_CHARGING, OPEN_MONUMENTAL_TREES, OSM_POI_META } from '@/lib/osmPoi';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    source: 'OpenStreetMap (ODbL) per colonnine e alberi monumentali; elenco curato da verificare per acque di balneazione e hotspot Wi-Fi',
    osm: OSM_POI_META,
    counts: {
      bathingWaters: BATHING_WATERS_DATA.length,
      urbanTrees: OPEN_MONUMENTAL_TREES.length,
      evCharging: OPEN_EV_CHARGING.length,
      wifiHotspots: WIFI_HOTSPOTS_DATA.length
    },
    data: {
      bathingWaters: BATHING_WATERS_DATA,
      urbanTrees: OPEN_MONUMENTAL_TREES,
      evCharging: OPEN_EV_CHARGING,
      wifiHotspots: WIFI_HOTSPOTS_DATA
    }
  });
}
