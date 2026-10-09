import { createMcpHandler } from '@modelcontextprotocol/server';
import { createVodMcpServer } from '@/lib/mcp/server';
import { allowRequest } from '@/lib/mcp/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const MAX_REQUEST_BYTES = 256_000;

// Server stateless: ogni richiesta crea un'istanza nuova; compatibile con i client MCP della generazione precedente
const handler = createMcpHandler(() => createVodMcpServer(), {
  legacy: 'stateless',
  responseMode: 'json',
  onerror: (error) => console.warn('[mcp]', error.message),
});

/** Dati pubblici in sola lettura, senza cookie: i connettori web (ChatGPT, Claude, Cursor) possono chiamare da qualsiasi origine. */
function withHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Expose-Headers', 'Mcp-Session-Id, Mcp-Protocol-Version');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
}

async function handle(request: Request): Promise<Response> {
  if (!allowRequest(clientKey(request))) {
    return withHeaders(Response.json({ error: 'rate_limited', message: 'Troppe richieste: riprova tra un minuto.' }, { status: 429, headers: { 'Retry-After': '60' } }));
  }
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_REQUEST_BYTES) {
    return withHeaders(Response.json({ error: 'request_too_large' }, { status: 413 }));
  }
  return withHeaders(await handler.fetch(request));
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
