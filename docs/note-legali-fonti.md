# Note legali: fonti, licenze, privacy e sicurezza

Revisione del 14/10/2026. Obiettivo: nessun dato usato fuori dalla sua licenza, attribuzioni sempre visibili,
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
| Alilaguna GTFS | nessuna licenza dichiarata nel feed | scheda, /sources | sì | **conferma in bozza** (richiesta 9) |
| FlixBus GTFS (FlixMobility) | ODbL 1.0 | scheda "© FlixMobility · ODbL", /sources | sì, sotto ODbL | ok |
| OpenStreetMap (base cartografica e livelli) | ODbL 1.0 | **attribuzione fissa sulla mappa** + schede | sì, sotto ODbL | ok |
| ARPAV, ISTAT, Camera di Commercio, AgID, AGCOM | CC BY 4.0 | schede, /sources | sì | ok |
| BDAP (MEF) | CC BY | scheda, /sources | sì | ok |
| Open-Meteo (vento, mare) | CC BY 4.0; API gratuita solo per uso non commerciale, entro i limiti di chiamate | schede "Open-Meteo (CC BY 4.0)" | sì | ok finché VOD resta senza fini di lucro |
| Copernicus CAMS (aria, pollini) via Open-Meteo | licenza Copernicus | formula "Generato usando informazioni del Copernicus Atmosphere Monitoring Service…" nelle schede | sì | ok |
| NOAA METAR | pubblico dominio | /sources | sì | ok |
| OpenSky Network (voli) | solo ricerca/educazione non commerciale; citazione dell'articolo OpenSky | scheda con citazione e link | **no**: tolto dal server MCP; API usata solo dalla mappa, con nota "non ridistribuire" | ok (prudente) |
| aisstream.io (navi AIS) | termini non pubblicati in modo consultabile | scheda "via aisstream.io" | **no**: tolto dal server MCP; API con nota "non ridistribuire" | **conferma in bozza** (richiesta 8) |
| Packet Broker / TTN (gateway LoRa) | dati resi pubblici dai proprietari (opt-in) | scheda | sì, senza identificativi | ok |
| CAMPO | CC BY 4.0 (progetto del titolare di VOD) | scheda con formula richiesta | sì | ok |
| Venice Tap Water | uso con citazione e link | scheda, /sources | sì | **da confermare per iscritto** dal titolare del progetto |
| Webcam (SkylineWebcams e altre) | contenuti proprietari | solo link alla pagina ufficiale | no (nessuna immagine) | ok |
| Elenchi curati del progetto | dati indicativi "da verificare" | schede con la dicitura | sì | ok |

## Fonti valutate e non integrate

| Fonte | Motivo |
|---|---|
| Geoportale del Comune (GeoSMA, GeoIDS, GeoElezioni) | protetto da filtro anti-bot: non si aggira; richiesta di pubblicazione possibile |
| Planimetria delle competenze sui canali, mappe MILVa | immagini con avvertenze d'uso (no modifiche, no uso commerciale): non si ricalcano |
| Rivenditori autorizzati ACTV (mappa Google) | dati vecchi (verifiche 2015–2022) e nomi di titolari di ditte individuali |
| ViaggiaTreno (treni) | servizio non pubblicato come open data, senza licenza |
| Anopticon | i termini vietano l'accesso automatico senza autorizzazione |

## Privacy

- Nessun cookie e nessun account; statistiche d'uso aggregate senza cookie (Vercel Web Analytics).
- Ordinanze: esclusi i titoli che possono riguardare persone (sig./sig.ra, "a carico di", residente, codice fiscale, trattamenti sanitari, minori…).
- Gateway LoRa: nessun identificativo né nome del proprietario.
- Mezzi ACTV: si mostra il numero o il nome del mezzo pubblicato nel feed, nessun dato del personale.
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
