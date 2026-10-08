import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { parseVehiclePositions } from './gtfsRt';

const toArrayBuffer = (u8: Uint8Array) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;

describe('parseVehiclePositions', () => {
  it('decodifica il feed reale ACTV registrato', () => {
    const buf = readFileSync(path.join(__dirname, '../../test/fixtures/actv-nav-vehiclepositions.pb'));
    const vehicles = parseVehiclePositions(toArrayBuffer(new Uint8Array(buf)));
    expect(vehicles.length).toBeGreaterThan(0);
    for (const v of vehicles) {
      expect(v.lat).toBeGreaterThan(45);
      expect(v.lat).toBeLessThan(46);
      expect(v.lon).toBeGreaterThan(12);
      expect(v.lon).toBeLessThan(13);
    }
  });

  it('ignora entità senza posizione o con coordinate 0,0', () => {
    const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;
    const msg = FeedMessage.encode(
      FeedMessage.create({
        header: { gtfsRealtimeVersion: '2.0' },
        entity: [
          { id: 'a', vehicle: { position: { latitude: 45.43, longitude: 12.33 }, trip: { tripId: 't1' } } },
          { id: 'b', vehicle: { position: { latitude: 0, longitude: 0 } } },
          { id: 'c', vehicle: {} },
        ],
      }),
    ).finish();
    const vehicles = parseVehiclePositions(toArrayBuffer(msg));
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0]).toMatchObject({ id: 'a', tripId: 't1' });
  });
});
