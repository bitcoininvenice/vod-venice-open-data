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
  Gauge,
  Navigation,
  Train,
  Trash2,
  Bell,
  Landmark,
  HeartPulse,
  Pill,
  ThermometerSun,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  PasserellaItem,
  BriccolaSignalItem,
  OceanStationItem,
  BathingWaterItem,
  UrbanTreeItem,
  EvChargingItem,
  WifiHotspotItem,
  CanalSpeedLimitItem,
  BridgeClearanceItem,
  GondolaStationItem,
  PublicDockItem,
  SubsidenceInSARItem,
  LagoonMorphologyItem,
  MeteoMarineWindItem,
  TrainLiveItem,
  VeritasWasteBoatItem,
  NizioletoCivicoItem,
  VeniceWellItem,
  BellTowerItem,
  LagoonFortressIslandItem,
  EmergencyWaterDockItem,
  PublicDaeItem,
  PharmacyDutyItem,
  HeatIslandSurfaceTempItem
} from '@/lib/types';

export type VeniceFeatureSelected =
  | { type: 'passerella'; data: PasserellaItem }
  | { type: 'briccola'; data: BriccolaSignalItem }
  | { type: 'oceanStation'; data: OceanStationItem }
  | { type: 'bathingWater'; data: BathingWaterItem }
  | { type: 'urbanTree'; data: UrbanTreeItem }
  | { type: 'evCharging'; data: EvChargingItem }
  | { type: 'wifiHotspot'; data: WifiHotspotItem }
  | { type: 'speedLimit'; data: CanalSpeedLimitItem }
  | { type: 'bridgeClearance'; data: BridgeClearanceItem }
  | { type: 'gondolaStation'; data: GondolaStationItem }
  | { type: 'publicDock'; data: PublicDockItem }
  | { type: 'subsidence'; data: SubsidenceInSARItem }
  | { type: 'lagoonMorphology'; data: LagoonMorphologyItem }
  | { type: 'marineWind'; data: MeteoMarineWindItem }
  | { type: 'trainLive'; data: TrainLiveItem }
  | { type: 'wasteBoat'; data: VeritasWasteBoatItem }
  | { type: 'nizioleto'; data: NizioletoCivicoItem }
  | { type: 'veniceWell'; data: VeniceWellItem }
  | { type: 'bellTower'; data: BellTowerItem }
  | { type: 'fortressIsland'; data: LagoonFortressIslandItem }
  | { type: 'emergencyDock'; data: EmergencyWaterDockItem }
  | { type: 'publicDae'; data: PublicDaeItem }
  | { type: 'pharmacy'; data: PharmacyDutyItem }
  | { type: 'heatIsland'; data: HeatIslandSurfaceTempItem };

interface VeniceFeatureDetailModalProps {
  feature: VeniceFeatureSelected | null;
  onClose: () => void;
  currentTideLevelCm?: number;
}

export const VeniceFeatureDetailModal: React.FC<VeniceFeatureDetailModalProps> = ({
  feature,
  onClose,
  currentTideLevelCm = 76
}) => {
  if (!feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--rule)] flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-2.5">
            {feature.type === 'passerella' && (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><ShieldAlert className="w-5 h-5" /></div>
            )}
            {feature.type === 'briccola' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Anchor className="w-5 h-5" /></div>
            )}
            {feature.type === 'oceanStation' && (
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400"><Compass className="w-5 h-5" /></div>
            )}
            {feature.type === 'bathingWater' && (
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400"><LifeBuoy className="w-5 h-5" /></div>
            )}
            {feature.type === 'urbanTree' && (
              <div className="p-2 rounded-xl bg-green-500/20 text-green-400"><Trees className="w-5 h-5" /></div>
            )}
            {feature.type === 'evCharging' && (
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400"><Zap className="w-5 h-5" /></div>
            )}
            {feature.type === 'wifiHotspot' && (
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400"><Wifi className="w-5 h-5" /></div>
            )}
            {feature.type === 'speedLimit' && (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><Gauge className="w-5 h-5" /></div>
            )}
            {feature.type === 'bridgeClearance' && (
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400"><Navigation className="w-5 h-5" /></div>
            )}
            {feature.type === 'gondolaStation' && (
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400"><Waves className="w-5 h-5" /></div>
            )}
            {feature.type === 'publicDock' && (
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><Anchor className="w-5 h-5" /></div>
            )}
            {feature.type === 'subsidence' && (
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400"><Layers className="w-5 h-5" /></div>
            )}
            {feature.type === 'lagoonMorphology' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Trees className="w-5 h-5" /></div>
            )}
            {feature.type === 'marineWind' && (
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400"><Wind className="w-5 h-5" /></div>
            )}
            {feature.type === 'trainLive' && (
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400"><Train className="w-5 h-5" /></div>
            )}
            {feature.type === 'wasteBoat' && (
              <div className="p-2 rounded-xl bg-lime-500/20 text-lime-400"><Trash2 className="w-5 h-5" /></div>
            )}
            {feature.type === 'nizioleto' && (
              <div className="p-2 rounded-xl bg-neutral-200 text-neutral-900 border border-neutral-400"><Landmark className="w-5 h-5" /></div>
            )}
            {feature.type === 'veniceWell' && (
              <div className="p-2 rounded-xl bg-amber-600/20 text-amber-500"><Landmark className="w-5 h-5" /></div>
            )}
            {feature.type === 'bellTower' && (
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400"><Bell className="w-5 h-5" /></div>
            )}
            {feature.type === 'fortressIsland' && (
              <div className="p-2 rounded-xl bg-stone-500/20 text-stone-300"><ShieldAlert className="w-5 h-5" /></div>
            )}
            {feature.type === 'emergencyDock' && (
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400"><HeartPulse className="w-5 h-5" /></div>
            )}
            {feature.type === 'publicDae' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><HeartPulse className="w-5 h-5" /></div>
            )}
            {feature.type === 'pharmacy' && (
              <div className="p-2 rounded-xl bg-green-500/20 text-green-400"><Pill className="w-5 h-5" /></div>
            )}
            {feature.type === 'heatIsland' && (
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400"><ThermometerSun className="w-5 h-5" /></div>
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
                {feature.type === 'speedLimit' && `Limite Velocità: ${feature.data.channelName}`}
                {feature.type === 'bridgeClearance' && `${feature.data.bridgeName} (${feature.data.rioName})`}
                {feature.type === 'gondolaStation' && feature.data.name}
                {feature.type === 'publicDock' && feature.data.name}
                {feature.type === 'subsidence' && `Subsidenza InSAR: ${feature.data.location}`}
                {feature.type === 'lagoonMorphology' && feature.data.name}
                {feature.type === 'marineWind' && `Stazione Meteomarina: ${feature.data.stationName}`}
                {feature.type === 'trainLive' && feature.data.trainNumber}
                {feature.type === 'wasteBoat' && `Battello Veritas: ${feature.data.boatCode}`}
                {feature.type === 'nizioleto' && feature.data.nizioletoText}
                {feature.type === 'veniceWell' && feature.data.name}
                {feature.type === 'bellTower' && feature.data.name}
                {feature.type === 'fortressIsland' && feature.data.name}
                {feature.type === 'emergencyDock' && feature.data.name}
                {feature.type === 'publicDae' && `Defibrillatore DAE: ${feature.data.code}`}
                {feature.type === 'pharmacy' && feature.data.name}
                {feature.type === 'heatIsland' && `Isola di Calore: ${feature.data.zoneName}`}
              </h2>
              <span className="text-[11px] font-mono text-[var(--ink-2)]">
                {feature.type === 'speedLimit' && `${feature.data.zoneType} · Max ${feature.data.maxSpeedKmh} km/h`}
                {feature.type === 'bridgeClearance' && `Franco zero marea: ${feature.data.clearanceCmZeroMarea} cm`}
                {feature.type === 'subsidence' && `${feature.data.satellite} · Trend: ${feature.data.trend}`}
                {feature.type === 'trainLive' && `${feature.data.origin} ➔ ${feature.data.destination}`}
                {feature.type === 'nizioleto' && `Sestiere ${feature.data.sestiere} · Civico ${feature.data.civicNumber}`}
                {feature.type === 'emergencyDock' && `SUEM 118 · ${feature.data.hospital}`}
                {feature.type === 'heatIsland' && `Temp. Superficiale: ${feature.data.surfaceTempCelsius}°C`}
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
          {/* SPEED LIMIT */}
          {feature.type === 'speedLimit' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Velocità Massima</span>
                  <p className="text-2xl font-bold font-mono text-amber-400">{feature.data.maxSpeedKmh} km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Controllo Elettronico</span>
                  <p className="text-base font-bold font-mono text-cyan-400 mt-1">
                    {feature.data.isBarcavelox ? 'BARCAVELOX ATTIVO' : 'PATTUGLIAMENTO POLIZIA'}
                  </p>
                </div>
              </div>
              <p className="text-[var(--ink)]">{feature.data.description}</p>
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]">
                <b>Regolamento:</b> {feature.data.ordinanza}
              </div>
            </>
          )}

          {/* BRIDGE CLEARANCE */}
          {feature.type === 'bridgeClearance' && (
            <>
              {(() => {
                const liveClearance = feature.data.clearanceCmZeroMarea - currentTideLevelCm;
                const isNavigable = liveClearance >= 160;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                        <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Franco Attuale (Marea {currentTideLevelCm}cm)</span>
                        <p className={`text-2xl font-bold font-mono ${isNavigable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {liveClearance} cm
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                        <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Marea Max Transito</span>
                        <p className="text-2xl font-bold font-mono text-cyan-400">+{feature.data.minNavigableTideCm} cm</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isNavigable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <span className="font-semibold">Transito Imbarcazioni:</span>
                      <span className="font-mono font-bold">{isNavigable ? 'TRANSITABILE ORA' : 'ATTENZIONE: ALTEZZA CRITICA'}</span>
                    </div>
                    <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
                    <div className="text-[11px] text-[var(--ink-3)]">
                      Gradini ponte: <b>{feature.data.stepsCount}</b> · Rampa accessibile: <b>{feature.data.isAccessibleRamp ? 'Sì' : 'No'}</b>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* GONDOLA STATION */}
          {feature.type === 'gondolaStation' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Gondole Operative</span>
                  <p className="text-2xl font-bold font-mono text-purple-400">{feature.data.activeGondolas}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Tariffa Regolata</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">€ {feature.data.priceEur.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">Orari di servizio: <b>{feature.data.openingHours}</b></p>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                Gestione: <b>{feature.data.managedBy}</b>
              </div>
            </>
          )}

          {/* SUBSIDENCE InSAR */}
          {feature.type === 'subsidence' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Velocità Movimento Suolo</span>
                  <p className="text-2xl font-bold font-mono text-rose-400">{feature.data.velocityMmYear} mm/anno</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Affidabilità Radar (Coerenza)</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{Math.round(feature.data.coherence * 100)}%</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                Dati interferometrici satellitari elaborati dal programma <strong>Copernicus EGMS (European Ground Motion Service)</strong>. 
                I riflettori permanenti monitorano l'assestamento millimetrico dei carichi lagunari e l'eustatismo adriatico.
              </p>
            </>
          )}

          {/* LAGOON MORPHOLOGY */}
          {feature.type === 'lagoonMorphology' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Superficie Protetto</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.areaHectares} ha</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Quota Media Fondale</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.avgDepthMeters} m</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
                <b>Tutela:</b> {feature.data.protectionDirective}
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.floraFauna}</p>
            </>
          )}

          {/* MARINE WIND */}
          {feature.type === 'marineWind' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Vento / Direzione</span>
                  <p className="text-xl font-bold font-mono text-teal-400">{feature.data.windDirection} ({feature.data.windDirectionDeg}°)</p>
                  <span className="text-xs font-mono text-[var(--ink-2)]">{feature.data.windSpeedKmh} km/h (Raffica: {feature.data.gustSpeedKmh} km/h)</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Altezza Onda Hs</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.waveHeightMeters} m</p>
                </div>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                feature.data.tidePushRisk === 'CRITICO' || feature.data.tidePushRisk === 'ALTO'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <span className="font-semibold">Spinta Idrodinamica verso la Laguna:</span>
                <span className="font-mono font-bold">RISCHIO {feature.data.tidePushRisk}</span>
              </div>
            </>
          )}

          {/* LIVE TRAIN */}
          {feature.type === 'trainLive' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Velocità di Transito</span>
                  <p className="text-2xl font-bold font-mono text-red-400">{feature.data.speedKmh} km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Scostamento Orario</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.delayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {feature.data.delayMinutes > 0 ? `+${feature.data.delayMinutes} min` : 'In Orario'}
                  </p>
                </div>
              </div>
              <p className="text-[var(--ink)]">Posizione: <b>{feature.data.currentLocation}</b></p>
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]">
                Binario di arrivo: <b>{feature.data.platform}</b>
              </div>
            </>
          )}

          {/* NIZIOLETO */}
          {feature.type === 'nizioleto' && (
            <>
              <div className="p-4 rounded-xl bg-neutral-100 text-neutral-900 border-2 border-neutral-900 font-serif text-center shadow-lg">
                <span className="text-xs uppercase tracking-widest text-neutral-600 block">Toponomastica Tradizionale</span>
                <p className="text-lg font-bold tracking-wider mt-1">{feature.data.nizioletoText}</p>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
              <div className="text-[11px] text-[var(--ink-3)]">
                Sestiere: <b>{feature.data.sestiere}</b> · Numero Civico: <b>{feature.data.civicNumber}</b>
              </div>
            </>
          )}

          {/* VENICE WELL */}
          {feature.type === 'veniceWell' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Epoca Storica</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.century}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Profondità Cisterna</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.cisternaDepthMeters} m</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                Materiale: <strong>{feature.data.material.replace(/_/g, ' ')}</strong> · Stile: <strong>{feature.data.style}</strong>
              </p>
            </>
          )}

          {/* BELL TOWER */}
          {feature.type === 'bellTower' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Altezza Torre</span>
                  <p className="text-2xl font-bold font-mono text-orange-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Inclinazione (Pendenza)</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.tiltAngleDeg > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {feature.data.tiltAngleDeg}°
                  </p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
            </>
          )}

          {/* EMERGENCY DOCK & DAE */}
          {feature.type === 'emergencyDock' && (
            <>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                <span className="font-bold">Accesso Sanitario Riservato SUEM 118</span>
                <p className="text-xs text-[var(--ink-2)] mt-1">Pontile prioritario per idroambulanze ed emergenze di soccorso medico urgente.</p>
              </div>
              <p className="text-[var(--ink-2)]">Ospedale di riferimento: <b>{feature.data.hospital}</b></p>
              <p className="text-[var(--ink-2)]">Rampa diretta ospedale: <b>{feature.data.hasDirectHospitalRamp ? 'Presente' : 'Non presente'}</b></p>
            </>
          )}

          {/* HEAT ISLAND */}
          {feature.type === 'heatIsland' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Temp. Superficie LST</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.surfaceTempCelsius > 32 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {feature.data.surfaceTempCelsius}°C
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Delta Microclimatico</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.airTempDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {feature.data.airTempDelta > 0 ? `+${feature.data.airTempDelta}°C` : `${feature.data.airTempDelta}°C`}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                Superficie: <b>{feature.data.surfaceType.replace(/_/g, ' ')}</b> · Missione: <b>{feature.data.satelliteMission}</b>
              </div>
            </>
          )}

          {/* PASSERELLE (existing fallback) */}
          {feature.type === 'passerella' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Lunghezza</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.lengthMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Soglia Attivazione</span>
                  <p className="text-xl font-bold font-mono text-cyan-400">+{feature.data.activationThresholdCm} cm</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
            </>
          )}

          {/* BRICCOLA */}
          {feature.type === 'briccola' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Luce</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">{feature.data.lightColor}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Fondale</span>
                  <p className="text-sm font-bold font-mono text-cyan-400">-{feature.data.depthMeters}m</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Pali</span>
                  <p className="text-sm font-bold font-mono text-amber-400">{feature.data.type === 'DAMA_5_PALI' ? 5 : 3}</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
            </>
          )}

          {/* OCEAN STATION */}
          {feature.type === 'oceanStation' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Altezza Onda Hs</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.waveHeightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Temp. Acqua</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.waterTempC} °C</p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                Operatore: <b>{feature.data.operator}</b> · Salinità: <b>{feature.data.salinityPsu} PSU</b>
              </div>
            </>
          )}

          {/* TREE */}
          {feature.type === 'urbanTree' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Altezza</span>
                  <p className="text-2xl font-bold font-mono text-green-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">CO₂ Assorbita/Anno</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.co2AbsorbedKgYear} kg</p>
                </div>
              </div>
            </>
          )}

          {/* EV & WIFI */}
          {feature.type === 'evCharging' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Prese Disponibili</span>
              <p className="text-2xl font-bold font-mono text-yellow-400">
                {feature.data.availableSockets} / {feature.data.totalSockets}
              </p>
              <span className="text-xs text-[var(--ink-2)]">Potenza: {feature.data.powerKw} kW</span>
            </div>
          )}

          {feature.type === 'wifiHotspot' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Utenti Connessi</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{feature.data.usersConnected}</p>
              <span className="text-xs text-[var(--ink-2)]">Velocità stimata: {feature.data.speedMbps} Mbps</span>
            </div>
          )}

          {/* Generic fallback for remaining types */}
          {feature.type === 'publicDock' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">Sosta Massima Consentita</span>
              <p className="text-2xl font-bold font-mono text-blue-400">{feature.data.maxStayMinutes} min</p>
            </div>
          )}

          {feature.type === 'fortressIsland' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
              <span className="text-[11px] text-[var(--ink-3)]">
                Epoca: <b>{feature.data.era.replace(/_/g, ' ')}</b> · Stato: <b>{feature.data.status.replace(/_/g, ' ')}</b>
              </span>
            </div>
          )}

          {feature.type === 'publicDae' && (
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <b>Defibrillatore Salvavita Pubblico DAE</b>
                <p className="text-xs text-[var(--ink-2)] mt-1">Accesso immediato: {feature.data.accessType.replace(/_/g, ' ')}</p>
              </div>
              <span className="text-[11px] text-[var(--ink-3)]">
                Gestore: <b>{feature.data.operator}</b> · Ultima ispezione: <b>{feature.data.lastInspected}</b>
              </span>
            </div>
          )}

          {feature.type === 'pharmacy' && (
            <div className="flex flex-col gap-2">
              <div className={`p-3 rounded-xl border ${feature.data.isOnDutyNow ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-black/20 border-[var(--rule)]'}`}>
                <b>{feature.data.isOnDutyNow ? 'APERTA DI TURNO' : 'APERTA ORARI ORDINARI'}</b>
                {feature.data.isNightShift && <span className="block text-xs text-amber-300 mt-1">Servizio Notturno Attivo</span>}
              </div>
              <span className="text-[11px] text-[var(--ink-3)]">
                Indirizzo: <b>{feature.data.address}</b> · Telefono: <b>{feature.data.phone}</b>
              </span>
            </div>
          )}

          {feature.type === 'wasteBoat' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">Zona assegnata: <b>{feature.data.assignedZone}</b></p>
              <span className="text-[11px] text-[var(--ink-3)]">
                Frazione raccolta: <b>{feature.data.collectionType.replace(/_/g, ' ')}</b> · Orario: <b>{feature.data.scheduleHours}</b>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
