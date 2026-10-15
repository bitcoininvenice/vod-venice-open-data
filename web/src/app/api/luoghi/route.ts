import { findPlaceService } from '@/server/planning/services';
import { param, respond } from '@/server/planning/http';

export const dynamic = 'force-dynamic';

/** Come VOD riconosce un luogo (fermata, indirizzo, civico, aeroporto, lat,lon): ?q=Calle Minestra */
export async function GET(request: Request) {
  const q = param(new URL(request.url), 'q');
  if (!q || q.length < 2) return respond({ ok: false, status: 400, error: 'missing_query', message: 'Indica un luogo: ?q=Rialto' });
  return respond(findPlaceService(q));
}
