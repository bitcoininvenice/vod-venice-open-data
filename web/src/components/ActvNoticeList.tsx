'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ACTV_INFOMOBILITY_PAGE, type ActvNotice } from '@/lib/contracts/actvNotices';
import { safeUrl } from '@/lib/safeUrl';

const dateOf = (iso: string, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', timeZone: 'Europe/Rome' }) : '';

/** Un avviso: titolo, data di pubblicazione, linee citate e link all'avviso ufficiale. */
const NoticeEntry: React.FC<{ n: ActvNotice; withText?: boolean }> = ({ n, withText }) => {
  const { t, language } = useTranslation();
  return (
    <div className="flex flex-col gap-0.5 text-[11px]">
      <span className="font-mono text-[10px] text-[var(--ink-3)]">
        {t('ui.actvNotice.published', { date: dateOf(n.publishedAt, language === 'it' ? 'it-IT' : 'en-GB') })}
        {n.lines.length > 0 && ` · ${t('ui.actvNotice.lines', { lines: n.lines.join(', ') })}`}
      </span>
      <a href={safeUrl(n.url) ?? ACTV_INFOMOBILITY_PAGE} target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] font-semibold hover:underline leading-snug">
        {n.title}
      </a>
      {withText && <span className="text-[var(--ink-2)] leading-snug">{n.text}</span>}
    </div>
  );
};

/** Riquadro degli avvisi ACTV in una scheda (fermata o mezzo). */
export const ActvNoticeBox: React.FC<{ here: ActvNotice[]; onLines: ActvNotice[] }> = ({ here, onLines }) => {
  const { t } = useTranslation();
  if (here.length + onLines.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30" data-testid="actv-notices">
      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
        <Megaphone className="w-4 h-4 shrink-0" aria-hidden />
        {t('ui.actvNotice.title')}
      </span>
      {here.map((n) => (
        <NoticeEntry key={n.id} n={n} withText />
      ))}
      {onLines.length > 0 && <span className="text-[10px] font-mono uppercase text-[var(--ink-3)] pt-1">{t('ui.actvNotice.onLines')}</span>}
      {onLines.map((n) => (
        <NoticeEntry key={n.id} n={n} />
      ))}
      <span className="text-[10px] text-[var(--ink-3)]">{t('ui.actvNotice.note')}</span>
    </section>
  );
};

/** Scheda di un avviso dal livello "Avvisi ACTV". */
export const ActvNoticeBody: React.FC<{ notice: ActvNotice }> = ({ notice: n }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3" data-testid="actv-notice-card">
      <p className="text-[var(--ink)] leading-relaxed">{n.text}</p>
      {n.stops.length > 0 && (
        <span className="text-[11px] text-[var(--ink-2)]">
          {t('ui.actvNotice.stops', { stops: [...new Set(n.stops.map((s) => s.name))].join(', ') })}
        </span>
      )}
      {n.lines.length > 0 && <span className="text-[11px] text-[var(--ink-2)]">{t('ui.actvNotice.lines', { lines: n.lines.join(', ') })}</span>}
      <a href={safeUrl(n.url) ?? ACTV_INFOMOBILITY_PAGE} target="_blank" rel="noopener noreferrer" className="text-[11px] text-cyan-400 hover:underline self-start">
        {t('ui.actvNotice.open')}
      </a>
      <p className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">{t('ui.actvNotice.note')}</p>
    </div>
  );
};

/** Avvisi senza una fermata precisa, elencati sotto la voce del livello nel pannello. */
export const UnplacedActvNotices: React.FC<{ notices: ActvNotice[] }> = ({ notices }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1 px-2.5 pb-1 text-[10px] text-[var(--ink-2)]" data-testid="unplaced-actv-notices">
      {notices.length > 0 && (
        <details>
          <summary className="cursor-pointer hover:text-[var(--ink)]">{t('ui.layerPanel.actvNoticesUnplaced', { n: notices.length })}</summary>
          <ul className="flex flex-col gap-2 mt-1.5 max-h-72 overflow-y-auto pr-1">
            {notices.map((n) => (
              <li key={n.id} className="border-t border-[var(--rule)] pt-1.5">
                <NoticeEntry n={n} />
              </li>
            ))}
          </ul>
        </details>
      )}
      <a href={ACTV_INFOMOBILITY_PAGE} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
        {t('ui.layerPanel.actvNoticesAll')}
      </a>
    </div>
  );
};
