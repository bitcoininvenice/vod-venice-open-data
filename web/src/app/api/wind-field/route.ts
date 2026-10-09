import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { openMeteoWindUrl, parseOpenMeteoWind } from '@/server/sources/openMeteoWind';

// Open-Meteo aggiorna i valori "current" ogni 15 minuti; 30 minuti di cache bastano e restano nel limite gratuito
export const revalidate = 1800;

export async function GET() {
  const res = await fetchUpstream(openMeteoWindUrl(), parseOpenMeteoWind, { revalidate: 1800, timeoutMs: 8000 });
  if (!res.ok) {
    return NextResponse.json({ success: false, error: res.error, data: null });
  }
  return NextResponse.json({
    success: true,
    meta: {
      kind: 'forecast-model',
      note: 'Previsione di modello numerico su griglia di circa 4 km, non una misura. Le misure reali sono quelle delle stazioni CPSM e del METAR.',
    },
    data: { ...res.data, fetchedAt: res.fetchedAt },
  });
}
