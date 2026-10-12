'use client';

import React from 'react';
import { Download, ExternalLink, FileText, Info, MessageSquare, Phone, Radio, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CPSM_BULLETIN_PDF } from './ForecastTab';

/** Canali ufficiali del Centro Maree per ricevere previsioni e allerte. */
export const ChannelsTab: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono flex flex-col gap-1.5">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>{t('ui.floodModal.channelsTitle')}</span>
        </div>
        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
          {t('ui.floodModal.channelsSubtitle')}
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-1.5">
          <a
            href={CPSM_BULLETIN_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.downloadBulletinPdf')}</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
          <a
            href="https://www.comune.venezia.it/it/content/centro-previsioni-e-segnalazioni-maree-beta"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink)] text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('ui.floodModal.channelsPortal')}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Grid Canali Ufficiali */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
        {/* 1. Segreteria Telefonica H24 */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{t('ui.floodModal.channelsPhoneH24Title')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              {t('ui.floodModal.badgePhone')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {t('ui.floodModal.channelsPhoneH24Desc')}
          </p>
          <a
            href="tel:0412411996"
            className="self-start mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 font-bold text-xs transition-colors"
          >
            <Phone className="w-3 h-3" />
            041 2411996
          </a>
        </div>

        {/* 2. Sala Operativa CPSM */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{t('ui.floodModal.channelsPhoneRoomTitle')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
              {t('ui.floodModal.badgeRoom')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {t('ui.floodModal.channelsPhoneRoomDesc')}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <a
              href="tel:0412748787"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 font-bold text-xs transition-colors"
            >
              <Phone className="w-3 h-3" />
              041 2748787
            </a>
            <a
              href="mailto:maree@comune.venezia.it"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] text-[11px] transition-colors"
            >
              maree@comune.venezia.it
            </a>
          </div>
        </div>

        {/* 3. Telegram */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <Send className="w-4 h-4 text-sky-400" />
              <span>{t('ui.floodModal.channelsTelegramTitle')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
              {t('ui.floodModal.badgeTelegram')}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px] text-[var(--ink-3)]">
            <div>
              <strong className="text-[var(--ink-2)]">{t('ui.floodModal.labelBot')}:</strong> {t('ui.floodModal.channelsTelegramBotDesc')}
            </div>
            <div>
              <strong className="text-[var(--ink-2)]">{t('ui.floodModal.labelAlerts')}:</strong> {t('ui.floodModal.channelsTelegramAlertDesc')}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <a
              href="https://t.me/Centromareevenezia_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 font-bold text-xs transition-colors"
            >
              <Send className="w-3 h-3" />
              @Centromareevenezia_bot
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <a
              href="https://t.me/CentroMareeAvvisa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 font-bold text-xs transition-colors"
            >
              @CentroMareeAvvisa
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* 4. SMS Gratuito */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{t('ui.floodModal.channelsSmsTitle')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              {t('ui.floodModal.badgeSms')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {t('ui.floodModal.channelsSmsDesc')}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <span className="px-2 py-0.5 rounded bg-[var(--rule)] text-[11px] font-bold text-[var(--ink)]">
              {t('ui.floodModal.smsNumber', { n: '342 4141041' })}
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">
              {t('ui.floodModal.smsCommands', { c: 'MAREA | MAREA ON | MAREA OFF' })}
            </span>
          </div>
        </div>

        {/* 5. Twitter / X */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span>{t('ui.floodModal.channelsTwitterTitle')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
              {t('ui.floodModal.badgeLive')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {t('ui.floodModal.channelsTwitterDesc')}
          </p>
          <a
            href="https://twitter.com/ICPSMVenezia"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 font-bold text-xs transition-colors"
          >
            @ICPSMVenezia
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {/* 6. Display Cittadini */}
        <div className="p-3.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>{t('ui.floodModal.channelsDisplaysTitle')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
              {t('ui.floodModal.badgeDisplays')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {t('ui.floodModal.channelsDisplaysDesc')}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--ink-3)] mt-auto">
            <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]">Ca&apos; Loredan</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]">Rialto ACTV</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]">Burano ACTV</span>
          </div>
        </div>
      </div>

      {/* Civil Protection Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono flex items-start gap-2.5 text-amber-200 mt-1">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-amber-300">
            {t('ui.floodModal.disclaimerTitle')}
          </span>
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            {t('ui.floodModal.disclaimerBody')}
          </p>
        </div>
      </div>
    </div>
  );
};
