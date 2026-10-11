import { describe, expect, it, vi } from 'vitest';
import { drawFloodLayer, VENICE_FLOOD_ZONES } from './floodLayer';
import type { RenderContext } from './renderContext';
import { CARTA } from '@/lib/solar';

describe('floodLayer', () => {
  const createMockRenderContext = (tideLevel: number, zoomed: boolean = true): RenderContext => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      measureText: vi.fn(() => ({ width: 60 })),
      roundRect: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      setLineDash: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    return {
      ctx: mockCtx,
      cw: 1200,
      ch: 800,
      dpr: 1,
      pal: CARTA,
      isDark: false,
      camera: { x0: 15900, y0: 13300, s: 0.05 },
      W: 26194,
      H: 38701,
      KY: 276000,
      zoomed,
      tideLevel,
      currentTimeSeconds: 43200,
      sx: (x: number) => x * 0.05,
      sy: (y: number) => y * 0.05,
      mx: (lon: number) => lon * 1000,
      my: (lat: number) => lat * 1000,
      t: (key: string) => key,
    } as unknown as RenderContext;
  };

  it('contains correctly defined flood zones starting at San Marco (+80 cm)', () => {
    expect(VENICE_FLOOD_ZONES.length).toBeGreaterThanOrEqual(14);
    const sanMarco = VENICE_FLOOD_ZONES.find((z) => z.id === 'san_marco');
    expect(sanMarco).toBeDefined();
    expect(sanMarco?.thresholdCm).toBe(80);

    const rialto = VENICE_FLOOD_ZONES.find((z) => z.id === 'rialto');
    expect(rialto).toBeDefined();
    expect(rialto?.thresholdCm).toBe(95);
  });

  it('does not render any flood layer when tide level is below 80 cm', () => {
    const rc = createMockRenderContext(65);
    drawFloodLayer(rc, 65);
    expect(rc.ctx.save).not.toHaveBeenCalled();
    expect(rc.ctx.fill).not.toHaveBeenCalled();
  });

  it('renders flood water when tide level reaches or exceeds 80 cm', () => {
    const rc = createMockRenderContext(115);
    drawFloodLayer(rc, 115);
    expect(rc.ctx.save).toHaveBeenCalled();
    expect(rc.ctx.restore).toHaveBeenCalled();
  });
});
