import { NextResponse } from 'next/server';
import { findStopsNearCantieri } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const radiusParam = searchParams.get('radius');
    const radius = radiusParam ? parseFloat(radiusParam) : 200;

    const results = await findStopsNearCantieri(radius);
    return NextResponse.json({
      success: true,
      radiusMeters: radius,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
