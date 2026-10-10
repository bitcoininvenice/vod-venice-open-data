import { describe, expect, it } from 'vitest';
import { DATA_RESOURCES, INITIAL_CITY_DATA, RESOURCES, layerCounts, neededResources, pickResource, type DataNeeds } from './cityData';
import { allLayers } from './layerState';
import { ALL_LAYER_KEYS } from './urlLayers';

const noUi: DataNeeds = { lists: false, alilagunaModal: false, airportModal: false, tideModal: false, tideSimulated: false };

describe('registro delle risorse', () => {
  it('ogni risorsa ha un URL /api distinto', () => {
    const urls = DATA_RESOURCES.map((k) => RESOURCES[k].url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u.startsWith('/api/')).toBe(true);
  });

  it('a mappa vuota servono solo marea e meteo (barra dell’orario)', () => {
    const needed = neededResources(allLayers(false), noUi);
    expect(DATA_RESOURCES.filter((k) => needed[k])).toEqual(['tide', 'weather']);
  });

  it('ricerca ed esportazione caricano gli elenchi cercabili', () => {
    const needed = neededResources(allLayers(false), { ...noUi, lists: true });
    for (const k of ['stops', 'cantieri', 'cameras', 'cityAssets', 'heritage', 'emergencyHealth', 'marineSensors'] as const) {
      expect(needed[k]).toBe(true);
    }
  });

  it('ogni livello che mostra dati caricati richiede almeno una risorsa', () => {
    // livelli disegnati da dati inclusi nella build o calcolati (nessuna API)
    const builtIn = new Set(['showRoutes', 'showVehicles', 'showMose', 'showShipRoutes']);
    const base = neededResources(allLayers(false), noUi);
    for (const key of ALL_LAYER_KEYS) {
      if (builtIn.has(key)) continue;
      const needed = neededResources({ ...allLayers(false), [key]: true }, noUi);
      const extra = DATA_RESOURCES.filter((k) => needed[k] && !base[k]);
      expect(extra.length, key).toBeGreaterThan(0);
    }
  });
});

describe('pickResource', () => {
  it('estrae la marea e lascia invariati i campi assenti', () => {
    const patch = pickResource('tide', {
      ok: true,
      data: { reference: { levelCm: 72, observedAt: '2026-10-10 10:00:00' }, trend: 'IN_AUMENTO', category: 'NORMALE', forecast: null, stations: [], moseGates: [] },
    });
    expect(patch?.tideLevel).toBe(72);
    expect(patch?.tideInfo?.trend).toBe('IN_AUMENTO');
    expect(patch).not.toHaveProperty('stops');
  });

  it('una risposta fallita non produce modifiche', () => {
    expect(pickResource('ships', { success: false, data: [] })).toBeUndefined();
    expect(pickResource('heritage', { success: false })).toBeUndefined();
    expect(pickResource('stops', 'non json')).toBeUndefined();
  });

  it('un elenco vuoto non sostituisce i dati di riferimento della build', () => {
    expect(pickResource('stops', { success: true, data: [] })).toBeUndefined();
    expect(pickResource('cameras', { success: true, data: [] })).toBeUndefined();
  });

  it('le risposte annidate finiscono nei campi giusti', () => {
    const patch = pickResource('emergencyHealth', { success: true, data: { dae: [{ id: 'a' }], pharmacies: [], emergencyDocks: [] } });
    expect(patch?.daeList).toHaveLength(1);
    expect(patch?.pharmacies).toEqual([]);
  });
});

describe('layerCounts', () => {
  it('conta gli elementi caricati per livello', () => {
    const counts = layerCounts(INITIAL_CITY_DATA, { scheduledVehicles: 12, alilagunaBoats: 3 });
    expect(counts.showVehicles).toBe(12);
    expect(counts.showAlilaguna).toBe(3);
    expect(counts.showStops).toBe(INITIAL_CITY_DATA.stops.length);
    expect(counts.showBdapWorks).toBe(0);
  });
});
