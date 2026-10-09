import { NextResponse } from 'next/server';
import {
  OPEN_CANAL_SPEED_LIMITS,
  OPEN_BRIDGE_CLEARANCES,
  OPEN_GONDOLA_STATIONS,
  OPEN_PUBLIC_DOCKS
} from '@/lib/open-data-catalog';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      speedLimits: OPEN_CANAL_SPEED_LIMITS,
      bridges: OPEN_BRIDGE_CLEARANCES,
      gondolas: OPEN_GONDOLA_STATIONS,
      docks: OPEN_PUBLIC_DOCKS
    },
    meta: {
      kind: 'curated-reference',
      source: 'Elenco curato del progetto, da verificare (riferimenti: regolamento comunale della circolazione acquea, Venice Project Center)',
      countSpeedLimits: OPEN_CANAL_SPEED_LIMITS.length,
      countBridges: OPEN_BRIDGE_CLEARANCES.length,
      countGondolas: OPEN_GONDOLA_STATIONS.length,
      countDocks: OPEN_PUBLIC_DOCKS.length,
    }
  });
}
