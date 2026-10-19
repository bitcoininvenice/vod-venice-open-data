import 'server-only';
import { serverSimulation } from '@/server/sources/simulationServer';
import { alilagunaTripsOn } from '@/lib/alilaguna-schedule';
import { trainsOnDate, romeYmd, setTrainSchedule, trainSchedule, type TrainScheduleData } from '@/lib/trainSimulation';
import { propulsionOf, propulsionReport, type ModeTrips, type PropulsionReport } from '@/lib/mobilityEmissions';
import { romeDayType, romeToday } from '@/lib/time';
import trainsJson from '@/data/trains-venezia.json';
import atvoJson from '@/data/atvo-venezia.json';
import dolomitiJson from '@/data/dolomitibus-venezia.json';
import flixJson from '@/data/flixbus-venezia.json';

if (!trainSchedule()) setTrainSchedule(trainsJson as unknown as TrainScheduleData);

/** Corse di una data negli orari a date UTC (ATVO, Dolomiti Bus, FlixBus): una corsa per data di servizio */
function coachTrips(data: { trips: { dates: string[] }[] }, ymd: string): number {
  return data.trips.filter((t) => t.dates.includes(ymd)).length;
}

/**
 * Corse del giorno per alimentazione, contate dagli orari ufficiali: GTFS ACTV (per categoria di linea),
 * Alilaguna, treni Santa Lucia – Mestre, ATVO, Dolomiti Bus e FlixBus.
 */
export async function propulsionToday(now: Date = new Date()): Promise<PropulsionReport> {
  const modes: ModeTrips[] = [];
  const sim = await serverSimulation();
  if (sim) {
    const day = sim.model.daysTrips[romeDayType(now)];
    const byCat = new Map<string, number>();
    for (let i = 0; i < day.count; i++) {
      const cat = sim.model.profs[day.tP[i]].route.cat;
      byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
    }
    for (const [cat, trips] of byCat) modes.push({ mode: cat, operator: 'ACTV', propulsion: propulsionOf(cat), trips });
  }
  const ymd = romeYmd(now);
  modes.push({ mode: 'alilaguna', operator: 'Alilaguna', propulsion: 'fossil', trips: alilagunaTripsOn(now).length });
  modes.push({ mode: 'train', operator: 'Trenitalia / Italo', propulsion: 'electric', trips: trainsOnDate(ymd).length });
  modes.push({ mode: 'coach', operator: 'ATVO', propulsion: 'fossil', trips: coachTrips(atvoJson, ymd) });
  modes.push({ mode: 'coach', operator: 'Dolomiti Bus', propulsion: 'fossil', trips: coachTrips(dolomitiJson, ymd) });
  modes.push({ mode: 'coach', operator: 'FlixBus', propulsion: 'fossil', trips: coachTrips(flixJson, ymd) });
  return propulsionReport(romeToday(now), modes.filter((m) => m.trips > 0));
}
