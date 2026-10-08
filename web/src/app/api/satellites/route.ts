import { NextResponse } from 'next/server';
import { SATELLITES_DATA } from '@/lib/satellitesData';
import type { SatelliteItem } from '@/lib/types';
import { headingAt, nextPass, satrecFor, stateAt } from '@/lib/orbits';
import { celestrakTleUrl, parseTle, tleEpoch } from '@/server/sources/celestrak';

// Posizioni e passaggi vengono ricalcolati ogni 5 minuti; i TLE sono in cache per 6 ore.
export const revalidate = 300;

const formatRome = (d: Date) =>
  d.toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

async function fetchTle(noradId: number): Promise<[string, string] | null> {
  try {
    const res = await fetch(celestrakTleUrl(noradId), {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 21600 },
      headers: { 'User-Agent': 'VOD-VeniceOpenData/1.0 (+https://venice-open-data.vercel.app)' },
    });
    if (!res.ok) return null;
    return parseTle(await res.text(), noradId);
  } catch (err) {
    console.warn(`[celestrak] ${noradId}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

export async function GET() {
  const now = new Date();
  const tles = await Promise.all(SATELLITES_DATA.map((s) => fetchTle(s.noradId)));

  const data: SatelliteItem[] = SATELLITES_DATA.map((sat, i) => {
    const tle = tles[i];
    if (!tle) {
      return { ...sat, isPassingNow: false, nextPassVenice: 'n.d. (TLE non disponibile)' };
    }
    const rec = satrecFor(tle[0], tle[1]);
    const state = stateAt(rec, now);
    const pass = nextPass(rec, now);
    const periodMinutes = Math.round((2 * Math.PI) / rec.no * 10) / 10; // rec.no: rad/min
    return {
      ...sat,
      tle,
      tleEpoch: tleEpoch(tle[0]).toISOString(),
      currentLat: state ? Math.round(state.lat * 1000) / 1000 : sat.currentLat,
      currentLon: state ? Math.round(state.lon * 1000) / 1000 : sat.currentLon,
      altitudeKm: state ? Math.round(state.altKm) : sat.altitudeKm,
      speedKmh: state ? Math.round(state.speedKmh) : sat.speedKmh,
      heading: Math.round(headingAt(rec, now)),
      inclinationDeg: Math.round(((rec.inclo * 180) / Math.PI) * 100) / 100,
      periodMinutes,
      isPassingNow: !!pass && pass.start <= now && pass.end >= now,
      nextPassStart: pass?.start.toISOString(),
      nextPassVenice: pass ? `${formatRome(pass.start)} (ora di Venezia)` : 'Nessun passaggio nelle prossime 48 ore',
      maxElevationDeg: pass?.maxElevationDeg ?? 0,
      passDurationSeconds: pass ? Math.round((pass.end.getTime() - pass.start.getTime()) / 1000) : 0,
      groundTrack: [],
    };
  });

  const live = tles.filter(Boolean).length;
  return NextResponse.json({
    success: true,
    count: data.length,
    data,
    meta: {
      kind: live > 0 ? 'live' : 'static-reference',
      source: 'CelesTrak (elementi orbitali GP/TLE) – propagazione SGP4',
      sourceUrl: 'https://celestrak.org',
      fetchedAt: now.toISOString(),
      note: `Orbite calcolate da TLE per ${live}/${data.length} satelliti. Passaggi sopra Venezia con elevazione minima 10°.`,
    },
  });
}
