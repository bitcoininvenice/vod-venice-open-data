import { NextResponse } from 'next/server';
import {
  OPEN_BRIDGE_CLEARANCES,
  OPEN_GONDOLA_STATIONS,
  OPEN_PUBLIC_DOCKS
} from '@/lib/open-data-catalog';

import osmWaterways from '@/data/osm-waterways.json';
import { buildSpeedLimits } from '@/lib/waterSpeedLimits';

export const revalidate = 86400;

// Limiti dagli atti ufficiali sui tracciati OSM: calcolati una volta per istanza
const SPEED_LIMITS = buildSpeedLimits(osmWaterways.canals as { id: number; name: string | null; coords: [number, number][] }[]);

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      speedLimits: SPEED_LIMITS,
      bridges: OPEN_BRIDGE_CLEARANCES,
      gondolas: OPEN_GONDOLA_STATIONS,
      docks: OPEN_PUBLIC_DOCKS
    },
    meta: {
      kind: 'curated-reference',
      source: 'Ponti, gondole e rive: elenco curato del progetto, da verificare. Limiti di velocità: Regolamento comunale per la circolazione acquea (art. 2-3) e Ordinanza 93/2007 del Provveditorato OO.PP., applicati ai canali di OpenStreetMap (ODbL); non per la navigazione.',
      countSpeedLimits: SPEED_LIMITS.length,
      countBridges: OPEN_BRIDGE_CLEARANCES.length,
      countGondolas: OPEN_GONDOLA_STATIONS.length,
      countDocks: OPEN_PUBLIC_DOCKS.length,
    }
  });
}
