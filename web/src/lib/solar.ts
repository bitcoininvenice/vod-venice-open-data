/**
 * VOD - Venice Open Data
 * Astronomical Solar Calculations and Dynamic Palette Blending for Venice
 * Coordinates: 45.437° N, 12.335° E
 */

export interface ColorScheme {
  ground: string;
  water: string;
  sea: string;
  land: string;
  coast: string;
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  cats: Record<string, string>;
}

export const NOTTE: ColorScheme = {
  ground: '#0c1114',
  water: '#0e1519',
  sea: '#0a1013',
  land: '#1a2227',
  coast: '#3a4850',
  ink: '#eef2f1',
  ink2: '#9aa7a8',
  ink3: '#66757a',
  rule: '#263238',
  cats: {
    vaporetto: '#5cc8ff',
    motoscafo: '#2ee6c5',
    motonave: '#ff85cf',
    ferry: '#ffd166',
    tram: '#ff6f5e',
    bus: '#a6e36a',
    island: '#c0a0ff',
    peoplemover: '#ff9f43',
  }
};

export const CARTA: ColorScheme = {
  ground: '#ebe3c9',
  water: '#cbd4c3',
  sea: '#b9c4bd',
  land: '#f1e6c6',
  coast: '#7d6b55',
  ink: '#2b2118',
  ink2: '#5f5140',
  ink3: '#85755f',
  rule: '#d3c8a8',
  cats: {
    vaporetto: '#007bbd',
    motoscafo: '#008a7e',
    motonave: '#b02068',
    ferry: '#b85000',
    tram: '#b0281b',
    bus: '#4a8018',
    island: '#6b3aa0',
    peoplemover: '#c2410c',
  }
};

const ORA_BLU: ColorScheme = {
  ground: '#101529',
  water: '#141b36',
  sea: '#10162d',
  land: '#222949',
  coast: '#4b568c',
  ink: '#eef0fa',
  ink2: '#a4abcd',
  ink3: '#70799f',
  rule: '#2b3359',
  cats: {
    vaporetto: '#70d0ff',
    motoscafo: '#3ff0d0',
    motonave: '#ff90d8',
    ferry: '#ffd878',
    tram: '#ff8070',
    bus: '#b0f075',
    island: '#ccaaff',
    peoplemover: '#ffb067',
  }
};

const ALBA: ColorScheme = {
  ground: '#f8e7df',
  water: '#e6d2e0',
  sea: '#d9c6da',
  land: '#f7dfc8',
  coast: '#b38e96',
  ink: '#3d2b40',
  ink2: '#6f596a',
  ink3: '#917b88',
  rule: '#e4cdcc',
  cats: {
    vaporetto: '#0b7ab8',
    motoscafo: '#0b8c84',
    motonave: '#c22d86',
    ferry: '#c2570a',
    tram: '#d1261f',
    bus: '#4f8a14',
    island: '#6d3fc8',
    peoplemover: '#c2410c',
  }
};

const TRAMONTO: ColorScheme = {
  ground: '#f9e5d0',
  water: '#ecc3c0',
  sea: '#e3b3b6',
  land: '#f6d3a4',
  coast: '#b98a78',
  ink: '#42293a',
  ink2: '#755a61',
  ink3: '#977c7e',
  rule: '#e6c8b6',
  cats: {
    vaporetto: '#086e9e',
    motoscafo: '#0a857d',
    motonave: '#b82a80',
    ferry: '#b8480a',
    tram: '#c8241c',
    bus: '#4a8212',
    island: '#6a36c0',
    peoplemover: '#b93d0a',
  }
};

const CREPUSCOLO: ColorScheme = {
  ground: '#190f23',
  water: '#1f142b',
  sea: '#190f24',
  land: '#33203b',
  coast: '#6c4b70',
  ink: '#f6eef2',
  ink2: '#baa4b9',
  ink3: '#877089',
  rule: '#3a2743',
  cats: {
    vaporetto: '#66cfff',
    motoscafo: '#3fe2c6',
    motonave: '#ff8fd2',
    ferry: '#ffcf70',
    tram: '#ff8370',
    bus: '#abe474',
    island: '#c6a6ff',
    peoplemover: '#ffa555',
  }
};

export interface SunHours {
  /** Inizio del crepuscolo nautico (sole a -12°), secondi dalla mezzanotte di Venezia */
  nDawn: number;
  /** Inizio del crepuscolo civile (-6°) */
  cDawn: number;
  /** Alba (-0.833°, rifrazione inclusa) */
  rise: number;
  set: number;
  cDusk: number;
  nDusk: number;
}

const VENICE_LAT = 45.437;
const VENICE_LON = 12.335;
const RAD = Math.PI / 180;

/** Scarto in minuti tra ora di Venezia e UTC per il giorno dato (CET/CEST). */
function romeOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((wall - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

/**
 * Orari di alba, tramonto e crepuscoli a Venezia per il giorno di `date`
 * (equazioni solari NOAA, precisione di circa un minuto), in secondi dall'inizio del giorno locale.
 */
export function sunHoursFor(date: Date): SunHours {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  // Scarto orario di mezzogiorno UTC: alba e tramonto cadono dopo il cambio dell'ora (che avviene alle 01:00 UTC)
  const offset = romeOffsetMinutes(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)));
  const lat = VENICE_LAT * RAD;

  const event = (zenithDeg: number, rising: boolean): number => {
    const cosHa = Math.cos(zenithDeg * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
    const ha = Math.acos(Math.min(1, Math.max(-1, cosHa))) / RAD;
    const utcMinutes = 720 - 4 * (VENICE_LON + (rising ? ha : -ha)) - eqTime;
    return Math.round((utcMinutes + offset) * 60);
  };

  return {
    nDawn: event(102, true),
    cDawn: event(96, true),
    rise: event(90.833, true),
    set: event(90.833, false),
    cDusk: event(96, false),
    nDusk: event(102, false),
  };
}

// Una sola valutazione per giorno: getDynamicPalette è chiamata a ogni frame della mappa
let cachedDay = '';
let cachedSun: SunHours | null = null;
function sunHoursCached(date: Date): SunHours {
  const key = date.toISOString().slice(0, 10);
  if (key !== cachedDay || !cachedSun) {
    cachedDay = key;
    cachedSun = sunHoursFor(date);
  }
  return cachedSun;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColor(c1: string, c2: string, f: number): string {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * f);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * f);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Il tema dinamico usa l'interfaccia chiara tra un'ora dopo l'alba e un'ora prima del tramonto a Venezia.
 * Stessa regola dello script iniziale in themeBoot.ts (un test verifica che coincidano).
 */
export function isDaylightTheme(timeSeconds: number, date: Date = new Date()): boolean {
  const h = sunHoursCached(date);
  return timeSeconds >= h.rise + 3600 && timeSeconds <= h.set - 3600;
}

export function getDynamicPalette(timeSeconds: number, date: Date = new Date()): ColorScheme {
  const SUN_HOURS = sunHoursCached(date);
  const DYN: [number, ColorScheme][] = [
    [SUN_HOURS.nDawn, NOTTE],
    [SUN_HOURS.cDawn, ORA_BLU],
    [SUN_HOURS.rise, ALBA],
    [SUN_HOURS.rise + 3600, CARTA],
    [SUN_HOURS.set - 3600, CARTA],
    [SUN_HOURS.set, TRAMONTO],
    [SUN_HOURS.cDusk, CREPUSCOLO],
    [SUN_HOURS.nDusk, NOTTE]
  ];

  if (timeSeconds <= DYN[0][0] || timeSeconds >= DYN[DYN.length - 1][0]) {
    return NOTTE;
  }

  let i = 0;
  while (timeSeconds > DYN[i + 1][0]) {
    i++;
  }

  const [tA, palA] = DYN[i];
  const [tB, palB] = DYN[i + 1];
  let factor = (timeSeconds - tA) / (tB - tA);
  factor = factor * factor * (3 - 2 * factor); // smoothstep

  const result: ColorScheme = {
    ground: mixColor(palA.ground, palB.ground, factor),
    water: mixColor(palA.water, palB.water, factor),
    sea: mixColor(palA.sea, palB.sea, factor),
    land: mixColor(palA.land, palB.land, factor),
    coast: mixColor(palA.coast, palB.coast, factor),
    ink: mixColor(palA.ink, palB.ink, factor),
    ink2: mixColor(palA.ink2, palB.ink2, factor),
    ink3: mixColor(palA.ink3, palB.ink3, factor),
    rule: mixColor(palA.rule, palB.rule, factor),
    cats: {}
  };

  for (const k of Object.keys(palA.cats)) {
    result.cats[k] = mixColor(palA.cats[k], palB.cats[k], factor);
  }

  return result;
}

export function formatTime(seconds: number): string {
  const s = ((seconds % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTimeParts(seconds: number): { hoursMinutes: string; seconds: string } {
  const s = ((Math.floor(seconds) % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return {
    hoursMinutes: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
    seconds: sec.toString().padStart(2, '0')
  };
}

type SolarIconType = 'sun' | 'moon' | 'sunrise' | 'sunset';

export interface SolarPhaseInfo {
  phaseKey: 'notte' | 'alba' | 'giorno' | 'goldenHour' | 'crepuscolo';
  icon: SolarIconType;
  labelKey: string;
  targetTime: string;
  targetLabelKey: string;
}

export function getSolarPhase(seconds: number, date: Date = new Date()): SolarPhaseInfo {
  const SUN_HOURS = sunHoursCached(date);
  const s = ((seconds % 86400) + 86400) % 86400;

  // Notte fonda prima del primo barlume civile
  if (s < SUN_HOURS.cDawn) {
    return {
      phaseKey: 'notte',
      icon: 'moon',
      labelKey: 'ui.timeline.faseNotte',
      targetTime: formatTime(SUN_HOURS.rise),
      targetLabelKey: 'ui.timeline.albaAlle'
    };
  }

  // Alba / Crepuscolo mattutino
  if (s < SUN_HOURS.rise + 1800) {
    return {
      phaseKey: 'alba',
      icon: 'sunrise',
      labelKey: 'ui.timeline.faseAlba',
      targetTime: formatTime(SUN_HOURS.rise),
      targetLabelKey: 'ui.timeline.albaAlle'
    };
  }

  // Giorno pieno
  if (s < SUN_HOURS.set - 3600) {
    return {
      phaseKey: 'giorno',
      icon: 'sun',
      labelKey: 'ui.timeline.faseGiorno',
      targetTime: formatTime(SUN_HOURS.set),
      targetLabelKey: 'ui.timeline.tramontoAlle'
    };
  }

  // Golden hour / Tramonto
  if (s < SUN_HOURS.set) {
    return {
      phaseKey: 'goldenHour',
      icon: 'sunset',
      labelKey: 'ui.timeline.faseGoldenHour',
      targetTime: formatTime(SUN_HOURS.set),
      targetLabelKey: 'ui.timeline.tramontoAlle'
    };
  }

  // Crepuscolo serale / Ora blu
  if (s < SUN_HOURS.nDusk) {
    return {
      phaseKey: 'crepuscolo',
      icon: 'sunset',
      labelKey: 'ui.timeline.faseCrepuscolo',
      targetTime: formatTime(SUN_HOURS.nDusk),
      targetLabelKey: 'ui.timeline.notteAlle'
    };
  }

  // Notte dopo il crepuscolo nautico
  return {
    phaseKey: 'notte',
    icon: 'moon',
    labelKey: 'ui.timeline.faseNotte',
    targetTime: formatTime(SUN_HOURS.rise),
    targetLabelKey: 'ui.timeline.albaAlle'
  };
}
