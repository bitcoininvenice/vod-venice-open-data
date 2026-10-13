import type { Metadata, Viewport } from "next";
// Font self-hosted (nessuna richiesta a server terzi): i nomi restano "DM Mono" e
// "Bricolage Grotesque" perché il canvas della mappa li richiama per nome.
import "@fontsource/bricolage-grotesque/latin-400.css";
import "@fontsource/bricolage-grotesque/latin-500.css";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/dm-mono/latin-500.css";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" }
    ],
    apple: "/apple-touch-icon.png"
  },
  title: {
    default: "VOD – Venice Open Data | Mappa di Venezia: vaporetti in tempo reale, marea e open data",
    template: "%s | VOD – Venice Open Data"
  },
  description: SITE_DESCRIPTION,
  applicationName: "VOD - Venice Open Data",
  authors: [{ name: "Venice Open Data Initiative" }],
  generator: "Next.js",
  // Google non usa le parole chiave: poche e pertinenti, per gli altri motori
  keywords: [
    "Venezia", "Venice", "Venice Open Data", "open data Venezia", "mappa Venezia",
    "vaporetti ACTV tempo reale", "ritardi vaporetti", "orari vaporetti", "come arrivare Venezia",
    "acqua alta", "marea Venezia", "MOSE", "numeri civici Venezia", "sestieri", "laguna di Venezia",
  ],

  creator: "Venice Open Data Community",
  publisher: "Venice Open Data",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL("https://venice-open-data.vercel.app"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "VOD – Venice Open Data | Mappa di Venezia: vaporetti in tempo reale, marea e open data",
    description: SITE_DESCRIPTION,
    url: "https://venice-open-data.vercel.app",
    siteName: "VOD - Venice Open Data",
    locale: "it_IT",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "VOD – Venice Open Data | Mappa di Venezia: vaporetti in tempo reale, marea e open data",
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  category: "technology"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" }
  ]
};

import { THEME_BOOT_SCRIPT } from '@/lib/themeBoot';
import { LanguageProvider } from "@/lib/i18n";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--ground)] text-[var(--ink)] antialiased select-none">
        {/* Dati strutturati: sito e applicazione web gratuita (schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: ['it', 'en'] },
              {
                '@type': 'WebApplication',
                name: SITE_NAME,
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                applicationCategory: 'TravelApplication',
                operatingSystem: 'Web',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
                inLanguage: ['it', 'en'],
                featureList: [
                  'Vaporetti ACTV in tempo reale con ritardo verificato',
                  'Come arrivare a piedi e in vaporetto',
                  'Marea in tempo reale e simulatore di acqua alta',
                  'Ricerca dei numeri civici per sestiere',
                  'Open data di Venezia con fonte e licenza',
                ],
              },
            ],
          })}
        />
        <LanguageProvider>
          <ServiceWorkerRegister />
          {children}
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
