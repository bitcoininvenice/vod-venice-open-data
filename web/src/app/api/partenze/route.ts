import { departuresService } from '@/server/planning/services';
import { numberParam, param, respond } from '@/server/planning/http';

export const dynamic = 'force-dynamic';

/**
 * Prossime partenze da una fermata (orario ufficiale ACTV e Alilaguna): ?fermata=Rialto[&data=][&ora=][&minuti=90]
 * Alias inglesi: stop, date, time, minutes.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const stop = param(url, 'fermata', 'stop');
  if (!stop) return respond({ ok: false, status: 400, error: 'missing_stop', message: 'Indica la fermata: ?fermata=Rialto' });
  return respond(await departuresService({ stop, date: param(url, 'data', 'date'), time: param(url, 'ora', 'time'), minutes: numberParam(url, 'minuti', 'minutes') ?? undefined }));
}
