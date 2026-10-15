/**
 * Modulo di Analisi Spaziale Quantitativa e Modelli Previsionali Scientifici
 * per Venice Open Data.
 *
 * Le funzioni dichiarano la natura del risultato:
 * - calcolato: ricavato dai dataset del progetto (es. copertura DAE, previsione maree CPSM);
 * - illustrativo (`illustrative: true`): valori di esempio senza una fonte pubblica che li misuri,
 *   da mostrare in UI con un'etichetta esplicita.
 */

import { OPEN_EMERGENCY_WATER_DOCKS, OPEN_HEAT_ISLAND_LST } from '@/lib/open-data-catalog';
import { getFloodedGroundPercentage, getSirenTones } from '@/lib/flood';
import type { TideForecast } from '@/lib/contracts/tide';
import { ACTV_STOPS_REFERENCE } from '@/lib/db';
import { romeLocalToDate } from '@/lib/time';

/** Natura del risultato, da mostrare in UI accanto a ogni indicatore. */
export type MetricBasis = 'calcolato' | 'stima' | 'illustrativo';

interface MetricProvenance {
  basis: MetricBasis;
  /** Da dove viene il valore e quali limiti ha, in una frase */
  basisNote: string;
}
import { VERIFIED_PUBLIC_DAE } from '@/lib/dae-data';
import { VERIFIED_PHARMACIES } from '@/lib/pharmacies-data';
import { calculateDistanceMeters } from '@/lib/geo';

// ============================================================================
// 1. ANALISI DI PROSSIMITÀ AI PRESIDI DI EMERGENZA (Accessibility Buffer)
// ============================================================================

export interface EmergencyAccessibilityStats extends MetricProvenance {
  totalDae: number;
  totalPharmacies: number;
  totalEmergencyDocks: number;
  /** Punti di riferimento usati per il calcolo (fermate di navigazione ACTV del centro storico) */
  referencePointsCount: number;
  /** % di punti di riferimento entro 200 m in linea d'aria da un DAE */
  daeCoverage200mPercent: number;
  /** % di punti di riferimento entro 350 m da una farmacia */
  pharmacyCoverage350mPercent: number;
  /** % di punti di riferimento entro 400 m da un approdo idroambulanze SUEM 118 */
  emergencyDockPerimeterCoveragePercent: number;
  /** Punti di riferimento più lontani dal DAE più vicino */
  underservedAreas: Array<{
    area: string;
    sestiere: string;
    distanceToNearestDaeMeters: number;
    recommendedAction: string;
  }>;
}

/** Riquadro del centro storico (con Giudecca), per selezionare le fermate di riferimento. */
const CENTRO_STORICO_BBOX = { latMin: 45.423, latMax: 45.449, lonMin: 12.305, lonMax: 12.366 };

function nearestDistance(lat: number, lon: number, targets: ReadonlyArray<{ lat: number; lon: number }>): number {
  let best = Infinity;
  for (const t of targets) best = Math.min(best, calculateDistanceMeters(lat, lon, t.lat, t.lon));
  return best;
}

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

/**
 * Copertura dei presidi sanitari calcolata sulle fermate di navigazione ACTV del centro storico
 * (proxy dei punti frequentati). Distanze in linea d'aria: il percorso pedonale reale è più lungo,
 * quindi le percentuali sono un limite superiore.
 */
export function calculateEmergencyAccessibility(): EmergencyAccessibilityStats {
  const b = CENTRO_STORICO_BBOX;
  const refs = ACTV_STOPS_REFERENCE.filter(
    (s) => s.mode === 'navigazione' && s.lat >= b.latMin && s.lat <= b.latMax && s.lon >= b.lonMin && s.lon <= b.lonMax,
  );
  const withDist = refs.map((s) => ({
    stop: s,
    dae: nearestDistance(s.lat, s.lon, VERIFIED_PUBLIC_DAE),
    pharmacy: nearestDistance(s.lat, s.lon, VERIFIED_PHARMACIES),
    dock: nearestDistance(s.lat, s.lon, OPEN_EMERGENCY_WATER_DOCKS),
  }));

  const underservedAreas = [...withDist]
    .sort((x, y) => y.dae - x.dae)
    .slice(0, 4)
    .map((d) => ({
      area: d.stop.name,
      sestiere: 'Fermata ACTV',
      distanceToNearestDaeMeters: Math.round(d.dae),
      recommendedAction: 'Verificare la presenza di un DAE accessibile nelle vicinanze',
    }));

  return {
    basis: 'calcolato',
    basisNote: 'Distanze in linea d\'aria dalle fermate ACTV del centro storico ai DAE e alle farmacie OpenStreetMap e agli approdi idroambulanze dell\'elenco curato.',
    totalDae: VERIFIED_PUBLIC_DAE.length,
    totalPharmacies: VERIFIED_PHARMACIES.length,
    totalEmergencyDocks: OPEN_EMERGENCY_WATER_DOCKS.length,
    referencePointsCount: refs.length,
    daeCoverage200mPercent: pct(withDist.filter((d) => d.dae <= 200).length, refs.length),
    pharmacyCoverage350mPercent: pct(withDist.filter((d) => d.pharmacy <= 350).length, refs.length),
    emergencyDockPerimeterCoveragePercent: pct(withDist.filter((d) => d.dock <= 400).length, refs.length),
    underservedAreas,
  };
}

// ============================================================================
// 3. PUNTUALITÀ E SCOSTAMENTO TRASPORTO PUBBLICO LAGUNARE (Delta Realtime vs Scheduled)
// ============================================================================

export interface TransitPunctualityStats extends MetricProvenance {
  totalScheduledRoutes: number;
  totalWaterbusStops: number;
  onTimePercent: number; // ritardo < 2 min
  minorDelayPercent: number; // 2 - 5 min
  majorDelayPercent: number; // > 5 min
  averageDelaySeconds: number;
  criticalLines: Array<{
    line: string;
    route: string;
    avgDelayMinutes: number;
    bottleneckCause: string;
  }>;
  resilientLines: Array<{
    line: string;
    route: string;
    onTimeRatePercent: number;
  }>;
}

export function calculateTransitPunctuality(): TransitPunctualityStats {
  return {
    basis: 'illustrativo',
    basisNote: 'ACTV non pubblica dati di puntualità e il feed GTFS-RT usato contiene solo le posizioni dei mezzi.',
    totalScheduledRoutes: 30,
    totalWaterbusStops: 153,
    onTimePercent: 84.2,
    minorDelayPercent: 11.6,
    majorDelayPercent: 4.2,
    averageDelaySeconds: 78,
    criticalLines: [
      {
        line: 'Linea 1',
        route: 'P.le Roma - Canal Grande - Lido SME (21 approdi)',
        avgDelayMinutes: 3.4,
        bottleneckCause: 'Traffico acqueo, correnti di marea e imbarco passeggeri a Rialto e S. Marco'
      },
      {
        line: 'Linea 2',
        route: 'San Zaccaria - Giudecca - Tronchetto - Canal Grande',
        avgDelayMinutes: 2.8,
        bottleneckCause: 'Incroci con naviglio commerciale e navette Alilaguna in Canale della Giudecca'
      },
      {
        line: 'Linea 3 (Diretta Murano)',
        route: 'P.le Roma - Ferrovia - Rio di Cannaregio - Murano',
        avgDelayMinutes: 2.2,
        bottleneckCause: 'Strettoia Rio di Cannaregio e franchigia ridotta Ponte delle Guglie'
      }
    ],
    resilientLines: [
      {
        line: 'Linea 12',
        route: 'F.te Nove - Murano - Burano - Punta Sabbioni',
        onTimeRatePercent: 93.4
      },
      {
        line: 'Linea 14',
        route: 'San Zaccaria - Lido - Punta Sabbioni',
        onTimeRatePercent: 92.1
      },
      {
        line: 'Linea 5.1/5.2',
        route: 'Circolare esterna lagunare (Girocittà)',
        onTimeRatePercent: 88.5
      }
    ]
  };
}

// ============================================================================
// 4. INDICE DI BARRIERE ARCHITETTONICHE INSULARI
// ============================================================================

export interface AccessibilityBarriersStats extends MetricProvenance {
  totalHistoricBridges: number;
  accessibleBridgesCount: number;
  steppedBridgesCount: number;
  accessibilityPercentage: number;
  inaccessiblePercentage: number;
  officialReferences: Array<{ id: string; label: string; url: string }>;
}

export function calculateBarrierFreeIndex(): AccessibilityBarriersStats {
  const totalHistoricBridges = 435; // Numero di ponti del centro storico indicato dal Comune di Venezia
  const accessibleBridgesCount = 35; // Valore di esempio: manca un elenco aperto e aggiornato dei ponti attrezzati
  const steppedBridgesCount = totalHistoricBridges - accessibleBridgesCount;
  const accessibilityPercentage = +((accessibleBridgesCount / totalHistoricBridges) * 100).toFixed(2);
  const inaccessiblePercentage = +(100 - accessibilityPercentage).toFixed(2);

  // Nessun itinerario viene presentato come "verificato": per chi si muove in carrozzina un dato
  // sbagliato è un rischio. Si rimanda alle fonti ufficiali del Comune.
  const officialReferences = [
    { id: 'accessibleMap', label: 'Mappa di Venezia accessibile (Comune di Venezia)', url: 'https://www.comune.venezia.it/en/content/accessible-venice-map' },
    { id: 'wheelchairGuide', label: 'Venezia a ruota libera – guida del Comune', url: 'https://www.comune.venezia.it/sites/comune.venezia.it/files/page/files/venezia_a_ruota_libera.pdf' },
  ];

  return {
    basis: 'illustrativo',
    basisNote: 'Il totale di 435 ponti è il dato del Comune; il numero di ponti attrezzati è un valore di esempio da sostituire con un elenco ufficiale.',
    totalHistoricBridges,
    accessibleBridgesCount,
    steppedBridgesCount,
    accessibilityPercentage,
    inaccessiblePercentage,
    officialReferences
  };
}

// ============================================================================
// 5. PREVISIONE DI ALLAGAMENTO PEDONALE A 72-96 ORE (Forecast CPSM + Flood Matrix)
// ============================================================================

interface HourlyFloodForecastPoint {
  timeStr: string;
  timestampMs: number;
  heightCm: number;
  floodedPercent: number;
  isPeak: boolean;
  isHighTide: boolean;
  passerelleRequired: boolean;
  sirenTone: number;
}

export interface TideFloodForecastAnalysis extends MetricProvenance {
  issuedAt: string | null;
  forecastPoints: HourlyFloodForecastPoint[];
  maxPeakCm: number;
  maxFloodedPercent: number;
  moseDeploymentForecasted: boolean;
  totalFloodedHoursCount: number;
  hoursWithPasserelleCount: number;
  // Rigore scientifico: esplicitazione del metodo, dati storici e margini di incertezza
  methodName: string;
  historicalBasis: string;
  uncertaintyMargin: string;
  probabilisticDisclaimer: string;
}

const TIDE_FORECAST_METHOD = {
  basis: 'stima' as const,
  basisNote: 'Derivata dalla previsione ufficiale degli estremali CPSM; l\'andamento tra un estremale e l\'altro e la quota allagata sono stime.',
  methodName: 'Interpolazione cosinusoidale tra gli estremali previsti dal Centro Maree (CPSM)',
  historicalBasis: 'Previsione CPSM (dati.venezia.it) e tabella indicativa di allagamento del centro storico per livello di marea',
  uncertaintyMargin: 'L\'incertezza della previsione CPSM cresce con l\'orizzonte; l\'interpolazione oraria aggiunge un errore sugli orari intermedi',
  probabilisticDisclaimer: 'Non è un prodotto ufficiale: per decisioni operative fare riferimento ai bollettini del Centro Maree',
};

export function calculateTideFloodForecast72h(forecast: TideForecast | null | undefined): TideFloodForecastAnalysis {
  if (!forecast || !forecast.extremes || forecast.extremes.length === 0) {
    return {
      issuedAt: null,
      forecastPoints: [],
      maxPeakCm: 0,
      maxFloodedPercent: 0,
      moseDeploymentForecasted: false,
      totalFloodedHoursCount: 0,
      hoursWithPasserelleCount: 0,
      ...TIDE_FORECAST_METHOD
    };
  }

  // Gli orari CPSM sono in ora locale di Venezia senza offset: non usare new Date(stringa),
  // che li interpreterebbe nel fuso del browser (e su Safari può restituire Invalid Date).
  const toMs = (at: string) => romeLocalToDate(at).getTime();
  const extremes = forecast.extremes.slice().sort((a, b) => toMs(a.at) - toMs(b.at));

  const points: HourlyFloodForecastPoint[] = [];

  // Interpolazione armonica di marea semi-diurna tra massimi e minimi successivi
  for (let i = 0; i < extremes.length - 1; i++) {
    const e1 = extremes[i];
    const e2 = extremes[i + 1];
    const t1 = toMs(e1.at);
    const t2 = toMs(e2.at);
    const dt = t2 - t1;

    // Genera punti orari tra e1 ed e2
    const stepHours = Math.max(1, Math.round(dt / (3600 * 1000)));
    for (let s = 0; s < stepHours; s++) {
      const frac = s / stepHours;
      const tMs = t1 + frac * dt;
      // Formula armonica di marea: h(t) = (h1 + h2)/2 + (h1 - h2)/2 * cos(pi * frac)
      const heightCm = Math.round((e1.levelCm + e2.levelCm) / 2 + ((e1.levelCm - e2.levelCm) / 2) * Math.cos(Math.PI * frac));
      const floodedPercent = getFloodedGroundPercentage(heightCm);
      const isPeak = s === 0;

      points.push({
        timeStr: new Date(tMs).toISOString(),
        timestampMs: tMs,
        heightCm,
        floodedPercent,
        isPeak,
        isHighTide: e1.type === 'max',
        passerelleRequired: heightCm >= 100,
        sirenTone: getSirenTones(heightCm)
      });
    }
  }

  // Aggiunge l'ultimo estremo
  const last = extremes[extremes.length - 1];
  points.push({
    timeStr: new Date(toMs(last.at)).toISOString(),
    timestampMs: toMs(last.at),
    heightCm: last.levelCm,
    floodedPercent: getFloodedGroundPercentage(last.levelCm),
    isPeak: true,
    isHighTide: last.type === 'max',
    passerelleRequired: last.levelCm >= 100,
    sirenTone: getSirenTones(last.levelCm)
  });

  const maxPeakCm = Math.max(...extremes.map((e) => e.levelCm));
  const maxFloodedPercent = getFloodedGroundPercentage(maxPeakCm);
  const moseDeploymentForecasted = maxPeakCm >= 110;
  const totalFloodedHoursCount = points.filter((p) => p.floodedPercent > 0.5).length;
  const hoursWithPasserelleCount = points.filter((p) => p.passerelleRequired).length;

  return {
    issuedAt: forecast.issuedAt,
    forecastPoints: points,
    maxPeakCm,
    maxFloodedPercent,
    moseDeploymentForecasted,
    totalFloodedHoursCount,
    hoursWithPasserelleCount,
    ...TIDE_FORECAST_METHOD
  };
}

// ============================================================================
// 6. PREVISIONE COLLI DI BOTTIGLIA & CONGESTIONE CANALI (Canal Traffic Capacity)
// ============================================================================

export interface CanalBottleneckForecast extends MetricProvenance {
  canalName: string;
  widthMeters: number;
  speedLimitKmh: number;
  peakHourlyTransits: number;
  capacitySaturationPercent: number;
  criticalHours: string;
  tideSensitivity: string;
  riskFactor: 'Critico' | 'Elevato' | 'Moderato';
  methodName: string;
  historicalBasis: string;
  uncertaintyMargin: string;
}

export function calculateCanalBottlenecksForecast(): CanalBottleneckForecast[] {
  const commonMethod = {
    basis: 'illustrativo' as const,
    basisNote: 'Transiti e saturazione sono valori di esempio: non esistono conteggi aperti del traffico acqueo per canale.',
    methodName: 'Scenario di esempio (nessun modello calibrato)',
    historicalBasis: 'Nessun dato di conteggio: valori scritti a mano per illustrare la sezione',
    uncertaintyMargin: 'Stima indicativa soggetta a picchi di naviglio privato, moto ondoso riflesso e manovre ai pontili'
  };

  return [
    {
      canalName: 'Rio di Cannaregio (sottopasso Ponte delle Guglie)',
      widthMeters: 22,
      speedLimitKmh: 5,
      peakHourlyTransits: 28,
      capacitySaturationPercent: 86.4,
      criticalHours: '07:45 - 09:15 e 17:15 - 18:45',
      tideSensitivity: 'Critica: a quota >= +95 cm la franchigia del ponte scende sotto i 2.10m, bloccando motoscafi alti e barche merci',
      riskFactor: 'Critico',
      ...commonMethod
    },
    {
      canalName: 'Canal Grande (sezione Volta di Canal / San Tomà)',
      widthMeters: 48,
      speedLimitKmh: 7,
      peakHourlyTransits: 44,
      capacitySaturationPercent: 78.5,
      criticalHours: '10:00 - 13:00 e 15:30 - 18:00',
      tideSensitivity: 'Moderata: con marea eccezionale le onde scalzano le rive e riducono l\'agibilità dei pontili galleggianti',
      riskFactor: 'Elevato',
      ...commonMethod
    },
    {
      canalName: 'Incrocio Rio Nuovo / Rio di Ca\' Foscari',
      widthMeters: 16,
      speedLimitKmh: 5,
      peakHourlyTransits: 22,
      capacitySaturationPercent: 74.0,
      criticalHours: '08:00 - 10:00',
      tideSensitivity: 'Elevata: visibilità ridotta a gomito e manovra obbligata a senso alternato per mototaxi e servizi ACTV',
      riskFactor: 'Elevato',
      ...commonMethod
    },
    {
      canalName: 'Bacino San Marco (fronte Molo e Riva degli Schiavoni)',
      widthMeters: 380,
      speedLimitKmh: 11,
      peakHourlyTransits: 68,
      capacitySaturationPercent: 62.0,
      criticalHours: '11:00 - 17:00',
      tideSensitivity: 'Elevata con vento di Scirocco / Bora: forte moto ondoso riflettente contro le banchine in pietra d\'Istria',
      riskFactor: 'Moderato',
      ...commonMethod
    }
  ];
}

// ============================================================================
// 7. PREVISIONE DELLO STRESS TERMICO URBANO A 24-48 ORE (Urban Heat Stress)
// ============================================================================

export interface MicroclimateThermalZone {
  zoneName: string;
  satelliteLstArrayAnomalyC: number;
  perceivedPeakTempC: number;
  heatStressCategory: 'Confortevole' | 'Cautela' | 'Cautela Estrema' | 'Pericolo';
  vegetationRole: string;
}

export interface UrbanHeatStressForecast extends MetricProvenance {
  /** null se il METAR non è disponibile: nessun valore di ripiego inventato */
  baseAirTempC: number | null;
  baseHumidityPercent: number | null;
  baseHeatIndexC: number | null;
  zones: MicroclimateThermalZone[];
  coolestRefugeZone: string | null;
  hottestExposureZone: string | null;
  methodName: string;
  historicalBasis: string;
  uncertaintyMargin: string;
  probabilisticDisclaimer: string;
}

/** Umidità relativa da temperatura e punto di rugiada (Magnus). */
export function relativeHumidityPercent(tempC: number, dewC: number): number {
  const rh = 100 * Math.exp((17.625 * dewC) / (243.04 + dewC) - (17.625 * tempC) / (243.04 + tempC));
  return Math.round(Math.min(100, Math.max(0, rh)));
}

/**
 * Temperatura apparente di Steadman senza vento (formulazione del Bureau of Meteorology australiano):
 * AT = Ta + 0.33·e − 4.0, con e pressione di vapore in hPa.
 */
export function apparentTemperatureC(tempC: number, rhPercent: number): number {
  const e = (rhPercent / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return +(tempC + 0.33 * e - 4.0).toFixed(1);
}

export function calculateUrbanHeatStressForecast(
  metarTempC: number | null,
  metarDewPointC: number | null
): UrbanHeatStressForecast {
  const method = {
    basis: 'stima' as const,
    basisNote: 'Temperatura e umidità dal METAR reale di Tessera; gli scarti per zona vengono da un elenco curato di anomalie superficiali, non da un prodotto satellitare elaborato dal progetto.',
    methodName: 'Temperatura apparente di Steadman senza vento (formula BoM) e umidità relativa di Magnus',
    historicalBasis: 'METAR LIPZ (NOAA) per la temperatura dell\'aria; anomalie per zona da elenco curato (open-data-catalog.ts, OPEN_HEAT_ISLAND_LST)',
    uncertaintyMargin: 'Indicativa: il METAR è misurato all\'aeroporto, non in città, e le anomalie per zona sono valori medi',
    probabilisticDisclaimer: 'L\'impatto termico reale dipende da ombra, vento e ventilazione dei canali',
  };

  if (metarTempC === null || metarDewPointC === null) {
    return {
      ...method,
      baseAirTempC: null,
      baseHumidityPercent: null,
      baseHeatIndexC: null,
      zones: [],
      coolestRefugeZone: null,
      hottestExposureZone: null,
    };
  }

  const rh = relativeHumidityPercent(metarTempC, metarDewPointC);
  const baseHeatIndexC = apparentTemperatureC(metarTempC, rh);

  const zones: MicroclimateThermalZone[] = OPEN_HEAT_ISLAND_LST.map((island) => {
    const anomaly = island.airTempDelta;
    const perceived = +(baseHeatIndexC + anomaly).toFixed(1);

    let heatStressCategory: MicroclimateThermalZone['heatStressCategory'] = 'Confortevole';
    if (perceived >= 38) heatStressCategory = 'Pericolo';
    else if (perceived >= 32) heatStressCategory = 'Cautela Estrema';
    else if (perceived >= 27) heatStressCategory = 'Cautela';

    const role =
      anomaly < 0
        ? 'Zona più fresca della media (verde, acqua, ombra)'
        : 'Zona più calda della media (superfici impermeabili e assolate)';

    return {
      zoneName: island.zoneName,
      satelliteLstArrayAnomalyC: anomaly,
      perceivedPeakTempC: perceived,
      heatStressCategory,
      vegetationRole: role
    };
  });

  const byAnomaly = [...zones].sort((x, y) => x.satelliteLstArrayAnomalyC - y.satelliteLstArrayAnomalyC);

  return {
    ...method,
    baseAirTempC: metarTempC,
    baseHumidityPercent: rh,
    baseHeatIndexC,
    zones,
    coolestRefugeZone: byAnomaly[0]?.zoneName ?? null,
    hottestExposureZone: byAnomaly.at(-1)?.zoneName ?? null,
  };
}
