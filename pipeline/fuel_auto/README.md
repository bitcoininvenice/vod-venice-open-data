# Prezzi dei carburanti: aggiornamento automatico dal Mac

Il firewall del Ministero (MIMIT) rifiuta le richieste dai data center, quindi né Vercel né GitHub Actions riescono a
scaricare i prezzi. Da una connessione italiana i file si scaricano normalmente. Per questo un Mac del progetto
scarica i prezzi ogni mattina, presentandosi come VOD e senza aggirare nessun filtro, e li pubblica nel repository.
Da lì il sito li mostra a tutti, da qualsiasi paese.

## Cosa fa ogni giorno alle 9:15

1. Allinea una copia separata del repository (`~/.vod-carburanti/repo`, branch `main`). Non tocca la tua cartella
   di lavoro.
2. Lancia `pipeline/import_mimit_fuel.py`. Se il Ministero non risponde o il file è incompleto, si ferma e lascia
   quello del giorno prima.
3. Se i prezzi sono cambiati, committa **solo** `web/src/data/mimit-fuel-venezia.json` («Carburanti: prezzi del
   GG/MM/AAAA») e fa il push su `main`. Se nell'area di commit ci fosse qualsiasi altro file, si ferma.
4. Vercel pubblica il sito. `/api/carburanti` usa questi prezzi quando il Ministero non risponde (`meta.pricesFrom:
   "daily-file"`) e, se il file ha più di 7 giorni, passa ai distributori di OpenStreetMap senza prezzi.

Se il Mac è spento o in stop alle 9:15, il job parte al risveglio. Il registro è in
`~/Library/Logs/vod-carburanti.log`. Se qualcosa non va compare una notifica.

## Installazione (una volta)

```bash
bash pipeline/fuel_auto/install.sh
```

Lo script crea una chiave SSH dedicata (`~/.vod-carburanti/deploy_key`) e ne stampa la parte pubblica. Aggiungila su
GitHub: repository → **Settings → Deploy keys → Add deploy key**, titolo «VOD prezzi carburanti», con **Allow write
access**. La chiave funziona solo su questo repository e non dà accesso al tuo account.

Per provare subito:

```bash
launchctl kickstart gui/$(id -u)/it.veniceopendata.carburanti
```

Per disattivare: `bash pipeline/fuel_auto/install.sh --uninstall`, poi togli la chiave da GitHub.

Se `main` ha regole di protezione che impediscono il push diretto, va aggiunta un'eccezione per la deploy key.
