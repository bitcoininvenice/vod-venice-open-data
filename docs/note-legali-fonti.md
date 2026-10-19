# Note legali: fonti, licenze, privacy e sicurezza

Revisione del 19/10/2026. Obiettivo: nessun dato usato fuori dalla sua licenza, attribuzioni sempre visibili,
nessun dato personale ripubblicato senza necessità. Regola generale: **nel dubbio il dato non si integra,
oppure si mostra solo nella mappa senza ridistribuirlo** (API pubbliche, server MCP, esportazioni), finché il
titolare non conferma (bozze in [richieste-autorizzazione.md](richieste-autorizzazione.md)).

## Stato per fonte

| Fonte | Licenza / termini | Attribuzione in VOD | Ridistribuzione (API, MCP, export) | Stato |
|---|---|---|---|---|
| Comune di Venezia – dati.venezia.it (opere pubbliche, Wi-Fi) | CC BY | scheda, /sources, catalogo | sì | ok |
| Centro Maree CPSM (marea, meteo) | scheda dataset CC BY; pagina Open Data del Comune CC BY-SA 3.0 | /sources con nota; meta API con licenza e attribuzione | sì, **sotto CC BY-SA 3.0** | ok (scelta prudente) |
| Comune – ordinanze | atti pubblici | scheda con link all'atto, "fa fede l'atto" | sì | ok; esclusi i titoli con possibili dati personali |
| ACTV GTFS statico | CC BY (open data ACTV) | /sources, schede | sì | ok |
| ACTV GTFS-Realtime | «Open Data Real Time» nel catalogo dati ACTV (art. 53 CAD); senza licenza esplicita: open by default (art. 52 CAD) | /sources, schede | sì, citando ACTV | ok (comunicazione di cortesia ad AVM in bozza) |
| ACTV avvisi (RSS) | contenuti ACTV pubblici | titolo, testo breve e link all'avviso | sì, con link | ok |
| Tariffe ACTV e Alilaguna (pagine «Prezzi in vigore» e «Tariffe») | informazioni pubbliche; i GTFS non contengono le tariffe | costo «stimato» con data della verifica e link alle due pagine | sì, solo i prezzi usati nel calcolo | ok; da ricontrollare a ogni cambio di tariffa (`web/src/lib/fares.ts`, `FARES_CHECKED_AT`) |
| Alilaguna GTFS | nessuna licenza dichiarata nel feed | scheda, /sources | sì | **conferma in bozza** (richiesta 9) |
| FlixBus GTFS (FlixMobility) | ODbL 1.0 | scheda "© FlixMobility · ODbL", /sources | sì, sotto ODbL | ok |
| OpenStreetMap (base cartografica e livelli) | ODbL 1.0 | **attribuzione fissa sulla mappa** + schede | sì, sotto ODbL | ok |
| ARPAV (qualità aria, pollini, sonde laguna, balneazione, RIR Seveso III, Osservatorio Rifiuti), ISTAT, Camera di Commercio, AgID, AGCOM | CC BY 4.0 | schede, /sources, /metrics | sì | ok |
| Inside Airbnb (`insideairbnb.com`, snapshot Venezia) | CC BY 4.0 | scheda «Inside Airbnb (CC BY 4.0)», /sources, catalogo | sì: aggregati per zona e griglia 100 m e punti dei singoli annunci con la posizione già spostata da Airbnb fino a 150 m, **solo nelle celle con almeno 3 annunci**; nessun id, host, titolo, link o codice CIN; nessun giudizio sul singolo annuncio | ok |
| Comune di Venezia – GeoIDS (strutture ricettive, imposta di soggiorno) | nessuna licenza espressa: art. 52 c. 2 CAD (dati aperti, citando la fonte); esportazione CSV prevista dal manuale del servizio, fatta a mano | scheda «Comune di Venezia – GeoIDS», /sources, catalogo | sì: attività d'impresa come punti (nome, categoria, stanze, letti; ragione sociale solo se società o ente); locazioni turistiche e complementari **solo aggregate** (celle 100 m, zone); mai contatti né nomi di privati; CSV originali fuori dal repository | ok |
| Ministero del Turismo – BDSR «in numeri» | nessuna licenza dichiarata: art. 52 c. 2 CAD; CSV di soli conteggi scaricato a mano | /metrics, /sources | sì, conteggi per comune e categoria; CSV e PDF originali fuori dal repository | ok |
| BusOne (`proxy.busone.app`): orari Trenitalia (NeTEx del Punto di Accesso Nazionale) e Italo, tempo reale Trenitalia, Italo, Busitalia Veneto | gratuito per privati ed enti senza scopo di lucro, uso non commerciale, citando BusOne e la fonte originale (feed Italo libero anche per uso commerciale); conferma dell'uso ricevuta dal titolare di VOD (19/10/2026) | schede, tabellone, /sources | orario dei treni sì (mappa, planner, tabellone); tempo reale **solo mappa e tabellone**, non nel server MCP né nelle esportazioni | ok |
| ATVO (PDF orari 35 e 35B) e Dolomiti Bus (PDF linea 72) | nessuna licenza dichiarata; orario pubblico citato con link al PDF | scheda, /sources | sì, solo partenze e arrivi letti dai PDF, con link | ok; linea ATVO 10A non importata |
| Mapillary (foto a livello strada) | immagini CC BY-SA 4.0; API con chiave del progetto | scheda «© Mapillary e gli autori», link alla foto | solo le posizioni, per riquadri; le immagini si aprono su Mapillary | ok |
| BDAP (MEF) | CC BY | scheda, /sources | sì | ok |
| MIMIT – prezzi dei carburanti (CSV quotidiani «prezzo alle 8» e anagrafica) | IODL 2.0 | scheda «Fonte: Ministero delle Imprese e del Made in Italy · IODL 2.0», /sources | sì, senza il nome del gestore né dell'impianto | ok. Il firewall del Ministero rifiuta i data center: il file si scarica ogni mattina da un Mac del progetto con lo User-Agent di VOD (`pipeline/fuel_auto/`), senza aggirare filtri; nessuna richiesta dal browser dei visitatori |
| Open-Meteo (vento, mare) | CC BY 4.0; API gratuita solo per uso non commerciale, entro i limiti di chiamate | schede "Open-Meteo (CC BY 4.0)" | sì | ok finché VOD resta senza fini di lucro |
| Copernicus CAMS (aria, pollini) via Open-Meteo | licenza Copernicus | formula "Generato usando informazioni del Copernicus Atmosphere Monitoring Service…" nelle schede | sì | ok |
| NOAA METAR | pubblico dominio | /sources | sì | ok |
| OpenSky Network (voli) | solo ricerca/educazione non commerciale; citazione dell'articolo OpenSky | scheda con citazione e link | **no**: tolto dal server MCP; API usata solo dalla mappa, con nota "non ridistribuire" | ok (prudente) |
| aisstream.io (navi AIS) | termini non pubblicati in modo consultabile | scheda "via aisstream.io" | **no**: tolto dal server MCP; API con nota "non ridistribuire" | **conferma in bozza** (richiesta 8) |
| Packet Broker / TTN (gateway LoRa) | dati resi pubblici dai proprietari (opt-in) | scheda | sì, senza identificativi | ok |
| CAMPO | CC BY 4.0 (progetto del titolare di VOD) | scheda con formula richiesta | sì | ok |
| Venice Tap Water | uso con citazione e link | scheda, /sources | sì | **da confermare per iscritto** dal titolare del progetto |
| Testo Unico della circolazione acquea (Ord. 274/2015, Comune di Venezia) | atto pubblico; regole trascritte da VOD | planner in barca: articolo di ogni regola e link alla normativa del Comune | sì (solo le regole, con il riferimento all'atto) | ok; percorso dichiarato «indicativo, non per la navigazione» |
| Webcam (SkylineWebcams e altre) | contenuti proprietari | solo link alla pagina ufficiale | no (nessuna immagine) | ok |
| Elenchi curati del progetto | dati indicativi "da verificare" | schede con la dicitura | sì | ok |

## Fonti valutate e non integrate

| Fonte | Motivo |
|---|---|
| Geoportale del Comune (GeoSMA, GeoElezioni; GeoIDS solo come esportazione manuale) | protetto da filtro anti-bot: nessuno script contro il geoportale; i CSV di GeoIDS si esportano a mano come previsto dal manuale del servizio |
| Siti commerciali di depositi bagagli (Radical Storage, Stasher, findluggagestorage…) | dati, prezzi e recensioni non aperti: si usano i depositi mappati su OpenStreetMap |
| Illuminazione pubblica del Comune o di Veritas | nessun dataset aperto dei punti luce: si usano i lampioni mappati su OpenStreetMap (copertura parziale) |
| Componenti grafici React Bits | licenza «MIT + Commons Clause» che vieta di ridistribuire i componenti: incompatibile con un repository AGPL pubblico, non usati (19/10/2026) |
| Planimetria delle competenze sui canali, mappe MILVa | immagini con avvertenze d'uso (no modifiche, no uso commerciale): non si ricalcano |
| Rivenditori autorizzati ACTV (mappa Google) | dati vecchi (verifiche 2015–2022) e nomi di titolari di ditte individuali |
| ViaggiaTreno (treni) | servizio non pubblicato come open data, senza licenza: VOD non lo interroga; il tempo reale dei treni arriva da BusOne alle sue condizioni |
| Anopticon | i termini vietano l'accesso automatico senza autorizzazione |
| Osservaprezzi Carburanti (API interna del sito carburanti.mise.gov.it) | API non pubblicata come open data, senza licenza né condizioni d'uso: si usano solo i CSV ufficiali (16/10/2026) |
| Busitalia Veneto (gtfs-biv.fsbusitalia.com) | orario e tempo reale protetti da autenticazione (HTTP 401): VOD non li interroga; le posizioni dei bus arrivano dal feed pubblico di BusOne, alle sue condizioni (solo mappa) |
| Banda Ultra Larga – Infratel (bandaultralarga.italia.it) | la mappa usa una chiamata interna del sito; nessun dataset aperto con licenza, né sul sito né su dati.gov.it (16/10/2026) |
| Starlink (file pubblici availability-cells, metrics_*, feed GeoIP) | nessuna licenza dichiarata; i poligoni di disponibilità non dicono lo stato di Venezia (solo eccezioni mondiali), le metriche sono per paese o per regioni con codici Mapbox proprietari, il feed GeoIP elenca punti di rete, non utenti. Valutato il 15/10/2026, non integrato |
| Venice Project Center – WPI (`veniceprojectcenter.org/opendata`) | rilievi su ponti (luce utile e gradini), vere da pozzo, patere/formelle e batimetria dei rii interni privi di licenza aperta esplicita sul portale; predisposta richiesta di conferma CC BY 4.0 (richiesta 10 in `richieste-autorizzazione.md`, 17/10/2026) |

## Planner in barca (mezzo privato)

- Tracciati dei canali da OpenStreetMap (ODbL); regole dal Testo Unico (Ord. 274/2015): sensi unici (art. 7),
  divieti alle unità a motore (art. 2 c.3 Rii Blu, art. 8), Canal Grande vietato al diporto feriali 8-12 (art. 20),
  ZTL vietata al diporto salvo residenti e concessionari (art. 18): per default il percorso **non** entra nella ZTL,
  l'utente deve dichiararsi residente o concessionario.
- Con la marea: art. 3 del regolamento comunale (rii del centro vietati a motore da +110 cm, 5 km/h nel Canal Grande).
- Avviso sempre visibile: percorso indicativo, fanno fede atti, ordinanze temporanee e segnaletica; non considera
  ponti, larghezza e pescaggio, deroghe per categoria né i canali della Capitaneria. Le ordinanze in vigore sui
  canali del percorso sono segnalate con il link all'atto.

## Privacy

- Nessun cookie e nessun account; statistiche d'uso aggregate senza cookie (Vercel Web Analytics).
- Ordinanze: esclusi i titoli che possono riguardare persone (sig./sig.ra, "a carico di", residente, codice fiscale, trattamenti sanitari, minori…).
- Gateway LoRa: nessun identificativo né nome del proprietario.
- Distributori di carburante: solo marchio e indirizzo; il nome del gestore e quello dell'impianto (spesso il nome di una persona) non si leggono nemmeno nella risposta dell'API.
- Inside Airbnb: scartati alla fonte `id`, `name`, `host_id`, `host_profile_id`, `host_name` e codici identificativi individuali (`license` CIN/CIR); punti dei singoli annunci solo nelle celle da ~100 m con almeno 3 annunci (posizione già spostata da Airbnb fino a 150 m, avviso nella scheda); la scheda del singolo annuncio non dice se ha il codice CIN.
- GeoIDS (strutture ricettive del Comune): nessun contatto, nessun nome o indirizzo di locazioni turistiche e strutture complementari (solo conteggi per cella e zona); ragione sociale solo per società ed enti.
- Confronti fra registro del Comune, Ministero e annunci online solo per totali, con l'avvertenza che le differenze non indicano strutture irregolari.
- Mezzi ACTV: si mostra il numero o il nome del mezzo pubblicato nel feed, nessun dato del personale.
- Registri tecnici di Vercel: contengono l'URL delle richieste, quindi anche i luoghi cercati con planner, indirizzi, civici, skill e MCP; dichiarato in `/privacy` (15/10/2026).
- Mappa: link «Privacy» sempre visibile accanto all'attribuzione; simulatore di marea con avvertenza «divulgativo, non ufficiale».
- **Da completare dal titolare:** nome ed email del titolare del trattamento in `/privacy` (art. 13 GDPR).
- Licenze di VOD: codice GNU AGPL-3.0, dati e testi creati da VOD CC BY-SA 4.0 (`LICENSE`, README).
- Contatto per privacy, rimozioni e correzioni: messaggio diretto all'account Instagram [@veniceopendata](https://www.instagram.com/veniceopendata/), indicato in `/privacy`.

## Sicurezza

- Chiavi (aisstream, OpenSky) solo lato server, mai nel codice né nei log.
- Link presi da dati di terzi (siti web OSM e CAMPO, avvisi RSS, webcam) accettati solo se http/https (`safeUrl`); i link degli avvisi ACTV solo sui domini ACTV/AVM.
- Testi esterni (ordinanze, avvisi) mostrati come testo, mai come HTML.
- Richieste alle fonti dal server con cache e User-Agent identificabile; nessun aggiramento di filtri anti-bot.

## Pagine pubbliche

- `/privacy`: privacy, progetto senza fini di lucro, licenze e citazione, esclusione di responsabilità, richieste dei titolari (sospensione immediata del dato).
- `/sources`: ogni fonte con licenza, ente, portale e stato.
- Mappa: «© OpenStreetMap contributors · Fonti dei dati» sempre visibile.
