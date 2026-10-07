import { NextResponse } from 'next/server';
import { PedestrianFlowItem } from '@/lib/types';

// Smart Control Room del Comune di Venezia (Isola del Tronchetto)
// Rete sensori conta-persone ottici e termici sui varchi pedonali storici
export async function GET() {
  const now = new Date();
  const currentHour = now.getHours();

  // Flusso stimato realistico orario in base all'ora del giorno
  const baseRate = Math.sin((currentHour - 6) * Math.PI / 16);
  const multiplier = Math.max(0.15, Math.min(1.0, baseRate));

  const sensors: PedestrianFlowItem[] = [
    {
      id: 'flow-1',
      sensorName: 'Ponte della Costituzione (Calatrava)',
      location: 'Ingresso Piazzale Roma ➔ Stazione Santa Lucia',
      lat: 45.4389,
      lon: 12.3188,
      hourlyFlow: Math.round(2850 * multiplier + 320),
      trend: currentHour < 12 ? 'IN_AUMENTO' : currentHour > 18 ? 'IN_CALO' : 'STABILE',
      crowdingLevel: multiplier > 0.7 ? 'ELEVATO' : multiplier > 0.4 ? 'MEDIO' : 'BASSO',
      accessFeeEnforced: true
    },
    {
      id: 'flow-2',
      sensorName: 'Ponte di Rialto',
      location: 'Asse commerciale San Marco ➔ San Polo',
      lat: 45.4380,
      lon: 12.3358,
      hourlyFlow: Math.round(3400 * multiplier + 450),
      trend: currentHour < 13 ? 'IN_AUMENTO' : 'STABILE',
      crowdingLevel: multiplier > 0.65 ? 'ELEVATO' : 'MEDIO',
      accessFeeEnforced: true
    },
    {
      id: 'flow-3',
      sensorName: 'Lista di Spagna (Ponte delle Guglie)',
      location: 'Cannaregio / Direttrice Stazione',
      lat: 45.4430,
      lon: 12.3245,
      hourlyFlow: Math.round(2400 * multiplier + 280),
      trend: currentHour < 11 ? 'IN_AUMENTO' : 'STABILE',
      crowdingLevel: multiplier > 0.6 ? 'ELEVATO' : 'MEDIO',
      accessFeeEnforced: true
    }
  ];

  const accessFeeData = {
    bollino: multiplier > 0.6 ? 'BOLLINO_ROSSO' : 'BOLLINO_GIALLO',
    importoTicket: '€ 5,00',
    fasciaOraria: '08:30 - 16:30',
    esenzioniAttive: 'Residenti, lavoratori, studenti, pernottanti in strutture ricettive, minori di 14 anni',
    portalePrenotazione: 'cda.ve.it'
  };

  return NextResponse.json({
    success: true,
    data: {
      sensors,
      accessFeeData
    }
  });
}
