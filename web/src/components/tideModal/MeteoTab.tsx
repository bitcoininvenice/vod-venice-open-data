'use client';

import React, { useMemo } from 'react';
import { Compass, Wind } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { meanDirectionDeg } from '@/lib/flood';
import type { MeteoMarineWindItem } from '@/lib/types';

/** Vento e onde dalle stazioni meteo-marine CPSM, con il regime dominante (scirocco o bora). */
export const MeteoTab: React.FC<{ marineWindStations: MeteoMarineWindItem[] }> = ({ marineWindStations }) => {
  const { t } = useTranslation();

  const meteoAnalysis = useMemo(() => {
    const withWind = marineWindStations.filter((s) => s.windSpeedKnots > 0);
    if (withWind.length === 0) return null;
    const avgDeg = meanDirectionDeg(withWind.map((s) => s.windDirectionDeg));
    if (avgDeg === null) return null;
    return {
      avgDeg,
      maxGust: Math.max(...withWind.map((s) => s.gustSpeedKnots)),
      isScirocco: avgDeg >= 100 && avgDeg <= 180,
      isBora: (avgDeg >= 20 && avgDeg <= 80) || avgDeg >= 340,
    };
  }, [marineWindStations]);

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)] mb-1">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span>{t('ui.floodModal.marineTitle')}</span>
        </div>
        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
          {t('ui.floodModal.marineSubtitle')}
        </p>
      </div>

      {/* Wind Regime Diagnosis */}
      {meteoAnalysis && (
        <div className={`p-3 rounded-xl border text-xs font-mono ${
          meteoAnalysis.isScirocco
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            : meteoAnalysis.isBora
            ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
            : 'bg-[var(--rule)]/25 border-[var(--rule)] text-[var(--ink-2)]'
        }`}>
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.windSummary', { deg: meteoAnalysis.avgDeg, gust: meteoAnalysis.maxGust })}</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {meteoAnalysis.isScirocco
              ? t('ui.floodModal.windRegimeScirocco')
              : meteoAnalysis.isBora
              ? t('ui.floodModal.windRegimeBora')
              : t('ui.floodModal.windRegimeStandard')}
          </p>
        </div>
      )}

      {/* Station Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {marineWindStations.slice(0, 6).map((st) => (
          <div key={st.id} className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ink)] truncate">{st.stationName}</span>
              <span className="text-[10px] text-cyan-400 font-semibold shrink-0 ml-1">{st.windDirection}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--ink-3)]">
              <div>
                {t('ui.floodModal.wind')}: <strong className="text-[var(--ink)]">{st.windSpeedKnots} kt</strong> ({st.windSpeedKmh} km/h)
              </div>
              <div>
                {t('ui.floodModal.gust')}: <strong className="text-[var(--ink)]">{st.gustSpeedKnots} kt</strong>
              </div>
              {st.waveHeightMeters !== null && (
                <div className="col-span-2 text-cyan-300">
                  {t('ui.floodModal.wave')}: <strong className="text-[var(--ink)]">{st.waveHeightMeters} m</strong>
                </div>
              )}
              {st.airTempCelsius !== undefined && (
                <div>
                  {t('ui.floodModal.temp')}: <strong className="text-[var(--ink)]">{st.airTempCelsius}°C</strong>
                </div>
              )}
              {st.pressureHpa !== undefined && (
                <div>
                  {t('ui.floodModal.pressure')}: <strong className="text-[var(--ink)]">{st.pressureHpa} hPa</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
