'use client';

import React, { useState } from 'react';
import { Bot, Check, Copy, Database, Download, Link2, ShieldCheck, Terminal } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';
import { copyToClipboard } from '@/lib/dataExport';
import { MCP_DATASETS, MCP_RELATED_SERVICES, type McpDatasetKind } from '@/lib/mcp/catalog';
import { MCP_ENDPOINT, SITE_URL } from '@/lib/site';

const SKILL_ZIP = `${SITE_URL}/downloads/venice-open-data-skill.zip`;

const KIND_CLS: Record<McpDatasetKind, string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  forecast: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  simulated: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  dataset: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  osm: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  curated: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

function CopyBlock({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--rule)] font-mono text-xs">
      <pre className="flex-1 whitespace-pre-wrap break-all text-[var(--ink)]">{text}</pre>
      <button
        type="button"
        onClick={async () => {
          if (await copyToClipboard(text)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
        className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] cursor-pointer"
        aria-label={label}
        title={label}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function McpPage() {
  const { t, language } = useTranslation();
  const p = (key: string, params?: Record<string, string | number>) => t(`ui.mcpPage.${key}`, params);
  // Sempre l'indirizzo pubblico, anche aprendo la pagina in locale o in anteprima
  const endpoint = MCP_ENDPOINT;

  const clients = [
    { id: 'claude', title: p('claudeTitle'), body: p('claudeBody'), code: endpoint },
    { id: 'chatgpt', title: p('chatgptTitle'), body: p('chatgptBody'), code: endpoint },
    { id: 'claudeCode', title: p('claudeCodeTitle'), body: p('claudeCodeBody'), code: `claude mcp add --transport http vod ${endpoint}` },
    { id: 'json', title: p('jsonTitle'), body: p('jsonBody'), code: JSON.stringify({ mcpServers: { vod: { url: endpoint } } }, null, 2) },
  ];

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between">
      <SiteHeader page="mcp" subtitle={p('subtitle')} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold w-max border border-cyan-500/30">
            <Bot className="w-3.5 h-3.5" /> MCP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{p('title')}</h1>
          <p className="text-sm text-[var(--ink-2)] max-w-3xl leading-relaxed">{p('intro', { n: MCP_DATASETS.length })}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase font-mono text-[var(--ink-3)]">{p('endpointTitle')}</h2>
          <CopyBlock text={endpoint} label={p('copy')} />
          <p className="text-xs text-[var(--ink-3)]">{p('endpointNote')}</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map((c) => (
            <div key={c.id} className="glass-panel rounded-2xl p-4 border border-[var(--rule)] flex flex-col gap-2">
              <h3 className="font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                {c.title}
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">{c.body}</p>
              <CopyBlock text={c.code} label={p('copy')} />
            </div>
          ))}
        </section>

        <section className="glass-panel rounded-2xl p-5 border border-cyan-500/30 flex flex-col gap-3">
          <h2 className="font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            {p('skillTitle')}
          </h2>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">{p('skillIntro')}</p>
          <a
            href="/downloads/venice-open-data-skill.zip"
            download
            className="flex items-center gap-2 w-max px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            {p('skillDownload')}
          </a>
          <ul className="text-xs text-[var(--ink-2)] flex flex-col gap-1.5">
            <li>• {p('skillClaudeAi')}</li>
            <li>• {p('skillClaudeCode')}</li>
            <li>• {p('skillCli')}</li>
          </ul>
          <CopyBlock text={`curl -L -o vod-skill.zip ${SKILL_ZIP} && unzip vod-skill.zip -d ~/.claude/skills/`} label={p('copy')} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase font-mono text-[var(--ink-3)]">{p('examplesTitle')}</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {['example1', 'example2', 'example3', 'example4'].map((k) => (
              <li key={k} className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-[var(--ink)]">“{p(k)}”</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase font-mono text-[var(--ink-3)] flex items-center gap-2">
            <Database className="w-4 h-4" />
            {p('datasetsTitle', { n: MCP_DATASETS.length })}
          </h2>
          <div className="flex flex-col divide-y divide-[var(--rule)] border border-[var(--rule)] rounded-2xl overflow-hidden">
            {MCP_DATASETS.map((d) => (
              <div key={d.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                <code className="font-mono text-cyan-400 sm:w-48 shrink-0">{d.id}</code>
                <span className="flex-1 text-[var(--ink)]">{language === 'it' ? d.title : d.titleEn}</span>
                <span className={`px-2 py-0.5 rounded-full border font-mono text-[10px] w-max ${KIND_CLS[d.kind]}`}>{p(`kind_${d.kind}`)}</span>
                <span className="text-[var(--ink-3)] sm:w-56 shrink-0 truncate" title={`${d.source} · ${d.license}`}>{d.license}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase font-mono text-[var(--ink-3)] flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {p('relatedTitle')}
          </h2>
          <p className="text-xs text-[var(--ink-2)]">{p('relatedIntro')}</p>
          {MCP_RELATED_SERVICES.map((s) => (
            <div key={s.id} className="p-3 rounded-xl border border-[var(--rule)] bg-[var(--rule)]/20 flex flex-col gap-1.5 text-xs">
              <a href={s.about} target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:underline">{s.name}</a>
              <span className="text-[var(--ink-2)]">{p('relatedCruscotto')}</span>
              <CopyBlock text={s.endpoint} label={p('copy')} />
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase font-mono text-[var(--ink-3)]">{p('practicesTitle')}</h2>
          <ul className="text-xs text-[var(--ink-2)] flex flex-col gap-1.5">
            {['practice1', 'practice2', 'practice3', 'practice4'].map((k) => (
              <li key={k}>• {p(k, { site: SITE_URL })}</li>
            ))}
          </ul>
        </section>

        <section className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-1.5 text-xs text-[var(--ink-2)]">
          <h2 className="font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {p('rulesTitle')}
          </h2>
          {['rule1', 'rule2', 'rule3', 'rule4'].map((k) => (
            <p key={k}>• {p(k)}</p>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
