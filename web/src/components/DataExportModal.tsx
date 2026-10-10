'use client';

import React, { useState } from 'react';
import { Download, X, FileCode, FileSpreadsheet, Check, CheckSquare, Square, ShieldCheck, Copy, FileCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { buildCsv, buildGeoJson, copyToClipboard, downloadBlob, sha256Hex } from '@/lib/dataExport';
import { isLocated } from '@/lib/types';
import type { CityData } from '@/lib/cityData';
import { Modal } from '@/components/ui/Modal';

interface ExportableLayer {
  id: string;
  name: string;
  count: number;
  getData: () => readonly object[];
}

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dati caricati nella mappa: si esportano gli elenchi con almeno un elemento */
  data: CityData;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose, data }) => {
  const { t } = useTranslation();
  const { stops, pharmacies, daeList, emergencyDocks, fountains, cameras, parkings, nizioleti, wells, bellTowers, moseGates, oceanStations, briccole } = data;
  const cantieri = data.cantieri.filter(isLocated);

  const exportableLayers: ExportableLayer[] = [
    { id: 'stops', name: t('ui.exportModal.layer_stops'), count: stops.length, getData: () => stops },
    { id: 'pharmacies', name: t('ui.exportModal.layer_pharmacies'), count: pharmacies.length, getData: () => pharmacies },
    { id: 'dae', name: t('ui.exportModal.layer_dae'), count: daeList.length, getData: () => daeList },
    { id: 'emergencyDocks', name: t('ui.exportModal.layer_emergencyDocks'), count: emergencyDocks.length, getData: () => emergencyDocks },
    { id: 'fountains', name: t('ui.exportModal.layer_fountains'), count: fountains.length, getData: () => fountains },
    { id: 'cantieri', name: t('ui.exportModal.layer_cantieri'), count: cantieri.length, getData: () => cantieri },
    { id: 'cameras', name: t('ui.exportModal.layer_cameras'), count: cameras.length, getData: () => cameras },
    { id: 'parkings', name: t('ui.exportModal.layer_parkings'), count: parkings.length, getData: () => parkings },
    { id: 'nizioleti', name: t('ui.exportModal.layer_nizioleti'), count: nizioleti.length, getData: () => nizioleti },
    { id: 'wells', name: t('ui.exportModal.layer_wells'), count: wells.length, getData: () => wells },
    { id: 'bellTowers', name: t('ui.exportModal.layer_bellTowers'), count: bellTowers.length, getData: () => bellTowers },
    { id: 'moseGates', name: t('ui.exportModal.layer_moseGates'), count: moseGates.length, getData: () => moseGates },
    { id: 'oceanStations', name: t('ui.exportModal.layer_oceanStations'), count: oceanStations.length, getData: () => oceanStations },
    { id: 'briccole', name: t('ui.exportModal.layer_briccole'), count: briccole.length, getData: () => briccole },
  ].filter((l) => l.count > 0);

  // Si memorizzano i layer esclusi (non quelli scelti): i dati arrivano dopo il mount
  // e i layer caricati in seguito devono risultare selezionati di default.
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [exportedSha256, setExportedSha256] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!isOpen) return null;

  const selectedLayers = exportableLayers.filter((l) => !excludedIds.includes(l.id));
  const allSelected = selectedLayers.length === exportableLayers.length;

  const toggleLayer = (id: string) => {
    setExcludedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setExcludedIds(allSelected ? exportableLayers.map((l) => l.id) : []);
  };

  const exportData = () => selectedLayers.map((l) => ({ id: l.id, name: l.name, items: l.getData() }));

  const finishExport = async (content: string, mime: string, ext: string) => {
    const filename = `venice-opendata-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
    downloadBlob(new Blob([content], { type: mime }), filename);
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4000);
    try {
      setExportedSha256(await sha256Hex(content));
    } catch {
      setExportedSha256(null); // crypto.subtle non disponibile fuori da contesti sicuri
    }
  };

  const handleCopyHash = async () => {
    if (!exportedSha256) return;
    setCopyState((await copyToClipboard(exportedSha256)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2500);
  };

  const handleExportGeoJson = () => {
    const fc = buildGeoJson(exportData(), new Date().toISOString(), 'https://venice-open-data.vercel.app');
    return finishExport(JSON.stringify(fc, null, 2), 'application/geo+json', 'geojson');
  };

  const handleExportCsv = () => finishExport(buildCsv(exportData()), 'text/csv;charset=utf-8', 'csv');

  const totalSelectedFeatures = selectedLayers.reduce((acc, l) => acc + l.count, 0);

  return (
    <Modal onClose={onClose} label={t('ui.exportModal.title')} panelClassName="relative w-full max-w-xl bg-[var(--ground)] border border-[var(--rule)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)] bg-[var(--rule)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                {t('ui.exportModal.title')}
              </h2>
              <p className="text-xs text-[var(--ink-3)] font-mono">
                {t('ui.exportModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ui.floodModal.close')}
            className="p-1.5 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--rule)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer Selector */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--ink-2)] font-semibold uppercase">
              {t('ui.exportModal.selectLayers')} ({selectedLayers.length}/{exportableLayers.length})
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {allSelected ? t('ui.exportModal.deselectAll') : t('ui.exportModal.selectAll')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exportableLayers.map((layer) => {
              const isSelected = !excludedIds.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-[var(--ink)]'
                      : 'bg-[var(--rule)]/20 border-transparent text-[var(--ink-3)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{layer.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--ink-3)] shrink-0 ml-2">
                    {layer.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('ui.exportModal.downloadReady')}: {downloadSuccess}</span>
            </div>
          )}

          {/* Cryptographic SHA-256 Verification Fingerprint */}
          {exportedSha256 && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  {t('ui.exportModal.hashTitle')}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--rule)]/60 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono border border-[var(--rule)] cursor-pointer transition-all"
                >
                  {copyState === 'copied' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>
                    {copyState === 'copied'
                      ? t('ui.exportModal.copied')
                      : copyState === 'failed'
                        ? t('ui.exportModal.copyFailed')
                        : t('ui.exportModal.copyHash')}
                  </span>
                </button>
              </div>
              <p className="text-[10px] font-mono text-[var(--ink-2)] break-all bg-[var(--ground)]/80 p-2 rounded-lg border border-[var(--rule)]/60">
                {exportedSha256}
              </p>
              <span className="text-[10px] text-[var(--ink-3)] font-mono">
                {t('ui.exportModal.hashNote')}
              </span>
            </div>
          )}

          {/* Formati e licenze */}
          <div className="p-3 rounded-xl bg-[var(--rule)]/20 text-[11px] font-mono text-[var(--ink-3)] flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{t('ui.exportModal.licenseInfo')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]/50 border border-[var(--rule)] text-[var(--ink-2)]">
                GeoJSON RFC 7946
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]/50 border border-[var(--rule)] text-[var(--ink-2)]">
                CRS: WGS84 / EPSG:4326
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]/50 border border-[var(--rule)] text-[var(--ink-2)]">
                CSV RFC 4180 (UTF-8)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--rule)] bg-[var(--rule)]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-[var(--ink-2)]">
            <strong className="text-cyan-400">{totalSelectedFeatures}</strong> {t('ui.exportModal.featuresCount')}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={totalSelectedFeatures === 0}
              onClick={handleExportGeoJson}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileCode className="w-4 h-4" />
              <span>{t('ui.exportModal.exportGeoJson')}</span>
            </button>

            <button
              type="button"
              disabled={totalSelectedFeatures === 0}
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] font-medium text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-[var(--rule)]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t('ui.exportModal.exportCsv')}</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
