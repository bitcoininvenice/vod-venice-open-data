'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { TideForecast } from '@/lib/contracts/tide';
import { formatSignedCm, romeLocalToDate } from '@/lib/time';
import { getFloodedGroundPercentage } from '@/lib/flood';
import { useTranslation } from '@/lib/i18n';
import { TrendingUp, TrendingDown, Waves, Play } from 'lucide-react';

interface TideForecastChartProps {
  forecast: TideForecast;
  liveTideLevel?: number | null;
  onSimulateLevel?: (cm: number) => void;
}

export const TideForecastChart: React.FC<TideForecastChartProps> = ({
  forecast,
  liveTideLevel,
  onSimulateLevel,
}) => {
  const { t, language } = useTranslation();
  const extremes = forecast.extremes;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // Linea "adesso", aggiornata ogni minuto
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  // 1. Ordina e calcola timestamp reali di ciascun estremale
  const parsed = useMemo(() => {
    if (!extremes || extremes.length === 0) return [];
    return extremes
      .map((ex, index) => {
        const date = romeLocalToDate(ex.at);
        return {
          ...ex,
          index,
          date,
          time: date.getTime(),
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [extremes]);

  // Se ci sono meno di 2 estremali, il grafico non ha abbastanza punti per la curva
  if (parsed.length < 2) {
    return (
      <div className="p-6 text-center text-xs font-mono text-[var(--ink-3)] bg-[var(--rule)]/20 rounded-xl">
        {t('ui.floodModal.noForecast')}
      </div>
    );
  }

  // 2. Calcolo coordinate e domini
  const minTime = parsed[0].time;
  const maxTime = parsed[parsed.length - 1].time;
  const totalDuration = Math.max(1, maxTime - minTime);

  // Calcolo limiti Y (almeno da -25 cm a +100 cm, espandibile se ci sono picchi maggiori o minori)
  const minCm = Math.min(...parsed.map((p) => p.levelCm), -20);
  const maxCm = Math.max(...parsed.map((p) => p.levelCm), 95);
  const minY = Math.floor((minCm - 5) / 25) * 25;
  const maxY = Math.ceil((maxCm + 10) / 25) * 25;
  const spanY = Math.max(25, maxY - minY);

  // Dimensioni SVG responsive
  const svgWidth = 800;
  const svgHeight = 310;
  const marginLeft = 48;
  const marginRight = 24;
  const marginTop = 36;
  const marginBottom = 34;

  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  const timeToX = (tMs: number) =>
    marginLeft + ((tMs - minTime) / totalDuration) * plotWidth;

  const cmToY = (cm: number) =>
    marginTop + ((maxY - cm) / spanY) * plotHeight;

  // 3. Generazione curva continua sinusoidale armonica
  const curvePoints: [number, number][] = [];
  for (let i = 0; i < parsed.length - 1; i++) {
    const e1 = parsed[i];
    const e2 = parsed[i + 1];
    const steps = 24; // campionamento ogni ~15 minuti

    for (let s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue; // evita duplicati
      const alpha = s / steps;
      const tMs = e1.time + alpha * (e2.time - e1.time);
      const mid = (e1.levelCm + e2.levelCm) / 2;
      const halfSpan = (e1.levelCm - e2.levelCm) / 2;
      const cm = mid + halfSpan * Math.cos(Math.PI * alpha);
      curvePoints.push([timeToX(tMs), cmToY(cm)]);
    }
  }

  const linePathD = curvePoints.reduce(
    (acc, [x, y], idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`,
    ''
  );

  const baseY = cmToY(minY);
  const areaPathD = `${linePathD} L ${curvePoints[curvePoints.length - 1][0].toFixed(1)} ${baseY.toFixed(1)} L ${curvePoints[0][0].toFixed(1)} ${baseY.toFixed(1)} Z`;

  // 4. Linee orizzontali di riferimento
  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 25) {
    yTicks.push(v);
  }

  // 5. Mezzanotti in ora di Roma (le date degli estremi sono già locali di Venezia)
  const dayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });
  const dayDividers: { time: number; x: number; label: string }[] = [];
  const days = Array.from(new Set(parsed.map((p) => p.at.slice(0, 10))));
  for (const day of days) {
    const tMs = romeLocalToDate(`${day} 00:00:00`).getTime();
    if (tMs > minTime && tMs <= maxTime) dayDividers.push({ time: tMs, x: timeToX(tMs), label: dayFormat.format(tMs) });
  }

  // Etichette dei giorni centrati tra i divisori
  const dayHeaders: { label: string; centerX: number }[] = [];
  const boundaries = [minTime, ...dayDividers.map((d) => d.time), maxTime];
  const uniqueBoundaries = Array.from(new Set(boundaries)).sort((a, b) => a - b);

  for (let i = 0; i < uniqueBoundaries.length - 1; i++) {
    const t1 = uniqueBoundaries[i];
    const t2 = uniqueBoundaries[i + 1];
    const midTime = (t1 + t2) / 2;
    const dayLabel = dayFormat.format(midTime);

    const x1 = timeToX(t1);
    const x2 = timeToX(t2);
    if (x2 - x1 >= 50) {
      dayHeaders.push({ label: dayLabel, centerX: (x1 + x2) / 2 });
    }
  }

  // Istante attuale (adesso)
  const hasNow = nowMs >= minTime && nowMs <= maxTime;
  const nowX = hasNow ? timeToX(nowMs) : null;

  // Punto attivo per il tooltip (hover oppure selezionato)
  const activePointIdx = hoveredIdx ?? selectedIdx;
  const activePoint = activePointIdx !== null ? parsed[activePointIdx] : null;

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-[var(--rule)]/25 border border-[var(--rule)] shadow-inner">
      {/* Intestazione del grafico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-[var(--ink)]">
            {t('ui.tideChart.title')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <strong className="text-[var(--ink-2)]">
              {t('ui.tideChart.predicted')}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
            <span>+80 cm San Marco</span>
          </span>
          {maxY >= 110 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400 inline-block" />
              <span>+110 cm MOSE</span>
            </span>
          )}
        </div>
      </div>

      {forecast.stale && (
        <p className="text-[11px] font-mono text-amber-400">{t('ui.tideChart.stale', { at: forecast.issuedAt.slice(0, 16) })}</p>
      )}

      {/* SVG Container Interattivo */}
      <div className="relative w-full aspect-[800/310] max-h-[340px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible font-mono"
        >
          <defs>
            <linearGradient id="tideAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#e11d48" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="sanMarcoZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Area di Allagamento San Marco (Sopra +80 cm) */}
          {maxY > 80 && (
            <rect
              x={marginLeft}
              y={cmToY(maxY)}
              width={plotWidth}
              height={Math.max(0, cmToY(80) - cmToY(maxY))}
              fill="url(#sanMarcoZoneGrad)"
            />
          )}

          {/* Area normale (Sotto +80 cm) */}
          <rect
            x={marginLeft}
            y={cmToY(Math.min(80, maxY))}
            width={plotWidth}
            height={Math.max(0, cmToY(minY) - cmToY(Math.min(80, maxY)))}
            fill="rgba(16, 185, 129, 0.04)"
          />

          {/* Linee di griglia orizzontali e Quote Y */}
          {yTicks.map((tick) => {
            const y = cmToY(tick);
            const isZero = tick === 0;
            const is80 = tick === 80;
            const is110 = tick === 110;

            return (
              <g key={tick}>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={svgWidth - marginRight}
                  y2={y}
                  stroke={
                    is110
                      ? '#f43f5e'
                      : is80
                      ? '#f59e0b'
                      : isZero
                      ? 'var(--rule)'
                      : 'var(--rule)'
                  }
                  strokeWidth={isZero ? 1.5 : is80 || is110 ? 1.2 : 0.7}
                  strokeDasharray={is80 || is110 ? '4 3' : undefined}
                  strokeOpacity={isZero ? 0.9 : is80 || is110 ? 0.8 : 0.4}
                />
                <text
                  x={marginLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill={is110 ? '#f43f5e' : is80 ? '#f59e0b' : 'var(--ink-3)'}
                  fontWeight={is80 || is110 || isZero ? 'bold' : 'normal'}
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              </g>
            );
          })}

          {/* Titolo asse Y */}
          <text
            x={12}
            y={svgHeight / 2}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-3)"
            transform={`rotate(-90 12 ${svgHeight / 2})`}
          >
            {t('ui.tideChart.axis')}
          </text>

          {/* Separatori e Intestazioni Giorni (in alto) */}
          {dayDividers.map((d, i) => (
            <line
              key={i}
              x1={d.x}
              y1={marginTop - 10}
              x2={d.x}
              y2={cmToY(minY)}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.5"
            />
          ))}

          {dayHeaders.map((dh, i) => (
            <text
              key={i}
              x={dh.centerX}
              y={marginTop - 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="var(--ink-2)"
            >
              {dh.label}
            </text>
          ))}

          {/* Linea tempo corrente (Adesso) */}
          {hasNow && nowX !== null && (
            <g>
              <line
                x1={nowX}
                y1={marginTop - 6}
                x2={nowX}
                y2={cmToY(minY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={nowX}
                y={cmToY(minY) + 16}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#38bdf8"
              >
                {t('ui.tideChart.now')}
              </text>
              {liveTideLevel !== null && liveTideLevel !== undefined && (
                <circle
                  cx={nowX}
                  cy={cmToY(liveTideLevel)}
                  r="4"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}

          {/* Area riempita sotto la curva */}
          <path d={areaPathD} fill="url(#tideAreaGrad)" />

          {/* Tracciato continuo della marea (Curva Rossa) */}
          <path
            d={linePathD}
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Punti Estremali (Colmi e Cavi) */}
          {parsed.map((p, idx) => {
            const cx = timeToX(p.time);
            const cy = cmToY(p.levelCm);
            const isHover = hoveredIdx === idx || selectedIdx === idx;
            const isMax = p.type === 'max';
            const isHigh = p.levelCm >= 80;

            return (
              <g
                key={p.at}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  setSelectedIdx(idx);
                  onSimulateLevel?.(p.levelCm);
                }}
              >
                {/* Hit target invisibile allargato per mobile */}
                <circle cx={cx} cy={cy} r="18" fill="transparent" />

                {/* Cerchio visibile */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHover ? 6 : 4}
                  fill={isHigh ? '#f43f5e' : isMax ? '#e11d48' : '#be123c'}
                  stroke="#ffffff"
                  strokeWidth={isHover ? 2.5 : 1.5}
                  className="transition-all duration-150 shadow-sm"
                />

                {/* Linea guida tratteggiata verso il basso se selezionato o in hover */}
                {isHover && (
                  <line
                    x1={cx}
                    y1={cy + 7}
                    x2={cx}
                    y2={cmToY(minY)}
                    stroke="#e11d48"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity="0.6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip interattivo (stile portale CPSM) */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[var(--ground)]/95 backdrop-blur-md border border-[var(--rule)] text-[var(--ink)] p-2.5 rounded-xl shadow-xl flex flex-col gap-1 text-[11px] font-mono min-w-[170px]"
            style={{
              left: `${(timeToX(activePoint.time) / svgWidth) * 100}%`,
              top: `${(cmToY(activePoint.levelCm) / svgHeight) * 100}%`,
            }}
          >
            <div className="font-bold text-xs text-[var(--ink)]">
              {new Intl.DateTimeFormat(locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Rome',
              }).format(activePoint.date)}
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>
                {t('ui.tideChart.predicted')}:{' '}
                <strong
                  className={`text-sm ${
                    activePoint.levelCm >= 110
                      ? 'text-rose-400'
                      : activePoint.levelCm >= 80
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }`}
                >
                  {formatSignedCm(activePoint.levelCm)}
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--ink-3)] pt-1 border-t border-[var(--rule)]/50">
              <span className="flex items-center gap-1">
                {activePoint.type === 'max' ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-rose-400" />
                    <span>{t('ui.floodModal.peakMax')}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-cyan-400" />
                    <span>{t('ui.floodModal.peakMin')}</span>
                  </>
                )}
              </span>

              {getFloodedGroundPercentage(activePoint.levelCm) > 0 && (
                <span className="text-amber-400 font-semibold">
                  {t('ui.tideChart.flooded', { pct: getFloodedGroundPercentage(activePoint.levelCm) })}
                </span>
              )}
            </div>

            {onSimulateLevel && (
              <div className="text-[9px] text-cyan-400 pt-0.5 font-bold flex items-center gap-1">
                <Play className="w-2.5 h-2.5" />
                <span>{t('ui.tideChart.clickToSimulate')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Didascalia ufficiale istituzionale ZMPS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[var(--ink-3)] pt-1 border-t border-[var(--rule)]/40 gap-1">
        <span>{t('ui.tideChart.datum')}</span>
        <span className="text-[var(--ink-2)] font-semibold">{t('ui.tideChart.clickHint')}</span>
      </div>
    </div>
  );
};
