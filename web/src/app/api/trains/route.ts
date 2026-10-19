import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveTrainsInVenice, fetchStationBoard } from '@/server/sources/busoneTrains';
import { providerMeta } from '@/lib/provenance/providers';

export const revalidate = 20;

export async function GET(req: NextRequest) {
  const stationParam = req.nextUrl.searchParams.get('station');

  if (stationParam === 'santa_lucia' || stationParam === 'mestre') {
    const board = await fetchStationBoard(stationParam);
    return NextResponse.json({
      success: true,
      data: board,
      meta: {
        kind: 'live-board',
        ...providerMeta('busone', 'BusOne (https://busone.app) – ViaggiaTreno & Italo'),
      },
    });
  }

  const [trainsResult, santaLuciaBoard, mestreBoard] = await Promise.all([
    fetchLiveTrainsInVenice(),
    fetchStationBoard('santa_lucia'),
    fetchStationBoard('mestre'),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      trains: trainsResult.trains,
      stationBoards: {
        santaLucia: santaLuciaBoard,
        mestre: mestreBoard,
      },
    },
    meta: {
      kind: 'live',
      liveAvailable: trainsResult.ok,
      ...providerMeta('busone', 'BusOne (https://busone.app) – Trenitalia & Italo GTFS-RT'),
      count: trainsResult.trains.length,
    },
  });
}
