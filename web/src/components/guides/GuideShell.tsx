/**
 * Cornice delle guide (componente server): intestazione, percorso di navigazione, piè di pagina e JSON-LD, tutto
 * nella lingua della pagina e già nell'HTML, senza dipendere dalla lingua scelta nel browser per la mappa.
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Map as MapIcon } from 'lucide-react';
import { breadcrumbJsonLd, jsonLd } from '@/lib/seo';
import { SITE_URL, SOURCE_CODE_URL } from '@/lib/site';
import { GUIDE_PATHS } from '@/lib/guides/paths';
import type { GuideLang } from '@/lib/guides/places';

const L = {
  it: {
    tagline: 'Mappa di Venezia con dati aperti',
    map: 'Apri la mappa',
    nav: [
      { href: GUIDE_PATHS.tide.it, label: 'Marea' },
      { href: GUIDE_PATHS.vaporetti.it, label: 'Vaporetti' },
      { href: GUIDE_PATHS.gettingTo.it, label: 'Come arrivare' },
      { href: GUIDE_PATHS.faq.it, label: 'FAQ' },
    ],
    other: 'English',
    home: 'Mappa',
    guides: 'Guide',
    footer: 'Progetto indipendente e non ufficiale. Ogni dato indica fonte e licenza.',
    footerLinks: [
      { href: '/guide', label: 'Guide' },
      { href: '/glossario', label: 'Glossario' },
      { href: '/layers', label: 'Catalogo dei dati' },
      { href: '/sources', label: 'Stato delle fonti' },
      { href: '/privacy', label: 'Privacy' },
    ],
    code: 'Codice sorgente',
    crumbs: 'Percorso',
  },
  en: {
    tagline: 'Open-data map of Venice',
    map: 'Open the map',
    nav: [
      { href: GUIDE_PATHS.tide.en, label: 'Tide' },
      { href: GUIDE_PATHS.vaporetti.en, label: 'Waterbuses' },
      { href: GUIDE_PATHS.gettingTo.en, label: 'Getting there' },
      { href: GUIDE_PATHS.faq.en, label: 'FAQ' },
    ],
    other: 'Italiano',
    home: 'Map',
    guides: 'Guides',
    footer: 'Independent, unofficial project. Every value states its source and licence.',
    footerLinks: [
      { href: '/en/guides', label: 'Guides' },
      { href: '/en/glossary', label: 'Glossary' },
      { href: '/layers', label: 'Data catalogue' },
      { href: '/sources', label: 'Source status' },
      { href: '/privacy', label: 'Privacy' },
    ],
    code: 'Source code',
    crumbs: 'Breadcrumb',
  },
} as const;

export interface Crumb {
  name: string;
  path: string;
}

interface GuideShellProps {
  lang: GuideLang;
  /** Indirizzo della pagina gemella nell'altra lingua */
  alternatePath: string;
  /** Percorso dopo «Mappa › Guide» (l'ultimo è la pagina corrente) */
  crumbs: Crumb[];
  /** Altri nodi schema.org da aggiungere al grafo della pagina */
  schema?: object[];
  children: React.ReactNode;
}

export function GuideShell({ lang, alternatePath, crumbs, schema = [], children }: GuideShellProps) {
  const t = L[lang];
  const hub = { name: t.guides, path: GUIDE_PATHS.hub[lang] };
  const trail: Crumb[] = [{ name: t.home, path: '/' }, ...(crumbs[0]?.path === hub.path ? crumbs : [hub, ...crumbs])];
  const graph = { '@context': 'https://schema.org', '@graph': [breadcrumbJsonLd(trail), ...schema] };

  return (
    // lang sul contenitore: l'<html> resta in italiano per tutto il sito, le guide inglesi lo correggono qui
    <div lang={lang} className="min-h-screen flex flex-col bg-[var(--ground)] text-[var(--ink)] select-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(graph)} />
      <header className="border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link href={lang === 'en' ? '/en/guides' : '/guide'} className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#0a0f1d] ring-1 ring-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo-mark.png" alt="" aria-hidden width={32} height={32} className="w-[85%] h-[85%] object-contain" />
            </span>
            <span className="min-w-0">
              <span className="font-bold text-base tracking-tight block">VOD – Venice Open Data</span>
              <span className="text-[10px] font-mono text-[var(--ink-3)] block -mt-0.5">{t.tagline}</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1.5 flex-wrap text-xs font-mono" aria-label={t.guides}>
            {t.nav.map((n) => (
              <Link key={n.href} href={n.href} className="px-2.5 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/60">
                {n.label}
              </Link>
            ))}
            <Link href={alternatePath} hrefLang={lang === 'it' ? 'en' : 'it'} className="px-2.5 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)]">
              {t.other}
            </Link>
            <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
              <MapIcon className="w-3.5 h-3.5" aria-hidden /> {t.map}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        <nav aria-label={t.crumbs} className="text-xs font-mono text-[var(--ink-3)]">
          <ol className="flex flex-wrap items-center gap-1">
            {trail.map((c, i) => (
              <li key={c.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" aria-hidden />}
                {i === trail.length - 1 ? (
                  <span aria-current="page" className="text-[var(--ink-2)]">{c.name}</span>
                ) : (
                  <Link href={c.path} className="hover:text-cyan-400">{c.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {children}
      </main>

      <footer className="border-t border-[var(--rule)] py-6 px-4 text-xs text-[var(--ink-3)] font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>{t.footer}</p>
          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            {t.footerLinks.map((f) => (
              <Link key={f.href} href={f.href} className="hover:text-cyan-400">{f.label}</Link>
            ))}
            <a href={SOURCE_CODE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">{t.code}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Invito ad aprire la mappa già pronta (livelli, planner o scenario) */
export function MapCta({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/10">
      <Link href={href} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-[#04121a] font-semibold text-sm hover:bg-cyan-400 shrink-0">
        {label} <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
      {note && <p className="text-xs text-[var(--ink-2)] leading-relaxed">{note}</p>}
    </div>
  );
}

/** Sezione con titolo h2 */
export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-3 scroll-mt-24" aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="text-lg sm:text-xl font-bold tracking-tight border-b border-[var(--rule)] pb-2">{title}</h2>
      {children}
    </section>
  );
}

/** Fonti citate in fondo alla pagina (E-E-A-T: da dove viene ogni dato) */
export function SourceList({ lang, sources }: { lang: GuideLang; sources: { name: string; url: string; license?: string }[] }) {
  return (
    <Section id="fonti" title={lang === 'it' ? 'Fonti dei dati' : 'Data sources'}>
      <ul className="flex flex-col gap-1.5 text-sm text-[var(--ink-2)]">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{s.name}</a>
            {s.license && <span className="text-[var(--ink-3)]"> · {s.license}</span>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Indirizzo relativo da un vodUrl assoluto del planner (resta sul dominio che serve la pagina) */
export function relativeVodUrl(vodUrl: string | null, fallback = '/'): string {
  if (!vodUrl) return fallback;
  try {
    const u = new URL(vodUrl, SITE_URL);
    return `${u.pathname}${u.search}`;
  } catch {
    return fallback;
  }
}
