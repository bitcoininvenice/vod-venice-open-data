import { NextResponse } from 'next/server';
import { OCEAN_STATIONS_DATA, BRICCOLE_SIGNALS_DATA } from '@/lib/marineSensorsData';

export async function GET() {
  return NextResponse.json({
    success: true,
    source: 'CNR-ISMAR (Istituto di Scienze Marine) / ISPRA RML / Provveditorato Opere Pubbliche',
    oceanStationsCount: OCEAN_STATIONS_DATA.length,
    briccoleCount: BRICCOLE_SIGNALS_DATA.length,
    data: {
      oceanStations: OCEAN_STATIONS_DATA,
      briccole: BRICCOLE_SIGNALS_DATA
    }
  });
}
