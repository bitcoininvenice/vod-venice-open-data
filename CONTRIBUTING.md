# Contribuire a VOD

Grazie per l'interesse. VOD (Venice Open Data) è un progetto civico senza fini di lucro: una mappa di Venezia e
della laguna costruita solo con dati aperti, sempre con fonte, licenza e natura del dato dichiarate.

## Modi di contribuire

- **Proporre una fonte o un livello** senza scrivere codice: apri un issue con il modulo «Proponi una fonte».
- **Segnalare un errore** nei dati o nel sito: modulo «Segnala un errore». Per un dato sbagliato indica la fonte
  ufficiale che lo smentisce.
- **Aggiungere una fonte o un livello** con una pull request: segui la guida
  [docs/AGGIUNGERE-UNA-FONTE.md](docs/AGGIUNGERE-UNA-FONTE.md).
- **Migliorare il codice, i testi o le traduzioni** (italiano e inglese): pull request.
- **Problemi di sicurezza**: non aprire un issue pubblico, vedi [SECURITY.md](SECURITY.md).

## Prima di una pull request

1. Una pull request per argomento (una fonte, una correzione).
2. Esegui la verifica completa, la stessa della CI:

   ```bash
   npm ci
   npm run typecheck && npm run lint && npm test && npm run build
   cd web && npx playwright install chromium && npx playwright test && cd ..
   pip install -r pipeline/requirements-dev.txt && python -m pytest -q pipeline/tests skills/tests
   ```
3. Testi visibili in italiano e inglese, attraverso le traduzioni (`web/src/lib/i18n/ui.it.ts`, `ui.en.ts`).
4. Commenti e messaggi di commit in italiano, come il resto del progetto.
5. Nessuna chiave, password o dato personale nel codice, nei test o nei log.

## Regole sui dati

Sono le stesse del progetto, riassunte nella guida: licenza verificata con link, natura del dato dichiarata,
nessun dato personale, nessun aggiramento di filtri anti-bot, una sola chiamata condivisa per fonte dentro la
quota del fornitore, citazione visibile. Nel dubbio la fonte non si integra, oppure si mostra solo nella mappa
senza ridistribuirla. La verifica legale finale la fa il manutentore.

## Licenza dei contributi

Contribuendo accetti che il tuo contributo sia distribuito con la licenza del progetto indicata nel file
`LICENSE` (codice) e con le licenze dichiarate per i dati. I dati di terzi restano sotto la licenza della loro
fonte.
