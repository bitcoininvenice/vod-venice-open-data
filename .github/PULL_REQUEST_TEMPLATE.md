## Cosa cambia

<!-- In due righe: cosa aggiunge o corregge questa pull request. -->

## Se aggiunge o modifica una fonte di dati

- [ ] Fonte: ente o progetto e link alla pagina dei dati
- [ ] Licenza: nome e **link alla pagina dove è scritta** (se non c'è, spiegalo)
- [ ] Natura del dato: misura in tempo reale / previsione / simulato dall'orario / dataset ufficiale / OpenStreetMap / elenco curato da verificare
- [ ] Nessun dato personale, nessun aggiramento di filtri anti-bot o login
- [ ] Richieste alla fonte solo dal server, con cache dentro la quota del fornitore
- [ ] Citazione visibile: scheda del livello, catalogo `/layers`, pagina `/sources`
- [ ] Server MCP / API dei dataset solo se la licenza permette la ridistribuzione

## Verifica

- [ ] `npm run typecheck && npm run lint && npm test && npm run build`
- [ ] `npx playwright test` (in `web/`)
- [ ] `python -m pytest -q pipeline/tests skills/tests`
- [ ] Testi in italiano e inglese
- [ ] Test nuovi per la parte aggiunta

Guida: [docs/AGGIUNGERE-UNA-FONTE.md](../docs/AGGIUNGERE-UNA-FONTE.md)
