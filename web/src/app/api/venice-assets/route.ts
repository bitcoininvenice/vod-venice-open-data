import { NextResponse } from 'next/server';
import {
  BATHING_WATERS_DATA,
  URBAN_TREES_DATA,
  EV_CHARGING_DATA,
  WIFI_HOTSPOTS_DATA
} from '@/lib/urbanAssetsVeniceData';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    source: 'ARPAV Veneto / Comune di Venezia (dati.venezia.it) / Venis S.p.A. / PUN',
    counts: {
      bathingWaters: BATHING_WATERS_DATA.length,
      urbanTrees: URBAN_TREES_DATA.length,
      evCharging: EV_CHARGING_DATA.length,
      wifiHotspots: WIFI_HOTSPOTS_DATA.length
    },
    data: {
      bathingWaters: BATHING_WATERS_DATA,
      urbanTrees: URBAN_TREES_DATA,
      evCharging: EV_CHARGING_DATA,
      wifiHotspots: WIFI_HOTSPOTS_DATA
    }
  });
}
