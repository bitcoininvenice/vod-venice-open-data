# Venice Open Data (VOD) Mobile - Wireflows & User Journeys

Questo documento definisce i flussi di navigazione, le schermate e la logica di interazione per l'applicazione mobile Flutter di Venice Open Data.

---

## 1. Schermata 1: "Oggi" (Home - Killer Screen in 3 Secondi)

### Obiettivo
Rispondere immediatamente a 3 domande:
1. Com'e la marea adesso e quando ci sara il prossimo picco?
2. Rischio di bagnarmi i piedi nelle calli o trovo passerelle?
3. Quando passa il mio battello alla fermata abituale?

### Wireflow
```
[ TOP BAR ]
Data odierna (es. "Giovedi 15 Ottobre") | Badge CPSM Ufficiale | Pulsante Switch Lingua [IT/EN]

[ CARD 1: LIVE MAREA PUNTA DELLA SALUTE ]
+ Valore numerico grande: "+78 cm"
+ Pill stato colorata CPSM: [ Marea Normale / Sostenuta / Molto Sostenuta / Eccezionale ]
+ Riga previsione: "Prossimo picco: +95 cm alle 21:30" | "Minimo: +15 cm alle 03:45"
+ Tap card -> Apre Tab "Acqua"

[ BANNER DI ALLERTA / STATO PIEDI ASCIUTTI ] (Condizionale)
SE Marea < 80 cm:
  Box verde sobrio: "Tutte le calli e piazze sono all'asciutto."
SE Marea >= 80 cm:
  Box giallo/arancione: "Possibile acqua a San Marco (+64cm). Passerelle attive."
  [ Pulsante: "Guarda mappa passerelle" ] -> Apre Mappa Passerelle in Tab Acqua

[ CARD 2: LE MIE FERMATE PREFERITE (Max 2) ]
SE nessuna fermata salvata:
  Box neutro: "Nessuna fermata salvata. Cerca una fermata in 'Muoviti' per vederla qui."
SE fermate salvate (es. Ferrovia + Rialto):
  Fermata 1: "Ferrovia (S. Lucia)"
    - Linea 2 -> S. Marco (Approdo D): [ 3 min ] (in arrivo)
    - Linea 1 -> Lido (Approdo E): [ 8 min ]
  Fermata 2: "Rialto"
    - Linea 1 -> P.le Roma (Approdo B): [ 5 min ]
  [ Link: "Tutte le partenze" ] -> Apre Tab Muoviti
```

---

## 2. Schermata 2: "Muoviti" (Come Arrivare + Fermate)

### Obiettivo
Fornire un calcolo di percorso pedonale/acqueo preciso e visualizzare le partenze di qualsiasi pontile ACTV o Alilaguna.

### Wireflow
```
[ TOP SEGMENTED CONTROL ]
[ Come Arrivare ]  |  [ Fermate ACTV ]

--- SEZIONE: COME ARRIVARE ---
[ Campi di Input ]
Partenza: [ Posizione attuale (GPS) o Cerca calle/approdo ]
Destinazione: [ Cerca destinazione (es. Piazza San Marco, Rialto, Ospedale) ]

[ Filtri Rapidi ]
[ Vaporetto + Piedi (attivo) ]  [ Solo a piedi (Gratis) ]  [ No Gradini / Bagagli ]

[ Avviso Marea Sul Percorso ]
"Percorso all'asciutto: nessuna calle allagata con la marea attuale (+78cm)."

[ Card Soluzione Consigliata ]
"23 min totali (18 min a bordo)" | Arrivo: 10:04 | Badge Linea [ 2 ] o [ 1 ]
Step-by-step pieghevole:
1. Cammina verso "Ferrovia Approdo D" (2 min, 0 gradini)
2. Sali a bordo Linea 2 dir. Rialto/San Marco (Partenza: tra 3 min)
3. Sbarca a "San Marco Vallaresso"
4. Cammina 3 min verso Piazza San Marco

--- SEZIONE: FERMATE ACTV ---
[ Barra di ricerca approdo ] "Cerca approdo (es. Zattere, S. Zaccaria, Burano)..."
[ Chip approdi vicini con GPS ]
Lista partenze con:
- Badge colore linea (es. 2 rosso, 1 nero, 4.2 arancione, 5.1 verde, Alilaguna Blu)
- Direzione finale
- Indicazione lettera pontile (A, B, C, D, E)
- Minuti mancanti (es. "In arrivo", "4 min", "12 min")
- Icona stella [ Salva come preferito in Home ]
```

---

## 3. Schermata 3: "Acqua" (Marea + Passerelle + MOSE)

### Obiettivo
Offrire il quadro completo e scientifico della situazione idrografica della laguna di Venezia.

### Wireflow
```
[ SEZIONE 1: LIVE & PREVISIONE MAREA CPSM ]
- Tachimetro o livello attuale: +78 cm (Punta della Salute)
- Tendenza: [ In calo / In aumento ]
- Grafico semplice 48 ore (ora, livello previsto, linea soglia allagamento +90cm)
- Tabella colmi e minimi previsti:
  - Oggi ore 21:30: +92 cm (Max)
  - Domani ore 03:45: +15 cm (Min)
  - Domani ore 10:15: +102 cm (Max sostenuta)

[ SEZIONE 2: PASSERELLE E ZONE ALLAGATE ]
- Percentuale stimata di suolo allagato alla marea corrente: "< 1%"
- Stato passerelle comunali:
  - Sotto 80 cm: "Smontate / A riposo"
  - Da 80 a 110 cm: "Montate sulle tratte San Marco, Rialto, Ferrovia"
- [ Tasto: Mappa Tracciati Passerelle ] (Visualizza i pontili rialzati su mappa)

[ SEZIONE 3: STATO BARRIERE MOSE ]
- Stato complessivo: [ A RIPOSO ] (oppure [ ATTIVO - BOCCHE CHIUSE ])
- Dettaglio per bocca di porto:
  - Lido Treporti: A riposo (0 cm)
  - Lido San Nicolo: A riposo (0 cm)
  - Malamocco: A riposo (0 cm)
  - Chioggia: A riposo (0 cm)
- Spiegazione in 2 righe:
  "Le paratoie vengono sollevate quando la marea in mare aperto supera i +110/+120 cm per proteggere la laguna."
- [ Card Bottone: "Simulatore MOSE interattivo su Venice Open Data" ]
  -> Apre il simulatore interattivo sul web
```

---

## 4. Schermata 4: "Altro" (Impostazioni & Fonti)

### Obiettivo
Utility minime, controllo preferenze, privacy e attribuzione trasparente dei dati.

### Wireflow
```
[ SEZIONE PREFERENZE ]
- Lingua applicazione: [ Italiano / English ] (toggle immediato)
- Notifiche Marea Locale:
  - Switch: [ Abilita avviso marea alta ]
  - Slider/Selezione soglia: "Avvisami quando il colmo previsto supera: [ +100 cm | +110 cm | +120 cm ]"

[ SEZIONE GESTIONE PREFERITI ]
- Lista fermate preferite salvate (con pulsante per rimuovere o riordinare)

[ SEZIONE FONTI E NOTE LEGALI ]
- Dati Marea: Comune di Venezia - CPSM (Licenza IODL 2.0 / Open Data)
- Dati Mobilità e Linee: AVM/ACTV SpA Open Data (GTFS)
- Tracciati Passerelle: Comune di Venezia - Direzione Lavori Pubblici
- Trasparenza codice: Progetto Open Source Venice Open Data (MIT License)

[ DISCLAIMER DI SICUREZZA ]
"Venice Open Data non e un canale ufficiale di protezione civile.
In caso di eventi meteorologici o mareali eccezionali, fare esclusivo riferimento ai canali ufficiali del Comune di Venezia e del Centro Previsioni Maree (CPSM)."
```
