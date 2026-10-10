# Richieste di autorizzazione ai titolari dei dati

Bozze pronte da inviare dal titolare del progetto. Nessuna è stata inviata.

| Fonte | Perché serve | Contatto |
|---|---|---|
| Anopticon (tramaci.org) | I Termini d'uso vietano l'accesso ai dati "con script o api di qualunque genere senza autorizzazione da parte dei gestori". Il fatto che la mappa sia consultabile gratuitamente non concede il diritto di copiarne i dati. | epto@tramaci.org (indicato nei Termini) |
| ACTV / AVM – GTFS-Realtime | L'endpoint `tpl.actv.it/.../GTFSRT` è pubblico ma non è documentato come open data né accompagnato da una licenza (a differenza dei GTFS statici, CC BY). | Canale open data / contatti istituzionali AVM S.p.A. |
| SkylineWebcams | Le immagini sono contenuti proprietari: oggi il progetto mostra solo un link alla pagina ufficiale. Per mostrare un'anteprima o un player serve l'embed ufficiale o un accordo. | Modulo contatti / programma partner di SkylineWebcams |
| Regione del Veneto / Azienda Zero – Pronto Soccorso | Il servizio regionale pubblica attese e pazienti in trattamento per codice colore ogni 15 minuti, ma senza API né licenza esplicita; le note legali coprono solo i dati a pubblicazione obbligatoria. | Area Sanità e Sociale della Regione / Azienda Zero |

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

il progetto non commerciale VOD – Venice Open Data utilizza già i GTFS statici ACTV pubblicati come open data, con citazione della fonte. Vorremmo mostrare anche le posizioni in tempo reale dei mezzi leggendo gli endpoint
`https://tpl.actv.it/nav/GTFSRT/vehiclePositions` e `https://tpl.actv.it/aut/GTFSRT/vehiclePositions`, e i ritardi stimati dagli endpoint `https://tpl.actv.it/nav/GTFSRT/tripUpdates` e `https://tpl.actv.it/aut/GTFSRT/tripUpdates`, con una lettura ogni 20 secondi dal nostro server (non dai browser degli utenti). I ritardi vengono mostrati per singolo mezzo e alle fermate, indicando che si tratta di stime ACTV; non pubblichiamo statistiche aggregate di puntualità senza il vostro consenso.

Vi chiediamo di confermare:
1. se l'uso pubblico di questi dati è consentito e con quale licenza;
2. eventuali limiti di frequenza o requisiti tecnici (chiave API, user agent);
3. la formula di attribuzione da riportare.

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
