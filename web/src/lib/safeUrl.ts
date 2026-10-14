/**
 * Link presi dai dati di terzi (OpenStreetMap, CAMPO, feed RSS): si accettano solo indirizzi web http/https.
 * Evita link "javascript:", "data:" e simili inseriti nelle fonti.
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  const withScheme = /^www\./i.test(v) ? `https://${v}` : v;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}
