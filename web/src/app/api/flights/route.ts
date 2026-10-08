import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { OPENSKY_STATES_URL, OPENSKY_TOKEN_URL, parseOpenSkyStates } from '@/server/sources/opensky';

// Cache condivisa: tutte le richieste dei client nello stesso intervallo consumano una sola chiamata OpenSky.
export const revalidate = 15;

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Token OAuth2 (client credentials) se configurato: alza la quota rispetto all'accesso anonimo. */
async function getOpenSkyToken(): Promise<string | null> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  try {
    const res = await fetch(OPENSKY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 1800) * 1000 };
    return cachedToken.value;
  } catch {
    return null;
  }
}

export async function GET() {
  const token = await getOpenSkyToken();
  const result = await fetchUpstream(OPENSKY_STATES_URL, parseOpenSkyStates, {
    revalidate: 15,
    timeoutMs: 5000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const meta = {
    kind: 'live' as const,
    source: 'OpenSky Network (ADS-B)',
    sourceUrl: 'https://opensky-network.org',
    license: 'Uso non commerciale / ricerca – termini OpenSky Network',
    fetchedAt: result.ok ? result.fetchedAt : undefined,
  };

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      success: true,
      count: 0,
      data: [],
      meta: { ...meta, note: 'OpenSky non raggiungibile o quota esaurita: nessun volo mostrato.' },
    });
  }

  return NextResponse.json({
    ok: true,
    success: true,
    count: result.data.length,
    data: result.data,
    meta: result.data.length === 0
      ? { ...meta, note: 'Nessun transponder rilevato nell\'area in questo momento (es. chiusura notturna dell\'aeroporto).' }
      : meta,
  });
}
