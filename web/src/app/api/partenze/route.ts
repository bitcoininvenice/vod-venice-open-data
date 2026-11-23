import { departuresService } from '@/server/planning/services';
import { numberParam, param, respond } from '@/server/planning/http';

export const dynamic = 'force-dynamic';

/**
 * Prossime partenze da una fermata (orario ufficiale ACTV e Alilaguna): ?fermata=Rialto[&data=][&ora=][&minuti=90]
 * Filtri facoltativi: &operatore=ACTV|Alilaguna, &categoria=vaporetto,motoscafo, &linea=4.1.
 * Alias inglesi: stop, date, time, minutes, operator, category, line.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const stop = param(url, 'fermata', 'stop');
  if (!stop) return respond({ ok: false, status: 400, error: 'missing_stop', message: 'Indica la fermata: ?fermata=Rialto' });
  const op = param(url, 'operatore', 'operator')?.toLowerCase();
  if (op && op !== 'actv' && op !== 'alilaguna') return respond({ ok: false, status: 400, error: 'invalid_operator', message: 'Operatore: ACTV o Alilaguna' });
  const category = param(url, 'categoria', 'category')
    ?.split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 10);
  const line = param(url, 'linea', 'line')?.slice(0, 10);
  return respond(
    await departuresService({
      stop,
      date: param(url, 'data', 'date'),
      time: param(url, 'ora', 'time'),
      minutes: numberParam(url, 'minuti', 'minutes') ?? undefined,
      operator: op ? (op === 'actv' ? 'ACTV' : 'Alilaguna') : null,
      category: category?.length ? category : null,
      line: line || null,
    }),
  );
}
