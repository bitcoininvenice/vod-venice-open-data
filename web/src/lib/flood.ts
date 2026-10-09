/**
 * Percentuale stimata di suolo pedonale allagato nel centro storico per livello di marea (cm, zero mareografico
 * di Punta Salute). Interpolazione lineare della tabella pubblicata dal Centro Maree del Comune di Venezia
 * (circa 12% a +110, 35% a +120, 70% a +130, 90% a +140): valore indicativo, non una mappa altimetrica.
 */
export function getFloodedGroundPercentage(cm: number): number {
  if (cm < 80) return 0;
  if (cm <= 90) return +(0.1 + (cm - 80) * 0.17).toFixed(1);
  if (cm <= 100) return +(1.8 + (cm - 90) * 0.33).toFixed(1);
  if (cm <= 110) return +(5.1 + (cm - 100) * 0.71).toFixed(1);
  if (cm <= 120) return +(12.2 + (cm - 110) * 2.33).toFixed(1);
  if (cm <= 130) return +(35.5 + (cm - 120) * 3.33).toFixed(1);
  if (cm <= 140) return +(68.8 + (cm - 130) * 2.08).toFixed(1);
  return Math.min(100, +(89.6 + (cm - 140) * 0.5).toFixed(1));
}

/** Numero di toni delle sirene CPSM per la marea prevista (1 tono da +110 cm, poi uno ogni 10 cm fino a 4). */
export function getSirenTones(cm: number): number {
  if (cm < 110) return 0;
  if (cm < 120) return 1;
  if (cm < 130) return 2;
  if (cm < 140) return 3;
  return 4;
}

/** Media circolare delle direzioni (gradi): 350° e 10° danno 0°, non 180°. */
export function meanDirectionDeg(degrees: number[]): number | null {
  if (degrees.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const d of degrees) {
    x += Math.cos((d * Math.PI) / 180);
    y += Math.sin((d * Math.PI) / 180);
  }
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return null;
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

/** Ora corrente di Venezia nel formato del Comune ("YYYY-MM-DD HH:mm:ss"), confrontabile come stringa. */
export function romeLocalNow(now: Date = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now);
  const g = (type: string) => p.find((x) => x.type === type)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
}
