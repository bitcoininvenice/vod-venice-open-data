import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseVehiclePositions } from './gtfsRt';
import { lineCategory, lookupTrip } from './gtfsIndex';

describe('abbinamento GTFS-RT -> linea', () => {
  it('riconosce le corse anche con prefisso diverso dal GTFS statico', () => {
    const buf = readFileSync(path.join(__dirname, '../../test/fixtures/actv-nav-vehiclepositions.pb'));
    const u8 = new Uint8Array(buf);
    const vehicles = parseVehiclePositions(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer);
    const withTrip = vehicles.filter((v) => v.tripId);
    const matched = withTrip.filter((v) => lookupTrip(v.tripId));
    expect(withTrip.length).toBeGreaterThan(0);
    // la fixture è del 08/10/2026, come l'indice: la quasi totalità delle corse deve essere riconosciuta
    expect(matched.length / withTrip.length).toBeGreaterThan(0.8);
  });

  it('restituisce null per corse sconosciute', () => {
    expect(lookupTrip('XYZ_1_2')).toBeNull();
    expect(lookupTrip(null)).toBeNull();
  });
});

describe('categoria per linea', () => {
  it('le linee del tram sono tram anche senza la corsa nell indice', () => {
    expect(lineCategory('T1')).toBe('tram');
    expect(lineCategory('T2')).toBe('tram');
    // lo stesso numero è vaporetto e bus: decide la rete del mezzo
    expect(lineCategory('15', 'automobilistico')).toBe('bus');
    expect(lineCategory('15', 'navigazione')).toBe('vaporetto');
    expect(lineCategory('PM')).toBe('peoplemover');
    expect(lineCategory('1')).toBe('vaporetto');
    expect(lineCategory('linea-inesistente')).toBeNull();
    expect(lineCategory(null)).toBeNull();
  });
});
