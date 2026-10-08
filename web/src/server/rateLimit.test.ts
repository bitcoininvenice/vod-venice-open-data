import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimit';

describe('rate limiter', () => {
  it('blocca oltre il limite nella stessa finestra e riapre dopo', () => {
    const check = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([1, 2, 3].map(() => check('a', 0).allowed)).toEqual([true, true, true]);
    const blocked = check('a', 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBe(1);
    expect(check('a', 1001).allowed).toBe(true);
  });
  it('conta separatamente ogni client', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(check('a', 0).allowed).toBe(true);
    expect(check('b', 0).allowed).toBe(true);
    expect(check('a', 0).allowed).toBe(false);
  });
  it('non cresce oltre maxKeys', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    check('a', 0);
    check('b', 0);
    expect(check('c', 0).allowed).toBe(true);
  });
});
