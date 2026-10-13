'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Navigation,
  HeartPulse,
  Activity,
  Layers,
  Landmark,
  Waves,
  MapPin,
  CornerDownLeft
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { civicLabel, parseCivicQuery, type CivicMatch } from '@/lib/civici';
import { LayerKey } from '@/lib/urlLayers';
import { isLocated } from '@/lib/types';
import type { CityData } from '@/lib/cityData';
import { Modal } from '@/components/ui/Modal';
import { filterFountains } from '@/lib/fountainFilter';

export type SearchCategory = 'transit' | 'health' | 'services' | 'heritage' | 'lagoon';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  lat: number;
  lon: number;
  /** livello da accendere selezionando il risultato (assente per i numeri civici) */
  layerKey?: LayerKey;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload eterogeneo, ristretto da `type` nel chiamante
  rawItem: any;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (item: SearchResultItem) => void;
  /** Dati caricati nella mappa, indicizzati per la ricerca */
  data: CityData;
  /** testo con cui aprire la ricerca (link diretti, es. ?open=search&q=Cannaregio 3450) */
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectResult, data, initialQuery = '' }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<'all' | SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus sul campo all'apertura
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [isOpen]);

  // Lo stato si azzera alla chiusura (nell'handler, non in un effetto)
  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  // Index entities into unified search pool
  const indexedItems = useMemo<SearchResultItem[]>(() => {
    const { stops, pharmacies, daeList, emergencyDocks, fountains, cameras, parkings, nizioleti, wells, bellTowers, moseGates, oceanStations } = data;
    const cantieri = data.cantieri.filter(isLocated);
    const list: SearchResultItem[] = [];

    // 1. Fermate ACTV
    for (const s of stops) {
      list.push({
        id: `stop-${s.id}`,
        title: s.name,
        subtitle: s.lines && s.lines.length > 0
          ? t('ui.search.subStopLines', { lines: `${s.lines.slice(0, 5).join(', ')}${s.lines.length > 5 ? '…' : ''}` })
          : t('ui.search.subStop'),
        category: 'transit',
        lat: s.lat,
        lon: s.lon,
        layerKey: 'showStops',
        type: 'stop',
        rawItem: s
      });
    }

    // 2. Farmacie (i turni non sono open data: la scheda rimanda alla pagina dell'AULSS 3)
    for (const p of pharmacies) {
      list.push({
        id: `pharmacy-${p.id}`,
        title: p.name,
        subtitle: p.source === 'ELENCO_CURATO' ? `${p.address} · ${t('ui.search.toVerify')}` : p.address,
        category: 'health',
        lat: p.lat,
        lon: p.lon,
        layerKey: 'showPharmacies',
        type: 'pharmacy',
        rawItem: p
      });
    }

    // 3. DAE Defibrillatori
    for (const d of daeList) {
      list.push({
        id: `dae-${d.id}`,
        title: d.location,
        subtitle: `${t('ui.search.subDae')}${d.accessType === 'PUBBLICO_H24' ? ' H24' : ''} · ${d.operator}${d.source === 'ELENCO_CURATO' ? ` · ${t('ui.search.toVerify')}` : ''}`,
        category: 'health',
        lat: d.lat,
        lon: d.lon,
        layerKey: 'showDae',
        type: 'dae',
        rawItem: d
      });
    }

    // 4. Idroambulanze SUEM
    for (const e of emergencyDocks) {
      list.push({
        id: `suem-${e.id}`,
        title: e.name,
        subtitle: `${e.hospital} · ${t('ui.search.subDock')} · ${t('ui.search.toVerify')}`,
        category: 'health',
        lat: e.lat,
        lon: e.lon,
        layerKey: 'showEmergencyDocks',
        type: 'emergency_dock',
        rawItem: e
      });
    }

    // 5. Fontanelle potabili
    for (const f of filterFountains(fountains, 'all')) {
      list.push({
        id: `fountain-${f.id}`,
        title: f.name || t('ui.search.subFountain'),
        subtitle: `${f.sestiere || 'Venezia'} · ${t('ui.search.subFountain')} (OSM)`,
        category: 'services',
        lat: f.lat,
        lon: f.lon,
        layerKey: 'showCityAssets',
        type: 'fountain',
        rawItem: f
      });
    }

    // 6. Cantieri Opere Pubbliche
    for (const c of cantieri) {
      if (c.lat !== null && c.lon !== null) {
        list.push({
          id: `cantiere-${c.id}`,
          title: c.titolo,
          subtitle: c.stato ? `${c.quartiere || 'Venezia'} · ${c.stato}` : c.quartiere || 'Venezia',
          category: 'services',
          lat: c.lat,
          lon: c.lon,
          layerKey: 'showCantieri',
          type: 'cantiere',
          rawItem: c
        });
      }
    }

    // 7. Webcam & Telecamere
    for (const cam of cameras) {
      list.push({
        id: `cam-${cam.id}`,
        title: cam.name,
        subtitle: `${cam.sestiere || 'Venezia'} · ${cam.typeLabel || t('ui.search.subCamera')}`,
        category: 'services',
        lat: cam.lat,
        lon: cam.lon,
        layerKey: 'showCameras',
        type: 'camera',
        rawItem: cam
      });
    }

    // 8. Parcheggi
    for (const pk of parkings) {
      list.push({
        id: `parking-${pk.id}`,
        title: pk.name,
        subtitle: pk.totalSpots ? `${pk.location} · ${t('ui.search.subSpots', { n: pk.totalSpots })}` : pk.location,
        category: 'transit',
        lat: pk.lat,
        lon: pk.lon,
        layerKey: 'showParkings',
        type: 'parking',
        rawItem: pk
      });
    }

    // 9. Nizioleti
    for (const n of nizioleti) {
      list.push({
        id: `nizioleto-${n.id}`,
        title: n.streetName,
        subtitle: `${n.sestiere} · ${n.nizioletoText || t('ui.search.subToponym')}`,
        category: 'heritage',
        lat: n.lat,
        lon: n.lon,
        layerKey: 'showNizioleti',
        type: 'nizioleto',
        rawItem: n
      });
    }

    // 10. Vere da Pozzo
    for (const w of wells) {
      list.push({
        id: `well-${w.id}`,
        title: w.name,
        subtitle: [w.campo, w.century].filter(Boolean).join(' · ') || t('ui.search.subToponym'),
        category: 'heritage',
        lat: w.lat,
        lon: w.lon,
        layerKey: 'showWells',
        type: 'well',
        rawItem: w
      });
    }

    // 11. Campanili Pendenti
    for (const b of bellTowers) {
      list.push({
        id: `bell-${b.id}`,
        title: b.name,
        subtitle: t('ui.search.subBellTower', { h: b.heightMeters, tilt: b.tiltAngleDeg }),
        category: 'heritage',
        lat: b.lat,
        lon: b.lon,
        layerKey: 'showBellTowers',
        type: 'bell_tower',
        rawItem: b
      });
    }

    // 12. MOSE
    for (const m of moseGates) {
      list.push({
        id: `mose-${m.id}`,
        title: `MOSE - ${m.inletName}`,
        subtitle: t('ui.search.subMose', { channel: m.channel, n: m.barriersCount }),
        category: 'lagoon',
        lat: m.lat,
        lon: m.lon,
        layerKey: 'showMose',
        type: 'mose',
        rawItem: m
      });
    }

    // 13. Piattaforma CNR & Boe
    for (const o of oceanStations) {
      list.push({
        id: `ocean-${o.id}`,
        title: o.name,
        subtitle: t('ui.search.subOcean'),
        category: 'lagoon',
        lat: o.lat,
        lon: o.lon,
        layerKey: 'showOceanStations',
        type: 'ocean_station',
        rawItem: o
      });
    }

    return list;
  }, [data, t]);

  // Filter items by query and category
  // Numeri civici ("Cannaregio 3450"): risposta dell'API per la ricerca corrente
  const civicQuery = useMemo(() => parseCivicQuery(query), [query]);
  const civicKey = civicQuery ? civicLabel(civicQuery.sestiere, civicQuery.number, civicQuery.letter) : null;
  const [civic, setCivic] = useState<{ key: string; item: SearchResultItem | null } | null>(null);
  useEffect(() => {
    if (!civicKey) return;
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/civici?q=${encodeURIComponent(civicKey)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => {
          const r = j.success ? (j.result as CivicMatch | null) : null;
          setCivic({
            key: civicKey,
            item: r && {
              id: `civico-${civicKey}`,
              title: civicKey,
              subtitle:
                r.match === 'exact'
                  ? t('ui.civic.resultExact')
                  : t('ui.civic.resultApprox', { found: civicLabel(r.sestiere, r.number, r.letter) }),
              category: 'heritage',
              lat: r.lat,
              lon: r.lon,
              type: 'civico',
              rawItem: { ...r, query: j.query },
            },
          });
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [civicKey, t]);
  const civicItem = civic && civic.key === civicKey ? civic.item : null;

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const head = civicItem ? [civicItem] : [];

    return [
      ...head,
      ...indexedItems.filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
        );
      }),
    ].slice(0, 35);
  }, [indexedItems, query, selectedCategory, civicItem]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape è gestito da Modal
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          onSelectResult(filteredResults[selectedIndex]);
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, handleClose, onSelectResult]);

  if (!isOpen) return null;

  const renderCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'transit':
        return <Navigation className="w-3.5 h-3.5 text-cyan-400" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case 'services':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'heritage':
        return <Landmark className="w-3.5 h-3.5 text-amber-400" />;
      case 'lagoon':
        return <Waves className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <Modal onClose={handleClose} label={t('ui.search.title')} align="top" panelClassName="relative w-full max-w-2xl bg-[var(--ground)] border border-[var(--rule)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--rule)] bg-[var(--ground)]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('ui.search.placeholder')}
            className="flex-1 bg-transparent text-[var(--ink)] placeholder-[var(--ink-3)] text-sm outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--ink-3)] bg-[var(--rule)]/60 border border-[var(--rule)]">
            ESC
          </kbd>
        </div>

        {/* Filter Categories Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--rule)]/50 bg-[var(--rule)]/20 overflow-x-auto no-scrollbar shrink-0">
          {(
            [
              { key: 'all', label: t('ui.search.categoryAll'), icon: <Layers className="w-3 h-3" /> },
              { key: 'transit', label: t('ui.search.categoryTransit'), icon: <Navigation className="w-3 h-3 text-cyan-400" /> },
              { key: 'health', label: t('ui.search.categoryHealth'), icon: <HeartPulse className="w-3 h-3 text-rose-400" /> },
              { key: 'services', label: t('ui.search.categoryServices'), icon: <Activity className="w-3 h-3 text-emerald-400" /> },
              { key: 'heritage', label: t('ui.search.categoryHeritage'), icon: <Landmark className="w-3 h-3 text-amber-400" /> },
              { key: 'lagoon', label: t('ui.search.categoryLagoon'), icon: <Waves className="w-3 h-3 text-blue-400" /> },
            ] as const
          ).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setSelectedCategory(c.key);
                setSelectedIndex(0);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c.key
                  ? 'bg-cyan-500 text-white font-medium shadow-sm'
                  : 'bg-[var(--rule)]/50 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 flex flex-col gap-1 flex-1">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--ink-3)]">
              {t('ui.search.searchPrompt')}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--ink-3)]">
              {t('ui.search.noResults')} <span className="text-cyan-400 font-bold">&quot;{query}&quot;</span>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectResult(item);
                    handleClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-[var(--ink)]'
                      : 'hover:bg-[var(--rule)]/40 border border-transparent text-[var(--ink-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[var(--rule)]/60 shrink-0">
                      {renderCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-[var(--ink)] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[var(--ink-3)] font-mono truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[var(--ink-3)]">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{item.lat.toFixed(4)}, {item.lon.toFixed(4)}</span>
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="w-4 h-4 text-cyan-400 shrink-0 motion-safe:animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Guide */}
        <div className="px-4 py-2 border-t border-[var(--rule)] bg-[var(--rule)]/20 flex items-center justify-between text-[11px] font-mono text-[var(--ink-3)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--rule)] text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-[var(--rule)] text-[10px]">↓</kbd>
              {t('ui.search.navigateHint')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--rule)] text-[10px]">↵</kbd>
              {t('ui.search.selectHint')}
            </span>
          </div>
          <span className="text-[10px]">{indexedItems.length} {t('ui.exportModal.featuresCount')}</span>
        </div>
    </Modal>
  );
};
