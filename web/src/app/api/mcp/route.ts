import { createMcpHandler } from '@modelcontextprotocol/server';
import { createVodMcpServer } from '@/lib/mcp/server';
import { clientKey, createRateLimiter } from '@/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const MAX_REQUEST_BYTES = 256_000;
/** Come Cruscotto Italia: 60 richieste MCP al minuto per client (oltre al limite generale delle API). */
const checkMcpLimit = createRateLimiter({ limit: Number(process.env.MCP_RATE_LIMIT_PER_MINUTE) || 60, windowMs: 60_000 });
/** Richieste MCP elaborate in parallelo per istanza: oltre si risponde 503 con Retry-After. */
const MAX_CONCURRENT = 8;
let inFlight = 0;

// Server stateless: ogni richiesta crea un'istanza nuova; compatibile con i client MCP della generazione precedente
const handler = createMcpHandler(() => createVodMcpServer(), {
  legacy: 'stateless',
  responseMode: 'json',
  onerror: (error) => console.warn('[mcp]', error.message),
});

/** Dati pubblici in sola lettura, senza cookie: i connettori web (ChatGPT, Claude, Cursor) possono chiamare da qualsiasi origine. */
function withHeaders(response: Response, extra: Record<string, string> = {}): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Expose-Headers', 'Mcp-Session-Id, Mcp-Protocol-Version, Retry-After, X-RateLimit-Remaining');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handle(request: Request): Promise<Response> {
  const limit = checkMcpLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return withHeaders(
      Response.json({ error: 'rate_limited', message: 'Troppe richieste: riprova più tardi.', retryAfterSeconds: limit.retryAfter }, { status: 429 }),
      { 'Retry-After': String(limit.retryAfter) },
    );
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) {
    return withHeaders(Response.json({ error: 'request_too_large' }, { status: 413 }));
  }
  if (inFlight >= MAX_CONCURRENT) {
    return withHeaders(Response.json({ error: 'busy', message: 'Server occupato: riprova tra qualche secondo.' }, { status: 503 }), { 'Retry-After': '5' });
  }
  inFlight += 1;
  try {
    return withHeaders(await handler.fetch(request), { 'X-RateLimit-Remaining': String(limit.remaining) });
  } finally {
    inFlight -= 1;
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}
