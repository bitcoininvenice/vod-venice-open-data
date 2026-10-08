import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { elevationAt, groundTrack, nextPass, satrecFor, stateAt } from './orbits';
import { parseTle, tleEpoch } from '@/server/sources/celestrak';

const text = readFileSync(path.join(__dirname, '../test/fixtures/iss.tle'), 'utf8');
const tle = parseTle(text, 25544)!;
const epoch = tleEpoch(tle[0]);

describe('TLE CelesTrak', () => {
  it('estrae le due righe del satellite richiesto', () => {
    expect(tle[0].startsWith('1 25544')).toBe(true);
    expect(tle[1].startsWith('2 25544')).toBe(true);
    expect(parseTle(text, 99999)).toBeNull();
  });
  it('calcola l\'epoca del TLE', () => {
    expect(epoch.getUTCFullYear()).toBe(2026);
  });
});

describe('propagazione SGP4 (ISS)', () => {
  const rec = satrecFor(tle[0], tle[1]);

  it('quota e velocità plausibili per la ISS', () => {
    const s = stateAt(rec, epoch)!;
    expect(s.altKm).toBeGreaterThan(350);
    expect(s.altKm).toBeLessThan(460);
    expect(s.speedKmh).toBeGreaterThan(27000);
    expect(s.speedKmh).toBeLessThan(28500);
    expect(Math.abs(s.lat)).toBeLessThanOrEqual(52);
  });

  it('trova un passaggio sopra Venezia entro 48 ore con elevazione sopra la soglia', () => {
    const pass = nextPass(rec, epoch);
    expect(pass).not.toBeNull();
    expect(pass!.maxElevationDeg).toBeGreaterThanOrEqual(10);
    expect(pass!.end.getTime()).toBeGreaterThan(pass!.start.getTime());
    const mid = new Date((pass!.start.getTime() + pass!.end.getTime()) / 2);
    expect(elevationAt(rec, mid)!).toBeGreaterThan(0);
  });

  it('traccia a terra continua', () => {
    const track = groundTrack(rec, epoch, -5, 5, 30);
    expect(track.length).toBe(21);
  });
});
