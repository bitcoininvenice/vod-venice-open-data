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

export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png"
  },
  title: {
    default: "VOD – Venice Open Data | Cruscotto Geospaziale & Digital Twin di Venezia",
    template: "%s | VOD – Venice Open Data"
  },
  description: "Piattaforma interattiva che incrocia Open Data di diverso genere relativi all'area della città di Venezia.",
  applicationName: "VOD - Venice Open Data",
  authors: [{ name: "Venice Open Data Initiative" }],
  generator: "Next.js",
  keywords: [
    // Identità e Piattaforma
    "Venezia",
    "Venice",
    "Venice Open Data",
    "Open Data Venezia",
    "Digital Twin Venezia",
    "Cruscotto Geospaziale",
    "Mappa Interattiva Venezia",
    "dati.venezia.it",

    // Trasporti & Mobilità Acquea e Terraferma
    "ACTV",
    "Vaporetti Venezia",
    "Motoscali",
    "Alilaguna",
    "GTFS Venezia",
    "Linee Navigazione ACTV",
    "Mobilità Laguna",
    "Canal Grande",
    "Piazzale Roma",
    "Tronchetto",
    "Ferry-Boat Lido",

    // Maree, Clima & Protezione Civile
    "Centro Maree Venezia",
    "CPSM",
    "Previsione Maree",
    "Acqua Alta",
    "Barriere MOSE",
    "Bocche di Porto",
    "Passerelle Acqua Alta",
    "Percorsi Passerelle Venezia",
    "Allagamento Venezia",

    // Monitoraggio Satellitare & Spazio
    "Copernicus",
    "Sentinel-1 SAR Radar",
    "Sentinel-2 Multispettrale",
    "COSMO-SkyMed ASI",
    "Interferometria Radar DInSAR",
    "Subsidenza Venezia",
    "Stazione Spaziale ISS",
    "Galileo GNSS",
    "Telerilevamento Satellitare",

    // Ricerca Marina & Oceanografia
    "CNR-ISMAR",
    "Piattaforma Oceanografica Acqua Alta",
    "ISPRA RML",
    "Boe Ondametriche",
    "Altezza Onde Adriatico",
    "Salinità Laguna",
    "Briccole Venezia",
    "Dame di Canale",
    "Fanali Marittimi",
    "Canale dei Petroli",

    // Ambiente, Mare & Spiagge
    "ARPAV",
    "Qualità Aria Venezia",
    "PM10 Mestre",
    "Acque di Balneazione Lido",
    "Spiagge Venezia",
    "Lido Blue Moon",
    "Alberoni WWF",
    "Pellestrina",
    "Bandiera Blu",

    // Città, Smart City & Patrimonio
    "Smart Control Room Tronchetto",
    "Flussi Pedonali Rialto",
    "Ponti Accessibili",
    "Fontanelle Potabili",
    "Cantieri Opere Pubbliche",
    "Catasto Verde",
    "Alberi Monumentali Venezia",
    "Colonnine Ricarica EV",
    "VeniceConnected Wi-Fi",

    // Navale & Aeroportuale
    "AIS Navi Venezia",
    "VTS Guardia Costiera",
    "Porto di Venezia",
    "Voli Marco Polo VCE",
    "Radar ADS-B",
    "ENAV OpenSky"
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
    title: "VOD – Venice Open Data | Cruscotto Geospaziale & Digital Twin di Venezia",
    description: "Piattaforma interattiva che incrocia Open Data di diverso genere relativi all'area della città di Venezia.",
    url: "https://venice-open-data.vercel.app",
    siteName: "VOD - Venice Open Data",
    locale: "it_IT",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "VOD – Venice Open Data | Cruscotto Geospaziale di Venezia",
    description: "Piattaforma interattiva che incrocia Open Data di diverso genere relativi all'area della città di Venezia."
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
            __html: `(function(){try{var t=localStorage.getItem('vod_theme_preference');if(t==='carta'){document.documentElement.dataset.theme='carta';document.documentElement.style.colorScheme='light';}else{document.documentElement.dataset.theme='notte';document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--ground)] text-[var(--ink)] antialiased select-none">
        <LanguageProvider>
          <ServiceWorkerRegister />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
