import { NextResponse, type NextRequest } from 'next/server';
import { createRateLimiter } from '@/server/rateLimit';

// Un caricamento della pagina esegue circa 22 richieste alle API, poi circa 6 al minuto con i
// layer live attivi: 600 richieste al minuto per IP lasciano ampio margine all'uso normale
// (anche più utenti dietro lo stesso NAT) e bloccano le raffiche automatiche.
const checkLimit = createRateLimiter({
  limit: Number(process.env.API_RATE_LIMIT_PER_MINUTE) || 600,
  windowMs: 60_000,
});

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function proxy(request: NextRequest) {
  const result = checkLimit(clientKey(request));
  if (!result.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfterSeconds: result.retryAfter },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
    );
  }
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
