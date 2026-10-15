import { planTripService } from '@/server/planning/services';
import { numberParam, param, respond } from '@/server/planning/http';

export const dynamic = 'force-dynamic';

const MODES: Record<string, 'fastest' | 'walk' | 'water' | 'private'> = {
  piu_veloce: 'fastest', fastest: 'fastest', a_piedi: 'walk', walk: 'walk', via_acqua: 'water', water: 'water', barca: 'private', private: 'private',
};

/**
 * Come arrivare da A a B con tutti i mezzi (ACTV, Alilaguna), a piedi o con la barca privata.
 * ?da=Rialto&a=Murano Colonna[&data=YYYY-MM-DD][&ora=HH:MM][&modo=piu_veloce|a_piedi|via_acqua|barca][&residente=1][&marea=130]
 * Alias inglesi: from, to, date, time, mode (fastest|walk|water|private), resident, tideCm.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = param(url, 'da', 'from');
  const to = param(url, 'a', 'to');
  if (!from || !to) {
    return respond({ ok: false, status: 400, error: 'missing_places', message: 'Indica partenza e arrivo: ?da=Rialto&a=Murano Colonna (fermata, indirizzo, civico, «aeroporto» o lat,lon).' });
  }
  const modeParam = param(url, 'modo', 'mode');
  const mode = modeParam ? MODES[modeParam] : 'fastest';
  if (!mode) return respond({ ok: false, status: 400, error: 'invalid_mode', message: 'modo: piu_veloce, a_piedi, via_acqua o barca.' });
  const resident = ['1', 'true', 'si', 'sì', 'yes'].includes((param(url, 'residente', 'resident') ?? '').toLowerCase());
  return respond(
    await planTripService({ from, to, date: param(url, 'data', 'date'), time: param(url, 'ora', 'time'), mode, resident, tideCm: numberParam(url, 'marea', 'tideCm') }),
  );
}
