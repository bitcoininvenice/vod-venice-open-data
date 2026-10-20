import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Tutte le fonti esterne sono interrogate lato server (route /api/*): il browser parla solo con l'origine.
const cspDirectives = (frameAncestors: string) => [
  "default-src 'self'",
  // Next.js inietta script inline per l'idratazione; in sviluppo serve anche eval per l'HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  `frame-ancestors ${frameAncestors}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const commonHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// Nessun sito può incorniciare VOD, tranne i riquadri di /embed/* (marea), fatti per stare in altri siti
const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives("'none'") },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...commonHeaders,
];
const embedHeaders = [{ key: "Content-Security-Policy", value: cspDirectives("*") }, ...commonHeaders];
const NOT_EMBED = "/((?!embed/).*)";

// Il ritardo dalla posizione legge l'orario ACTV (public/data/sim-*.json) dal disco: va incluso
// nelle funzioni che rispondono con i mezzi in tempo reale (API, server MCP e API dei dataset).
const SIM_FILES = ["./public/data/sim-*.json"];
// Planner, partenze e acqua alta lato server (API, server MCP, CLI della skill) leggono anche rete pedonale e canali
const PLANNING_FILES = [...SIM_FILES, "./public/data/walk-*.json", "./public/data/boat-*.json"];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/realtime/vehicles": SIM_FILES,
    "/api/mcp": PLANNING_FILES,
    "/api/come-arrivare": PLANNING_FILES,
    "/api/partenze": PLANNING_FILES,
    "/api/acqua-alta": PLANNING_FILES,
    "/api/datasets/[id]": SIM_FILES,
    // Guide «Come arrivare»: percorsi calcolati con il planner a ogni rigenerazione
    "/come-arrivare/[luogo]": PLANNING_FILES,
    "/en/getting-to/[place]": PLANNING_FILES,
  },
  async headers() {
    // La cache condivisa (CDN) delle API è governata da `revalidate` in ogni route. Qui si aggiunge la
    // cache del browser, proporzionata a quanto spesso cambia il dato: tornando sul sito o riattivando
    // un livello la risposta arriva dal browser senza richiesta di rete.
    const browserCache = (pattern: string, maxAge: number, swr: number) => ({
      source: `/api/:name(${pattern})`,
      headers: [{ key: "Cache-Control", value: `public, max-age=${maxAge}, stale-while-revalidate=${swr}` }],
    });
    // In sviluppo niente cache del browser: i dati rigenerati dalle pipeline devono vedersi subito
    const security = [
      { source: NOT_EMBED, headers: securityHeaders },
      { source: "/embed/:path*", headers: embedHeaders },
    ];
    if (isDev) return security;
    return [
      ...security,
      // Dataset aggiornati dalle pipeline (al più una volta al giorno)
      browserCache(
        "cantieri|stops|city-assets|venice-assets|cameras|heritage|emergency-health|waterways|lagoon-morphology|rail-logistics|pedestrian-flows|urban-microclimate|passerelle|fiber|lagoon-network|opere-bdap|nautical|parks",
        3600,
        86400,
      ),
      // Previsioni e medie che cambiano nell'arco della giornata
      browserCache("environment|regional-data|wind-field|sports", 600, 1800),
      browserCache("weather|marine-sensors|satellites|lora-gateways", 120, 300),
      // Dati in tempo reale: cache breve, solo per evitare richieste doppie ravvicinate
      browserCache("tide|alilaguna|ships", 30, 60),
      // Geometrie e simulazione: il nome del file contiene l'hash del contenuto, quindi non cambia mai
      {
        source: "/data/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
