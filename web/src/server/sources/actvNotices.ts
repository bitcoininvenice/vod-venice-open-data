/**
 * Avvisi di servizio ACTV dal feed RSS ufficiale: testo, linee e fermate citate, date.
 * Funzioni pure; la richiesta è nella route /api/avvisi-actv.
 */
import type { ActvNotice, ActvNoticeStop } from '@/lib/contracts/actvNotices';

export interface RawRssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  guid: string;
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const tag = (xml: string, name: string) => decode(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] ?? '').trim();

/** Elementi del feed RSS; errore se non è un feed. */
export function parseRss(xml: string): RawRssItem[] {
  if (!/<rss[\s>]/.test(xml)) throw new Error('feed RSS non valido');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
    title: tag(m[1], 'title'),
    link: tag(m[1], 'link'),
    pubDate: tag(m[1], 'pubDate'),
    description: tag(m[1], 'description'),
    guid: tag(m[1], 'guid'),
  }));
}

/** Testo leggibile dall'HTML della descrizione */
export function plainText(html: string): string {
  return decode(html.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/**
 * Date citate nel testo ("13 ottobre 2026", "giovedì 15 ottobre"): l'anno mancante è quello di pubblicazione.
 * I giorni senza mese ("venerdì 9 alle…") prendono il mese della data successiva nel testo.
 */
export function mentionedDates(text: string, year: number): string[] {
  const out: string[] = [];
  // mese in minuscolo: "27 Ottobre" con la maiuscola è un toponimo (via, fermata), non una data
  const re = new RegExp(`\\b(\\d{1,2})(?:\\s+(${MONTHS.join('|')}))?(?:\\s+(\\d{4}))?\\b`, 'g');
  const pending: number[] = [];
  for (const m of text.matchAll(re)) {
    const day = Number(m[1]);
    if (day < 1 || day > 31) continue;
    const before = text.slice(Math.max(0, (m.index ?? 0) - 12), m.index ?? 0).toLowerCase();
    const isDay = /(luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica|dal|al|del)\s*$/.test(before);
    if (!m[2]) {
      if (isDay) pending.push(day);
      continue;
    }
    const month = MONTHS.indexOf(m[2]) + 1;
    const y = m[3] ? Number(m[3]) : year;
    for (const d of [...pending, day]) out.push(`${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    pending.length = 0;
  }
  return out;
}

/** Linee ACTV citate ("Linea 17", "linee 53E e 55SE"), solo se esistono nell'orario. */
export function mentionedLines(text: string, known: Set<string>): string[] {
  const out = new Set<string>();
  const TOKEN = String.raw`[A-Z]{0,3}\d{1,3}(?:\.\d)?[A-Z/]{0,3}|[A-Z]{1,3}\d?`;
  const re = new RegExp(String.raw`\blinee?a?\s+((?:${TOKEN})(?:\s*(?:,|\be\b|\bed\b)\s*(?:${TOKEN}))*)`, 'gi');
  for (const m of text.matchAll(re)) {
    for (const tok of m[1].split(/\s*(?:,|\be\b|\bed\b)\s*/i)) {
      const t = tok.trim().toUpperCase();
      if (t && known.has(t)) out.add(t);
    }
  }
  return [...out];
}

const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Fermate citate: per codice ("ID 3409"), altrimenti per nome completo ("Mestre stazione C6") se il testo
 * parla di una fermata. I nomi brevi o generici (meno di due parole o 10 caratteri) non sono usati.
 */
export function mentionedStops(text: string, stops: Record<string, [string, number, number]>): ActvNoticeStop[] {
  const out: ActvNoticeStop[] = [];
  for (const m of text.matchAll(/\bID\s*(\d{2,5})\b/g)) {
    const s = stops[m[1]];
    if (s && !out.some((o) => o.id === m[1])) out.push({ id: m[1], name: s[0], lat: s[1], lon: s[2], match: 'id' });
  }
  if (out.length > 0 || !/\b(fermat[ae]|capolinea|pontil[ei]|approd[oi])\b/i.test(text)) return out;
  const t = ` ${norm(text)} `;
  let best: { n: string; ids: string[] } | null = null;
  const byName = new Map<string, string[]>();
  for (const [id, [name]] of Object.entries(stops)) {
    const n = norm(name);
    if (n.length < 10 || !n.includes(' ')) continue;
    byName.set(n, [...(byName.get(n) ?? []), id]);
  }
  for (const [n, ids] of byName) if (t.includes(` ${n} `) && (!best || n.length > best.n.length)) best = { n, ids };
  if (best) for (const id of best.ids) out.push({ id, name: stops[id][0], lat: stops[id][1], lon: stops[id][2], match: 'name' });
  return out;
}

/** Avviso completo da un elemento del feed. */
export function toNotice(item: RawRssItem, stops: Record<string, [string, number, number]>, knownLines: Set<string>): ActvNotice {
  const text = plainText(item.description);
  const published = new Date(item.pubDate);
  const year = Number.isNaN(published.getTime()) ? new Date().getFullYear() : published.getFullYear();
  const dates = mentionedDates(text, year).sort();
  return {
    id: /^(\d+)/.exec(item.guid)?.[1] ?? item.link,
    title: plainText(item.title),
    url: /^https?:\/\/(?:www\.)?(?:actv|avm)\.avmspa\.it\//.test(item.link) ? item.link.replace(/^http:/, 'https:') : 'https://avm.avmspa.it/it/content/infomobilit%C3%A0-avmactv-venezia',
    publishedAt: Number.isNaN(published.getTime()) ? '' : published.toISOString(),
    text: text.length > 900 ? `${text.slice(0, 897)}…` : text,
    lines: mentionedLines(text, knownLines),
    stops: mentionedStops(`${item.title}. ${text}`, stops),
    lastDate: dates.length ? dates[dates.length - 1] : null,
    openEnded: /fino al termine|fino a nuov[oa]|fino a fine lavori|fino a cessate esigenze|fino a revoca/i.test(text),
  };
}

/**
 * Avviso ancora utile oggi: con date, se l'ultima non è passata (o è senza termine);
 * senza date (notizie, comunicati), se pubblicato negli ultimi 14 giorni.
 */
export function isCurrent(n: ActvNotice, today: string): boolean {
  if (n.openEnded) return true;
  if (n.lastDate) return n.lastDate >= today;
  if (!n.publishedAt) return false;
  return n.publishedAt.slice(0, 10) >= new Date(Date.parse(`${today}T12:00:00Z`) - 14 * 86400000).toISOString().slice(0, 10);
}
