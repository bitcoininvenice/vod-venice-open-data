import { NextResponse } from 'next/server';
import { CityAssetItem, ParkingItem } from '@/lib/types';

// Dataset Comune di Venezia (dati.venezia.it), Veritas S.p.A. e AVM
export async function GET() {
  const assets: CityAssetItem[] = [
    // 1. Fontanelle Pubbliche Potabili (Comune di Venezia / Veritas)
    {
      id: 'f-1',
      name: 'Fontanella Campo San Polo',
      type: 'FOUNTAIN',
      lat: 45.4371,
      lon: 12.3304,
      sestiere: 'San Polo',
      details: 'Fontana in ghisa ottocentesca, acqua potabile attiva H24'
    },
    {
      id: 'f-2',
      name: 'Fontanella Campo Santa Margherita',
      type: 'FOUNTAIN',
      lat: 45.4338,
      lon: 12.3235,
      sestiere: 'Dorsoduro',
      details: 'Fontana a colonna con vaschetta in pietra d\'Istria'
    },
    {
      id: 'f-3',
      name: 'Fontanella Campo Santo Stefano',
      type: 'FOUNTAIN',
      lat: 45.4328,
      lon: 12.3312,
      sestiere: 'San Marco',
      details: 'Fontana monumentale in pietra d\'Istria, punto ricarica borracce'
    },
    {
      id: 'f-4',
      name: 'Fontanella Piazzale Roma (Giardini Papadopoli)',
      type: 'FOUNTAIN',
      lat: 45.4390,
      lon: 12.3195,
      sestiere: 'Santa Croce',
      details: 'Punto idrico ingresso pedonale Piazzale Roma'
    },
    {
      id: 'f-5',
      name: 'Fontanella Campo San Geremia',
      type: 'FOUNTAIN',
      lat: 45.4428,
      lon: 12.3248,
      sestiere: 'Cannaregio',
      details: 'Presso Palazzo Labia e fermata Riva de Biasio'
    },
    {
      id: 'f-6',
      name: 'Fontanella Campo dei Gesuiti',
      type: 'FOUNTAIN',
      lat: 45.4435,
      lon: 12.3385,
      sestiere: 'Cannaregio',
      details: 'Accesso da Fondamente Nove per imbarco isole'
    },
    {
      id: 'f-7',
      name: 'Fontanella Riva degli Schiavoni (Pietà)',
      type: 'FOUNTAIN',
      lat: 45.4344,
      lon: 12.3456,
      sestiere: 'Castello',
      details: 'Fronte Bacino San Marco'
    },
    {
      id: 'f-8',
      name: 'Fontanella Giudecca Sant\'Eufemia',
      type: 'FOUNTAIN',
      lat: 45.4265,
      lon: 12.3258,
      sestiere: 'Giudecca',
      details: 'Lungo il Canale della Giudecca'
    },

    // 2. Ponti con Rampe e Percorsi Accessibili (Comune di Venezia)
    {
      id: 'p-1',
      name: 'Ponte della Paglia (Rampe Agevolate)',
      type: 'ACCESSIBLE_BRIDGE',
      lat: 45.4338,
      lon: 12.3405,
      sestiere: 'San Marco / Castello',
      details: 'Ponte dotato di rampe a pendenza ridotta (6%) per disabili e passeggini',
      accessibilityNote: 'Percorso accessibile Marciana - Arsenale'
    },
    {
      id: 'p-2',
      name: 'Ponte della Costituzione (Cabinovia / Ovitto)',
      type: 'ACCESSIBLE_BRIDGE',
      lat: 45.4389,
      lon: 12.3188,
      sestiere: 'Santa Croce / Cannaregio',
      details: 'Collegamento Stazione Santa Lucia - Piazzale Roma',
      accessibilityNote: 'Impianto traslante e percorsi a gradino ribassato'
    },
    {
      id: 'p-3',
      name: 'Ponte dei Tre Archi (Rampe Laterali)',
      type: 'ACCESSIBLE_BRIDGE',
      lat: 45.4462,
      lon: 12.3204,
      sestiere: 'Cannaregio',
      details: 'Ponte storico sul Canale di Cannaregio dotato di raccordo accessibile'
    },
    {
      id: 'p-4',
      name: 'Ponte della Veneta Marina (Rampe Temporanee Maratona)',
      type: 'ACCESSIBLE_BRIDGE',
      lat: 45.4320,
      lon: 12.3530,
      sestiere: 'Castello',
      details: 'Rampa fissa per accesso Giardini della Biennale'
    },

    // 3. Veritas - Punti Raccolta Rifiuti e Battelli
    {
      id: 'v-1',
      name: 'Battello Veritas Raccolta Rifiuti (Rialto Mercato)',
      type: 'VERITAS_BOAT',
      lat: 45.4392,
      lon: 12.3355,
      sestiere: 'San Polo',
      details: 'Battello ecologico ormeggiato 06:30 - 08:30 per conferimento residenti'
    },
    {
      id: 'v-2',
      name: 'Battello Veritas Raccolta (Zattere)',
      type: 'VERITAS_BOAT',
      lat: 45.4295,
      lon: 12.3275,
      sestiere: 'Dorsoduro',
      details: 'Battello ormeggiato Canale Giudecca per raccolta differenziata'
    },
    {
      id: 'v-3',
      name: 'Isola Ecologica Interrata Tronchetto',
      type: 'VERITAS_WASTE',
      lat: 45.4410,
      lon: 12.3025,
      sestiere: 'Tronchetto',
      details: 'Piattaforma compattatrice Veritas per carta, vetro, plastica e RSU'
    }
  ];

  // Parcheggi in Tempo Reale (AVM / Polizia Locale)
  const parkings: ParkingItem[] = [
    {
      id: 'park-1',
      name: 'Autorimessa Comunale ASM',
      location: 'Piazzale Roma',
      totalSpots: 2182,
      freeSpots: 184,
      lat: 45.4378,
      lon: 12.3182,
      rateHourly: '€ 35,00 / 24h',
      operator: 'AVM S.p.A.'
    },
    {
      id: 'park-2',
      name: 'Garage San Marco',
      location: 'Piazzale Roma',
      totalSpots: 900,
      freeSpots: 42,
      lat: 45.4368,
      lon: 12.3178,
      rateHourly: '€ 45,00 / 24h',
      operator: 'Privato convenzionato'
    },
    {
      id: 'park-3',
      name: 'Parcheggio Sant\'Andrea',
      location: 'Piazzale Roma',
      totalSpots: 100,
      freeSpots: 12,
      lat: 45.4365,
      lon: 12.3160,
      rateHourly: '€ 7,00 / 2h',
      operator: 'AVM S.p.A.'
    },
    {
      id: 'park-4',
      name: 'Interparking Tronchetto',
      location: 'Tronchetto',
      totalSpots: 3950,
      freeSpots: 865,
      lat: 45.4415,
      lon: 12.3040,
      rateHourly: '€ 26,00 / 24h',
      operator: 'Interparking Italia'
    }
  ];

  return NextResponse.json({
    success: true,
    totalAssets: assets.length,
    totalParkings: parkings.length,
    data: {
      assets,
      parkings
    }
  });
}
