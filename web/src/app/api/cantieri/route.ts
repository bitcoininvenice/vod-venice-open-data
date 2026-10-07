import { NextResponse } from 'next/server';
import { fetchCantieri } from '@/lib/db';

export async function GET() {
  try {
    const cantieri = await fetchCantieri();
    return NextResponse.json({
      success: true,
      count: cantieri.length,
      data: cantieri
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
