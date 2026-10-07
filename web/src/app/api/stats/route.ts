import { NextResponse } from 'next/server';
import { fetchPlatformMetrics } from '@/lib/db';

export async function GET() {
  try {
    const metrics = await fetchPlatformMetrics();
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
