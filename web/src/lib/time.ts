import type { DayType } from '@/lib/types';

/** Gli orari GTFS ACTV/Alilaguna sono espressi in ora locale di Venezia, indipendentemente dal fuso del browser. */
const ROME_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Rome',
  hourCycle: 'h23',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function romeParts(date: Date) {
  const parts = ROME_PARTS.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    weekday: get('weekday'),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

/** Secondi trascorsi dalla mezzanotte a Venezia (frazione di secondo inclusa). */
export function romeSecondsOfDay(date: Date = new Date()): number {
  const p = romeParts(date);
  return p.hour * 3600 + p.minute * 60 + p.second + date.getMilliseconds() / 1000;
}

/**
 * Istante reale corrispondente a `secondsOfDay` (ora di Venezia) nella giornata di `now`.
 * Serve a convertire l'ora della timeline in una data per calcoli astronomici e orbitali.
 */
export function dateAtRomeSeconds(secondsOfDay: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + (secondsOfDay - romeSecondsOfDay(now)) * 1000);
}

/** Tipo di giorno di servizio GTFS a Venezia. */
export function romeDayType(date: Date = new Date()): DayType {
  const { weekday } = romeParts(date);
  if (weekday === 'Sun') return 'sunday';
  if (weekday === 'Sat') return 'saturday';
  return 'weekday';
}

/** Adesso (per l'orario del giorno: calendario Alilaguna). */
export function todayDate(): Date {
  return new Date();
}

/** Stesso istante di domani (per l'orario del giorno dopo). */
export function tomorrowDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + 86400_000);
}

/** Tipo di giorno di domani a Venezia (per l'orario dopo la fine del servizio di oggi). */
export function romeTomorrowDayType(now: Date = new Date()): DayType {
  return romeDayType(new Date(now.getTime() + 86400_000));
}

/** "+17 cm" / "-5 cm"; "n.d." se il valore non è disponibile. */
export function formatSignedCm(value: number | null | undefined, unit = ' cm'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n.d.';
  return `${value > 0 ? '+' : ''}${value}${unit}`;
}

/** Formatta "YYYY-MM-DD HH:mm:ss" (ora locale pubblicata dalla fonte) come "08/10 01:40". */
export function formatLocalStamp(local: string | null | undefined): string {
  if (!local) return 'n.d.';
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : local;
}

/**
 * Converte "YYYY-MM-DD HH:mm:ss" in ora locale di Venezia in un istante UTC.
 * Il Comune pubblica orari locali senza offset: l'offset (CET/CEST) viene ricavato con Intl.
 */
export function romeLocalToDate(local: string): Date {
  const [d, t = '00:00:00'] = local.trim().split(' ');
  const asUtc = new Date(`${d}T${t}Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(asUtc);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const romeWallClockAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const offsetMs = romeWallClockAsUtc - asUtc.getTime();
  return new Date(asUtc.getTime() - offsetMs);
}

/** Data di oggi a Venezia, "YYYY-MM-DD". */
export function romeToday(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
