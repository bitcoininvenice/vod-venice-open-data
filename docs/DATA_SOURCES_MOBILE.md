# Venice Open Data (VOD) Mobile - Fonti Dati e Integrazioni

Questo documento descrive le origini dei dati, i formati, le licenze e le strategie di caching offline adottate dall'applicazione mobile Flutter di Venice Open Data.

---

## 1. Marea e Previsioni CPSM

- **Ente**: Comune di Venezia - Centro Previsioni e Segnalazioni Maree (CPSM)
- **Endpoint Ufficiale Primario**:
  - Dati orari e tempo reale: `https://dati.comune.venezia.it/sites/default/files/dataset/opendata/livello.json`
  - Previsioni e colmi mareali: `https://dati.comune.venezia.it/sites/default/files/dataset/opendata/previsione.json`
- **Proxy/Endpoint VOD Aggregato**:
  - `https://venice-open-data.vercel.app/api/tide`
- **Frequenza di aggiornamento**:
  - Livello live: ogni 5-10 minuti.
  - Previsione astronomica/meteorologica: 3 volte al giorno (mattina, pomeriggio, sera).
- **Licenza**: Italian Open Data License (IODL 2.0) o CC-BY 4.0.
- **Fallback Offline**:
  - Caching dell'ultimo valore scaricato in memoria locale (`SharedPreferences` / archivio locale).
  - Se la rete non e disponibile, l'app mostra l'ultimo livello noto con indicazione oraria chiara (es. "Rilevato alle 09:15 - Connessione assente").

---

## 2. Battelli e Bus ACTV / AVM

- **Ente**: AVM S.p.A. / ACTV S.p.A.
- **Fonte Dati**:
  - Open Data GTFS Static (orari programmati, percorsi, approdi e banchine).
  - Open Data GTFS Realtime (Vehicle Positions e Trip Updates se disponibili/pubblici).
- **Dataset VOD**:
  - `web/src/data/actv-stops.json` (coordinate, nomi, pontili e accessibilita).
  - `web/src/data/actv-line-colors.json` (codici cromatici ufficiali delle linee: es. linea 1 nero, linea 2 rosso, linea 4.2 arancio).
- **Frequenza di aggiornamento**:
  - Tabelle orari: stagionale (cambio orario invernale/estivo).
  - RT: polling ogni 30-60 secondi su richiesta dell'utente.
- **Licenza**: Open Data AVM / CC-BY.
- **Fallback Offline**:
  - Database JSON compatto delle fermate e degli orari programmati integrato negli asset dell'app (`assets/data/`).
  - Funzionamento al 100% per gli orari standard anche in assenza di rete.

---

## 3. Rete Alilaguna (Aeroporto - Citta)

- **Ente**: Alilaguna S.p.A.
- **Linee**: Linea Blu, Linea Rossa (stagionale), Linea Arancio.
- **Dati**:
  - Orari programmati delle corse e punti di imbarco (Aeroporto Marco Polo, Murano Colonna, Fondamente Nove, San Marco, Zattere, Tronchetto).
- **Licenza**: Orari di pubblico transito.
- **Fallback Offline**:
  - Tabella orari sincronizzata e salvata in locale.

---

## 4. Passerelle e Zone Critiche Allagamento

- **Ente**: Comune di Venezia - Direzione Lavori Pubblici
- **Fonte Dati**:
  - Piano Passerelle del Comune di Venezia (file GeoJSON e quote altimetriche soglia).
  - Dataset VOD `web/src/lib/passerelleData.ts` con quote di attivazione (da 80 cm a 120 cm).
- **Licenza**: Open Data Comune di Venezia.
- **Fallback Offline**:
  - I tracciati geometrici delle passerelle comunali e le quote delle singole tratte sono interamente pre-caricati nell'applicazione in formato GeoJSON statico compatto. Nessuna richiesta di rete necessaria per consultare le passerelle.

---

## 5. Stato Barriere MOSE

- **Ente**: Commissario Straordinario per il MOSE / Ministero delle Infrastrutture e dei Trasporti.
- **Fonte Dati**:
  - Comunicati operativi di chiusura bocche di porto (Lido Treporti, Lido San Nicolo, Malamocco, Chioggia).
  - Endpoint VOD `TideResponse.data.moseGates`.
- **Frequenza di aggiornamento**: In caso di allerta marea eccezionale (sollevamento barriere).
- **Fallback Offline**:
  - Se non disponibile, l'app riporta "Stato non aggiornato - verifica su canali ufficiali CPSM".

---

## 6. Privacy e Tracciamento
- **Zero tracciamento**: L'app non invia identificativi utente, UUID di dispositivo, indirizzi IP o dati personali a server terzi.
- **Posizione geografica (GPS)**: Utilizzata esclusivamente sul dispositivo (*on-device*) per calcolare la distanza dall'approdo o per il routing pedonale. Nessuna coordinata GPS viene mai trasmessa o registrata.
