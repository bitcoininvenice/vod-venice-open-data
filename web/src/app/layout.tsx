import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOD – Venice Open Data | Cruscotto Geospaziale della Laguna",
  description: "Piattaforma interattiva che incrocia Open Data di diverso genere relativi all'area della città di Venezia.",
  keywords: ["Venezia", "Open Data", "ACTV", "GTFS", "PostGIS", "Vaporetti", "Laguna di Venezia", "MapLibre", "Mobilità"]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[var(--ground)] text-[var(--ink)] antialiased select-none">
        {children}
      </body>
    </html>
  );
}
