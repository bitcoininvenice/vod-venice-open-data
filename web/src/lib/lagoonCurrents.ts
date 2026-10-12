/**
 * VOD - Venice Open Data
 * Modulo Idrodinamica & Correnti della Laguna di Venezia
 * 
 * Modella lo stato delle correnti di marea lagunari e i vettori di flusso
 * lungo le bocche di porto (Lido, Malamocco, Chioggia) e i canali di scorrimento.
 * Include indicatori ecologici ARPAV (WFD / TRIX) e metadati della Rete RMLV di ISPRA.
 * 
 * Fonti scientifiche e istituzionali:
 * - CNR-ISMAR: Modello idrodinamico SHYFEM (System of HydrodYnamic Finite Element Modules)
 * - ISPRA: Servizio Laguna di Venezia / Rete Mareografica Laguna e Alto Adriatico (RMLV)
 * - CPSM: Centro Previsioni e Segnalazioni Maree del Comune di Venezia
 * - ARPAV: Monitoraggio ecologico acque di transizione (D.Lgs. 152/2006, Dir. 2000/60/CE)
 */

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
  /** Velocità massima sizigiale tipica in nodi */
  maxSpeedKnots: number;
  /** Velocità massima sizigiale in metri al secondo */
  maxSpeedMs: number;
  /** Profondità media o massima di scavo del canale in metri */
  depthMeters: number;
  /** Descrizione della sezione idraulica e funzione idrodinamica */
  hydraulicSectionDesc: string;
  /** Modello o rete di riferimento */
  modelSource: string;
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
    hydraulicSectionDesc: 'Varco nord verso il mare Adriatico; alimenta la circolazione della laguna centro-nord, il Canale dei Marani e il Bacino di San Marco.',
    modelSource: 'CNR-ISMAR SHYFEM / ISPRA RMLV',
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
    hydraulicSectionDesc: 'Il varco marittimo piu profondo della laguna; assorbe circa il 45% del prisma di marea e immette direttamente nel Canale dei Petroli verso Porto Marghera.',
    modelSource: 'CNR-ISMAR SHYFEM / ISPRA RMLV',
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
    hydraulicSectionDesc: 'Varco sud della laguna; controlla il ricambio idrico del bacino meridionale, delle valli da pesca di Chioggia e del porto rifugio.',
    modelSource: 'CNR-ISMAR SHYFEM / ISPRA RMLV',
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
    hydraulicSectionDesc: 'Autostrada navigabile artificiale per il traffico commerciale; crea una rapida propagazione della marea verso la zona industriale e Fusina.',
    modelSource: 'Autorita di Sistema Portuale / ISPRA',
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
    hydraulicSectionDesc: 'Corridoio idraulico naturale che convoglia l onda di marea dal Lido verso il Bacino di San Marco e l Arsenale.',
    modelSource: 'CPSM Centro Maree / CNR-ISMAR',
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
    hydraulicSectionDesc: 'Nodo idraulico e monumentale centrale; distribuisce il flusso di marea tra il Canal Grande, il Canale della Giudecca e il bacino di San Giorgio.',
    modelSource: 'CPSM Centro Maree',
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
    hydraulicSectionDesc: 'Forte canale di transito tra le Zattere e l isola della Giudecca; caratterizzato da intense correnti trasversali durante le fasi di picco.',
    modelSource: 'CPSM Centro Maree / Autorita Portuale',
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
    hydraulicSectionDesc: 'Asse sinuoso principale del centro storico; la corrente inverte la direzione di moto a ogni stanca (flusso verso San Simeone, riflusso verso la Salute).',
    modelSource: 'Comune di Venezia CPSM',
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
    hydraulicSectionDesc: 'Importante via di collegamento acqueo che unisce il Canal Grande con la laguna nord aperta (verso San Giuliano e Mestre).',
    modelSource: 'Comune di Venezia',
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
    hydraulicSectionDesc: 'Asse idrodinamico verso Murano e la Laguna Nord; drena le acque tra l Arsenale e le barene settentrionali.',
    modelSource: 'CNR-ISMAR / ARPAV',
  },
];

export const LAGOON_CURRENT_CHANNELS: LagoonCurrentChannel[] = CHANNEL_DEFS.map((c) => {
  const mid = c.coordinates[Math.floor(c.coordinates.length / 2)];
  return { ...c, lon: mid[0], lat: mid[1] };
});

/** Estremale di marea nel formato del contratto CPSM (/api/tide). */
export interface TideExtremeInput {
  /** ora locale Europe/Rome, "YYYY-MM-DD HH:mm:ss" */
  at: string;
  levelCm: number;
}

function parseLocalStamp(at: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(at);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])).getTime();
}

export interface LagoonCurrentState {
  phase: LagoonCurrentPhase;
  speedFactor: number; // Da 0.05 a 1.0
  flowDirection: 'INBOUND' | 'OUTBOUND' | 'SLACK';
  labelIt: string;
  labelEn: string;
  descIt: string;
  descEn: string;
  inletSpeedKnotsEst: number;
  inletSpeedMsEst: number;
  urbanSpeedKnotsEst: number;
  urbanSpeedMsEst: number;
  nextSlackMinutes: number | null;
  nextSlackLabel: string | null;
}

/**
 * Calcola lo stato idrodinamico istantaneo della laguna di Venezia
 * in base al livello di marea attuale e alla sequenza degli estremali di previsione CPSM.
 */
export function computeLagoonCurrentState(
  currentTideCm: number,
  forecastExtremes?: TideExtremeInput[] | null,
  nowMs: number = Date.now()
): LagoonCurrentState {
  // Se abbiamo gli estremali CPSM, determiniamo con precisione la posizione nel ciclo
  if (forecastExtremes && forecastExtremes.length >= 2) {
    const parsedExtremes = forecastExtremes
      .map((ex) => {
        const time = parseLocalStamp(ex.at);
        return time === null ? null : { val: ex.levelCm, time, hhmm: ex.at.slice(11, 16) };
      })
      .filter((e): e is { val: number; time: number; hhmm: string } => e !== null)
      .sort((a, b) => a.time - b.time);

    // Cerca l'estremale precedente e il successivo rispetto all'istante attuale
    const nextExtreme = parsedExtremes.find((e) => e.time > nowMs);
    const prevExtreme = [...parsedExtremes].reverse().find((e) => e.time <= nowMs);

    if (nextExtreme) {
      const minutesToNextSlack = Math.max(0, Math.round((nextExtreme.time - nowMs) / 60000));
      const nextSlackLabel = `${nextExtreme.hhmm} (${nextExtreme.val >= 0 ? '+' : ''}${nextExtreme.val} cm)`;

      // Consideriamo STANCA di marea la finestra di +/- 25 minuti dall'estremale
      const isNearNextSlack = minutesToNextSlack <= 25;
      const isNearPrevSlack = prevExtreme ? (nowMs - prevExtreme.time) / 60000 <= 25 : false;

      if (isNearNextSlack || isNearPrevSlack) {
        return {
          phase: 'STANCA',
          speedFactor: 0.08,
          flowDirection: 'SLACK',
          labelIt: 'Stanca di Marea',
          labelEn: 'Slack Water (Tidal Turn)',
          descIt: 'Inversione del flusso: velocita di corrente minima o nulla nei canali. Momento ottimale di calma idraulica.',
          descEn: 'Tidal current reversal: near-zero flow speed across lagoon channels. Hydraulic slack window.',
          inletSpeedKnotsEst: 0.2,
          inletSpeedMsEst: 0.1,
          urbanSpeedKnotsEst: 0.1,
          urbanSpeedMsEst: 0.05,
          nextSlackMinutes: minutesToNextSlack,
          nextSlackLabel,
        };
      }

      // Se il prossimo estremale e piu alto del precedente, la marea sta salendo -> FLUSSO
      const isRising = prevExtreme ? nextExtreme.val > prevExtreme.val : currentTideCm < nextExtreme.val;

      // Progresso nel semiciclo di marea (~6 ore)
      const durationMs = prevExtreme ? Math.max(1, nextExtreme.time - prevExtreme.time) : 6 * 3600 * 1000;
      const elapsedMs = prevExtreme ? nowMs - prevExtreme.time : 3 * 3600 * 1000;
      const fraction = Math.min(1, Math.max(0, elapsedMs / durationMs));
      // Funzione sinusoidale per modulare la velocita: massima a meta ciclo (fraction = 0.5)
      const speedFactor = Math.max(0.15, Math.sin(Math.PI * fraction));

      if (isRising) {
        return {
          phase: 'FLUSSO',
          speedFactor: Number(speedFactor.toFixed(2)),
          flowDirection: 'INBOUND',
          labelIt: 'Flusso (Corrente Entrante)',
          labelEn: 'Flood Tide (Inbound Current)',
          descIt: 'Le acque marine entrano energicamente dalle tre bocche di porto verso la laguna interna e il centro storico.',
          descEn: 'Marine waters surge through the three sea inlets inward toward the historic centre and northern lagoon.',
          inletSpeedKnotsEst: Number((2.2 * speedFactor).toFixed(1)),
          inletSpeedMsEst: Number((1.1 * speedFactor).toFixed(1)),
          urbanSpeedKnotsEst: Number((0.9 * speedFactor).toFixed(1)),
          urbanSpeedMsEst: Number((0.45 * speedFactor).toFixed(1)),
          nextSlackMinutes: minutesToNextSlack,
          nextSlackLabel,
        };
      } else {
        return {
          phase: 'RIFLUSSO',
          speedFactor: Number(speedFactor.toFixed(2)),
          flowDirection: 'OUTBOUND',
          labelIt: 'Riflusso (Svolto di Marea)',
          labelEn: 'Ebb Tide (Outbound Current)',
          descIt: 'Le acque lagunari defluiscono verso il mare Adriatico attraverso le bocche di Lido, Malamocco e Chioggia.',
          descEn: 'Lagoon waters drain seaward into the Adriatic Sea through the inlets ("svolto di marea").',
          inletSpeedKnotsEst: Number((2.4 * speedFactor).toFixed(1)),
          inletSpeedMsEst: Number((1.2 * speedFactor).toFixed(1)),
          urbanSpeedKnotsEst: Number((1.0 * speedFactor).toFixed(1)),
          urbanSpeedMsEst: Number((0.5 * speedFactor).toFixed(1)),
          nextSlackMinutes: minutesToNextSlack,
          nextSlackLabel,
        };
      }
    }
  }

  // Fallback cinematico quando non sono disponibili estremali precisi
  const isExtremeLevel = currentTideCm >= 90 || currentTideCm <= -50;

  if (isExtremeLevel) {
    return {
      phase: 'STANCA',
      speedFactor: 0.1,
      flowDirection: 'SLACK',
      labelIt: 'Stanca di Marea (Colmo/Minimo)',
      labelEn: 'Slack Water (Peak/Low)',
      descIt: 'Picco di marea raggiunto: velocita di corrente orizzontale in fase di inversione.',
      descEn: 'Tidal peak reached: horizontal current velocity at reversal phase.',
      inletSpeedKnotsEst: 0.3,
      inletSpeedMsEst: 0.15,
      urbanSpeedKnotsEst: 0.15,
      urbanSpeedMsEst: 0.08,
      nextSlackMinutes: null,
      nextSlackLabel: null,
    };
  }

  return {
    phase: 'FLUSSO',
    speedFactor: 0.6,
    flowDirection: 'INBOUND',
    labelIt: 'Flusso di Marea (Attivo)',
    labelEn: 'Active Flood Current',
    descIt: 'Circolazione di marea attiva nei canali navigabili lagunari.',
    descEn: 'Active tidal current circulation across navigable lagoon channels.',
    inletSpeedKnotsEst: 1.5,
    inletSpeedMsEst: 0.75,
    urbanSpeedKnotsEst: 0.6,
    urbanSpeedMsEst: 0.3,
    nextSlackMinutes: null,
    nextSlackLabel: null,
  };
}

export interface ArpavWaterQualityEvaluation {
  status: 'ELEVATO' | 'BUONO' | 'SUFFICIENTE' | 'SCARSO' | 'CATTIVO';
  /** sempre null: il TRIX richiede nutrienti (N, P) non presenti nei dati sonda */
  trixEstimated: number | null;
  statusBadgeColor: string;
  titleIt: string;
  titleEn: string;
  notesIt: string;
  notesEn: string;
}

/**
 * Classe trofica INDICATIVA di una stazione sonda ARPAV da clorofilla e ossigeno disciolto.
 * Non e la classificazione ufficiale WFD (2000/60/CE), che ARPAV pubblica per corpo idrico
 * integrando elementi biologici e nutrienti.
 */
export function evaluateArpavWaterQuality(
  chlorophyllUgL: number | null,
  dissolvedOxygenPercent: number | null,
  salinityPsu: number | null
): ArpavWaterQualityEvaluation {
  // Clorofilla "a" e saturazione di ossigeno disciolto guidano la classificazione trofica
  const chl = chlorophyllUgL ?? 2.0;
  const doPct = dissolvedOxygenPercent ?? 100.0;

  // TRIX non calcolabile: richiede azoto e fosforo, assenti nel file sonda ARPAV
  const trix = null;

  // Soglie indicative (ispirate ai criteri trofici per acque di transizione):
  // Elevato: Chl < 1.8 µg/L e ossigeno 85-115%
  // Buono: Chl 1.8-6.0 µg/L e ossigeno 70-130%
  // Sufficiente: Chl 6.0-15.0 µg/L
  // Scarso / Cattivo: Chl > 15.0 µg/L o ossigeno < 60% (ipossia) o > 150% (iper-eutrofizzazione)
  if (doPct < 60.0 || chl > 18.0) {
    return {
      status: 'SCARSO',
      trixEstimated: trix,
      statusBadgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      titleIt: 'Condizione Trofica Critica (indicativa)',
      titleEn: 'Critical Trophic Condition (indicative)',
      notesIt: `Ossigeno disciolto anomalo (${doPct}%) o clorofilla elevata (${chl} µg/l). Condizioni di stress ecologico per la fauna bentonica.`,
      notesEn: `Abnormal dissolved oxygen (${doPct}%) or high chlorophyll (${chl} µg/l). Ecological stress for benthic fauna.`,
    };
  }

  if (chl > 7.0 || doPct > 135.0 || doPct < 75.0) {
    return {
      status: 'SUFFICIENTE',
      trixEstimated: trix,
      statusBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      titleIt: 'Condizione Trofica Moderata (indicativa)',
      titleEn: 'Moderate Trophic Condition (indicative)',
      notesIt: `Biomassa fitoplanctonica moderata (${chl} µg/l). Stato tipico delle aree a idrodinamismo ridotto della laguna centrale.`,
      notesEn: `Moderate phytoplankton biomass (${chl} µg/l). Typical of reduced hydrodynamics zones in the central lagoon.`,
    };
  }

  if (chl <= 2.2 && doPct >= 85.0 && doPct <= 115.0) {
    return {
      status: 'ELEVATO',
      trixEstimated: trix,
      statusBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      titleIt: 'Condizione Trofica Ottima (indicativa)',
      titleEn: 'Very Good Trophic Condition (indicative)',
      notesIt: `Ottima trasparenza e ricambio marino; clorofilla contenuta (${chl} µg/l) e saturazione d ossigeno ottimale (${doPct}%).`,
      notesEn: `Optimal transparency and sea water exchange; low chlorophyll (${chl} µg/l) and balanced oxygen (${doPct}%).`,
    };
  }

  return {
    status: 'BUONO',
    trixEstimated: trix,
    statusBadgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    titleIt: 'Condizione Trofica Buona (indicativa)',
    titleEn: 'Good Trophic Condition (indicative)',
    notesIt: `Parametri fisico-chimici nella norma per le acque lagunari (salinita ${salinityPsu ?? '--'} PSU).`,
    notesEn: `Physicochemical parameters within normal lagoon ranges (salinity ${salinityPsu ?? '--'} PSU).`,
  };
}

/** Riferimenti istituzionali e documentazione ufficiale */
export const OFFICIAL_LAGOON_SOURCES = {
  ispra: {
    name: 'ISPRA – Servizio Laguna di Venezia (RMLV)',
    url: 'https://www.venezia.isprambiente.it/',
    networkDesc: 'Rete Mareografica della Laguna di Venezia e dell Alto Adriatico (45 stazioni mareo-meteorologiche e Piattaforma Oceanografica Acqua Alta).',
  },
  arpav: {
    name: 'ARPAV – Acque di Transizione & Monitoraggio Ecologico',
    url: 'https://www.arpa.veneto.it/dati-ambientali/open-data/idrosfera/acque-di-transizione',
    networkDesc: 'Rete di monitoraggio multiparametrico e campionamenti biologici (WFD 2000/60/CE, licenza CC BY 4.0).',
  },
  cnr: {
    name: 'CNR-ISMAR – Istituto di Scienze Marine',
    url: 'https://www.ismar.cnr.it/',
    networkDesc: 'Sviluppatore del modello idrodinamico tridimensionale a elementi finiti SHYFEM per le correnti lagunari.',
  },
  cpsm: {
    name: 'Comune di Venezia – CPSM Centro Maree',
    url: 'https://www.comune.venezia.it/it/content/centro-previsioni-e-segnalazioni-maree-beta',
    networkDesc: 'Previsioni astronomiche e meteorologiche ufficiali, feed live dei livelli e bollettini di salvaguardia.',
  },
};
