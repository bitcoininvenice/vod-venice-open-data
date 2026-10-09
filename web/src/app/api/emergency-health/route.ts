import { NextResponse } from 'next/server';
import {
  OPEN_EMERGENCY_WATER_DOCKS
} from '@/lib/open-data-catalog';
import { OPEN_PHARMACIES, PHARMACY_DUTY_URL } from '@/lib/pharmacies-data';
import { OPEN_PUBLIC_DAE, OSM_DAE_META } from '@/lib/dae-data';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      emergencyDocks: OPEN_EMERGENCY_WATER_DOCKS,
      dae: OPEN_PUBLIC_DAE,
      pharmacies: OPEN_PHARMACIES
    },
    meta: {
      source: 'DAE e farmacie: OpenStreetMap (ODbL) + elenchi curati da verificare; approdi idroambulanze: elenco curato',
      daeOsmGeneratedAt: OSM_DAE_META.generatedAt,
      countEmergencyDocks: OPEN_EMERGENCY_WATER_DOCKS.length,
      countDae: OPEN_PUBLIC_DAE.length,
      countPharmacies: OPEN_PHARMACIES.length,
      pharmacyDutyUrl: PHARMACY_DUTY_URL,
    }
  });
}
