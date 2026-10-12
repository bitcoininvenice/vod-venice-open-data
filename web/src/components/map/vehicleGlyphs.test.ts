import { describe, expect, it, vi } from 'vitest';
import { drawVehicleGlyph, headingFromMotion } from './vehicleGlyphs';
import { isWaterCategory } from '@/lib/actvLines';

function mockCtx() {
  const calls: string[] = [];
  const fn = (name: string) => vi.fn(() => calls.push(name));
  const ctx = {
    save: fn('save'), restore: fn('restore'), translate: fn('translate'), rotate: fn('rotate'), scale: fn('scale'),
    beginPath: fn('beginPath'), moveTo: fn('moveTo'), lineTo: fn('lineTo'), closePath: fn('closePath'),
    fill: fn('fill'), stroke: fn('stroke'), fillRect: fn('fillRect'), roundRect: fn('roundRect'),
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

describe('icone dei mezzi', () => {
  it('barca per i mezzi acquei, autobus per la terraferma', () => {
    for (const c of ['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']) expect(isWaterCategory(c), c).toBe(true);
    for (const c of ['bus', 'tram', null, undefined]) expect(isWaterCategory(c)).toBe(false);
    const boat = mockCtx();
    drawVehicleGlyph(boat.ctx, 'vaporetto', 0, 0, 0, { fill: '#000', stroke: '#fff', lineWidth: 1 });
    expect(boat.calls).not.toContain('roundRect');
    const bus = mockCtx();
    drawVehicleGlyph(bus.ctx, 'bus', 0, 0, 0, { fill: '#000', stroke: '#fff', lineWidth: 1 });
    expect(bus.calls).toContain('roundRect');
  });

  it('l icona punta nel verso di marcia sullo schermo', () => {
    expect(headingFromMotion(0, 10, 0, 0)).toBeCloseTo(0); // verso nord (in alto)
    expect(headingFromMotion(0, 0, 10, 0)).toBeCloseTo(Math.PI / 2); // verso est
    expect(headingFromMotion(0, 0, 0, 10)).toBeCloseTo(Math.PI); // verso sud
    expect(headingFromMotion(5, 5, 5.1, 5)).toBeNull(); // fermo
  });
});
