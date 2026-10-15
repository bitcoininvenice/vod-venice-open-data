# Venice Open Data Mobile - Checklist QA e Collaudo

Questa checklist riassume i test obbligatori prima del rilascio dell'applicazione.

---

## 1. Test di Connettivita e Degrado Controllato

- [ ] **Modalita Aereo / Rete Assente**:
  - All'avvio dell'app senza connessione, l'app non deve andare in crash ne mostrare una schermata bianca.
  - La card della marea mostra l'ultimo valore presente in cache locale con badge chiaro "Offline".
  - Se non esiste una cache precedente, viene mostrato il dato stimato di fallback con avviso visivo.
  - La lista delle fermate e gli orari programmati restano consultabili offline.
  - La mappa delle passerelle e i tracciati rimangono accessibili al 100% (file statici inclusi nel bundle).

- [ ] **Timeout / Errore 500 API Esterna**:
  - Se l'endpoint VOD o CPSM risponde con errore o impiega oltre 4 secondi, l'interfaccia intercetta l'eccezione e ripiega sulla memoria locale senza bloccare l'interfaccia.

---

## 2. Permessi e Privacy

- [ ] **Permesso Posizione Negato / Revocato**:
  - Se l'utente nega il consenso GPS, l'app non deve richiedere continuamente il permesso a ogni avvio.
  - Nel tab "Muoviti" il campo di partenza imposta come default "Stazione S. Lucia" o permette la digitazione manuale della calle/approdo.

- [ ] **Zero Tracciamento**:
  - Nessuna richiesta verso domini di terze parti (Firebase Analytics, Facebook SDK, Google Analytics). Solo chiamate dirette all'API marea e risorse GTFS.

---

## 3. Dispositivi a Schermo Ridotto (iPhone SE / Android Compact)

- [ ] **Test su schermo da 4.7 pollici (375x667 pt)**:
  - Nessun overflow giallo/nero (`RenderFlex overflowed`).
  - La schermata "Oggi" mostra in un colpo d'occhio senza scroll orizzontale il livello marea e la prima fermata preferita.
  - Tutti i pulsanti mantengono un'area touch attiva di almeno 44x44 pixel.
  - La bottom navigation bar mostra chiaramente testo e icona senza sovrapposizioni.

---

## 4. Usabilita e Coerenza dei Dati

- [ ] **Regola dei 3 Secondi (Home Oggi)**:
  - Apertura immediata: l'utente comprende in < 3 secondi:
    1. Quota di marea attuale e se e normale o sostenuta.
    2. Se serve stivali/passerelle.
    3. Minuti mancanti per il proprio battello abituale.

- [ ] **Indicazione Pontile (Lettera Approdo)**:
  - In ogni vista di partenza e itinerario e chiaramente evidenziata la lettera del pontile (A, B, C, D, E) per evitare imbarco in direzione contraria.

- [ ] **Cambio Lingua Istantaneo**:
  - Toccando il selettore IT/EN, tutti i testi di navigazione, allerte e categorie si aggiornano istantaneamente senza dover riavviare l'app.
