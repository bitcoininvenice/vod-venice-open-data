'use client';

import React, { useMemo } from 'react';
import { Download, ExternalLink, Radio, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatLocalStamp, formatSignedCm } from '@/lib/time';
import { getFloodedGroundPercentage, romeLocalNow } from '@/lib/flood';
import { MOSE_THRESHOLD_CM } from '@/lib/tideCurve';
import type { TideForecast } from '@/lib/contracts/tide';
import { TideForecastChart } from '../TideForecastChart';
import { formatExtremeStamp } from './format';

export const CPSM_BULLETIN_PDF = 'https://www.comune.venezia.it/sites/default/files/publicCPSM/bollettino/bollettinoMaree.pdf';

interface ForecastTabProps {
  forecast?: TideForecast | null;
  liveTideLevel: number | null;
  /** simula il livello di un estremo e torna al simulatore */
  onSimulate: (cm: number) => void;
  onShowChannels: () => void;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({ forecast, liveTideLevel, onSimulate, onShowChannels }) => {
  const { t, language } = useTranslation();
  const extremes = forecast?.extremes ?? [];

  // Primo colmo da MOSE ancora nel futuro (con previsione aggiornata)
  const futureMosePeak = useMemo(() => {
    if (!forecast || forecast.stale) return null;
    const now = romeLocalNow();
    return forecast.extremes.find((e) => e.type === 'max' && e.levelCm >= MOSE_THRESHOLD_CM && e.at > now) ?? null;
  }, [forecast]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {forecast?.issuedAt && (
            <span className="text-[var(--ink-3)]">
              {t('ui.floodModal.bulletinIssued')}: <strong className="text-[var(--ink)]">{formatLocalStamp(forecast.issuedAt)}</strong>
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">{t('ui.floodModal.officialForecast')}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={CPSM_BULLETIN_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.downloadBulletinPdf')}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
          <button
            type="button"
            onClick={onShowChannels}
            className="px-2.5 py-1 rounded-lg bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{t('ui.floodModal.viewAllChannels')}</span>
          </button>
        </div>
      </div>

      {futureMosePeak && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-mono flex items-start gap-2.5 text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">
              {t('ui.floodModal.futureMoseWarning')} {formatSignedCm(futureMosePeak.levelCm)}
            </span>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              {t('ui.floodModal.futureMoseBody', { at: formatExtremeStamp(futureMosePeak.at, language) })}
            </p>
          </div>
        </div>
      )}

      {forecast && extremes.length > 0 && (
        <TideForecastChart forecast={forecast} liveTideLevel={liveTideLevel} onSimulateLevel={onSimulate} />
      )}

      <div className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1 text-[11px] font-mono text-[var(--ink-3)]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[var(--ink-2)]">{t('ui.floodModal.forecastNoteTitle')}</span>
          <span className="text-cyan-400">Punta della Salute</span>
        </div>
        <p>{t('ui.floodModal.forecastNoteBody')}</p>
      </div>

      <div className="flex flex-col gap-2">
        {extremes.length > 0 ? (
          extremes.map((ex) => {
            const isMax = ex.type === 'max';
            const isMose = ex.levelCm >= MOSE_THRESHOLD_CM;
            const flooded = getFloodedGroundPercentage(ex.levelCm);
            return (
              <div
                key={ex.at}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                  isMose
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : isMax && ex.levelCm >= 80
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-[var(--rule)]/25 border-[var(--rule)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isMax ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    {isMax ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{formatExtremeStamp(ex.at, language)}</div>
                    <div className="text-[11px] text-[var(--ink-3)]">{isMax ? t('ui.floodModal.peakMax') : t('ui.floodModal.peakMin')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-base font-bold font-mono ${isMose ? 'text-rose-400' : isMax ? 'text-amber-400' : 'text-blue-400'}`}>
                      {formatSignedCm(ex.levelCm)}
                    </span>
                    {flooded > 0 && (
                      <span className="text-[10px] text-blue-300 font-mono font-semibold">{t('ui.floodModal.floodedShort', { pct: flooded })}</span>
                    )}
                    {isMose && <div className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold mt-0.5">MOSE</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSimulate(ex.levelCm)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--rule)] hover:bg-blue-500 hover:text-white text-[11px] font-mono transition-all cursor-pointer"
                    title={t('ui.floodModal.simulatePeak')}
                  >
                    {t('ui.floodModal.simulate')}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs font-mono text-[var(--ink-3)] bg-[var(--rule)]/20 rounded-xl">{t('ui.floodModal.noForecast')}</div>
        )}
      </div>
    </div>
  );
};
