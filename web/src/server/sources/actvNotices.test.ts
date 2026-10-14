import { describe, expect, it } from 'vitest';
import { isCurrent, mentionedDates, mentionedLines, mentionedStops, parseRss, plainText, toNotice } from './actvNotices';

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Mirano: spostamento fermata</title><link>https://actv.avmspa.it/it/content/mirano</link>
<description>&lt;p&gt;&lt;strong&gt;AVM/Actv&lt;/strong&gt; informa che, dalle ore 12.00 di martedì 13 ottobre 2026 fino al termine dei lavori, la fermata Mirano Miranese ID 3409 viene posticipata.&lt;/p&gt;</description>
<pubDate>Tue, 13 Oct 2026 09:23:05 +0000</pubDate><guid isPermaLink="false">10647 at https://actv.avmspa.it</guid></item>
</channel></rss>`;
const STOPS: Record<string, [string, number, number]> = {
  '3409': ['Mirano Miranese', 45.49, 12.1],
  '100': ['Mestre Stazione C6', 45.48, 12.23],
  '200': ['Lido', 45.41, 12.37],
};
const LINES = new Set(['9', '17', '53E', '55SE', '4.1']);

describe('avvisi ACTV', () => {
  it('legge il feed RSS e rifiuta altro', () => {
    const [i] = parseRss(RSS);
    expect(i.title).toBe('Mirano: spostamento fermata');
    expect(plainText(i.description)).toMatch(/^AVM\/Actv informa che/);
    expect(() => parseRss('<html></html>')).toThrow();
  });

  it('date citate: anno sottinteso, giorni senza mese, "27 Ottobre" toponimo', () => {
    expect(mentionedDates('dalle 17 di venerdì 9 alle 15 di giovedì 15 ottobre 2026', 2026)).toEqual(['2026-10-09', '2026-10-15']);
    expect(mentionedDates('linea 9 27 Ottobre – S. Liberale, domenica 11 ottobre', 2026)).toEqual(['2026-10-11']);
  });

  it('linee citate, solo se esistono nell\'orario', () => {
    expect(mentionedLines('Linea 17 Le seguenti partenze; linee 53E e 55SE deviate; linea 99 inesistente', LINES).sort()).toEqual(['17', '53E', '55SE']);
    expect(mentionedLines('i bus della linea 9 27 Ottobre', LINES)).toEqual(['9']);
  });

  it('fermate dal codice ID, altrimenti dal nome completo; nomi generici esclusi', () => {
    expect(mentionedStops('la fermata Mirano Miranese ID 3409', STOPS).map((s) => [s.id, s.match])).toEqual([['3409', 'id']]);
    expect(mentionedStops('la fermata Mestre stazione C6 viene anticipata', STOPS).map((s) => s.id)).toEqual(['100']);
    expect(mentionedStops('la fermata del Lido viene spostata', STOPS)).toEqual([]);
    expect(mentionedStops('Mestre stazione C6 aperta', STOPS)).toEqual([]); // nessuna fermata citata come tale
  });

  it('avviso in corso: senza termine, con date future o recente senza date', () => {
    const n = toNotice(parseRss(RSS)[0], STOPS, LINES);
    expect(n.openEnded).toBe(true);
    expect(n.stops[0].id).toBe('3409');
    expect(isCurrent(n, '2026-12-01')).toBe(true);
    expect(isCurrent({ ...n, openEnded: false, lastDate: '2026-10-11' }, '2026-10-14')).toBe(false);
    expect(isCurrent({ ...n, openEnded: false, lastDate: null, publishedAt: '2026-10-09T10:00:00.000Z' }, '2026-10-14')).toBe(true);
    expect(isCurrent({ ...n, openEnded: false, lastDate: null, publishedAt: '2026-09-01T10:00:00.000Z' }, '2026-10-14')).toBe(false);
  });
});
