import { NextResponse } from 'next/server';
import { generateCurrentLIPZMetar, METEO_MARINE_WIND_STATIONS } from '@/lib/weatherWindData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentMetar = generateCurrentLIPZMetar();

  // Aggiorna la stazione aeroportuale con il METAR appena calcolato
  const stations = METEO_MARINE_WIND_STATIONS.map((st) => {
    if (st.id === 'WIND_LIPZ_AERONAUTICA') {
      return {
        ...st,
        metar: currentMetar,
        windSpeedKmh: currentMetar.windSpeedKmh,
        windSpeedKnots: currentMetar.windSpeedKnots,
        gustSpeedKnots: currentMetar.gustSpeedKnots || 17,
        windDirectionDeg: currentMetar.windDirectionDeg,
        airTempCelsius: currentMetar.temperatureCelsius,
        pressureHpa: currentMetar.qnhHpa,
        humidityPercent: currentMetar.relativeHumidityPercent
      };
    }
    return st;
  });

  return NextResponse.json({
    success: true,
    data: {
      metar: currentMetar,
      windStations: stations,
      summary: {
        prevailingWindAdriatic: 'Scirocco (135°-145°) con raffiche fino a 61 km/h al largo',
        prevailingWindLagoonNorth: 'Bora debole/moderata (55°-60°) su Tessera e Terraferma Mestre',
        maxWaveHeightMeters: 2.45,
        maxWaveLocation: 'Piattaforma Oceanografica Acqua Alta CNR-ISMAR (15 km offshore)',
        tideHydrodynamicPush: 'CRITICO - Scirocco attivo su Golfo di Venezia con potenziale sovralzo',
        runwayCrosswindLIPZ: `${currentMetar.crosswindKnots} kt (favorevole per atterraggio RWY 04R)`,
        flightConditionLIPZ: currentMetar.flightCategory
      }
    },
    meta: {
      sources: [
        'Aeronautica Militare - Servizio Meteorologico Nazionale (METAR LIPZ / Tessera)',
        'ENAV S.p.A. - Dati Navigazione Aerea e Bollettini Aeroportuali',
        'CNR-ISMAR - Piattaforma Oceanografica Acqua Alta',
        'Comune di Venezia - CPSM Centro Previsioni e Segnalazioni Maree',
        'ISPRA - RMN Rete Mareografica Nazionale & RON Rete Ondametrica',
        'ARPAV - Servizio Meteorologico Regionale del Veneto'
      ],
      stationCount: stations.length,
      updatedAt: currentMetar.observationTime
    }
  });
}
