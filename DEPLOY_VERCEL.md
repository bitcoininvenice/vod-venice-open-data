# Deploy su Vercel / Deploying to Vercel

[Italiano](#italiano) · [English](#english)

---

## Italiano

VOD non usa database: i dataset sono file nel repository e le fonti in tempo reale si leggono dalle route API
con cache. Basta un progetto Next.js su Vercel.

### Dalla dashboard di Vercel

1. **Add New… → Project** e importa il repository.
2. **Root Directory**: `web`. Il framework (Next.js) e il comando di build (`next build --webpack`, da
   `web/vercel.json`) si impostano da soli.
3. **Environment Variables**: nessuna è obbligatoria. Quelle facoltative sono descritte in `web/.env.example`:
   - `NEXT_PUBLIC_SITE_URL`: indirizzo pubblico, per link canonici e sitemap;
   - `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`: quota OpenSky più alta (l'IP condiviso di Vercel esaurisce in
     fretta la quota anonima);
   - `AISSTREAM_API_KEY` (e `AISSTREAM_LISTEN_MS`): navi in tempo reale nella mappa;
   - `API_RATE_LIMIT_PER_MINUTE`, `MCP_RATE_LIMIT_PER_MINUTE`: limite di richieste per IP.
4. **Deploy**. Se una fonte non risponde, l'interfaccia mostra «n.d.» invece di valori sostitutivi.

Errore `No Output Directory named "public" found`: Vercel sta compilando la radice del repository. In
**Settings → General** imposta **Root Directory** a `web` e **Framework Preset** a Next.js, poi **Redeploy**.

### Da terminale

```bash
cd web
npx vercel          # anteprima
npx vercel --prod   # produzione
```

### File di configurazione

- `web/vercel.json`: framework e comando di build quando la Root Directory è `web`.
- `vercel.json` nella radice: stessa build se il progetto punta alla radice del repository.
- `.vercelignore` e `web/.vercelignore`: escludono pipeline, skill, documentazione e file temporanei dal
  caricamento.

---

## English

VOD has no database: datasets are files in the repository and live sources are read by cached API routes. A
plain Next.js project on Vercel is enough.

### From the Vercel dashboard

1. **Add New… → Project** and import the repository.
2. **Root Directory**: `web`. Framework (Next.js) and build command (`next build --webpack`, from
   `web/vercel.json`) are set automatically.
3. **Environment Variables**: none required. Optional ones are described in `web/.env.example`:
   `NEXT_PUBLIC_SITE_URL` (public URL for canonical links and sitemap), `OPENSKY_CLIENT_ID` and
   `OPENSKY_CLIENT_SECRET` (higher OpenSky quota; Vercel's shared IP quickly uses up the anonymous one),
   `AISSTREAM_API_KEY` and `AISSTREAM_LISTEN_MS` (live ships on the map), `API_RATE_LIMIT_PER_MINUTE` and
   `MCP_RATE_LIMIT_PER_MINUTE` (per-IP request limits).
4. **Deploy**. When a source does not answer, the interface shows "n/a" instead of made-up values.

Error `No Output Directory named "public" found`: Vercel is building the repository root. In
**Settings → General** set **Root Directory** to `web` and **Framework Preset** to Next.js, then **Redeploy**.

### From the terminal

```bash
cd web
npx vercel          # preview
npx vercel --prod   # production
```
