import { describe, expect, it } from 'vitest';
import {
  italianDate,
  isCityOrIslands,
  mayContainPersonalData,
  matchCanal,
  matchPlace,
  ordinanceKind,
  ordinanceStatus,
  parseOrdinanceDetail,
  parseOrdinanceList,
  parseOrdinancePoints,
} from './comuneOrdinances';

describe('ordinanze del Comune: parser', () => {
  it('legge l\'elenco e rifiuta una risposta non valida', () => {
    const raw = { status: 'success', data: { elencoOrdinanze: [{ idPratica: '1', dataRepertorio: '07/10/2026', numeroRepertorio: '700', titolo: 'Cantiere', ambito: 'Traffico acqueo', luogo: 'Venezia Città Storica' }, { idPratica: '', titolo: '' }] } };
    expect(parseOrdinanceList(raw)).toHaveLength(1);
    expect(() => parseOrdinanceList({ status: 'error' })).toThrow();
  });

  it('date italiane e luoghi di terraferma', () => {
    expect(italianDate('29/05/2025')).toBe('2025-05-29');
    expect(italianDate('2025-05-29')).toBeNull();
    expect(isCityOrIslands({ luogo: 'Mestre - Carpenedo' })).toBe(false);
    expect(isCityOrIslands({ luogo: 'Lido - Pellestrina' })).toBe(true);
  });

  it('validità e allegato dalla pagina dell\'atto; null se la pagina non è quella attesa', () => {
    const html = `<h2>Dettagli ordinanza</h2><dt>Data Inizio Validit&agrave;</dt>\n<dd>08/10/2026</dd><dt>Data Fine Validità</dt><dd>31/10/2026</dd>
      <a href="#" class="download-link" data-id="98765">PDF</a>`;
    expect(parseOrdinanceDetail(html)).toEqual({ validFrom: '2026-10-08', validTo: '2026-10-31', attachmentId: '98765' });
    expect(parseOrdinanceDetail('<html>verifica</html>')).toBeNull();
  });

  it('punti della mappa del Comune, anche con blocchi non validi', () => {
    const html = `var polygonsData = [{"title":"A","coords":[12.33,45.43],"id":"11"}];\n// var polygonsData = [oops];`;
    expect(parseOrdinancePoints(html).get('11')).toEqual([12.33, 45.43]);
  });
});

describe('ordinanze del Comune: tipo, stato e luoghi', () => {
  it('tipo dal titolo', () => {
    expect(ordinanceKind('Interdizione transito ponte Santa Caterina')).toBe('closure');
    expect(ordinanceKind('Manifestazione "A Spasso in Canalasso"')).toBe('event');
    expect(ordinanceKind('Cantiere per il restauro di Fondamenta del Soccorso')).toBe('works');
    expect(ordinanceKind('Disciplina della sosta')).toBe('other');
  });

  it('stato rispetto a oggi', () => {
    const today = '2026-10-14';
    expect(ordinanceStatus('2026-10-01', '2026-10-31', '2026-09-30', today)).toBe('active');
    expect(ordinanceStatus('2026-10-18', null, '2026-10-10', today)).toBe('upcoming');
    expect(ordinanceStatus('2026-11-30', null, '2026-10-10', today)).toBeNull();
    expect(ordinanceStatus('2026-09-01', '2026-10-13', '2026-08-30', today)).toBeNull();
    expect(ordinanceStatus(null, null, '2026-10-01', today)).toBe('unverified');
    expect(ordinanceStatus(null, null, '2026-08-01', today)).toBeNull();
  });

  it('canale citato nel titolo: il nome più lungo, solo rii e canali', () => {
    const names = ['Canal Grande', 'Rio dei Carmini', 'Rio de San Barnaba', 'Calle Larga', 'Rio'];
    expect(matchCanal('Restauro della Fondamenta su Rio dei Carmini - di Santa Margherita', names)).toBe('Rio dei Carmini');
    expect(matchCanal('Regata in Canal Grande', names)).toBe('Canal Grande');
    expect(matchCanal('Lavori in Calle Larga', names)).toBeNull();
  });

  it('luogo citato nel titolo: abbreviazioni, grafie e nomi ambigui', () => {
    const toponyms: Record<string, [number, number][]> = {
      'Fondamenta del Socorso': [[12.3245, 45.4335]],
      'Ponte Santa Maria Maggiore': [[12.3175, 45.4365]],
      'Calle del Forno': [[12.33, 45.43], [12.35, 45.44]],
      'Ponte Santa Caterina': [[12.337, 45.443]],
      'Via Alberoni': [[12.3285, 45.3572]],
    };
    expect(matchPlace('Divieto di transito in F.ta del Soccorso', 'Venezia Città Storica', toponyms)?.name).toBe('Fondamenta del Socorso');
    expect(matchPlace('Interdizione del ponte S. Maria Maggiore', 'Venezia Città Storica', toponyms)?.point).toEqual([12.3175, 45.4365]);
    // omonimi in più punti della città: nessuna posizione
    expect(matchPlace('Lavori in Calle del Forno', 'Venezia Città Storica', toponyms)).toBeNull();
    // il ponte omonimo è in città, l'atto riguarda Mazzorbo: nessuna posizione
    expect(matchPlace('Interdizione ponte Santa Caterina Mazzorbo', 'Burano', toponyms)).toBeNull();
    expect(matchPlace('Senso unico in via Alberoni', 'Lido - Pellestrina', toponyms)?.name).toBe('Via Alberoni');
  });
});

describe('ordinanze e dati personali', () => {
  it('esclude i titoli che possono riguardare persone', () => {
    expect(mayContainPersonalData('Ordinanza di sgombero a carico del sig. Mario Rossi')).toBe(true);
    expect(mayContainPersonalData('Trattamento sanitario obbligatorio')).toBe(true);
    expect(mayContainPersonalData('Cantiere per il restauro di Fondamenta del Soccorso')).toBe(false);
    expect(mayContainPersonalData('Manifestazione "A Spasso in Canalasso"')).toBe(false);
  });
});
