/**
 * Correnti di marea nella laguna di Venezia: STIMA, non misura.
 *
 * Nessun ente pubblica correnti lagunari misurate in tempo reale come open data. La fase (flusso,
 * stanca, riflusso) si ricava dalla previsione CPSM dei colmi e dei cavi; l'intensità da velocità di
 * picco tipiche e indicative per ciascun canale. Senza una previsione valida lo stato non è disponibile.
 * Descrizioni ed etichette sono nelle traduzioni (ui.lagoonHydro).
 */
import type { TideForecast } from '@/lib/contracts/tide';
import { parseForecastExtremes } from '@/lib/tideCurve';

export type LagoonCurrentPhase = 'FLUSSO' | 'STANCA' | 'RIFLUSSO';

export interface LagoonCurrentChannel {
  id: string;
  name: string;
  zone: 'BOCCHE_DI_PORTO' | 'CANALI_LAGUNARI' | 'CENTRO_STORICO';
  /** Direzione bussola in gradi del flusso entrante (dal mare aperto verso la laguna) */
  flowBearingDeg: number;
  /** Coordinate geografiche [lon, lat] della linea di flusso */
  coordinates: [number, number][];
  /** punto medio del tracciato (calcolato), usato per etichette e selezione */
  lat: number;
  lon: number;
  /** Velocità di picco tipica in sizigie, in nodi (valore indicativo, non una misura) */
  maxSpeedKnots: number;
  /** La stessa in metri al secondo */
  maxSpeedMs: number;
  /** Profondità indicativa del canale in metri */
  depthMeters: number;
}

/**
 * Assi principali di circolazione idraulica e correnti di marea nella Laguna di Venezia.
 * Tracciati lungo le tre bocche di porto e i canali navigabili primari.
 */
const CHANNEL_DEFS: Omit<LagoonCurrentChannel, 'lat' | 'lon'>[] = [
  {
    id: 'bocca-lido',
    name: 'Bocca di Porto di Lido - San Nicolò',
    zone: 'BOCCHE_DI_PORTO',
    flowBearingDeg: 305,
    coordinates: [
      [12.4480, 45.4180],
      [12.4280, 45.4270],
      [12.4080, 45.4350],
    ],
    maxSpeedKnots: 2.5,
    maxSpeedMs: 1.3,
    depthMeters: 12.0,
  },
  {
    id: 'bocca-malamocco',
    name: 'Bocca di Porto di Malamocco',
    zone: 'BOCCHE_DI_PORTO',
    flowBearingDeg: 295,
    coordinates: [
      [12.3320, 45.3300],
      [12.3120, 45.3360],
      [12.2890, 45.3420],
    ],
    maxSpeedKnots: 3.0,
    maxSpeedMs: 1.5,
    depthMeters: 16.0,
  },
  {
    id: 'bocca-chioggia',
    name: 'Bocca di Porto di Chioggia',
    zone: 'BOCCHE_DI_PORTO',
    flowBearingDeg: 290,
    coordinates: [
      [12.3180, 45.2280],
      [12.3020, 45.2340],
      [12.2830, 45.2390],
    ],
    maxSpeedKnots: 2.2,
    maxSpeedMs: 1.1,
    depthMeters: 10.5,
  },
  {
    id: 'canale-petroli',
    name: 'Canale dei Petroli (Malamocco-Marghera)',
    zone: 'CANALI_LAGUNARI',
    flowBearingDeg: 340,
    coordinates: [
      [12.2890, 45.3420],
      [12.2720, 45.3720],
      [12.2450, 45.4120],
    ],
    maxSpeedKnots: 2.0,
    maxSpeedMs: 1.0,
    depthMeters: 12.0,
  },
  {
    id: 'canale-san-nicolo',
    name: 'Canale di San Nicolo (Lido - Vignole)',
    zone: 'CANALI_LAGUNARI',
    flowBearingDeg: 275,
    coordinates: [
      [12.4080, 45.4350],
      [12.3850, 45.4330],
      [12.3620, 45.4320],
    ],
    maxSpeedKnots: 1.8,
    maxSpeedMs: 0.9,
    depthMeters: 9.5,
  },
  {
    id: 'bacino-san-marco',
    name: 'Bacino di San Marco',
    zone: 'CENTRO_STORICO',
    flowBearingDeg: 260,
    coordinates: [
      [12.3620, 45.4320],
      [12.3450, 45.4335],
      [12.3370, 45.4315],
    ],
    maxSpeedKnots: 1.5,
    maxSpeedMs: 0.8,
    depthMeters: 8.5,
  },
  {
    id: 'canale-giudecca',
    name: 'Canale della Giudecca',
    zone: 'CENTRO_STORICO',
    flowBearingDeg: 255,
    coordinates: [
      [12.3370, 45.4315],
      [12.3250, 45.4265],
      [12.3120, 45.4240],
    ],
    maxSpeedKnots: 1.6,
    maxSpeedMs: 0.8,
    depthMeters: 10.0,
  },
  {
    id: 'canal-grande',
    name: 'Canal Grande (Volta de Canal)',
    zone: 'CENTRO_STORICO',
    flowBearingDeg: 320,
    coordinates: [
      [12.3360, 45.4310],
      [12.3340, 45.4360],
      [12.3220, 45.4410],
    ],
    maxSpeedKnots: 0.8,
    maxSpeedMs: 0.4,
    depthMeters: 4.5,
  },
  {
    id: 'canale-cannaregio',
    name: 'Canale di Cannaregio',
    zone: 'CENTRO_STORICO',
    flowBearingDeg: 310,
    coordinates: [
      [12.3290, 45.4420],
      [12.3230, 45.4445],
      [12.3170, 45.4465],
    ],
    maxSpeedKnots: 0.9,
    maxSpeedMs: 0.5,
    depthMeters: 3.5,
  },
  {
    id: 'canale-marani',
    name: 'Canale dei Marani (Murano)',
    zone: 'CANALI_LAGUNARI',
    flowBearingDeg: 345,
    coordinates: [
      [12.3680, 45.4390],
      [12.3620, 45.4500],
      [12.3550, 45.4580],
    ],
    maxSpeedKnots: 1.2,
    maxSpeedMs: 0.6,
    depthMeters: 5.5,
  },
];

/** Chiave di traduzione della descrizione di un canale */
export const channelDescKey = (id: string) => `ui.lagoonHydro.channel_${id.replace(/-/g, '_')}`;

export const LAGOON_CURRENT_CHANNELS: LagoonCurrentChannel[] = CHANNEL_DEFS.map((c) => {
  const mid = c.coordinates[Math.floor(c.coordinates.length / 2)];
  return { ...c, lon: mid[0], lat: mid[1] };
});

export interface LagoonCurrentState {
  phase: LagoonCurrentPhase;
  /** Intensità relativa da 0.08 (stanca) a 1 (metà semiciclo) */
  speedFactor: number;
  flowDirection: 'INBOUND' | 'OUTBOUND' | 'SLACK';
  inletSpeedKnotsEst: number;
  inletSpeedMsEst: number;
  urbanSpeedKnotsEst: number;
  urbanSpeedMsEst: number;
  nextSlackMinutes: number;
  /** Prossimo colmo o cavo previsto (ora locale "HH:mm") */
  nextSlack: { time: string; levelCm: number };
}

/** Finestra attorno a colmi e cavi considerata stanca */
const SLACK_WINDOW_MIN = 25;

/**
 * Stato stimato delle correnti all'istante indicato, dalla previsione CPSM.
 * null se la previsione manca, è scaduta o non copre l'istante.
 */
export function computeLagoonCurrentState(
  forecast: TideForecast | null | undefined,
  nowMs: number = Date.now()
): LagoonCurrentState | null {
  const extremes = parseForecastExtremes(forecast);
  const next = extremes.find((e) => e.time > nowMs);
  const prev = [...extremes].reverse().find((e) => e.time <= nowMs);
  if (!next || !prev) return null;

  const nextSlackMinutes = Math.max(0, Math.round((next.time - nowMs) / 60000));
  const nextSlack = { time: next.extreme?.at.slice(11, 16) ?? '', levelCm: next.levelCm };

  if (nextSlackMinutes <= SLACK_WINDOW_MIN || (nowMs - prev.time) / 60000 <= SLACK_WINDOW_MIN) {
    return {
      phase: 'STANCA', speedFactor: 0.08, flowDirection: 'SLACK',
      inletSpeedKnotsEst: 0.2, inletSpeedMsEst: 0.1, urbanSpeedKnotsEst: 0.1, urbanSpeedMsEst: 0.05,
      nextSlackMinutes, nextSlack,
    };
  }

  // Intensità sinusoidale nel semiciclo, massima a metà
  const fraction = Math.min(1, Math.max(0, (nowMs - prev.time) / Math.max(1, next.time - prev.time)));
  const f = Math.max(0.15, Math.sin(Math.PI * fraction));
  const rising = next.levelCm > prev.levelCm;
  const [inlet, urban] = rising ? [2.2, 0.9] : [2.4, 1.0];
  const r1 = (v: number) => Number(v.toFixed(1));
  return {
    phase: rising ? 'FLUSSO' : 'RIFLUSSO',
    speedFactor: Number(f.toFixed(2)),
    flowDirection: rising ? 'INBOUND' : 'OUTBOUND',
    inletSpeedKnotsEst: r1(inlet * f),
    inletSpeedMsEst: r1(inlet * 0.5 * f),
    urbanSpeedKnotsEst: r1(urban * f),
    urbanSpeedMsEst: r1(urban * 0.5 * f),
    nextSlackMinutes,
    nextSlack,
  };
}

export type ArpavQualityStatus = 'ELEVATO' | 'BUONO' | 'SUFFICIENTE' | 'SCARSO';

export interface ArpavWaterQualityEvaluation {
  status: ArpavQualityStatus;
  statusBadgeColor: string;
}

const QUALITY_BADGE: Record<ArpavQualityStatus, string> = {
  ELEVATO: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  BUONO: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  SUFFICIENTE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  SCARSO: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

/**
 * Classe trofica INDICATIVA di una sonda ARPAV da clorofilla "a" e ossigeno disciolto.
 * Non è la classificazione ufficiale WFD (2000/60/CE), che ARPAV pubblica per corpo idrico
 * integrando elementi biologici e nutrienti. null se mancano entrambe le misure.
 */
export function evaluateArpavWaterQuality(
  chlorophyllUgL: number | null,
  dissolvedOxygenPercent: number | null
): ArpavWaterQualityEvaluation | null {
  if (chlorophyllUgL === null && dissolvedOxygenPercent === null) return null;
  const chl = chlorophyllUgL;
  const o2 = dissolvedOxygenPercent;
  let status: ArpavQualityStatus = 'BUONO';
  // Soglie indicative ispirate ai criteri trofici per le acque di transizione
  if ((o2 !== null && o2 < 60) || (chl !== null && chl > 18)) status = 'SCARSO';
  else if ((chl !== null && chl > 7) || (o2 !== null && (o2 > 135 || o2 < 75))) status = 'SUFFICIENTE';
  else if (chl !== null && chl <= 2.2 && o2 !== null && o2 >= 85 && o2 <= 115) status = 'ELEVATO';
  return { status, statusBadgeColor: QUALITY_BADGE[status] };
}

/** Riferimenti istituzionali e documentazione ufficiale */
export const OFFICIAL_LAGOON_SOURCES = {
  ispra: {
    name: 'ISPRA – Servizio Laguna di Venezia (RMLV)',
    url: 'https://www.venezia.isprambiente.it/',
  },
  arpav: {
    name: 'ARPAV – Acque di Transizione & Monitoraggio Ecologico',
    url: 'https://www.arpa.veneto.it/dati-ambientali/open-data/idrosfera/acque-di-transizione',
  },
  cnr: {
    name: 'CNR-ISMAR – Istituto di Scienze Marine',
    url: 'https://www.ismar.cnr.it/',
  },
  cpsm: {
    name: 'Comune di Venezia – CPSM Centro Maree',
    url: 'https://www.comune.venezia.it/it/content/centro-previsioni-e-segnalazioni-maree-beta',
  },
};
