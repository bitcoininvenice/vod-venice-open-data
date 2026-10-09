import { describe, expect, it } from 'vitest';
import { delayMinutes, delayStatus, estimateKind, isFresh } from './realtimeDelay';

describe('ritardi ACTV', () => {
  it('classifica il ritardo', () => {
    expect(delayStatus(-120)).toBe('early');
    expect(delayStatus(-30)).toBe('onTime');
    expect(delayStatus(179)).toBe('onTime');
    expect(delayStatus(180)).toBe('late');
    expect(delayStatus(300)).toBe('late');
    expect(delayStatus(301)).toBe('veryLate');
  });

  it('non mostra ritardi vecchi', () => {
    expect(isFresh(1000, 1100)).toBe(true);
    expect(isFresh(1000, 1121)).toBe(false);
    expect(isFresh(null, 1000)).toBe(false);
  });

  it('distingue la stima costante da quella che varia lungo il percorso', () => {
    expect(estimateKind([35, 35, 35])).toBe('constant');
    expect(estimateKind([93, 71, 82])).toBe('predicted');
    expect(estimateKind([40])).toBe('constant');
    expect(delayMinutes(99)).toBe(2);
    expect(delayMinutes(-37)).toBe(-1);
  });
});
