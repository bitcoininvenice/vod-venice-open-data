import { NextResponse } from 'next/server';
import { AirQualityItem } from '@/lib/types';

// ARPA Veneto (ARPAV) & Monitoraggio Ambientale Lagunare
export async function GET() {
  const airStations: AirQualityItem[] = [
    {
      id: 'arpav-1',
      stationName: 'Stazione Rio Novo',
      location: 'Venezia Centro Storico (Dorsoduro)',
      lat: 45.4362,
      lon: 12.3218,
      aqi: 'BUONA',
      pm10: 18, // µg/m³ (limite 50)
      pm25: 11, // µg/m³ (limite 25)
      no2: 24,  // µg/m³ (limite 200)
      lastUpdate: 'Oggi, ore 09:00'
    },
    {
      id: 'arpav-2',
      stationName: 'Stazione Sacca Fisola',
      location: 'Laguna Centro / Giudecca Ovest',
      lat: 45.4278,
      lon: 12.3142,
      aqi: 'BUONA',
      pm10: 14,
      pm25: 9,
      no2: 19,
      lastUpdate: 'Oggi, ore 09:00'
    },
    {
      id: 'arpav-3',
      stationName: 'Stazione Parco Bissuola',
      location: 'Mestre Terraferma',
      lat: 45.4985,
      lon: 12.2482,
      aqi: 'ACCETTABILE',
      pm10: 29,
      pm25: 18,
      no2: 38,
      lastUpdate: 'Oggi, ore 09:00'
    }
  ];

  const lagoonWater = {
    temperaturaAcquaC: 16.8,
    salinitaPsu: 30.2, // tipico laguna centrale
    ossigenoDiscioltoMgL: 7.8,
    torbiditaNtu: 3.4,
    stazioneRiferimento: "Piattaforma Acqua Alta CNR / ARPAV Malamocco"
  };

  return NextResponse.json({
    success: true,
    data: {
      airStations,
      lagoonWater
    }
  });
}
