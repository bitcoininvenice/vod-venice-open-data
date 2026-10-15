# Venice Open Data (VOD) Mobile - Product Brief

## 1. Visione del Prodotto
Venice Open Data Mobile e un'applicazione tascabile, essenziale e ad alte prestazioni progettata per chi vive e visita Venezia.
L'obiettivo primario non e replicare il portale web GIS, bensi rispondere a un bisogno pratico e quotidiano: **muoversi e non bagnarsi**, in meno di 3 secondi dall'apertura.

---

## 2. Promesse e Non-Promesse

### Promesse Core
1. **Chiarezza istantanea**: Schermata iniziale "Oggi" che riassume in 3 secondi il livello di marea, il rischio allagamento delle calli e le prossime partenze dei battelli preferiti.
2. **Affidabilita delle fonti**: Nessun dato inventato. Integrazione diretta con i flussi aperti del Centro Previsioni e Segnalazioni Maree (CPSM), open data ACTV/AVM e tracciati comunali delle passerelle.
3. **Resilienza offline**: Se la rete cade tra le calli o in laguna, l'app mostra l'ultima marea scaricata con marcatura oraria evidente e i percorsi/orari programmati in cache locale.
4. **Leggerezza e rispetto delle risorse**: Nessun tracciatore invasivo, avvio immediato, zero sovraccarico della batteria.

### Non-Promesse (Out of Scope v1)
- Nessuna registrazione, login o account utente.
- Nessun motore 3D o rendering poligonale pesante.
- Nessuna complessita cartografica da GIS desktop (massimo 1 mappa snella e mirata).
- Nessuna componente social o recensioni.

---

## 3. Le 5 Funzionalita

1. **Come arrivare (Navigazione intelligente pedonale + acquea)**
   - Calcolo itinerario da punto A a B a piedi o combinato con battello ACTV.
   - Verifica automatica con la quota di marea: allerta se il percorso interseca calli a rischio sommersione e proposta di deviazione.
   - Opzione "Evita gradini" per viaggiatori con valigie, disabilita o passeggini.

2. **Battelli e bus ACTV + Alilaguna**
   - Tabellone partenze in tempo reale o programmate per la fermata vicina o cercata.
   - Indicazione cruciale della lettera del pontile (A, B, C, D, E) per evitare imbarchi nella direzione errata.
   - Possibilita di salvare fino a 2 fermate preferite mostrate direttamente nella home "Oggi".

3. **Marea e Allerte CPSM**
   - Livello attuale a Punta della Salute (in cm rispetto allo zero mareografico ZMPS).
   - Previsione delle prossime 24-72 ore con colmo e minimo astronomico.
   - Notifica locale opzionale su soglia personalizzata (es. avvisa se marea prevista >= 110 cm).

4. **Passerelle e Percorsi Asciutti**
   - Attivazione in evidenza quando la marea supera la soglia di allagamento (+80/+95 cm).
   - Mappa e lista delle passerelle comunali montate e delle zone critiche (Piazza San Marco, Rialto, Strada Nova).
   - Suggerimento percorsi alternativi all'asciutto in linguaggio colloquiale.

5. **MOSE e Stato Laguna**
   - Indicatore dello stato delle 4 barriere alle bocche di porto (Attivo / A riposo / In manovra).
   - Breve spiegazione dell'impatto sul differenziale di marea mare-laguna.
   - Accesso rapido one-tap al simulatore divulgativo ufficiale di VOD sul web.

---

## 4. Architettura dell'Informazione (4 Tab)

- **Tab 1: Oggi (Home)**
  Sintesi immediata: livello marea attuale con scala colori CPSM, eventuale allerta passerelle attiva, widget con i prossimi passaggi delle 2 fermate preferite.
- **Tab 2: Muoviti**
  Motore "Come arrivare" con barra di ricerca, mappa essenziale e lista step-by-step; catalogo fermate ACTV/Alilaguna e orari.
- **Tab 3: Acqua**
  Monitoraggio idrometrico completo: grafico marea, colmi previsti, stato passerelle, stato MOSE e collegamento al simulatore.
- **Tab 4: Altro**
  Selettore lingua (Italiano / English), impostazione soglia notifiche, gestione preferiti, note legali, disclaimer CPSM e crediti Open Data.
