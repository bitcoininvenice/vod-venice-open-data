import { NextResponse } from 'next/server';
import dataset from '@/data/agcom-fiber.json';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    meta: {
      kind: 'static-reference',
      note: 'Copertura della rete (dove arriva l’infrastruttura), non servizi attivi. Celle da 20 m aggregate a ~100 m con la tecnologia migliore.',
      attribution: 'BroadbandMap di Agcom - Autorità per le garanzie nelle comunicazioni è distribuito con Licenza Creative Commons Attribuzione 4.0 Internazionale',
    },
    data: dataset,
  });
}
