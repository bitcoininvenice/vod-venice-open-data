import { NextResponse } from 'next/server';
import { MoseGateItem } from '@/lib/types';

export interface CpsmStationItem {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  levelCm: number;
  trend: 'IN_AUMENTO' | 'STAZIONARIA' | 'IN_CALO';
}

export async function GET() {
  const now = new Date();
  
  // 1. Stazioni Idrometriche Rete CPSM (Centro Previsioni e Segnalazioni Maree)
  const stations: CpsmStationItem[] = [
    {
      id: 'cpsm-salute',
      name: 'Punta della Salute (ZMPS)',
      code: 'SALUTE',
      lat: 45.4310,
      lon: 12.3365,
      levelCm: 76,
      trend: 'IN_AUMENTO'
    },
    {
      id: 'cpsm-lido',
      name: 'Diga Sud Lido',
      code: 'LIDO_DIGA',
      lat: 45.4190,
      lon: 12.4350,
      levelCm: 79,
      trend: 'IN_AUMENTO'
    },
    {
      id: 'cpsm-malamocco',
      name: 'Diga Nord Malamocco',
      code: 'MALAMOCCO_DIGA',
      lat: 45.3360,
      lon: 12.3020,
      levelCm: 80,
      trend: 'IN_AUMENTO'
    },
    {
      id: 'cpsm-chioggia',
      name: 'Chioggia Vigo',
      code: 'CHIOGGIA',
      lat: 45.2210,
      lon: 12.2820,
      levelCm: 75,
      trend: 'STAZIONARIA'
    }
  ];

  // 2. Barriere MOSE (Modulo Sperimentale Elettromeccanico) alle 3 Bocche di Porto
  const moseGates: MoseGateItem[] = [
    {
      id: 'mose-lido-treporti',
      inletName: 'Lido San Nicolò - Canale Treporti',
      channel: 'Bocca di Porto di Lido Nord',
      lat: 45.4330,
      lon: 12.4280,
      barriersCount: 21,
      status: 'ABBASSATO', // Abbassato sul fondale marino
      elevationCm: 0,
      tideSeaCm: 79,
      tideLagoonCm: 76
    },
    {
      id: 'mose-lido-sannicolo',
      inletName: 'Lido - Canale San Nicolò',
      channel: 'Bocca di Porto di Lido Sud',
      lat: 45.4225,
      lon: 12.4330,
      barriersCount: 20,
      status: 'ABBASSATO',
      elevationCm: 0,
      tideSeaCm: 79,
      tideLagoonCm: 76
    },
    {
      id: 'mose-malamocco',
      inletName: 'Bocca di Malamocco',
      channel: 'Canale di Grande Navigazione / Petroli',
      lat: 45.3340,
      lon: 12.2980,
      barriersCount: 19,
      status: 'ABBASSATO',
      elevationCm: 0,
      tideSeaCm: 80,
      tideLagoonCm: 76
    },
    {
      id: 'mose-chioggia',
      inletName: 'Bocca di Chioggia',
      channel: 'Bocca di Porto Sud',
      lat: 45.2310,
      lon: 12.2980,
      barriersCount: 18,
      status: 'ABBASSATO',
      elevationCm: 0,
      tideSeaCm: 78,
      tideLagoonCm: 75
    }
  ];

  const floodingCurves = [
    { levelCm: 80, percent: 1.5, notes: "Allagamento parziale della sola Piazza San Marco antistante la Basilica" },
    { levelCm: 100, percent: 5.1, notes: "Piazza San Marco allagata, passerelle pedonali montate" },
    { levelCm: 110, percent: 12.2, notes: "Soglia di avviso acustico sirene CPSM; attivazione barriere MOSE" },
    { levelCm: 120, percent: 35.4, notes: "Marea molto sostenuta, viabilità pedonale critica senza MOSE" },
    { levelCm: 140, percent: 59.0, notes: "Marea eccezionale (acqua alta storica)" }
  ];

  return NextResponse.json({
    success: true,
    fonte: "Centro Previsioni e Segnalazioni Maree (CPSM) - Comune di Venezia",
    timestamp: now.toISOString(),
    data: {
      livelloCm: 76,
      stazione: "Punta della Salute (ZMPS)",
      dataOra: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      tendenza: "IN_AUMENTO",
      categoria: "NORMALE",
      prossimoPicco: {
        ora: "11:20",
        livelloPrevistoCm: 85
      },
      percentualeAllagamentoVenezia: 1.2,
      stations,
      moseGates,
      floodingCurves
    }
  });
}
