import { NextResponse } from 'next/server';
import { fetchStops } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    let stops = await fetchStops();
    if (mode) {
      stops = stops.filter(s => s.mode.toLowerCase() === mode.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      count: stops.length,
      data: stops
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
