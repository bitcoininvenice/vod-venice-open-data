# Richieste di autorizzazione ai titolari dei dati

Bozze pronte da inviare dal titolare del progetto. Nessuna è stata inviata.

Regola del progetto: finché una richiesta è aperta, il dato non viene integrato oppure è solo mostrato nella mappa, senza ridistribuirlo (API, MCP, esportazioni).

| Fonte | Perché serve | Contatto |
|---|---|---|
| Anopticon (tramaci.org) | I Termini d'uso vietano l'accesso ai dati "con script o api di qualunque genere senza autorizzazione da parte dei gestori". Il fatto che la mappa sia consultabile gratuitamente non concede il diritto di copiarne i dati. | epto@tramaci.org (indicato nei Termini) |
| ACTV / AVM – GTFS-Realtime | **Risolto (14/10/2026):** il [catalogo dei dati ACTV](https://actv.avmspa.it/it/content/catalogo-dei-dati-metadati-e-banche-dati-actv) (art. 53 CAD) elenca i feed come «Open Data Real Time». La bozza resta come comunicazione di cortesia (uso, frequenza, attribuzione). | Canale open data / contatti istituzionali AVM S.p.A. |
| SkylineWebcams | Le immagini sono contenuti proprietari: oggi il progetto mostra solo un link alla pagina ufficiale. Per mostrare un'anteprima o un player serve l'embed ufficiale o un accordo. | Modulo contatti / programma partner di SkylineWebcams |
| Regione del Veneto / Azienda Zero – Pronto Soccorso | Il servizio regionale pubblica attese e pazienti in trattamento per codice colore ogni 15 minuti, ma senza API né licenza esplicita; le note legali coprono solo i dati a pubblicazione obbligatoria. | Area Sanità e Sociale della Regione / Azienda Zero |
| Capitaneria di Porto di Venezia – canali marittimi | Per il livello "Competenze sui canali" serve sapere con certezza quali canali sono di competenza della Capitaneria: il *Regolamento per il servizio marittimo e la sicurezza della navigazione nel porto di Venezia* (Ord. 175/2009 e modifiche) non è pubblicato in un formato consultabile, e la planimetria del Comune è un'immagine con avvertenze d'uso. | Capitaneria di Porto di Venezia – Ufficio relazioni con il pubblico (indirizzo nella pagina contatti di guardiacostiera.gov.it) |
| ATVO – orari delle linee | Nessun open data: la pagina obbligatoria «Catalogo dei dati, metadati e banche dati» della trasparenza ATVO è vuota. Le linee verso Piazzale Roma, Aeroporto e litorale non sono in VOD. | ATVO S.p.A. – servizio clienti / trasparenza |
| Regione del Veneto – treni regionali | Non esiste un GTFS aperto dei treni regionali del Veneto (Trenitalia pubblica GTFS aperti solo per altre regioni, es. Toscana CC BY). Senza orario aperto VOD non può simulare i treni. | Regione del Veneto – Direzione Mobilità e Trasporti |
| aisstream.io – navi AIS | I termini d'uso del servizio non sono pubblicati in modo consultabile. VOD mostra le navi nella mappa ma non le ridistribuisce (API pubblica limitata alla mappa, niente MCP né esportazioni). | Contatto indicato su aisstream.io |
| Alilaguna – GTFS | Il feed GTFS pubblicato da Alilaguna non dichiara una licenza. VOD lo usa citando la fonte; serve una conferma scritta dell'uso e dell'attribuzione. | Alilaguna S.p.A. – contatti aziendali |

---

## 1. Anopticon

**Oggetto:** Richiesta di autorizzazione all'uso dei dati Anopticon per Venezia – progetto VOD Venice Open Data

Buongiorno,

sono il responsabile di VOD – Venice Open Data (https://venice-open-data.vercel.app), una mappa web non commerciale che raccoglie dati aperti su Venezia (trasporti, maree, ambiente, patrimonio).

Tra i livelli della mappa c'è quello sulla videosorveglianza urbana, oggi basato su OpenStreetMap. Il vostro progetto Anopticon ha censito a Venezia un numero di impianti molto più ampio e vorremmo poterlo mostrare, citando chiaramente Anopticon come fonte con un collegamento alla vostra mappa.

I vostri Termini d'uso escludono l'accesso automatico ai dati senza autorizzazione, per questo vi chiediamo:
1. se possiamo riutilizzare posizione e tipologia delle telecamere di Venezia (senza fotografie né dati degli utenti);
2. con quale formato preferite fornirli (esportazione una tantum, file periodico o accesso dedicato) e con quale frequenza di aggiornamento;
3. con quale licenza e formula di attribuzione.

Rimuoveremo o aggiorneremo i dati su vostra richiesta in qualsiasi momento.

Grazie per l'attenzione,
[Nome e cognome] – [email] – [sito]

---

## 2. AVM S.p.A. – feed GTFS-Realtime ACTV

**Oggetto:** Licenza d'uso dei feed GTFS-Realtime ACTV (VehiclePositions e TripUpdates)

Buongiorno,

il progetto non commerciale VOD – Venice Open Data utilizza già i GTFS statici ACTV pubblicati come open data, con citazione della fonte. Il vostro catalogo dei dati elenca i feed GTFS-Realtime come «Open Data Real Time» e li utilizziamo citando ACTV come fonte. Vi scriviamo per trasparenza e per eventuali indicazioni: mostriamo le posizioni in tempo reale dei mezzi leggendo gli endpoint
`https://tpl.actv.it/nav/GTFSRT/vehiclePositions` e `https://tpl.actv.it/aut/GTFSRT/vehiclePositions`, e i ritardi stimati dagli endpoint `https://tpl.actv.it/nav/GTFSRT/tripUpdates` e `https://tpl.actv.it/aut/GTFSRT/tripUpdates`, con una lettura ogni 20 secondi dal nostro server (non dai browser degli utenti). I ritardi vengono mostrati per singolo mezzo e alle fermate, indicando che si tratta di stime ACTV, e in forma aggregata per linea nella sola situazione del momento (nessuno storico).

Vi chiediamo:
1. se preferite una licenza esplicita (es. CC BY 4.0, come per i GTFS statici) o una formula di attribuzione specifica;
2. eventuali limiti di frequenza o requisiti tecnici (chiave API, user agent).

Grazie,
[Nome e cognome] – [email] – [sito]

---

## 3. SkylineWebcams

**Oggetto:** Embed ufficiale delle webcam di Venezia – progetto VOD Venice Open Data

Buongiorno,

il progetto non commerciale VOD – Venice Open Data indica sulla mappa la posizione di alcune vostre webcam di Venezia, con un link alla pagina ufficiale di ciascuna. Vorremmo sapere se è possibile mostrare il vostro player o un'anteprima tramite un embed ufficiale, e a quali condizioni (attribuzione, formato, eventuali limiti).

Grazie,
[Nome e cognome] – [email] – [sito]

---

## 4. Regione del Veneto / Azienda Zero – situazione nei Pronto Soccorso

**Destinatari:** Regione del Veneto – Area Sanità e Sociale (portale salute.regione.veneto.it) e Azienda Zero

**Oggetto:** Riuso dei dati "Situazione nei Pronto Soccorso" per gli ospedali dell'AULSS 3 Serenissima

Buongiorno,

il progetto non commerciale VOD – Venice Open Data (mappa dei dati aperti di Venezia) vorrebbe mostrare, per gli ospedali dell'AULSS 3 Serenissima, il numero di persone in attesa e in trattamento per codice colore pubblicato dal servizio regionale "Situazione nei Pronto Soccorso" (https://salute.regione.veneto.it/servizi/situazione-nei-pronto-soccorso), aggiornato ogni 15 minuti.

Le note legali del portale consentono il riuso dei dati a pubblicazione obbligatoria con citazione della fonte, ma non è chiaro se questi dati rientrino nel caso, e il servizio non offre un'API documentata. Per questo non li leggiamo dalla pagina senza il vostro consenso.

Vi chiediamo:
1. se il riuso pubblico di questi dati è consentito e con quale licenza o formula di attribuzione;
2. se esiste un endpoint o un file (JSON, CSV) da cui leggerli, e con quale frequenza massima;
3. eventuali avvertenze da mostrare insieme al dato.

Il dato verrebbe mostrato con l'ora di aggiornamento, il link al servizio regionale e l'avvertenza che in caso di urgenza si chiama il 112/118 e che l'ordine di accesso dipende dalla gravità, non dall'arrivo.

Grazie,
[Nome e cognome] – [email] – [sito]

---

## 5. Capitaneria di Porto di Venezia – elenco dei canali marittimi

**Oggetto:** Richiesta del Regolamento portuale vigente e dell'elenco dei canali marittimi della laguna – progetto VOD Venice Open Data

Buongiorno,

sono il responsabile di VOD – Venice Open Data (https://venice-open-data.vercel.app), una mappa web non commerciale che raccoglie dati aperti su Venezia, tra cui la rete dei canali con i limiti di velocità tratti dagli atti ufficiali (Regolamento comunale per la circolazione acquea e Ordinanza 93/2007 del Provveditorato).

Vorremmo aggiungere un livello che mostri, canale per canale, l'autorità competente (Comune, Provveditorato alle OO.PP., Capitaneria di Porto), così che chi naviga sappia quali regole si applicano. Per la parte di vostra competenza non vogliamo procedere per ipotesi, e vi chiediamo:
1. il testo vigente del *Regolamento per il servizio marittimo e la sicurezza della navigazione nel porto di Venezia* (Ordinanza n. 175/2009 e successive modifiche), oppure l'indicazione di dove è pubblicato;
2. l'elenco dei canali marittimi lagunari di vostra competenza con i relativi confini (dove iniziano e finiscono), se disponibile anche in formato cartografico;
3. i limiti di velocità vigenti in tali canali, se non già contenuti nel Regolamento.

Nel livello citeremo la Capitaneria di Porto come fonte con il riferimento all'atto, e indicheremo che fanno fede gli atti ufficiali. Aggiorneremo o rimuoveremo i dati su vostra indicazione.

Grazie per l'attenzione,
[Nome e cognome] – [email] – [sito]

---

## 6. ATVO – orari in formato aperto (GTFS)

**Oggetto:** Pubblicazione degli orari ATVO in formato aperto (GTFS) – progetto VOD Venice Open Data

Buongiorno,

sono il responsabile di VOD – Venice Open Data (https://venice-open-data.vercel.app), una mappa web senza fini di lucro che mostra i trasporti pubblici di Venezia a partire dai dati aperti di ACTV e Alilaguna.

Vorremmo includere anche le linee ATVO che collegano Venezia (Piazzale Roma, Aeroporto Marco Polo, litorale), ma non abbiamo trovato i vostri orari in un formato aperto: la sezione «Accessibilità e Catalogo dei Dati, Metadati e Banche Dati» della vostra trasparenza risulta vuota.

Vi chiediamo se potete pubblicare gli orari in formato GTFS, come ACTV, con una licenza aperta (ad esempio CC BY 4.0), oppure indicarci dove sono già disponibili (ad esempio nel Punto di Accesso Nazionale, nap.mit.gov.it). Citeremo ATVO come fonte e mostreremo che le posizioni sono stimate dall'orario.

Grazie per l'attenzione,
[Nome e cognome] – [email] – [sito]

---

## 7. Regione del Veneto – orari aperti dei treni regionali

**Oggetto:** Disponibilità degli orari dei treni regionali del Veneto in formato aperto (GTFS)

Buongiorno,

VOD – Venice Open Data (https://venice-open-data.vercel.app) è una mappa web senza fini di lucro sui trasporti e i dati aperti di Venezia. Per mostrare i treni regionali tra Mestre e Venezia Santa Lucia servirebbe l'orario in un formato aperto: Trenitalia pubblica GTFS con licenza aperta per altre regioni (ad esempio la Toscana, CC BY), ma non abbiamo trovato un dataset per il Veneto.

Vi chiediamo se l'orario del servizio ferroviario regionale previsto dal contratto di servizio è disponibile, o può esserlo, in formato GTFS con licenza aperta, ad esempio su dati.veneto.it o nel Punto di Accesso Nazionale.

Grazie,
[Nome e cognome] – [email] – [sito]

---

## 8. aisstream.io – termini d'uso dei dati AIS

**Subject:** Terms of use for displaying AIS data – VOD Venice Open Data

Hello,

VOD – Venice Open Data (https://venice-open-data.vercel.app) is a non-profit web map about Venice. We use the aisstream.io API (one server-side connection, cached) to show ships in the Venice lagoon on our map, crediting aisstream.io. We do not resell or redistribute the data.

Could you point us to your current terms of use, and confirm that this kind of public, non-commercial display with attribution is allowed?

Thank you,
[Name] – [email] – [website]

---

## 9. Alilaguna – uso del GTFS

**Oggetto:** Uso del vostro GTFS nella mappa VOD – Venice Open Data

Buongiorno,

VOD – Venice Open Data (https://venice-open-data.vercel.app) è una mappa web senza fini di lucro su Venezia. Usiamo il GTFS che pubblicate (https://www.alilaguna.it/attuale/alilaguna.zip) per mostrare linee, fermate e posizione stimata delle barche dall'orario, citando Alilaguna come fonte e indicando la stagionalità delle linee come sul vostro sito.

Il feed non indica una licenza: vi chiediamo di confermare che questo uso è consentito e quale formula di attribuzione preferite.

Grazie,
[Nome e cognome] – [email] – [sito]

