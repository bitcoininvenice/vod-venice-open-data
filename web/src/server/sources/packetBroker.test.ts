import { describe, expect, it } from 'vitest';
import { parseGateways, roundCoord } from './packetBroker';

const gw = (over: Record<string, unknown> = {}) => ({
  netID: '000013',
  tenantID: 'ttn',
  id: 'casa-mario-rossi',
  eui: 'B827EBFFFEA4D845',
  location: { latitude: 45.430609832725104, longitude: 12.354276180267334, altitude: 16, accuracy: 0 },
  antennaPlacement: 'OUTDOOR',
  antennaCount: 1,
  online: true,
  updatedAt: '2026-10-09T19:06:53Z',
  ...over,
});

describe('gateway LoRaWAN (Packet Broker)', () => {
  it('tiene solo i gateway online dentro la mappa', () => {
    const out = parseGateways([
      gw(),
      gw({ online: false }),
      gw({ location: { latitude: 45.6077, longitude: 12.2419 } }), // a nord della mappa
      gw({ location: null }),
    ]);
    expect(out).toHaveLength(1);
  });

  it('mantiene la posizione pubblicata e non espone identificativi del proprietario', () => {
    const [g] = parseGateways([gw()]);
    expect(g.lat).toBe(45.43061);
    expect(g.lon).toBe(12.354276);
    expect(JSON.stringify(g)).not.toMatch(/mario|B827EB/i);
    expect(g.id).toBe('lora-1');
    expect(g.network).toBe('The Things Network');
    expect(g.antennaPlacement).toBe('outdoor');
    expect(roundCoord(12.20648961)).toBe(12.20649);
  });

  it('rifiuta una risposta non valida', () => {
    expect(() => parseGateways({ error: 'x' })).toThrow();
  });
});
