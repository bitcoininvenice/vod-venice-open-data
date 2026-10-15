import { NextResponse } from 'next/server';
import flix from '@/data/flixbus-venezia.json';
import { serverSimulation } from '@/server/sources/simulationServer';
import { busLineName } from '@/server/sources/gtfsIndex';
import { airportBoard, BOARD_WINDOW_S } from '@/lib/airportBoard';
import { alilagunaTripsOn, ALILAGUNA_FEED_META } from '@/lib/alilaguna-schedule';
import { romeDayType, romeSecondsOfDay, romeTomorrowDayType } from '@/lib/time';
import type { FlixbusData } from '@/lib/flixbus';
import { providerCitation } from '@/lib/provenance/providers';

export const revalidate = 60;

/**
 * Collegamenti dell'aeroporto Marco Polo nei prossimi 90 minuti: partenze e arrivi di autobus ACTV,
 * barche Alilaguna e FlixBus, dagli orari ufficiali (nessun ritardo). I voli non sono dati aperti.
 */
export async function GET() {
  const sim = await serverSimulation();
  const now = new Date();
  const board = airportBoard({
    sim: sim?.model ?? null,
    day: romeDayType(now),
    nextDay: romeTomorrowDayType(now),
    nowMs: now.getTime(),
    nowS: romeSecondsOfDay(now),
    alilaguna: alilagunaTripsOn(now),
    flixbus: flix as unknown as FlixbusData,
    lineName: busLineName,
  });
  return NextResponse.json(
    {
      success: true,
      windowMinutes: BOARD_WINDOW_S / 60,
      ...board,
      meta: {
        kind: 'timetable',
        computedAt: now.toISOString(),
        sources: [
          providerCitation('actvGtfs', 'autobus'),
          { name: ALILAGUNA_FEED_META.source, license: ALILAGUNA_FEED_META.license, url: ALILAGUNA_FEED_META.sourceUrl, validTo: ALILAGUNA_FEED_META.validTo },
          { name: flix.source, license: flix.license, url: flix.licenseUrl },
        ],
        note: 'Orari teorici dei collegamenti di terra e d\'acqua, senza ritardi né variazioni del giorno. Gli orari dei voli non sono pubblicati come dati aperti: vedi il sito dell\'aeroporto.',
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
