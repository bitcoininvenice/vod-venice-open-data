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
    // La cache delle API è governata da `revalidate` in ogni route: le risposte vengono servite dalla
    // cache condivisa e le fonti esterne sono interrogate al massimo una volta per intervallo.
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
