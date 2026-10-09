import { describe, expect, it } from 'vitest';
import { buildCsv, buildGeoJson, csvCell } from './dataExport';

describe('csvCell', () => {
  it('raddoppia le virgolette e racchiude il valore', () => {
    expect(csvCell('Campo "San Polo", Venezia')).toBe('"Campo ""San Polo"", Venezia"');
  });
  it('neutralizza le formule dei fogli di calcolo', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell('+39')).toBe('"\'+39"');
  });
  it('gestisce null e undefined', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });
});

describe('buildCsv', () => {
  const layers = [{ id: 'dae', name: 'DAE', items: [
    { id: 'A', name: 'Uno, "due"', lat: 45.43, lon: 12.33, officialSource: 'ULSS 3' },
    { id: 'B', name: 'Senza coordinate' },
  ] }];
  it('esporta solo elementi con coordinate, con BOM e CRLF', () => {
    const csv = buildCsv(layers);
    expect(csv.startsWith('﻿id,layer,name,latitude,longitude,details,source\r\n')).toBe(true);
    const rows = csv.slice(1).split('\r\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe('"A","dae","Uno, ""due""",45.43,12.33,"","ULSS 3"');
  });
});

describe('buildGeoJson', () => {
  it('produce GeoJSON RFC 7946 senza crs, con lon/lat e layerId non sovrascrivibile', () => {
    const fc = buildGeoJson(
      [{ id: 'stops', name: 'Fermate', items: [{ id: 'S', lat: 45.4, lon: 12.3, layerId: 'falso' }] }],
      '2026-10-08T00:00:00.000Z',
      'https://example.org',
    );
    expect(fc).not.toHaveProperty('crs');
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.coordinates).toEqual([12.3, 45.4]);
    expect(fc.features[0].properties.layerId).toBe('stops');
    expect(fc.metadata.totalFeatures).toBe(1);
  });
});
