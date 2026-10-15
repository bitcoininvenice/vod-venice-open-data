import { floodService } from '@/server/planning/services';
import { numberParam, param, respond } from '@/server/planning/http';

export const dynamic = 'force-dynamic';

/**
 * Simulatore di acqua alta: ?marea=130[&luogo=Piazza San Marco][&da=Ferrovia&a=San Marco]
 * Senza marea usa la misura attuale di Punta della Salute. Alias inglesi: levelCm, place, from, to.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return respond(await floodService({ levelCm: numberParam(url, 'marea', 'levelCm'), place: param(url, 'luogo', 'place'), from: param(url, 'da', 'from'), to: param(url, 'a', 'to') }));
}
