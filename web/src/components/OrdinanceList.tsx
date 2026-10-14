'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ORDINANCES_PAGE, type OrdinanceItem } from '@/lib/contracts/ordinances';

const dmy = (d: string | null) => (d ? d.split('-').reverse().join('/') : '');

/** Periodo di validità, oppure l'avviso che va letto nell'atto */
const OrdinancePeriod: React.FC<{ o: OrdinanceItem }> = ({ o }) => {
  const { t } = useTranslation();
  return (
    <span className="font-mono text-[10px] text-[var(--ink-2)]">
      {o.status === 'unverified'
        ? t('ui.ordinance.unverified')
        : o.validTo
        ? t('ui.ordinance.period', { from: dmy(o.validFrom ?? o.date), to: dmy(o.validTo) })
        : t('ui.ordinance.from', { from: dmy(o.validFrom ?? o.date) })}
    </span>
  );
};

/** Link all'atto ufficiale e al PDF firmato */
const OrdinanceLinks: React.FC<{ o: OrdinanceItem }> = ({ o }) => {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap gap-3">
      <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
        {t('ui.ordinance.openAct', { n: o.number, date: dmy(o.date) })}
      </a>
      {o.pdfUrl && (
        <a href={o.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
          PDF
        </a>
      )}
    </span>
  );
};

/** Ordinanze temporanee che riguardano un canale: periodo, tipo e link all'atto del Comune. */
export const OrdinanceList: React.FC<{ ordinances: OrdinanceItem[] }> = ({ ordinances }) => {
  const { t } = useTranslation();
  if (ordinances.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/35" data-testid="canal-ordinances">
      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
        {t('ui.ordinance.title', { n: ordinances.length })}
      </span>
      {ordinances.map((o) => (
        <div key={o.id} className="flex flex-col gap-0.5 border-t border-amber-500/20 pt-1.5 text-[11px]">
          <span className="font-mono text-[10px] uppercase text-amber-400">
            {t(`ui.ordinance.kind_${o.kind}`)}
            {o.status === 'upcoming' && ` · ${t('ui.ordinance.upcoming')}`}
          </span>
          <span className="text-[var(--ink)] leading-snug">{o.title}</span>
          <OrdinancePeriod o={o} />
          <OrdinanceLinks o={o} />
        </div>
      ))}
      <span className="text-[10px] text-[var(--ink-3)]">{t('ui.ordinance.note')}</span>
    </div>
  );
};

/** Scheda di un'ordinanza del livello "Ordinanze del Comune": testo del titolo, validità, ambito e provenienza della posizione. */
export const OrdinanceBody: React.FC<{ ordinance: OrdinanceItem }> = ({ ordinance: o }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3" data-testid="ordinance-card">
      {o.status === 'upcoming' && (
        <span className="self-start text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {t('ui.ordinance.upcoming')}
        </span>
      )}
      <p className="text-[var(--ink)] leading-snug">{o.title}</p>
      <div className="flex flex-col gap-1 text-[11px]">
        <OrdinancePeriod o={o} />
        <span className="font-mono text-[10px] text-[var(--ink-3)]">{t('ui.ordinance.ambito', { ambito: o.ambito })}</span>
        <OrdinanceLinks o={o} />
      </div>
      <p className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
        {t(`ui.ordinance.position_${o.positionSource ?? 'comune'}`, { name: o.placeName ?? o.canalName ?? '' })} {t('ui.ordinance.prevails')}
      </p>
    </div>
  );
};

/** Atti in vigore senza posizione (es. per tutto il territorio comunale), elencati nel pannello del livello. */
export const UnplacedOrdinances: React.FC<{ ordinances: OrdinanceItem[] }> = ({ ordinances }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1 px-2.5 pb-1 text-[10px] text-[var(--ink-2)]" data-testid="unplaced-ordinances">
      {ordinances.length > 0 && (
        <details>
          <summary className="cursor-pointer hover:text-[var(--ink)]">{t('ui.layerPanel.ordinancesUnplaced', { n: ordinances.length })}</summary>
          <ul className="flex flex-col gap-2 mt-1.5 max-h-72 overflow-y-auto pr-1">
            {ordinances.map((o) => (
              <li key={o.id} className="flex flex-col gap-0.5 border-t border-[var(--rule)] pt-1.5 text-[11px]">
                <span className="font-mono text-[9px] uppercase text-amber-400">
                  {t(`ui.ordinance.kind_${o.kind}`)} · {o.luogo}
                  {o.status === 'upcoming' && ` · ${t('ui.ordinance.upcoming')}`}
                </span>
                <span className="text-[var(--ink)] leading-snug">{o.title}</span>
                <OrdinancePeriod o={o} />
                <OrdinanceLinks o={o} />
              </li>
            ))}
          </ul>
        </details>
      )}
      <a href={ORDINANCES_PAGE} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
        {t('ui.layerPanel.ordinancesAll')}
      </a>
    </div>
  );
};
