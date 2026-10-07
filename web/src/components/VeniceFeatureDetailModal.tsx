'use client';

import React from 'react';
import {
  X,
  ShieldAlert,
  Anchor,
  Compass,
  LifeBuoy,
  Trees,
  Zap,
  Wifi,
  ExternalLink,
  MapPin,
  Waves,
  Wind,
  Gauge
} from 'lucide-react';
import {
  PasserellaItem,
  BriccolaSignalItem,
  OceanStationItem,
  BathingWaterItem,
  UrbanTreeItem,
  EvChargingItem,
  WifiHotspotItem
} from '@/lib/types';

export type VeniceFeatureSelected =
  | { type: 'passerella'; data: PasserellaItem }
  | { type: 'briccola'; data: BriccolaSignalItem }
  | { type: 'oceanStation'; data: OceanStationItem }
  | { type: 'bathingWater'; data: BathingWaterItem }
  | { type: 'urbanTree'; data: UrbanTreeItem }
  | { type: 'evCharging'; data: EvChargingItem }
  | { type: 'wifiHotspot'; data: WifiHotspotItem };

interface VeniceFeatureDetailModalProps {
  feature: VeniceFeatureSelected | null;
  onClose: () => void;
}

export const VeniceFeatureDetailModal: React.FC<VeniceFeatureDetailModalProps> = ({
  feature,
  onClose
}) => {
  if (!feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--rule)] flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-2.5">
            {feature.type === 'passerella' && (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'briccola' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Anchor className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'oceanStation' && (
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Compass className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'bathingWater' && (
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'urbanTree' && (
              <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
                <Trees className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'evCharging' && (
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
                <Zap className="w-5 h-5" />
              </div>
            )}
            {feature.type === 'wifiHotspot' && (
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Wifi className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold leading-tight">
                {feature.type === 'passerella' && feature.data.name}
                {feature.type === 'briccola' && `${feature.data.code} · ${feature.data.channelName}`}
                {feature.type === 'oceanStation' && feature.data.name}
                {feature.type === 'bathingWater' && feature.data.name}
                {feature.type === 'urbanTree' && `${feature.data.commonName} (${feature.data.species})`}
                {feature.type === 'evCharging' && feature.data.name}
                {feature.type === 'wifiHotspot' && feature.data.name}
              </h2>
              <span className="text-[11px] font-mono text-[var(--ink-2)]">
                {feature.type === 'passerella' && `Sestiere: ${feature.data.district} · Quota suolo: ${feature.data.groundElevationCm} cm`}
                {feature.type === 'briccola' && `Tipologia: ${feature.data.type} · Profondità: ${feature.data.depthMeters}m`}
                {feature.type === 'oceanStation' && `Operatore: ${feature.data.operator} · Profondità: ${feature.data.depthMeters}m`}
                {feature.type === 'bathingWater' && `Località: ${feature.data.location} · Campionamento: ${feature.data.samplingDate}`}
                {feature.type === 'urbanTree' && `Località: ${feature.data.location} (${feature.data.district})`}
                {feature.type === 'evCharging' && `Operatore: ${feature.data.operator}`}
                {feature.type === 'wifiHotspot' && `Rete: ${feature.data.networkName} · Gratuita`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto text-xs leading-relaxed">
          {/* 1. Passerelle */}
          {feature.type === 'passerella' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Lunghezza Tracciato</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.lengthMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Soglia Montaggio</span>
                  <p className="text-xl font-bold font-mono text-cyan-400">+{feature.data.activationThresholdCm} cm</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="font-semibold text-amber-300">Stato Posa in Opera:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  feature.data.isMounted ? 'bg-amber-500 text-black' : 'bg-[var(--rule)] text-[var(--ink-2)]'
                }`}>
                  {feature.data.isMounted ? 'MONTATA IN OPERA' : 'A DISPOSIZIONE (MAGAZZINO)'}
                </span>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                Fonte: <b>{feature.data.officialSource}</b>
              </div>
            </>
          )}

          {/* 2. Briccole */}
          {feature.type === 'briccola' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Fanale</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">{feature.data.lightColor}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Fondale</span>
                  <p className="text-sm font-bold font-mono text-cyan-400">-{feature.data.depthMeters} m</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Materiale</span>
                  <p className="text-xs font-bold font-mono text-[var(--ink)]">{feature.data.material}</p>
                </div>
              </div>
              {feature.data.lightFlashRythm && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-emerald-300 font-medium">Ritmo Ottico Fanale:</span>
                  <span className="font-mono font-bold text-emerald-400">{feature.data.lightFlashRythm}</span>
                </div>
              )}
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
            </>
          )}

          {/* 3. Piattaforma Oceanografica CNR */}
          {feature.type === 'oceanStation' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-medium">
                    <Waves className="w-4 h-4 text-cyan-400" /> Altezza Onda Significativa (Hs)
                  </div>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.waveHeightMeters} m</p>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">Periodo spettrale Tp: {feature.data.wavePeriodSeconds}s</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-medium">
                    <Gauge className="w-4 h-4 text-blue-400" /> Corrente Marina Lagunare
                  </div>
                  <p className="text-2xl font-bold font-mono text-blue-400">{feature.data.currentSpeedMs} m/s</p>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">Direzione corrente: {feature.data.currentDirectionDeg}°</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Temp Mare</span>
                  <p className="text-base font-bold font-mono text-teal-300">{feature.data.waterTempC}°C</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Salinità</span>
                  <p className="text-base font-bold font-mono text-indigo-300">{feature.data.salinityPsu} PSU</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Vento Offshore</span>
                  <p className="text-base font-bold font-mono text-amber-300">{feature.data.windSpeedKnots} kn</p>
                </div>
              </div>
              <a
                href={feature.data.portalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/30 transition-all"
              >
                <span>Portale Dati Ufficiale {feature.data.operator}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          {/* 4. Acque Balneazione */}
          {feature.type === 'bathingWater' && (
            <>
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono uppercase">Giudizio Sanitario ARPAV</span>
                  <p className="text-xl font-extrabold text-sky-400">{feature.data.qualityClass}</p>
                </div>
                {feature.data.blueFlag && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase">
                    🌊 Bandiera Blu
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Temp Acqua</span>
                  <p className="text-base font-bold font-mono text-cyan-300">{feature.data.waterTempC}°C</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">E. Coli</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.escherichiaColiUfc} <span className="text-[10px]">ufc</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Enterococchi</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.enterococchiUfc} <span className="text-[10px]">ufc</span></p>
                </div>
              </div>
              <p className="text-[11px] text-[var(--ink-2)]">
                I valori microbiologici rilevati sono ampiamente al di sotto dei limiti di legge. Acque balneabili a conformità eccellente per la stagione turistica.
              </p>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                Fonte: <b>{feature.data.officialSource}</b>
              </div>
            </>
          )}

          {/* 5. Alberi Monumentali */}
          {feature.type === 'urbanTree' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Altezza</span>
                  <p className="text-base font-bold font-mono text-green-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Diametro Chioma</span>
                  <p className="text-base font-bold font-mono text-green-300">{feature.data.canopyDiameterMeters} m</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">CO₂ Assorbita</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.co2AbsorbedKgYear} <span className="text-[10px]">kg/anno</span></p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                <span className="font-semibold text-green-300">Classe di Tutela:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-green-600 text-white">
                  {feature.data.ageClass}
                </span>
              </div>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                Identificativo Catasto Verde: <b>{feature.data.code}</b> · Comune di Venezia
              </div>
            </>
          )}

          {/* 6. Colonnine Ricarica EV */}
          {feature.type === 'evCharging' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Potenza Max</span>
                  <p className="text-base font-bold font-mono text-yellow-400">{feature.data.powerKw} kW</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Prese Libere</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.availableSockets} / {feature.data.totalSockets}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Stato Stazione</span>
                  <p className="text-xs font-bold font-mono text-green-400">{feature.data.isOperational ? 'OPERATIVA' : 'GUASTA'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1.5">
                <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Connettori supportati:</span>
                <div className="flex flex-wrap gap-1.5">
                  {feature.data.socketTypes.map((sock, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono text-[10px]">
                      {sock}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 7. Wi-Fi Hotspot */}
          {feature.type === 'wifiHotspot' && (
            <>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Utenti Connessi Ora</span>
                  <p className="text-2xl font-bold font-mono text-indigo-400">{feature.data.usersConnected}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Velocità Banda</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.speedMbps} Mbps</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200">
                Accesso a banda ultra-larga con credenziali SPID, CIE o account VeniceConnected. Copertura libera nei campielli e piazzali.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
