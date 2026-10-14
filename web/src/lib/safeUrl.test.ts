import { describe, expect, it } from 'vitest';
import { safeUrl } from './safeUrl';

describe('link dai dati di terzi', () => {
  it('solo http/https', () => {
    expect(safeUrl('https://www.comune.venezia.it/')).toBe('https://www.comune.venezia.it/');
    expect(safeUrl('www.example.org')).toBe('https://www.example.org/');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html,<b>x</b>')).toBeNull();
    expect(safeUrl('  ')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});
