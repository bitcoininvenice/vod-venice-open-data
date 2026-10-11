import type { TideForecast, TideForecastExtreme } from '@/lib/contracts/tide';
import { dateAtRomeSeconds, romeLocalToDate } from '@/lib/time';

export type MoseStatus = 'ABBASSATO' | 'IN_SOLLEVAMENTO' | 'ATTIVATO' | 'IN_ABBASSAMENTO';

export interface DynamicTideState {
  /** Livello di marea in mare aperto (Adriatico), privo di sbarramenti */
  seaTideCm: number;
  /** Livello di marea all'interno della laguna (calmierato dal MOSE quando attivo) */
  lagoonTideCm: number;
  /** Stato operativo della schiera di paratie del MOSE */
  moseStatus: MoseStatus;
  /** Frazione di elevazione delle paratie da 0.0 (abbassate a fondo) a 1.0 (erette a 100%) */
  moseLiftProgress: number;
  /** Tendenza della marea marina */
  trend: 'IN_AUMENTO' | 'IN_CALO' | 'STAZIONARIO';
  /** True se il MOSE è attualmente in sollevamento o completamente alzato */
  isMoseRaised: boolean;
  /** True se il livello interno supera la soglia di allagamento di Piazza San Marco (+80 cm) */
  isFlooded: boolean;
  /** Estremale successivo di riferimento */
  nextExtreme: TideForecastExtreme | null;
}

export interface ResolveTideOptions {
  simulatedTideLevel?: number | null;
  isMoseProtected?: boolean;
  timelineSeconds?: number;
  forecast?: TideForecast | null;
  liveTideLevel?: number | null;
  liveObservedAt?: string;
  referenceDate?: Date;
}

const LIFT_DURATION_MS = 30 * 60 * 1000; // 30 minuti di sollevamento
const LOWER_DURATION_MS = 15 * 60 * 1000; // 15 minuti di abbassamento
const ANTICIPATION_MS = 45 * 60 * 1000; // Procedura avviata 45 min prima del picco
const MOSE_PROTECTED_LAGUNA_MAX_CM = 85; // Quota massima di equilibrio lagunare con MOSE alzato
const MOSE_THRESHOLD_CM = 110; // Soglia ufficiale di attivazione MOSE

/**
 * Calcola l'andamento reale o simulato della marea e lo stato operativo del MOSE
 * con interpolazione armonica sinusoidale tra gli estremi CPSM e dinamica temporale
 * delle manovre di sollevamento (30 min) e abbassamento (15 min).
 */
export function resolveTideState(options: ResolveTideOptions): DynamicTideState {
  const {
    simulatedTideLevel,
    isMoseProtected = true,
    timelineSeconds,
    forecast,
    liveTideLevel,
    referenceDate = new Date(),
  } = options;

  // 1. MODALITA SIMULATORE MANUALE: L'utente imposta arbitrariamente la quota
  if (simulatedTideLevel !== null && simulatedTideLevel !== undefined) {
    const seaTideCm = Math.round(simulatedTideLevel);
    const moseActive = isMoseProtected && seaTideCm >= MOSE_THRESHOLD_CM;
    const lagoonTideCm = moseActive ? MOSE_PROTECTED_LAGUNA_MAX_CM : seaTideCm;
    const moseStatus: MoseStatus = moseActive ? 'ATTIVATO' : 'ABBASSATO';

    return {
      seaTideCm,
      lagoonTideCm,
      moseStatus,
      moseLiftProgress: moseActive ? 1.0 : 0.0,
      trend: 'STAZIONARIO',
      isMoseRaised: moseActive,
      isFlooded: lagoonTideCm >= 80,
      nextExtreme: null,
    };
  }

  // 2. MODALITA REALE / TIMELINE DINAMICA: Calcolata da orario e previsioni CPSM
  const targetDate = timelineSeconds !== undefined
    ? dateAtRomeSeconds(timelineSeconds, referenceDate)
    : referenceDate;
  const targetTime = targetDate.getTime();

  const extremes = forecast?.extremes ?? [];
  if (extremes.length === 0) {
    // Nessuna previsione disponibile: fallback sulla misura live di Punta della Salute
    const seaTideCm = Math.round(liveTideLevel ?? 50);
    const moseActive = isMoseProtected && seaTideCm >= MOSE_THRESHOLD_CM;
    const lagoonTideCm = moseActive ? MOSE_PROTECTED_LAGUNA_MAX_CM : seaTideCm;

    return {
      seaTideCm,
      lagoonTideCm,
      moseStatus: moseActive ? 'ATTIVATO' : 'ABBASSATO',
      moseLiftProgress: moseActive ? 1.0 : 0.0,
      trend: 'STAZIONARIO',
      isMoseRaised: moseActive,
      isFlooded: lagoonTideCm >= 80,
      nextExtreme: null,
    };
  }

  // Mappatura temporale degli estremi ordinati
  const parsedExtremes = extremes
    .map((e) => ({
      at: e.at,
      type: e.type,
      levelCm: e.levelCm,
      time: romeLocalToDate(e.at).getTime(),
    }))
    .sort((a, b) => a.time - b.time);

  // Trova il prossimo estremale dopo targetTime
  const nextExt = parsedExtremes.find((e) => e.time > targetTime) ?? null;

  // Calcolo quota mare tramite interpolazione sinusoidale (armonica di marea)
  let seaTideCm: number;
  let trend: 'IN_AUMENTO' | 'IN_CALO' | 'STAZIONARIO' = 'STAZIONARIO';

  if (targetTime <= parsedExtremes[0].time) {
    // Prima del primo estremale: usa il primo estremale o il dato live se coerente
    seaTideCm = parsedExtremes[0].levelCm;
    trend = parsedExtremes[0].type === 'max' ? 'IN_AUMENTO' : 'IN_CALO';
  } else if (targetTime >= parsedExtremes[parsedExtremes.length - 1].time) {
    // Oltre l'ultimo estremale: usa l'ultimo valore disponibile
    seaTideCm = parsedExtremes[parsedExtremes.length - 1].levelCm;
    trend = 'STAZIONARIO';
  } else {
    // Tra due estremali consecutivi i e i+1
    let idx = 0;
    while (idx < parsedExtremes.length - 1 && parsedExtremes[idx + 1].time <= targetTime) {
      idx++;
    }

    const e1 = parsedExtremes[idx];
    const e2 = parsedExtremes[idx + 1];
    const duration = e2.time - e1.time;

    if (duration <= 0) {
      seaTideCm = e1.levelCm;
    } else {
      const alpha = Math.max(0, Math.min(1, (targetTime - e1.time) / duration));
      // Curva di marea: h(alpha) = mid + amp * cos(pi * alpha) se e1 e' un picco
      // o h(alpha) = mid - amp * cos(pi * alpha) se e1 e' un minimo
      const mid = (e1.levelCm + e2.levelCm) / 2;
      const halfSpan = (e1.levelCm - e2.levelCm) / 2;
      const interpolated = mid + halfSpan * Math.cos(Math.PI * alpha);
      seaTideCm = Math.round(interpolated);
      trend = e2.levelCm >= e1.levelCm ? 'IN_AUMENTO' : 'IN_CALO';
    }
  }

  // Se siamo vicini a now e abbiamo una lettura live reale, effettua una correzione morbida
  const diffFromNowMs = Math.abs(targetTime - referenceDate.getTime());
  if (liveTideLevel !== null && liveTideLevel !== undefined && diffFromNowMs < 20 * 60 * 1000) {
    const weight = 1 - diffFromNowMs / (20 * 60 * 1000);
    seaTideCm = Math.round((1 - weight) * seaTideCm + weight * liveTideLevel);
  }

  // 3. DINAMICA OPERATIVA DEL MOSE
  // Cerca se c'e un picco di marea >= 110 cm che richiede la chiusura
  let moseStatus: MoseStatus = 'ABBASSATO';
  let moseLiftProgress = 0.0;

  if (isMoseProtected) {
    // Trova tutti i picchi >= MOSE_THRESHOLD_CM
    const highPeaks = parsedExtremes.filter((e) => e.type === 'max' && e.levelCm >= MOSE_THRESHOLD_CM);

    for (const peak of highPeaks) {
      const peakTime = peak.time;
      const startTime = peakTime - ANTICIPATION_MS; // -45 min: inizio manovra
      const raisedTime = startTime + LIFT_DURATION_MS; // -15 min: barriera completamente eretta

      // Durata dell'evento sopra 105 cm dopo il picco (stima da semionda ~1.5 - 2 ore)
      const lowerStartTime = peakTime + 75 * 60 * 1000;
      const fullyLoweredTime = lowerStartTime + LOWER_DURATION_MS;

      if (targetTime >= startTime && targetTime < raisedTime) {
        // FASE 1: IN SOLLEVAMENTO (30 minuti di alzata con aria compressa)
        moseStatus = 'IN_SOLLEVAMENTO';
        moseLiftProgress = Math.max(0, Math.min(1, (targetTime - startTime) / LIFT_DURATION_MS));
        break;
      } else if (targetTime >= raisedTime && targetTime < lowerStartTime) {
        // FASE 2: ATTIVATO (barriera ermetica sollevata al 100%)
        moseStatus = 'ATTIVATO';
        moseLiftProgress = 1.0;
        break;
      } else if (targetTime >= lowerStartTime && targetTime < fullyLoweredTime) {
        // FASE 3: IN ABBASSAMENTO (15 minuti di allagamento per gravita)
        moseStatus = 'IN_ABBASSAMENTO';
        moseLiftProgress = Math.max(0, Math.min(1, 1 - (targetTime - lowerStartTime) / LOWER_DURATION_MS));
        break;
      }
    }
  }

  // 4. CALCOLO LIVELLO LAGUNARE PROTETTO
  let lagoonTideCm = seaTideCm;
  if (moseStatus === 'ATTIVATO') {
    lagoonTideCm = Math.min(MOSE_PROTECTED_LAGUNA_MAX_CM, seaTideCm);
  } else if (moseStatus === 'IN_SOLLEVAMENTO') {
    const choke = moseLiftProgress;
    lagoonTideCm = Math.round(seaTideCm - choke * Math.max(0, seaTideCm - MOSE_PROTECTED_LAGUNA_MAX_CM));
  } else if (moseStatus === 'IN_ABBASSAMENTO') {
    const choke = moseLiftProgress;
    lagoonTideCm = Math.round(MOSE_PROTECTED_LAGUNA_MAX_CM + (1 - choke) * Math.max(0, seaTideCm - MOSE_PROTECTED_LAGUNA_MAX_CM));
  }

  const isMoseRaised = moseStatus === 'ATTIVATO' || moseStatus === 'IN_SOLLEVAMENTO';

  return {
    seaTideCm,
    lagoonTideCm,
    moseStatus,
    moseLiftProgress,
    trend,
    isMoseRaised,
    isFlooded: lagoonTideCm >= 80,
    nextExtreme: nextExt ? { at: nextExt.at, type: nextExt.type, levelCm: nextExt.levelCm } : null,
  };
}
