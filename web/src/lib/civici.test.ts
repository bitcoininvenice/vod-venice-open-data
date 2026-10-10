import { describe, expect, it } from 'vitest';
import { civicLabel, findCivic, parseCivicQuery, type CivicRow } from './civici';

describe('numeri civici veneziani', () => {
  it('riconosce sestiere e numero in varie grafie', () => {
    expect(parseCivicQuery('Cannaregio 3450')).toEqual({ sestiere: 'Cannaregio', number: 3450, letter: '' });
    expect(parseCivicQuery('CN 3450/b')).toEqual({ sestiere: 'Cannaregio', number: 3450, letter: 'B' });
    expect(parseCivicQuery('s. marco, 1234')).toEqual({ sestiere: 'San Marco', number: 1234, letter: '' });
    expect(parseCivicQuery('SanPolo1200A')).toEqual({ sestiere: 'San Polo', number: 1200, letter: 'A' });
    expect(parseCivicQuery('Giudecca 95')?.sestiere).toBe('Giudecca');
    expect(parseCivicQuery('Rialto')).toBeNull();
    expect(parseCivicQuery('Mestre 12')).toBeNull();
  });

  const rows: CivicRow[] = [
    [10, '', 12.3, 45.4], [12, '', 12.31, 45.41], [12, 'A', 12.311, 45.41], [40, '', 12.32, 45.42],
  ];

  it('trova il civico esatto, anche con la lettera', () => {
    expect(findCivic(rows, { sestiere: 'Castello', number: 12, letter: '' })).toMatchObject({ match: 'exact', number: 12, letter: '', gap: 0 });
    expect(findCivic(rows, { sestiere: 'Castello', number: 12, letter: 'A' })).toMatchObject({ match: 'exact', letter: 'A' });
  });

  it('se manca indica il civico noto più vicino, come approssimato', () => {
    expect(findCivic(rows, { sestiere: 'Castello', number: 12, letter: 'C' })).toMatchObject({ match: 'nearest', number: 12 });
    expect(findCivic(rows, { sestiere: 'Castello', number: 15, letter: '' })).toMatchObject({ match: 'nearest', number: 12, gap: 3 });
    expect(findCivic(rows, { sestiere: 'Castello', number: 35, letter: '' })).toMatchObject({ match: 'nearest', number: 40, gap: 5 });
    expect(findCivic(rows, { sestiere: 'Castello', number: 1, letter: '' })).toMatchObject({ number: 10 });
    expect(findCivic([], { sestiere: 'Castello', number: 1, letter: '' })).toBeNull();
  });

  it('etichetta', () => {
    expect(civicLabel('San Polo', 1200, 'A')).toBe('San Polo 1200 A');
  });
});
