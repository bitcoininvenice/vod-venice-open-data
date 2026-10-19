import type { AirportMetarData } from './types';

export type WeatherConditionKey = 'sole' | 'nuvola' | 'pioggia' | 'neve' | 'nebbia' | 'vento';

export interface WeatherConditionInfo {
  condition: WeatherConditionKey;
  labelIt: string;
  labelEn: string;
  detail?: string;
}

/**
 * Determina la condizione meteo prevalente a partire dal METAR ufficiale dell'aeroporto di Venezia (LIPZ Tessera)
 * o da stazioni meteo della laguna.
 *
 * Priorita dei fenomeni:
 * 1. Neve (SN, SG, PL)
 * 2. Pioggia / temporale (RA, DZ, SHRA, TSRA, TS, GR, GS)
 * 3. Nebbia / foschia densa (FG, BR, MIFG, PRFG, FZFG) o visibilita <= 2000 m
 * 4. Vento forte / burrasca (SQ, raffiche >= 22 kt o velocita >= 35 km/h)
 * 5. Nuvole / cielo molto nuvoloso o coperto (OVC, BKN, o descrizione nuvole)
 * 6. Sole / cielo sereno o poco nuvoloso (SKC, CLR, CAVOK, FEW, NSC)
 */
export function detectWeatherCondition(
  metar: AirportMetarData | null | undefined,
  fallbackWindKmh?: number | null
): WeatherConditionInfo {
  const effectiveWindKmh = metar?.windSpeedKmh ?? fallbackWindKmh ?? 0;
  const gustKt = metar?.gustSpeedKnots ?? 0;

  if (metar?.rawMetar) {
    const raw = metar.rawMetar.toUpperCase();

    // 1. Neve
    if (/\b(\+|-|VC)?(SN|SG|PL)\b/.test(raw)) {
      return {
        condition: 'neve',
        labelIt: 'Neve',
        labelEn: 'Snow',
        detail: 'Precipitazione nevosa riportata da METAR LIPZ',
      };
    }

    // 2. Pioggia / temporale / rovesci
    if (/\b(\+|-|VC)?(RA|DZ|SHRA|TSRA|TS|GR|GS)\b/.test(raw)) {
      return {
        condition: 'pioggia',
        labelIt: 'Pioggia',
        labelEn: 'Rain',
        detail: 'Precipitazioni in corso riportate da METAR LIPZ',
      };
    }

    // 3. Nebbia o visibilita ridotta
    if (
      /\b(FG|BR|MIFG|PRFG|FZFG)\b/.test(raw) ||
      (metar.visibilityMeters !== undefined && metar.visibilityMeters !== null && metar.visibilityMeters <= 2000)
    ) {
      return {
        condition: 'nebbia',
        labelIt: 'Nebbia',
        labelEn: 'Fog',
        detail: `Visibilita ${metar.visibilityMeters ? `${metar.visibilityMeters} m` : 'ridotta'}`,
      };
    }

    // 4. Vento forte / groppi
    if (/\bSQ\b/.test(raw) || effectiveWindKmh >= 35 || gustKt >= 22) {
      return {
        condition: 'vento',
        labelIt: 'Vento forte',
        labelEn: 'Strong wind',
        detail: `Vento ${Math.round(effectiveWindKmh)} km/h`,
      };
    }

    // 5. Coperto / nuvoloso
    const cloudsDesc = (metar.cloudsDescription || '').toLowerCase();
    if (
      /\b(OVC|BKN)\b/.test(raw) ||
      cloudsDesc.includes('coperto') ||
      cloudsDesc.includes('frammentate')
    ) {
      return {
        condition: 'nuvola',
        labelIt: 'Nuvoloso',
        labelEn: 'Cloudy',
        detail: metar.cloudsDescription,
      };
    }

    // 6. Sereno / poco nuvoloso
    return {
      condition: 'sole',
      labelIt: 'Sereno',
      labelEn: 'Clear',
      detail: metar.cloudsDescription || 'Cielo sereno',
    };
  }

  // Fallback se il METAR non e disponibile
  if (effectiveWindKmh >= 35) {
    return {
      condition: 'vento',
      labelIt: 'Vento forte',
      labelEn: 'Strong wind',
      detail: `Vento ${Math.round(effectiveWindKmh)} km/h`,
    };
  }

  return {
    condition: 'sole',
    labelIt: 'Sereno',
    labelEn: 'Clear',
  };
}
