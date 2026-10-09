import { describe, expect, it } from 'vitest';
import { applyAisMessage, collectAis, currentShips, shipCategory, VENICE_BBOX, type AisState } from './aisstream';

const position = (mmsi: number, extra: Record<string, unknown> = {}) => ({
  MessageType: 'PositionReport',
  MetaData: { MMSI: mmsi, ShipName: 'COSTA TEST     ', time_utc: '2026-10-09 13:00:00.123456 +0000 UTC' },
  Message: { PositionReport: { Latitude: 45.4301234, Longitude: 12.3456789, Sog: 12.34, Cog: 87.6, TrueHeading: 88, NavigationalStatus: 0, ...extra } },
});
const staticData = (mmsi: number) => ({
  MessageType: 'ShipStaticData',
  MetaData: { MMSI: mmsi, ShipName: 'COSTA TEST', time_utc: '2026-10-09 13:01:00 +0000 UTC' },
  Message: {
    ShipStaticData: {
      Name: 'COSTA TEST@@@', CallSign: 'IBCD', ImoNumber: 9123456, Type: 60, Destination: 'VENEZIA ',
      Dimension: { A: 200, B: 90, C: 16, D: 16 }, MaximumStaticDraught: 8.2, Eta: { Month: 10, Day: 9, Hour: 14, Minute: 30 },
    },
  },
});

describe('aisstream: messaggi AIS', () => {
  it('legge posizione, velocità, rotta e stato', () => {
    const state: AisState = new Map();
    expect(applyAisMessage(state, position(247000001))).toBe(true);
    const s = state.get('247000001')!;
    expect(s).toMatchObject({ name: 'COSTA TEST', lat: 45.43012, lon: 12.34568, speedKnots: 12.3, courseDeg: 88, heading: 88, navStatus: 'underway', lastSeen: '2026-10-09T13:00:00Z' });
  });

  it('scarta i valori AIS "non disponibile"', () => {
    const state: AisState = new Map();
    applyAisMessage(state, position(1, { Sog: 102.3, Cog: 360, TrueHeading: 511 }));
    expect(state.get('1')).toMatchObject({ speedKnots: null, courseDeg: null, heading: null });
    expect(applyAisMessage(state, position(2, { Latitude: 91 }))).toBe(false);
    expect(applyAisMessage(state, { MessageType: 'PositionReport' })).toBe(false);
  });

  it('unisce i dati statici alla posizione', () => {
    const state: AisState = new Map();
    applyAisMessage(state, position(3));
    applyAisMessage(state, staticData(3));
    expect(state.get('3')).toMatchObject({
      name: 'COSTA TEST', imo: '9123456', callSign: 'IBCD', category: 'PASSENGER', destination: 'VENEZIA',
      lengthMeters: 290, draughtMeters: 8.2, eta: '09/10 14:30 UTC', speedKnots: 12.3,
    });
  });

  it('classifica il tipo di nave', () => {
    expect(shipCategory(69)).toBe('PASSENGER');
    expect(shipCategory(74)).toBe('CARGO');
    expect(shipCategory(81)).toBe('TANKER');
    expect(shipCategory(52)).toBe('TUG');
    expect(shipCategory(null)).toBe('OTHER');
  });

  it('elenca solo le navi con posizione e sentite negli ultimi 30 minuti', () => {
    const state: AisState = new Map();
    applyAisMessage(state, position(4));
    applyAisMessage(state, staticData(5)); // solo dati statici: nessuna posizione
    expect(currentShips(state, new Date('2026-10-09T13:20:00Z')).map((s) => s.mmsi)).toEqual(['4']);
    expect(currentShips(state, new Date('2026-10-09T13:31:00Z'))).toEqual([]);
    expect(state.has('4')).toBe(false);
  });
});

describe('aisstream: raccolta via WebSocket', () => {
  it('si abbona all’area di Venezia, raccoglie i messaggi e chiude', async () => {
    const sent: string[] = [];
    let closed = false;
    class FakeWS {
      onopen: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: unknown }) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      onclose: ((ev: unknown) => void) | null = null;
      constructor() {
        setTimeout(() => {
          this.onopen?.({});
          this.onmessage?.({ data: JSON.stringify(position(6)) });
          this.onmessage?.({ data: 'non json' });
        }, 5);
      }
      send(data: string) { sent.push(data); }
      close() { closed = true; }
    }
    const state: AisState = new Map();
    const res = await collectAis(state, 'KEY', 50, FakeWS);
    expect(res).toEqual({ messages: 1 });
    expect(closed).toBe(true);
    const sub = JSON.parse(sent[0]);
    expect(sub.APIKey).toBe('KEY');
    expect(sub.BoundingBoxes).toEqual([VENICE_BBOX]);
  });

  it('senza WebSocket disponibile non lancia', async () => {
    expect(await collectAis(new Map(), 'KEY', 10, null)).toEqual({ messages: 0, error: 'websocket_unavailable' });
  });
});
