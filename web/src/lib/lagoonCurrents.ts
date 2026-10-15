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

type LagoonCurrentPhase = 'FLUSSO' | 'STANCA' | 'RIFLUSSO';

export interface LagoonCurrentChannel {
  id: string;
  name: string;
  zone: 'BOCCHE_DI_PORTO' | 'CANALI_LAGUNARI' | 'CENTRO_STORICO';
  /** Direzione bussola in gradi del flusso entrante (dal mare aperto verso la laguna) */
  flowBearingDeg: number;
  /** Asse del canale [lon, lat] da OpenStreetMap (ODbL), orientato dal mare verso la laguna */
  coordinates: [number, number][];
  /** Larghezza indicativa dello specchio d'acqua, per distribuire il flusso disegnato */
  widthMeters: number;
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
 * Assi principali delle correnti di marea: le tre bocche di porto e i canali navigabili primari.
 * I tracciati sono gli assi dei canali di OpenStreetMap (src/data/osm-waterways.json), semplificati a ~12 m.
 */
const CHANNEL_DEFS: Omit<LagoonCurrentChannel, 'lat' | 'lon'>[] = [
  {
    id: 'bocca-lido',
    name: 'Bocca di Porto di Lido - San Nicolò',
    zone: 'BOCCHE_DI_PORTO',
    flowBearingDeg: 305,
    coordinates: [
      [12.43408, 45.42104],
      [12.41919, 45.42717],
    ],
    widthMeters: 800,
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
      [12.34404, 45.33132],
      [12.32901, 45.33488],
      [12.30668, 45.33911],
    ],
    widthMeters: 280,
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
      [12.29516, 45.23249],
      [12.29082, 45.23273],
      [12.285, 45.23159],
      [12.28137, 45.23027],
      [12.27758, 45.22937],
      [12.27433, 45.22956],
    ],
    widthMeters: 450,
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
      [12.30668, 45.33911],
      [12.26991, 45.34618],
      [12.26439, 45.34796],
      [12.26142, 45.34994],
      [12.25913, 45.35243],
      [12.25696, 45.35555],
      [12.25501, 45.35989],
      [12.25483, 45.36206],
      [12.25896, 45.38448],
      [12.26045, 45.39068],
      [12.26161, 45.39691],
      [12.26129, 45.40881],
      [12.26015, 45.41777],
      [12.25914, 45.43325],
      [12.25889, 45.44536],
      [12.25849, 45.4488],
      [12.25889, 45.45117],
      [12.26121, 45.45716],
    ],
    widthMeters: 160,
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
      [12.40804, 45.43066],
      [12.40354, 45.43234],
      [12.39756, 45.43544],
      [12.39468, 45.4361],
      [12.3909, 45.43669],
      [12.3893, 45.43673],
      [12.38755, 45.43649],
      [12.38652, 45.43601],
      [12.38046, 45.43188],
      [12.37361, 45.42596],
      [12.36766, 45.42162],
      [12.36443, 45.42146],
      [12.35991, 45.42344],
      [12.35952, 45.42378],
    ],
    widthMeters: 250,
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
      [12.35952, 45.42378],
      [12.35691, 45.42664],
      [12.35506, 45.42827],
      [12.35297, 45.42959],
      [12.34793, 45.43182],
      [12.34568, 45.4323],
      [12.34405, 45.43226],
      [12.34192, 45.4319],
      [12.34066, 45.43143],
    ],
    widthMeters: 360,
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
      [12.34066, 45.43143],
      [12.33632, 45.42832],
      [12.33334, 45.42721],
      [12.33161, 45.42703],
      [12.32866, 45.42757],
      [12.32416, 45.42876],
      [12.31888, 45.42989],
      [12.31097, 45.43005],
      [12.30871, 45.4306],
      [12.30284, 45.43351],
    ],
    widthMeters: 300,
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
      [12.34066, 45.43143],
      [12.33707, 45.43159],
      [12.33072, 45.43125],
      [12.32871, 45.43175],
      [12.32769, 45.43243],
      [12.32713, 45.43434],
      [12.32725, 45.43462],
      [12.32958, 45.43562],
      [12.3336, 45.43672],
      [12.33514, 45.43743],
      [12.3362, 45.43838],
      [12.33588, 45.43924],
      [12.33537, 45.43972],
      [12.33165, 45.44159],
      [12.32907, 45.44232],
      [12.32643, 45.44229],
      [12.32259, 45.44107],
      [12.32036, 45.43913],
      [12.31952, 45.43882],
      [12.31908, 45.43902],
      [12.31765, 45.44098],
      [12.31622, 45.4419],
      [12.31538, 45.44213],
    ],
    widthMeters: 30,
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
      [12.32643, 45.44229],
      [12.32539, 45.44376],
      [12.32384, 45.44452],
      [12.321, 45.44541],
      [12.31841, 45.44682],
    ],
    widthMeters: 12,
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
      [12.36386, 45.43407],
      [12.36558, 45.43925],
      [12.36623, 45.44026],
      [12.36827, 45.4419],
      [12.36949, 45.44419],
      [12.36762, 45.44749],
      [12.36607, 45.44869],
      [12.36224, 45.45062],
      [12.3576, 45.45234],
      [12.35899, 45.45436],
      [12.35978, 45.45634],
      [12.36199, 45.45842],
      [12.36208, 45.45903],
      [12.3617, 45.45957],
      [12.36061, 45.46021],
      [12.35711, 45.46162],
      [12.35751, 45.46345],
      [12.35723, 45.46487],
      [12.35689, 45.46522],
    ],
    widthMeters: 120,
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
