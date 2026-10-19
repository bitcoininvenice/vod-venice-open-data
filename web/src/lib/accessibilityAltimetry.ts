/**
 * Farmacie del centro storico e acqua alta.
 *
 * Dati reali: farmacie mappate su OpenStreetMap (con il sestiere dall'indirizzo, es. «Dorsoduro 1053/C»),
 * residenti e over 65 per sestiere dal Censimento ISTAT 2021, percentuale di suolo allagato del centro storico
 * dalla curva ufficiale del Centro Maree. Stima dichiarata: la quota del suolo davanti a ogni farmacia, interpolata
 * da pochi punti noti come nel resto di VOD (non esiste un rilievo aperto delle pavimentazioni).
 */
import pharmaciesData from '@/data/osm-pharmacies.json';
import censusData from '@/data/istat-census-venezia.json';
import { getFloodedGroundPercentage } from '@/lib/flood';

export const HISTORIC_SESTIERI = ['Cannaregio', 'Castello', 'Dorsoduro', 'San Marco', 'San Polo', 'Santa Croce'] as const;
export type Sestiere = (typeof HISTORIC_SESTIERI)[number];

export interface PharmacyAccess {
  id: string;
  name: string;
  sestiere: Sestiere;
  lat: number;
  lon: number;
  /** quota STIMATA del suolo all'ingresso (cm sullo ZMPS) */
  groundEstimateCm: number;
}

export interface SestiereAccess {
  sestiere: Sestiere;
  population: number;
  over65: number;
  pctOver65: number;
  pharmacies: number;
  /** farmacie con la quota stimata sopra la marea */
  pharmaciesDry: number;
}

export interface AltimetricScenarioResult {
  tideLevelCm: number;
  /** percentuale di suolo del centro storico allagato secondo la curva ufficiale CPSM */
  cityFloodedPercent: number;
  pharmacies: number;
  pharmaciesDry: number;
  sestieri: SestiereAccess[];
}

/**
 * Stima della quota del piano di calpestio (cm ZMPS) alle coordinate indicate,
 * basata sugli ancoraggi altimetrici del Centro Maree CPSM.
 */
export function estimateFacilityGroundThreshold(lon: number, lat: number): number {
  // Punti di riferimento altimetrici del centro storico
  const anchors = [
    { lon: 12.3385, lat: 45.4338, h: 80, r: 0.003 }, // San Marco Piazzetta
    { lon: 12.3370, lat: 45.4344, h: 85, r: 0.003 }, // Piazza San Marco
    { lon: 12.3360, lat: 45.4382, h: 96, r: 0.003 }, // Rialto Erbaria
    { lon: 12.3368, lat: 45.4377, h: 104, r: 0.003 }, // Campo San Bartolomeo
    { lon: 12.3255, lat: 45.4445, h: 106, r: 0.004 }, // Cannaregio Guglie
    { lon: 12.3325, lat: 45.4455, h: 110, r: 0.004 }, // Misericordia
    { lon: 12.3412, lat: 45.4398, h: 114, r: 0.004 }, // Campo SS. Giovanni e Paolo
    { lon: 12.3300, lat: 45.4372, h: 112, r: 0.004 }, // Campo San Polo
    { lon: 12.3275, lat: 45.4412, h: 118, r: 0.004 }, // San Giacomo dell'Orio
    { lon: 12.3235, lat: 45.4338, h: 115, r: 0.004 }, // Campo Santa Margherita
    { lon: 12.3280, lat: 45.4295, h: 108, r: 0.004 }, // Zattere
    { lon: 12.3525, lat: 45.4325, h: 124, r: 0.005 }, // Castello Garibaldi
    { lon: 12.3265, lat: 45.4262, h: 110, r: 0.004 }, // Giudecca Palanca
  ];

  let totalWeight = 0.001;
  let weightedH = 115 * 0.001; // Quota media centro storico: 115 cm

  for (const a of anchors) {
    const dist = Math.hypot(lon - a.lon, lat - a.lat);
    if (dist < a.r * 2.5) {
      const w = 1 / (1 + Math.pow(dist / a.r, 2));
      weightedH += a.h * w;
      totalWeight += w;
    }
  }

  return Math.round(weightedH / totalWeight);
}


/** Sestiere dall'indirizzo veneziano («Cannaregio 1234»): null se l'indirizzo non lo dice */
export function sestiereFromAddress(address: string | null | undefined): Sestiere | null {
  const a = (address ?? '').toLowerCase();
  return HISTORIC_SESTIERI.find((s) => a.startsWith(s.toLowerCase())) ?? null;
}

/** Farmacie del centro storico con il sestiere dall'indirizzo e la quota stimata */
export function historicCentrePharmacies(): PharmacyAccess[] {
  return (pharmaciesData.pharmacies as { id: string; name: string; address?: string | null; lat: number; lon: number }[]).flatMap((p) => {
    const sestiere = sestiereFromAddress(p.address);
    return sestiere ? [{ id: p.id, name: p.name, sestiere, lat: p.lat, lon: p.lon, groundEstimateCm: estimateFacilityGroundThreshold(p.lon, p.lat) }] : [];
  });
}

/** Con la marea a tideLevelCm: suolo allagato (CPSM) e farmacie stimate asciutte, per sestiere */
export function calculateAltimetricAccessibility(tideLevelCm: number): AltimetricScenarioResult {
  const pharmacies = historicCentrePharmacies();
  const census = (censusData.sestieri ?? []) as { name: string; population: number; pct65plus: number }[];
  const sestieri = HISTORIC_SESTIERI.map((name) => {
    const c = census.find((x) => x.name === name);
    const here = pharmacies.filter((p) => p.sestiere === name);
    return {
      sestiere: name,
      population: c?.population ?? 0,
      over65: c ? Math.round((c.population * c.pct65plus) / 100) : 0,
      pctOver65: c?.pct65plus ?? 0,
      pharmacies: here.length,
      pharmaciesDry: here.filter((p) => p.groundEstimateCm > tideLevelCm).length,
    };
  });
  return {
    tideLevelCm,
    cityFloodedPercent: getFloodedGroundPercentage(tideLevelCm),
    pharmacies: pharmacies.length,
    pharmaciesDry: pharmacies.filter((p) => p.groundEstimateCm > tideLevelCm).length,
    sestieri,
  };
}
