/** Serializzazione degli export GeoJSON/CSV, separata dalla UI per poterla testare. */

export interface ExportLayerData {
  id: string;
  name: string;
  items: readonly object[];
}

type Row = Record<string, unknown>;

function coords(item: Row): [number, number] | null {
  const lat = item.lat ?? item.latitude;
  const lon = item.lon ?? item.longitude;
  return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)
    ? [lon, lat]
    : null;
}

/** GeoJSON RFC 7946: coordinate WGS84 lon/lat, nessun membro `crs`. */
export function buildGeoJson(layers: ExportLayerData[], exportedAt: string, platformUrl: string) {
  const features = layers.flatMap((layer) =>
    layer.items.flatMap((raw) => {
      const item = raw as Row;
      const c = coords(item);
      if (!c) return [];
      return [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: c },
        // I campi dell'elemento vanno prima: layerId/layerName non devono essere sovrascritti.
        properties: { ...item, layerId: layer.id, layerName: layer.name },
      }];
    }),
  );
  return {
    type: 'FeatureCollection' as const,
    metadata: {
      title: 'Venice Open Data export',
      exportedAt,
      totalFeatures: features.length,
      format: 'GeoJSON RFC 7946 (WGS84, lon/lat)',
      licenseNote:
        'Licenza della fonte originale di ciascun elemento (campo officialSource/source quando presente): ' +
        'es. CC BY per dati del Comune di Venezia, ODbL per dati OpenStreetMap.',
      platform: platformUrl,
    },
    features,
  };
}

/** Cella CSV RFC 4180, con protezione dalle formule nei fogli di calcolo. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const NAME_FIELDS = ['name', 'titolo', 'toponimo', 'collocazione', 'chiesa', 'denominazione', 'stationName'];
const DETAIL_FIELDS = ['sestiere', 'indirizzo', 'municipalita', 'campo', 'type'];
const SOURCE_FIELDS = ['officialSource', 'source'];

function firstField(item: Row, fields: string[]): unknown {
  for (const f of fields) if (item[f] !== undefined && item[f] !== null && item[f] !== '') return item[f];
  return '';
}

export function buildCsv(layers: ExportLayerData[]): string {
  const rows = [['id', 'layer', 'name', 'latitude', 'longitude', 'details', 'source'].join(',')];
  for (const layer of layers) {
    for (const raw of layer.items) {
      const item = raw as Row;
      const c = coords(item);
      if (!c) continue;
      rows.push([
        csvCell(item.id),
        csvCell(layer.id),
        csvCell(firstField(item, NAME_FIELDS)),
        c[1],
        c[0],
        csvCell(firstField(item, DETAIL_FIELDS)),
        csvCell(firstField(item, SOURCE_FIELDS)),
      ].join(','));
    }
  }
  // CRLF come da RFC 4180; il BOM fa riconoscere UTF-8 a Excel.
  return '﻿' + rows.join('\r\n');
}

export async function sha256Hex(content: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Avvia il download; la revoca dell'URL è differita perché Safari/Firefox la leggono dopo il click. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Scrive negli appunti restituendo l'esito invece di lanciare (http, iframe, permesso negato). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
