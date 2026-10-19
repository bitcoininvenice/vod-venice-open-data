import { describe, it, expect, vi } from 'vitest';
import { drawPublicLighting, hitTestPublicLighting } from './lightingLayer';
import { OPEN_PUBLIC_LIGHTING } from '@/lib/publicLighting';
import type { RenderContext } from './renderContext';
import { NOTTE } from '@/lib/solar';

describe('lightingLayer', () => {
  it('identifica correttamente il punto luce cliccato con hitTestPublicLighting', () => {
    const p0 = OPEN_PUBLIC_LIGHTING[0];
    const testPoints = [
      p0,
      { ...p0, id: -1, lon: p0.lon + 1.0, lat: p0.lat + 1.0 }
    ];
    const screenFn = vi.fn((lon: number, lat: number) => {
      return [100 + (lon - p0.lon) * 10000, 200 + (lat - p0.lat) * 10000] as const;
    });

    const hit = hitTestPublicLighting(testPoints, 102, 201, screenFn, 16);
    expect(hit).not.toBeNull();
    expect(hit?.id).toBe(p0.id);

    // Clic molto lontano: deve restituire null
    const miss = hitTestPublicLighting(testPoints, 9999, 9999, screenFn, 16);
    expect(miss).toBeNull();
  });

  it('disegna i punti luce con blending additivo durante l orario notturno', () => {
    const mockGradient = {
      addColorStop: vi.fn(),
    };
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn(() => mockGradient),
      globalCompositeOperation: 'source-over',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
    } as unknown as CanvasRenderingContext2D;

    const mockRc = {
      ctx,
      camera: { x0: 0, y0: 0, s: 0.1 },
      cw: 1000,
      ch: 800,
      sx: (x: number) => x,
      sy: (y: number) => y,
      mx: () => 500,
      my: () => 400,
      currentTimeSeconds: 23 * 3600, // 23:00 - Notte piena
      showPublicLighting: true,
      publicLighting: OPEN_PUBLIC_LIGHTING,
      isDark: true,
      pal: NOTTE,
    } as unknown as RenderContext;

    drawPublicLighting(mockRc);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('non disegna nulla se showPublicLighting e false', () => {
    const ctx = {
      save: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const mockRc = {
      ctx,
      showPublicLighting: false,
    } as unknown as RenderContext;

    drawPublicLighting(mockRc);
    expect(ctx.save).not.toHaveBeenCalled();
  });
});
