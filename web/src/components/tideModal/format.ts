/** "LUN 12/10 14:25" da un orario locale di Venezia "YYYY-MM-DD HH:mm:ss" (indipendente dal fuso del browser). */
export function formatExtremeStamp(atStr: string, language: 'it' | 'en'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(atStr);
  if (!m) return atStr;
  const [, y, mo, d, hh, mm] = m;
  // Il giorno della settimana dipende solo dalla data: calcolato in UTC per non risentire del fuso
  const weekday = new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-GB', { weekday: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))));
  return `${weekday.toUpperCase()} ${d}/${mo} ${hh}:${mm}`;
}
