import { describe, expect, it } from 'vitest';
import { parseCampo } from './campo';
import { matchesSportFilter, mergeSportPlaces } from '@/lib/sports';
import type { SportPlace } from '@/lib/types';

const feature = (props: Record<string, unknown>, coords = [12.3645, 45.429]) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: coords },
  properties: { id: 'abc', title: 'Campo X', sport_category: 'basketball', marker_type: 'public_field', ...props },
});
const fc = (...features: unknown[]) => ({ type: 'FeatureCollection', features });
const places = (raw: unknown) => parseCampo(raw).places;

describe('CAMPO', () => {
  it('legge i punti e normalizza gli sport', () => {
    const [p] = places(fc(feature({ sport_category: 'football', sestiere: 'Castello', schedule_info: 'ACCESSO LIBERO 24/7' })));
    expect(p.id).toBe('campo-abc');
    expect(p.source).toBe('CAMPO');
    expect(p.sports).toEqual(['soccer']);
    expect(p.area).toBe('Castello');
    expect(p.access).toBe('public');
    expect(p.lat).toBe(45.429);
  });

  it('riconosce patronati, società e punti di ritrovo', () => {
    expect(places(fc(feature({ schedule_info: 'Aperto tutti i giorni / orari patronato' })))[0].access).toBe('parish');
    expect(places(fc(feature({ access: 'parish' })))[0].access).toBe('parish');
    expect(places(fc(feature({ marker_type: 'patronage' })))[0].access).toBe('parish');
    const club = places(fc(feature({ marker_type: 'partner' })))[0];
    expect(club.access).toBe('club');
    expect(club.kind).toBe('club');
    expect(places(fc(feature({ marker_type: 'community_hub', sport_category: 'rowing' })))[0].kind).toBe('hub');
  });

  it('un punto dichiarato pubblico ma con orari del patronato non risulta "aperto a tutti"', () => {
    expect(places(fc(feature({ access: 'public', schedule_info: 'Aperto tutti i giorni / orari patronato' })))[0].access).toBe('unknown');
    expect(places(fc(feature({ access: 'public', schedule_info: 'ACCESSO LIBERO 24/7' })))[0].access).toBe('public');
  });

  it('legge avviso, data di aggiornamento e metadati legali', () => {
    const data = parseCampo({
      ...fc(feature({ access: 'parish', access_notice: 'Spazio parrocchiale: accesso regolato dalla parrocchia.', updated_at: '2026-10-06T12:47:31Z' })),
      license: 'https://creativecommons.org/licenses/by/4.0/',
      license_name: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      attribution: 'Dati forniti dalla comunità di CAMPO Venezia',
      disclaimer: 'Dati forniti as-is.',
    });
    expect(data.places[0].notice).toMatch(/parrocchia/);
    expect(data.places[0].updatedAt).toBe('2026-10-06T12:47:31Z');
    expect(data.meta.license).toMatch(/CC BY 4\.0/);
    expect(data.meta.attribution).toBe('Dati forniti dalla comunità di CAMPO Venezia');
    expect(data.meta.disclaimer).toBe('Dati forniti as-is.');
    expect(data.meta.licensePage).toMatch(/\/licenza$/);
  });

  it('scarta punti senza coordinate e rifiuta risposte non valide', () => {
    expect(places(fc(feature({}, [Number.NaN, 45])))).toHaveLength(0);
    expect(() => parseCampo({ error: 'x' })).toThrow();
  });
});

describe('unione CAMPO + OpenStreetMap', () => {
  const osm = (over: Partial<SportPlace>): SportPlace => ({
    id: 'way/1', source: 'OPENSTREETMAP', name: null, sports: ['basketball'], kind: 'pitch', access: 'unknown',
    lat: 45.429, lon: 12.3645, area: null, address: null, schedule: null, description: null, surface: null,
    lit: null, operator: null, sourceUrl: null, ...over,
  });
  const campo = places(fc(feature({})));

  it('la segnalazione CAMPO prevale sull’impianto OSM vicino dello stesso sport', () => {
    const merged = mergeSportPlaces(campo, [osm({}), osm({ id: 'way/2', sports: [] })]);
    expect(merged.map((p) => p.id)).toEqual(['campo-abc']);
  });

  it('restano gli impianti OSM lontani o di altri sport', () => {
    const merged = mergeSportPlaces(campo, [osm({ id: 'way/3', lat: 45.44 }), osm({ id: 'way/4', sports: ['tennis'] })]);
    expect(merged.map((p) => p.id)).toEqual(['campo-abc', 'way/3', 'way/4']);
  });

  it('filtro per sport', () => {
    expect(matchesSportFilter(osm({ sports: ['beachvolleyball'] }), 'volleyball')).toBe(true);
    expect(matchesSportFilter(osm({ sports: ['equestrian'] }), 'other')).toBe(true);
    expect(matchesSportFilter(osm({ sports: ['soccer'] }), 'other')).toBe(false);
    expect(matchesSportFilter(osm({}), 'all')).toBe(true);
  });
});
