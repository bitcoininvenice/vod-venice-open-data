import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Tutte le fonti esterne sono interrogate lato server (route /api/*): il browser parla solo con l'origine.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inietta script inline per l'idratazione; in sviluppo serve anche eval per l'HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  async headers() {
    // La cache condivisa (CDN) delle API è governata da `revalidate` in ogni route. Qui si aggiunge la
    // cache del browser, proporzionata a quanto spesso cambia il dato: tornando sul sito o riattivando
    // un livello la risposta arriva dal browser senza richiesta di rete.
    const browserCache = (pattern: string, maxAge: number, swr: number) => ({
      source: `/api/:name(${pattern})`,
      headers: [{ key: "Cache-Control", value: `public, max-age=${maxAge}, stale-while-revalidate=${swr}` }],
    });
    // In sviluppo niente cache del browser: i dati rigenerati dalle pipeline devono vedersi subito
    if (isDev) return [{ source: "/:path*", headers: securityHeaders }];
    return [
      { source: "/:path*", headers: securityHeaders },
      // Dataset aggiornati dalle pipeline (al più una volta al giorno)
      browserCache(
        "cantieri|stops|city-assets|venice-assets|cameras|heritage|emergency-health|waterways|lagoon-morphology|rail-logistics|pedestrian-flows|urban-microclimate|passerelle|fiber|lagoon-network|opere-bdap",
        3600,
        86400,
      ),
      // Previsioni e medie che cambiano nell'arco della giornata
      browserCache("environment|regional-data|wind-field", 600, 1800),
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
