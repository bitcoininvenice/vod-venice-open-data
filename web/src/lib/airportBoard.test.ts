import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { airportBoard, FLIX_AIRPORT_STOP, prettyPlace } from './airportBoard';
import { alilagunaTripsOn } from './alilaguna-schedule';
import type { FlixbusData } from './flixbus';
import type { AtvoData } from './atvo';
import type { DolomitiData } from './dolomitibus';

const publicDir = existsSync(path.join(process.cwd(), 'public')) ? path.join(process.cwd(), 'public') : path.join(process.cwd(), 'web', 'public');
const sim = buildSimulation(JSON.parse(readFileSync(path.join(publicDir, SIM_URL), 'utf8')) as RawSimulation);
/** mercoledì 14/10/2026 alle 10:00 a Venezia (08:00 UTC) */
const nowMs = Date.UTC(2026, 9, 14, 8, 0, 0);
const nowS = 10 * 3600;
const date = new Date(nowMs);

const flix: FlixbusData = {
  shapes: [],
  trips: [
    { id: 'f1', line: 'N1', name: '', from: 'Trieste', to: 'Milano', dates: ['20261014'], shape: 0, stops: [[0, 28000, 28800, FLIX_AIRPORT_STOP, true], [9000, 30000, 30300, 'Mestre', true]] },
    { id: 'f2', line: 'N2', name: '', from: 'Roma', to: FLIX_AIRPORT_STOP, dates: ['20261014'], shape: 0, stops: [[0, 29000, 29100, 'Mestre', true], [9000, 31000, 31000, FLIX_AIRPORT_STOP, true]] },
  ],
} as unknown as FlixbusData;

describe('tabellone aeroporto', () => {
  const board = airportBoard({ sim, day: 'weekday', nextDay: 'weekday', nowMs, nowS, alilaguna: alilagunaTripsOn(date), flixbus: flix });

  it('bus 5 e altre linee ACTV, Alilaguna e FlixBus nei prossimi 90 minuti, in ordine', () => {
    const kinds = new Set(board.departures.map((r) => r.kind));
    expect(kinds.has('bus')).toBe(true);
    expect(kinds.has('alilaguna')).toBe(true);
    expect(board.departures.some((r) => r.kind === 'bus' && r.line === '5' && r.place === 'Venezia, Piazzale Roma')).toBe(true);
    expect(board.arrivals.some((r) => r.kind === 'bus' && r.line === '5')).toBe(true);
    for (const list of [board.departures, board.arrivals]) {
      for (const r of list) expect(r.at >= nowMs && r.at <= nowMs + 90 * 60_000, `${r.kind} ${r.line}`).toBe(true);
      expect(list.map((r) => r.at)).toEqual([...list.map((r) => r.at)].sort((a, b) => a - b));
    }
  });

  it('FlixBus: partenza se non finisce all\'aeroporto, arrivo se non parte da lì (orari UTC)', () => {
    // 08:00 UTC + 800 s = partenza 10:13 a Venezia verso Milano; la seconda corsa arriva alle 10:36
    expect(board.departures.filter((r) => r.kind === 'flixbus')).toEqual([{ kind: 'flixbus', line: 'N1', color: expect.any(String), place: 'Milano', at: Date.UTC(2026, 9, 14) + 28800_000 }]);
    expect(board.arrivals.filter((r) => r.kind === 'flixbus').map((r) => r.place)).toEqual(['Roma']);
  });

  it('nomi delle fermate leggibili', () => {
    expect(prettyPlace('VENEZIA CORSIA C')).toBe('Venezia, Piazzale Roma');
    expect(prettyPlace('Stazione Mestre FS')).toBe('Stazione Mestre FS');
  });

  it('dopo mezzanotte: il bus 5 delle 00:10 da Piazzale Roma arriva all\'aeroporto', () => {
    const late = airportBoard({ sim, day: 'weekday', nextDay: 'weekday', nowMs: Date.UTC(2026, 9, 14, 21, 50), nowS: 23 * 3600 + 50 * 60, alilaguna: [], flixbus: null });
    expect(late.arrivals.some((r) => r.line === '5' && r.at > Date.UTC(2026, 9, 14, 22, 0))).toBe(true);
  });

  it('include partenze e arrivi di bus ATVO e Dolomiti Bus nelle loro date (orari UTC come FlixBus)', () => {
    const atvoData = {
      shapes: [],
      trips: [
        { id: 'a1', line: '35', name: '', from: 'Venezia (Piazzale Roma)', to: 'Aeroporto Marco Polo', dates: ['20261014'], shape: 0, stops: [[0, 28800, 28800, 'Venezia', true], [12000, 30000, 30000, 'Aeroporto Marco Polo', true]] },
        { id: 'a2', line: '35', name: '', from: 'Aeroporto Marco Polo', to: 'Venezia (Piazzale Roma)', dates: ['20261014'], shape: 1, stops: [[0, 30600, 30600, 'Aeroporto Marco Polo', true], [12000, 31800, 31800, 'Venezia', true]] },
      ],
    } as unknown as AtvoData;
    const dolomitiData = {
      shapes: [],
      trips: [
        { id: 'd1', line: '72', name: '', from: 'Venezia', to: 'Cortina', dates: ['20261014'], shape: 0, stops: [[0, 28800, 28800, 'Venezia', true], [12000, 30500, 30500, 'Aeroporto Marco Polo', true], [30000, 42000, 42000, 'Cortina', true]] },
      ],
    } as unknown as DolomitiData;
    const b = airportBoard({ sim: null, day: 'weekday', nextDay: 'weekday', nowMs, nowS, alilaguna: [], flixbus: null, atvo: atvoData, dolomitibus: dolomitiData });
    expect(b.departures.some((r) => r.kind === 'atvo' && r.line === 'ATVO 35')).toBe(true);
    expect(b.arrivals.some((r) => r.kind === 'atvo' && r.line === 'ATVO 35')).toBe(true);
    expect(b.departures.some((r) => r.kind === 'dolomitibus' && r.line === 'Dolomiti Bus 72')).toBe(true);
    // un altro giorno: nessuna corsa
    const other = airportBoard({ sim: null, day: 'weekday', nextDay: 'weekday', nowMs: nowMs + 86_400_000, nowS, alilaguna: [], flixbus: null, atvo: atvoData, dolomitibus: dolomitiData });
    expect(other.departures.filter((r) => r.kind === 'atvo' || r.kind === 'dolomitibus')).toEqual([]);
  });
});
