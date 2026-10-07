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
  }
};

export const ORA_BLU: ColorScheme = {
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
  }
};

export const ALBA: ColorScheme = {
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
  }
};

export const TRAMONTO: ColorScheme = {
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
  }
};

export const CREPUSCOLO: ColorScheme = {
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
  }
};

const SUN_HOURS = {
  nDawn: 6 * 3600 + 13 * 60, // 06:13
  cDawn: 6 * 3600 + 47 * 60, // 06:47
  rise: 7 * 3600 + 18 * 60,  // 07:18
  set: 18 * 3600 + 38 * 60,  // 18:38
  cDusk: 19 * 3600 + 8 * 60, // 19:08
  nDusk: 19 * 3600 + 42 * 60 // 19:42
};

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

export function getDynamicPalette(timeSeconds: number): ColorScheme {
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
