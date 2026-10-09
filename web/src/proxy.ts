import { NextResponse, type NextRequest } from 'next/server';
import { clientKey, createRateLimiter } from '@/server/rateLimit';

// Il limite serve solo per le route calcolate a ogni richiesta (vedi `matcher`): le altre API sono
// rigenerate in background (ISR) e servite dalla CDN, quindi le raffiche non arrivano al server.
// 600 richieste al minuto per IP lasciano ampio margine all'uso normale (anche più utenti dietro
// lo stesso NAT) e bloccano le raffiche automatiche.
const checkLimit = createRateLimiter({
  limit: Number(process.env.API_RATE_LIMIT_PER_MINUTE) || 600,
  windowMs: 60_000,
});

export function proxy(request: NextRequest) {
  // /mcp: GET mostra la pagina con le istruzioni, le richieste MCP (POST, OPTIONS, DELETE) vanno al server
  const isMcpAlias = request.nextUrl.pathname === '/mcp' && request.method !== 'GET' && request.method !== 'HEAD';
  if (request.nextUrl.pathname === '/mcp' && !isMcpAlias) return NextResponse.next();

  const result = checkLimit(clientKey(request.headers));
  if (!result.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfterSeconds: result.retryAfter },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
    );
  }
  const response = isMcpAlias ? NextResponse.rewrite(new URL('/api/mcp', request.url)) : NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

// Solo le route dinamiche (parametri nella richiesta o POST): escludere le API in cache evita
// un'esecuzione del proxy, cioè una funzione sul server, per ogni richiesta servita dalla CDN.
export const config = {
  matcher: ['/api/mcp', '/mcp', '/api/datasets/:path*', '/api/realtime/arrivals', '/api/spatial/:path*', '/api/stops'],
};
