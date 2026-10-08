import { describe, expect, it } from 'vitest';
import { assess } from './sourceHealth';

describe('salute delle fonti', () => {
  const now = new Date('2026-10-08T10:00:00Z');
  it('ok entro la soglia', () => {
    expect(assess('x', 'X', 'live', new Date('2026-10-08T09:50:00Z'), 30, now)).toMatchObject({ status: 'ok', ageMinutes: 10 });
  });
  it('stale oltre la soglia', () => {
    expect(assess('x', 'X', 'live', new Date('2026-10-08T08:00:00Z'), 30, now).status).toBe('stale');
  });
  it('down senza data', () => {
    expect(assess('x', 'X', 'live', null, 30, now)).toMatchObject({ status: 'down', ageMinutes: null });
  });
});
