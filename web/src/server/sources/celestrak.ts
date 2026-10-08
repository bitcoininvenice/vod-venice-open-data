/** CelesTrak GP: elementi orbitali correnti (TLE) per numero di catalogo NORAD. */
export const celestrakTleUrl = (noradId: number) =>
  `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;

/** Estrae le due righe TLE da una risposta testuale (nome + riga 1 + riga 2). */
export function parseTle(text: string, noradId: number): [string, string] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const l1 = lines.find((l) => l.startsWith('1 ') && l.slice(2, 7).trim() === String(noradId));
  const l2 = lines.find((l) => l.startsWith('2 ') && l.slice(2, 7).trim() === String(noradId));
  return l1 && l2 ? [l1, l2] : null;
}

/** Epoca del TLE (campi 19-32 della riga 1: anno a due cifre + giorno dell'anno frazionario). */
export function tleEpoch(line1: string): Date {
  const yy = Number(line1.slice(18, 20));
  const day = Number(line1.slice(20, 32));
  const year = yy < 57 ? 2000 + yy : 1900 + yy;
  return new Date(Date.UTC(year, 0, 1) + (day - 1) * 86400_000);
}
