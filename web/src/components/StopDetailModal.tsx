'use client';

import React, { useEffect, useState } from 'react';
import { X, Anchor, Accessibility, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { StopItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { DELAY_COLORS, delayMinutes, type StopArrival } from '@/lib/realtimeDelay';

interface StopDetailModalProps {
  stop: StopItem | null;
  onClose: () => void;
  currentTimeSeconds: number;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  onClose
}) => {
  const { t } = useTranslation();
  if (!stop) return null;

  const lines = stop.lines ?? [];

  return (
    <InfoPanel open={stop !== null} onClose={onClose} labelledBy="stop-modal-title" layer="showStops" accent="border-cyan-500/30">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                {t('ui.stop.fermataActvModo', { mode: stop.mode.toUpperCase() })}
              </span>
              <h3 id="stop-modal-title" className="text-base font-bold text-[var(--ink)] leading-snug">
                {stop.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Coordinates */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--ink-3)]" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('common.coordinates')}</span>
              <span className="font-mono text-[var(--ink)]">{stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}</span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('stopModal.accessibility')}</span>
              <span className={stop.wheelchair === undefined ? 'text-[var(--ink-2)]' : stop.wheelchair ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                {stop.wheelchair === undefined ? t('ui.stop.accessNotStated') : stop.wheelchair ? t('stopModal.accessible') : t('ui.stop.accessNo')}
              </span>
            </div>
          </div>
        </div>

        {/* Linee che servono la fermata (dal GTFS) */}
        {lines.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase text-[var(--ink-3)]">{t('stopModal.linesServed')}</span>
          <div className="flex flex-wrap gap-1.5">
            {lines.map((l) => (
              <span
                key={l}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
              >
                {t('ui.stop.linea')} {l}
              </span>
            ))}
          </div>
        </div>
        )}

        <RealtimeArrivals lat={stop.lat} lon={stop.lon} gtfsIds={stop.gtfsIds} />

        {/* Institutional Verification Notice */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{t('ui.stop.datoIstituzionaleGtfsActv')}</span>
          </div>
          <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
            {t('ui.stop.approdoCensitoNelCatalogoOpen')}
          </p>
          <a
            href="https://actv.avmspa.it/it/content/orari-servizio-di-navigazione-0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('ui.stop.orariUfficialiNavigazioneActv')}
          </a>
        </div>
    </InfoPanel>
  );
};

/** Prossimi arrivi con il ritardo stimato da ACTV (GTFS-Realtime), aggiornati ogni 30 s. */
const RealtimeArrivals: React.FC<{ lat: number; lon: number; gtfsIds?: string[] }> = ({ lat, lon, gtfsIds }) => {
  const { t, language } = useTranslation();
  const [state, setState] = useState<{ key: string; arrivals: StopArrival[] | null; failed: boolean }>({ key: '', arrivals: null, failed: false });
  const ids = gtfsIds?.join(',') ?? '';
  const key = `${lat},${lon},${ids}`;

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/realtime/arrivals?lat=${lat}&lon=${lon}${ids ? `&stops=${ids}` : ''}`)
        .then((r) => r.json())
        .then((j) => !cancelled && setState({ key, arrivals: Array.isArray(j.data) ? j.data : [], failed: !j.success }))
        .catch(() => !cancelled && setState({ key, arrivals: [], failed: true }));
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [lat, lon, ids, key]);

  const arrivals = state.key === key ? state.arrivals : null;
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const hhmm = (s: number) => new Date(s * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

  return (
    <section className="flex flex-col gap-1.5" aria-label={t('ui.delay.arrivalsTitle')}>
      <span className="text-[11px] font-mono uppercase text-[var(--ink-3)] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden />
        {t('ui.delay.arrivalsTitle')}
      </span>
      {arrivals === null && <div className="h-10 rounded-xl bg-[var(--rule)]/30 animate-pulse" aria-busy="true" />}
      {arrivals !== null && arrivals.length === 0 && (
        <p className="text-[11px] text-[var(--ink-3)]">{state.failed ? t('ui.delay.unavailable') : t('ui.delay.noArrivals')}</p>
      )}
      {arrivals !== null && arrivals.length > 0 && (
        <ul className="flex flex-col divide-y divide-[var(--rule)] text-xs" data-testid="realtime-arrivals">
          {arrivals.map((a, i) => {
            const min = delayMinutes(a.delaySeconds);
            const label =
              a.status === 'onTime' ? t('ui.delay.onTime') : a.status === 'early' ? t('ui.delay.early', { min: Math.abs(min) }) : t('ui.delay.late', { min });
            return (
              <li key={`${a.line}-${a.time}-${i}`} className="py-1.5 flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] min-w-[2.2rem] text-center border border-[var(--rule)]"
                  style={a.color && a.color !== '#FFFFFF' ? { background: a.color, color: '#fff' } : undefined}
                >
                  {a.line ?? '?'}
                </span>
                <span className="flex-1 min-w-0 truncate text-[var(--ink-2)]" title={a.routeLongName ?? undefined}>
                  {a.routeLongName ?? a.stopName}
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">{hhmm(a.time)}</span>
                <span className="font-mono text-[10px] w-20 text-right" style={{ color: DELAY_COLORS[a.status] }}>{label}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[10px] text-[var(--ink-3)]">{t('ui.delay.arrivalsNote')}</p>
    </section>
  );
};
