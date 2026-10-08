# 🚀 Guida al Deploy su Vercel: VOD (Venice Open Data)

Il progetto è pronto al 100% per essere deployato su **Vercel** sia tramite la **Dashboard web di Vercel (GitHub/GitLab/Bitbucket)** sia tramite **Vercel CLI**.

---

## 🌟 Metodo 1: Deploy tramite Dashboard Web di Vercel (Consigliato)

1. Vai su [vercel.com](https://vercel.com) ed effettua l'accesso.
2. Clicca su **Add New...** → **Project**.
3. Importa il repository Git del progetto.
4. Nella schermata di configurazione **Configure Project**:
   * **Project Name**: `vod-venice-open-data` (o il nome che preferisci).
   * **Framework Preset**: Seleziona **Next.js** (verrà rilevato automaticamente).
   * ⚠️ **Root Directory**: Clicca su **Edit** e seleziona la cartella **`web`**.
     *(Questo dice a Vercel di eseguire la build e il runtime all'interno dell'applicazione Next.js).*
   * **Build and Output Settings**: Lascia i valori predefiniti, il file `web/vercel.json` imposterà automaticamente:
     * **Build Command**: `next build --webpack` (garantisce zero errori Turbopack su Tailwind v4).
   * **Environment Variables (Facoltative)**:
     Non sono necessarie variabili d'ambiente obbligatorie. Facoltative: `OPENSKY_CLIENT_ID` e `OPENSKY_CLIENT_SECRET` (quota OpenSky più alta: l'IP condiviso di Vercel esaurisce rapidamente la quota anonima). Se una fonte live non risponde l'interfaccia mostra "n.d." invece di valori sostitutivi.
     Se disponi di un database cloud (Neon, Supabase, Vercel Postgres) o vuoi integrare PostHog, puoi aggiungere:
     * `DATABASE_URL`: stringa di connessione PostgreSQL + PostGIS (es. Neon).
     * `NEXT_PUBLIC_POSTHOG_KEY`: chiave API di PostHog per le metriche utenti.
     * `NEXT_PUBLIC_POSTHOG_HOST`: es. `https://eu.i.posthog.com`.
5. Clicca su **Deploy**.
6. Entro circa 60 secondi il deploy sarà online con certificato SSL e dominio `https://tuo-progetto.vercel.app`.

---

### ⚠️ Risoluzione Errore: `No Output Directory named "public" found`
Se il progetto è già stato creato su Vercel e vedi questo errore, significa che Vercel sta cercando di compilare la root invece della sottocartella `web/`:

1. Vai sul tuo progetto su **Vercel** (`vercel.com`).
2. Clicca sulla scheda **Settings** in alto.
3. Nella sezione **General**:
   - Scorri fino a **Root Directory**, clicca su **Edit**, seleziona o digita **`web`** e clicca su **Save**.
   - Subito sopra, verifica che **Framework Preset** sia impostato su **Next.js**.
4. Vai nella scheda **Deployments**, clicca sui tre puntini `...` dell'ultimo deployment e seleziona **Redeploy**.

---

## ⚡ Metodo 2: Deploy tramite Vercel CLI

Se preferisci deployare dal terminale:

```bash
# 1. Accedi alla cartella dell'applicazione web
cd web

# 2. Esegui il deploy di preview
npx vercel

# 3. Oppure esegui direttamente il deploy di produzione
npx vercel --prod
```

---

## 🛠️ Cosa è stato configurato per Vercel:

1. **`web/vercel.json`**:
   Configura esplicitamente `"buildCommand": "next build --webpack"` e framework `"nextjs"`, evitando il panic di Turbopack con PostCSS/Tailwind v4 e garantendo una compilazione pulita in meno di 7 secondi.

2. **Root `package.json`**:
   Configura gli script delegati (`npm run build --workspace=web`) in modo che `npm run build` funzioni sia dalla root che dalla cartella `web/`.

3. **`web/.vercelignore` e `.vercelignore`**:
   Ignorano file temporanei, directory locali del database Docker (`db/`), pipeline Python (`pipeline/`), evitando upload inutili su Vercel.

4. **`web/.env.example`**:
   Fornisce la documentazione immediata di tutte le variabili d'ambiente opzionali (PostGIS, PostHog, URL di produzione).
