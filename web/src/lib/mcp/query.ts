/** Filtri generici e limiti di dimensione per le risposte MCP: funzioni pure, testate offline. */

export interface McpQueryArgs {
  text?: string;
  near?: { lat: number; lon: number; radiusMeters: number };
  limit: number;
  offset: number;
}

export interface McpQueryResult {
  total: number;
  matched: number;
  offset: number;
  returned: number;
  items: Record<string, unknown>[];
  truncatedForSize?: boolean;
}

/** Dimensione massima del testo restituito all'AI (caratteri JSON). */
export const MAX_RESPONSE_CHARS = 120_000;

function coords(item: Record<string, unknown>): [number, number] | null {
  const lat = item.lat ?? item.latitude;
  const lon = item.lon ?? item.longitude;
  return typeof lat === 'number' && typeof lon === 'number' ? [lat, lon] : null;
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** true se il testo compare in uno dei campi testuali (anche annidati di un livello). */
function matchesText(item: Record<string, unknown>, needle: string): boolean {
  const n = needle.toLowerCase();
  for (const v of Object.values(item)) {
    if (typeof v === 'string' && v.toLowerCase().includes(n)) return true;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const w of Object.values(v as Record<string, unknown>)) if (typeof w === 'string' && w.toLowerCase().includes(n)) return true;
    }
  }
  return false;
}

export function applyQuery(items: Record<string, unknown>[], args: McpQueryArgs): McpQueryResult {
  let rows = items;
  if (args.text) rows = rows.filter((it) => matchesText(it, args.text!));
  if (args.near) {
    const { lat, lon, radiusMeters } = args.near;
    rows = rows
      .map((it) => {
        const c = coords(it);
        return c ? { ...it, distanceMeters: distanceMeters(lat, lon, c[0], c[1]) } : null;
      })
      .filter((it): it is Record<string, unknown> & { distanceMeters: number } => it !== null && it.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
  let page = rows.slice(args.offset, args.offset + args.limit);
  let truncatedForSize = false;
  while (page.length > 1 && JSON.stringify(page).length > MAX_RESPONSE_CHARS) {
    page = page.slice(0, Math.ceil(page.length / 2));
    truncatedForSize = true;
  }
  return {
    total: items.length,
    matched: rows.length,
    offset: args.offset,
    returned: page.length,
    items: page,
    ...(truncatedForSize ? { truncatedForSize } : {}),
  };
}
