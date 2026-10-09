'use client';

import React from 'react';
import { X, Construction, FileText, Euro, Building2, MapPin, ExternalLink, Info } from 'lucide-react';
import { CantiereItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { BdapWorkDetails } from '@/components/BdapWorkDetails';

interface CantiereDetailModalProps {
  cantiere: CantiereItem | null;
  onClose: () => void;
}

const SOURCE_URL = 'https://dati.venezia.it/?q=area-tematica/opere-pubbliche';

/** Scheda di un'opera pubblica dall'Elenco Annuale dei Lavori del Comune di Venezia. */
export const CantiereDetailModal: React.FC<CantiereDetailModalProps> = ({ cantiere, onClose }) => {
  const { t } = useTranslation();
  if (!cantiere) return null;

  return (
    <InfoPanel open={cantiere !== null} onClose={onClose} labelledBy="cantiere-modal-title" layer="showCantieri" accent="border-amber-500/40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Construction className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  {t('ui.publicWork.operaPubblica')} · {cantiere.codice}
                </span>
                <ProvenanceBadge kind="static-reference" detail={t('ui.publicWork.elencoAnnualeLavori2026')} />
              </div>
              <h3 id="cantiere-modal-title" className="text-base font-bold text-[var(--ink)] leading-snug mt-1">
                {cantiere.titolo}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ui.publicWork.chiudi')}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Luogo e stato */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('ui.publicWork.municipalita')}</span>
              <span className="text-[var(--ink)] font-medium">{cantiere.quartiere || 'n.d.'}</span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-start gap-2">
            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('ui.publicWork.statoProgetto')}</span>
              <span className="text-[var(--ink)] font-medium">{cantiere.stato}</span>
              {cantiere.provvedimento && (
                <span className="text-[10px] text-[var(--ink-2)] font-mono block mt-0.5">{cantiere.provvedimento}</span>
              )}
            </div>
          </div>
        </div>

        {/* Importo e responsabile */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('ui.publicWork.importo')}</span>
              <span className="font-mono font-bold text-[var(--ink)] text-sm">
                € {cantiere.importoLavori.toLocaleString('it-IT')}
              </span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('ui.publicWork.stazioneAppaltante')}</span>
              <span className="text-[var(--ink)] text-[11px] leading-tight block">{cantiere.enteResponsabile}</span>
            </div>
          </div>
        </div>

        {/* Classificazione */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] bg-[var(--rule)]/20 border border-[var(--rule)] p-3 rounded-xl">
          <dt className="text-[var(--ink-3)]">{t('ui.publicWork.categoria')}</dt>
          <dd className="text-[var(--ink)]">{cantiere.categoria || 'n.d.'}</dd>
          <dt className="text-[var(--ink-3)]">{t('ui.publicWork.tipologia')}</dt>
          <dd className="text-[var(--ink)]">{cantiere.tipologia || 'n.d.'}</dd>
          {cantiere.finalita && (
            <>
              <dt className="text-[var(--ink-3)]">{t('ui.publicWork.finalita')}</dt>
              <dd className="text-[var(--ink)]">{cantiere.finalita}</dd>
            </>
          )}
          {cantiere.cup && (
            <>
              <dt className="text-[var(--ink-3)]">CUP</dt>
              <dd className="text-[var(--ink)] font-mono">{cantiere.cup}</dd>
            </>
          )}
        </dl>

        {/* Monitoraggio Opere Pubbliche dello Stato (BDAP), collegato per CUP */}
        {cantiere.bdap ? (
          <section className="flex flex-col gap-2 rounded-xl border border-orange-500/30 bg-orange-500/5 p-3" aria-label={t('ui.bdap.sectionTitle')}>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300">{t('ui.bdap.sectionTitle')}</h4>
            <BdapWorkDetails project={cantiere.bdap} />
          </section>
        ) : (
          cantiere.cup && <p className="text-[11px] text-[var(--ink-3)]">{t('ui.bdap.notInMonitoring')}</p>
        )}

        {/* Posizione */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2 text-[11px] text-[var(--ink-2)]">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            {cantiere.posizioneApprossimata
              ? t('ui.publicWork.approxPosition', { place: cantiere.localizzazione })
              : t('ui.publicWork.operaSenzaPosizioneTitoloNon')}
          </span>
        </div>

        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline self-start"
        >
          {t('ui.publicWork.fonteComuneVeneziaDatiVenezia')}
          <ExternalLink className="w-3 h-3" />
        </a>
    </InfoPanel>
  );
};
