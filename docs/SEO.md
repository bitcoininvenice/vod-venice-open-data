# SEO di VOD – audit e piano (ottobre 2026)

Audit del sito https://venice-open-data.vercel.app del 20/10/2026, modifiche già fatte nel codice e piano per i prossimi 90 giorni.
Nessun volume di ricerca è stimato a occhio: le priorità delle parole chiave sono qualitative e vanno confermate con Search Console e Google Keyword Planner dopo le prime settimane di dati.

## 1. Cosa c'era già (e funzionava)

Diverse ipotesi di partenza non erano più vere: il sito era già in buono stato tecnico.

| Elemento | Stato trovato |
|---|---|
| `lang` | già `it` (non `en`); la lingua dell'interfaccia cambia solo lato client |
| robots.txt | corretto: tutto indicizzabile tranne `/api/`, sitemap dichiarata |
| sitemap.xml | presente, 7 pagine |
| Canonical | presente su ogni pagina |
| Open Graph / Twitter | titolo, descrizione e immagine OG generata (`opengraph-image.tsx`) |
| Dati strutturati | `WebSite` + `WebApplication` in home, `DataCatalog`/`Dataset` su `/layers` (Google Dataset Search) |
| Status code | 200 sulle pagine, 404 vera per gli indirizzi inesistenti, nessuna catena di redirect |
| Sicurezza/HTTPS | HSTS preload, CSP rigida, nessun cookie |
| llms.txt | presente, generato dal catalogo |

## 2. Problemi trovati, per priorità

### Critical
1. **La home espone circa 100 parole indicizzabili.** È una mappa canvas a tutto schermo: il testo nell'HTML è fatto di etichette dell'interfaccia («Livelli 0 attivi», «ORA LIVE»…). L'H1 era solo «Venice Open Data». Google non ha nulla per posizionarla su «marea Venezia», «vaporetti tempo reale» ecc.
2. **Nessuna pagina di contenuto.** Tutto il traffico informativo (marea oggi, come arrivare a…, orari, FAQ) non aveva una pagina di destinazione. Era il limite principale, più di qualunque dettaglio tecnico.
3. **Nessuna versione inglese indicizzabile.** L'inglese esiste solo come preferenza nel browser sullo stesso URL: Google vede sempre l'italiano, quindi niente hreflang e niente traffico internazionale.

### High
4. **Dominio `*.vercel.app`.** Funziona, ma è un sottodominio condiviso: i link guadagnati restano legati a Vercel e la credibilità percepita è più bassa. Un dominio proprio (es. `veniceopendata.it`) va preso prima di fare link building (vedi §7).
5. **JavaScript pesante su ogni pagina.** Il dizionario delle traduzioni IT+EN della mappa (~115 KB gzip) veniva scaricato anche dalle pagine che non lo usano. Home: ~800 KB gzip di JS (mappa, simulazione): accettabile per un'app, ma da tenere d'occhio in INP.
6. **Zoom bloccato** (`maximum-scale=1`): penalizza l'accessibilità (audit Lighthouse) senza benefici, perché la mappa gestisce già i gesti da sé (`touch-action: none`).
7. **Search Console / Bing non verificabili dal codice**: nessun meccanismo per il meta di verifica.

### Medium
8. `Organization` assente nei dati strutturati (serve per il pannello del marchio ed E-E-A-T).
9. Sitemap senza alternative di lingua e con priorità piatte.
10. `category: technology` nei metadati invece di travel.
11. Piccolo difetto nelle risposte del planner: «ATVO ATVO 35», «FlixBus FlixBus 466» (nome dell'operatore ripetuto).

## 3. Modifiche implementate

Tutte verificate con build di produzione, typecheck, lint, test unitari ed e2e.

**Pagine nuove (server-rendered, testo completo nell'HTML, IT + EN con hreflang):**

| Pagina IT | Pagina EN | Contenuto |
|---|---|---|
| `/guide` | `/en/guides` | hub «Come muoversi a Venezia», link a tutto |
| `/marea-venezia` | `/en/venice-tide` | livello live a Punta della Salute, previsione dei prossimi estremi con sirene, tabella soglie con % di suolo allagato, altre stazioni; rigenerata ogni minuto; `Dataset` schema |
| `/vaporetti-tempo-reale` | `/en/vaporetto-live` | come funziona il tempo reale, tutte le linee di navigazione dal GTFS con colori e capolinea, biglietti |
| `/come-arrivare` | `/en/getting-to` | elenco luoghi |
| `/come-arrivare/<luogo>` ×12 | `/en/getting-to/<place>` ×12 | San Marco, Rialto, Santa Lucia, Piazzale Roma, aeroporto, Tronchetto, Lido, Murano, Burano, Torcello, Accademia, Biennale |
| `/faq` | `/en/faq` | 11 domande, `FAQPage` schema |
| `/glossario` | `/en/glossary` | 19 termini, `DefinedTermSet` schema |
| `/embed/marea`, `/embed/tide` | | riquadro incorporabile (noindex), asset per link building |

I percorsi delle pagine «Come arrivare» **non sono scritti a mano**: li calcola il planner di VOD sull'orario ufficiale ACTV/Alilaguna e sulla rete pedonale OSM, per il prossimo giorno feriale alle 10:00, e si rigenerano ogni giorno. Le linee sono quelle che il GTFS fa fermare ai pontili vicini. Tariffe, soglie e percentuali di allagamento vengono dalle stesse funzioni della mappa (`fares.ts`, `flood.ts`): pagina e mappa non possono divergere.

**Tecniche:**
- Home: H1 «Venice Open Data – mappa interattiva di Venezia» (parte descrittiva per lettori di schermo e crawler), paragrafo introduttivo accessibile, link «Guide» visibile nell'attribuzione della mappa.
- `LanguageProvider` spostato nel route group `src/app/(mappa)`: le guide scaricano 180 KB gzip di JS invece di 319 (−44%); la 404 carica le traduzioni solo quando serve. URL invariati.
- `viewport`: tolto `maximumScale`.
- JSON-LD: `Organization` con logo e `sameAs` (repository), `WebSite.publisher`, `BreadcrumbList` su ogni guida, `TouristAttraction`/`Airport` per i luoghi.
- `verification`: variabili `GOOGLE_SITE_VERIFICATION` e `BING_SITE_VERIFICATION`.
- Sitemap: 7 pagine + 36 guide con `xhtml:link` alternate it/en/x-default.
- Titoli delle guide con suffisso breve «| VOD» per non essere troncati.
- `next.config.ts`: `/embed/*` è l'unica rotta incorniciabile (`frame-ancestors *`), il resto resta `DENY`.
- `llms.txt`: aggiunte guide e marea.
- Planner: corretto «ATVO ATVO 35».

## 4. Parole chiave e cluster

Priorità: **A** = pagina dedicata già pronta, **B** = coperta in parte, **C** = da coprire con nuovi contenuti.

| Cluster | Esempi IT | Esempi EN | Intento | Pagina | Priorità |
|---|---|---|---|---|---|
| Marea live | marea Venezia oggi, acqua alta Venezia oggi, livello marea Venezia, marea Punta della Salute, previsione marea Venezia | Venice tide today, acqua alta today, Venice high water forecast, Venice tide level | informativo, ricorrente | `/marea-venezia` | A |
| Soglie e fenomeno | a quanti cm acqua alta, sirene acqua alta significato, quando si alza il MOSE | what do Venice flood sirens mean, when is MOSE raised | informativo | `/marea-venezia#soglie`, `/faq` | A |
| Vaporetti live | vaporetti tempo reale, mappa vaporetti, ritardi ACTV, tracker vaporetti | Venice vaporetto map live, ACTV waterbus tracker | navigazionale | `/vaporetti-tempo-reale` | A |
| Linee e biglietti | linee vaporetto Venezia, linea 1 vaporetto, quanto costa il vaporetto | vaporetto lines, Venice waterbus ticket price | informativo/transazionale | `/vaporetti-tempo-reale` | A |
| Come arrivare | come arrivare a San Marco dalla stazione, da Piazzale Roma a Rialto, come arrivare a Burano, vaporetto per Murano | how to get to Burano, Santa Lucia to St Mark's, vaporetto to Murano | transazionale (locale) | `/come-arrivare/*` | A |
| Aeroporto | aeroporto Venezia centro, Alilaguna orari, bus aeroporto Piazzale Roma | Marco Polo airport to Venice, Alilaguna | transazionale | `/come-arrivare/aeroporto-marco-polo` | A |
| Open data | open data Venezia, dati aperti Comune di Venezia, GTFS ACTV | Venice open data, ACTV GTFS | informativo, B2B | `/layers`, `/mcp` | B |
| Mappa | mappa interattiva Venezia, mappa Venezia sestieri, numeri civici Venezia | interactive map of Venice, Venice house numbers | navigazionale | `/` | B |
| Long tail stagionali | Redentore, Regata Storica, Biennale come arrivare, Mostra del Cinema Lido vaporetto | | stagionale | da creare | C |

## 5. Piano editoriale (prossimi 15 contenuti)

Ogni contenuto deve usare dati verificabili (fonte e data) e terminare con un invito alla mappa già configurata.

1. **Pagina «Numeri civici di Venezia»** (`/civici-venezia`): come funziona la numerazione per sestiere, ricerca integrata (esiste già l'API `/api/civici`). Alta domanda, pochi concorrenti utili.
2. **Sestieri** (`/sestieri/<nome>` ×6): confini, pontili, residenti ISTAT 2021 (dato già in pipeline), luoghi principali.
3. **Linee vaporetto** (`/vaporetti/linea-<n>`): fermate in ordine dal GTFS, frequenza da orario, mappa del percorso.
4. **Fermate principali** (`/fermate/<pontile>`): linee e prossime partenze (dato già calcolato da `/api/partenze`).
5. **Acqua alta: percorsi asciutti** (`/acqua-alta/percorsi`): passerelle del piano comunale per livello.
6. **MOSE** (`/mose`): cos'è, bocche di porto, quando si alza, misure mare/laguna dalle stazioni.
7. **Archivio maree** (`/marea-venezia/storico`): massimi storici dal dataset del Centro Maree.
8. **Dall'aeroporto al Lido / a Murano**: estendere i luoghi (Giudecca, San Michele, Mazzorbo, Chioggia, Mestre stazione).
9. **Eventi stagionali**: Redentore (luglio), Regata Storica (settembre), Biennale, Mostra del Cinema: come arrivare e variazioni ACTV (dagli avvisi ACTV già letti da `/api/avvisi-actv`).
10. **Venezia accessibile**: percorsi senza ponti, dati di altimetria già presenti (`accessibilityAltimetry`).
11. **Fontanelle e acqua potabile** (dati Venice Tap Water / OSM già nel progetto).
12. **Guida agli open data di Venezia per sviluppatori**: portali, licenze, API VOD e MCP.
13. **Qualità dell'aria e pollini a Venezia oggi** (ARPAV/Open-Meteo già integrati).
14. **Approfondimenti mensili** («Venezia in numeri – ottobre 2026»): metriche da `/metrics`, contenuto citabile dai giornalisti.
15. **Glossario esteso** con una pagina per i termini più cercati (acqua alta, ZMPS, bricole, sestiere).

Struttura URL: italiano senza prefisso, inglese sotto `/en/` con slug inglesi; ogni nuova pagina va aggiunta a `GUIDE_PATHS` (o a una lista simile) così compare in sitemap e hreflang automaticamente.

## 6. SEO locale e internazionale

- **Google Business Profile**: non applicabile (VOD non è un'attività con sede o clienti in presenza); il «locale» passa da contenuti per luogo, toponimi esatti e dati strutturati `Place`/`TouristAttraction`.
- **hreflang**: implementato sulle guide (it, en, x-default → it). La mappa resta su un solo URL con la lingua scelta nel browser: corretto, perché l'interfaccia non è contenuto indicizzabile.
- **Toponimi**: usare sempre i nomi ufficiali dei pontili ACTV (come nel GTFS) accanto a quelli comuni (es. «Ferrovia» e «Stazione Santa Lucia»): è così che le persone cercano.
- **Segnali di fiducia**: ogni guida chiude con le fonti (Comune di Venezia – Centro Maree, ACTV/AVM, Alilaguna, OpenStreetMap) prese dal registro `PROVIDERS`. Aggiungere una pagina «Chi siamo / metodo» con autore e contatto rafforzerebbe E-E-A-T.
- **Wikidata/OpenStreetMap**: proporre VOD come «sito web» correlato nelle voci Wikidata pertinenti solo se la comunità lo accetta; non inserire link promozionali in OSM.

## 7. Link building e off-page

Asset già pronti da proporre:
- **Riquadro della marea incorporabile** (`/embed/marea`, codice copiabile da `/marea-venezia#incorpora`): ideale per hotel, B&B, guide turistiche, blog veneziani, scuole. Ogni incorporamento porta un link alla pagina della marea.
- **API e server MCP pubblici** (`/mcp`, `/llms.txt`): da segnalare nelle liste di open data e strumenti AI.
- **Catalogo dei dataset** con schema `Dataset`: candidato a Google Dataset Search.

Destinatari concreti:
- **Università**: Ca' Foscari (corsi di informatica e geografia), IUAV (urbanistica, ha laboratori GIS), WPI Venice Project Center (lavora su dati di Venezia da decenni). Proposta: VOD come strumento didattico o come vetrina dei loro dataset.
- **Comunità open data**: OnData, Open Data Sicilia/Italia, lista dataset di dati.gov.it (segnalazione di riuso dei dati del Comune), awesome-lists su GitHub (open transit data, GTFS, Italy).
- **Comune di Venezia e AVM**: le pagine «riuso dei dati» dei portali open data citano spesso le applicazioni che li usano: chiedere l'inserimento.
- **Stampa locale e blog**: Venezia Today, Il Gazzettino (sezione Venezia), blog di residenti e associazioni (es. comitati sull'acqua alta): proporre la pagina marea e la tabella delle soglie come riferimento durante gli episodi di acqua alta (picchi di ricerca enormi e prevedibili da ottobre a dicembre).
- **Siti turistici**: guide di viaggio indipendenti e forum (TripAdvisor forum Venezia, Reddit r/Venice, r/italy) solo con risposte utili, mai spam.
- **Community tecniche**: OpenStreetMap Italia (forum e newsletter), MobilityData (vetrina GTFS), Hacker News «Show HN» per l'MCP.

**Prima di tutto questo: dominio proprio.** Ogni link ottenuto su `vercel.app` va poi recuperato con redirect 301; meglio partire già sul dominio definitivo.

## 8. Piano 30/60/90 giorni

**Giorni 1–30 (fondamenta)**
- Pubblicare queste modifiche; verificare in Search Console (variabile `GOOGLE_SITE_VERIFICATION`) e Bing Webmaster (`BING_SITE_VERIFICATION`); inviare la sitemap.
- Registrare e collegare il dominio proprio; impostare `NEXT_PUBLIC_SITE_URL`; redirect 301 da `vercel.app`.
- Controllare in Search Console: copertura delle 43 URL, hreflang senza errori, rich result `FAQPage`/`Breadcrumb`/`Dataset` (test dei risultati multimediali).
- PageSpeed Insights su home, `/marea-venezia`, una pagina «come arrivare», da mobile.
- Proporre il riquadro marea a 10–20 siti veneziani prima della stagione dell'acqua alta (novembre).

**Giorni 31–60 (contenuti)**
- Contenuti 1–5 del piano editoriale (civici, sestieri, linee, fermate, percorsi asciutti), IT+EN.
- Pagina «Chi siamo / metodo».
- Outreach a università e comunità open data.
- Prima analisi query reali in Search Console: aggiustare titoli/descrizioni delle pagine con CTR basso (impressioni alte, clic bassi).

**Giorni 61–90 (scala e autorevolezza)**
- Contenuti 6–10; primo «Venezia in numeri» mensile.
- Pagine per linea e per fermata generate dal GTFS (decine di URL long tail, tutte con dati veri).
- Misurare i link ottenuti dal riquadro; contattare la stampa locale durante il primo episodio di acqua alta con la pagina e la tabella delle soglie.
- Rivedere il peso JS della home (code splitting dei livelli più rari) se INP mobile > 200 ms.

## 9. Metriche da seguire

| Metrica | Strumento | Obiettivo a 90 giorni |
|---|---|---|
| URL indicizzate / inviate | Search Console › Pagine | tutte le 43 della sitemap |
| Impressioni e clic per cluster (marea, vaporetti, come arrivare, open data) | Search Console › Risultati di ricerca, filtro per pagina | crescita mese su mese; prima base reale dopo 4 settimane |
| Posizione media delle query principali | Search Console | «marea Venezia oggi», «vaporetti tempo reale», «come arrivare a Burano» in prima pagina |
| CTR per pagina | Search Console | sopra la media del sito per le guide; rivedere titoli sotto il 2% con molte impressioni |
| Core Web Vitals (LCP < 2,5 s, INP < 200 ms, CLS < 0,1) | Search Console › CWV, PageSpeed Insights (dati CrUX) | «buono» su mobile per le guide; home almeno «da migliorare» → «buono» su LCP |
| Errori hreflang e dati strutturati | Search Console › Miglioramenti | zero |
| Domini che linkano / incorporamenti del riquadro | Search Console › Link, referrer in Vercel Analytics | primi 10–20 domini |
| Uso: visite alle guide → apertura della mappa | Vercel Analytics (pagine e referrer) | quota di visite che passa dalla guida alla mappa |

## 10. Cosa resta da fare a mano (non si può fare dal codice)

1. Verificare la proprietà in Search Console e Bing (impostare le due variabili su Vercel e ripubblicare).
2. Inviare la sitemap e controllare il rapporto hreflang dopo l'indicizzazione.
3. Scegliere e collegare un dominio proprio.
4. Misurare i Core Web Vitals reali con PageSpeed Insights da mobile (i dati di campo arrivano dopo qualche settimana di traffico).
5. Outreach (§7).
