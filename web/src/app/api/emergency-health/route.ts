import { NextResponse } from 'next/server';
import {
  OPEN_EMERGENCY_WATER_DOCKS,
  OPEN_PUBLIC_DAE,
  OPEN_PHARMACY_DUTY
} from '@/lib/open-data-catalog';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      emergencyDocks: OPEN_EMERGENCY_WATER_DOCKS,
      dae: OPEN_PUBLIC_DAE,
      pharmacies: OPEN_PHARMACY_DUTY
    },
    meta: {
      source: 'SUEM 118, Azienda ULSS 3 Serenissima, Regione Veneto Sanità Open Data',
      countEmergencyDocks: OPEN_EMERGENCY_WATER_DOCKS.length,
      countDae: OPEN_PUBLIC_DAE.length,
      countPharmacies: OPEN_PHARMACY_DUTY.length,
    }
  });
}
