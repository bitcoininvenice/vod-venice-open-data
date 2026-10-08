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
  Plane,
  Info
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
  HeatIslandSurfaceTempItem,
  LagoonWaterQualityItem,
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem,
  ParkingItem
} from '@/lib/types';
import { Droplet, Building2, Bike, Flower2, GitBranch, Car } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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
  | { type: 'heatIsland'; data: HeatIslandSurfaceTempItem }
  | { type: 'lagoonWater'; data: LagoonWaterQualityItem }
  | { type: 'accommodation'; data: TouristAccommodationItem }
  | { type: 'bikeRoute'; data: RegionalBikeRouteItem }
  | { type: 'pollenStation'; data: PollenMonitoringStationItem }
  | { type: 'tributaryRiver'; data: LagoonTributaryRiverItem }
  | { type: 'parking'; data: ParkingItem };

interface VeniceFeatureDetailModalProps {
  feature: VeniceFeatureSelected | null;
  onClose: () => void;
  currentTideLevelCm?: number;
}

export const VeniceFeatureDetailModal: React.FC<VeniceFeatureDetailModalProps> = ({
  feature,
  onClose,
  currentTideLevelCm
}) => {
  const { language, t } = useTranslation();
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
            {feature.type === 'lagoonWater' && (
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400"><Droplet className="w-5 h-5" /></div>
            )}
            {feature.type === 'accommodation' && (
              <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400"><Building2 className="w-5 h-5" /></div>
            )}
            {feature.type === 'bikeRoute' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Bike className="w-5 h-5" /></div>
            )}
            {feature.type === 'pollenStation' && (
              <div className="p-2 rounded-xl bg-lime-500/20 text-lime-400"><Flower2 className="w-5 h-5" /></div>
            )}
            {feature.type === 'tributaryRiver' && (
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400"><GitBranch className="w-5 h-5" /></div>
            )}
            {feature.type === 'parking' && (
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400"><Car className="w-5 h-5" /></div>
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
                {feature.type === 'speedLimit' && `${language === 'it' ? 'Limite Velocità' : 'Speed Limit'}: ${feature.data.channelName}`}
                {feature.type === 'bridgeClearance' && `${feature.data.bridgeName} (${feature.data.rioName})`}
                {feature.type === 'gondolaStation' && feature.data.name}
                {feature.type === 'publicDock' && feature.data.name}
                {feature.type === 'subsidence' && `${language === 'it' ? 'Subsidenza InSAR' : 'InSAR Subsidence'}: ${feature.data.location}`}
                {feature.type === 'lagoonMorphology' && feature.data.name}
                {feature.type === 'marineWind' && `${language === 'it' ? 'Stazione Meteomarina' : 'Marine Weather Station'}: ${feature.data.stationName}`}
                {feature.type === 'trainLive' && feature.data.trainNumber}
                {feature.type === 'wasteBoat' && `${language === 'it' ? 'Battello Veritas' : 'Veritas Waste Boat'}: ${feature.data.boatCode}`}
                {feature.type === 'nizioleto' && feature.data.nizioletoText}
                {feature.type === 'veniceWell' && feature.data.name}
                {feature.type === 'bellTower' && feature.data.name}
                {feature.type === 'fortressIsland' && feature.data.name}
                {feature.type === 'emergencyDock' && feature.data.name}
                {feature.type === 'publicDae' && `${language === 'it' ? 'Defibrillatore DAE' : 'AED Defibrillator'}: ${feature.data.code}`}
                {feature.type === 'pharmacy' && feature.data.name}
                {feature.type === 'heatIsland' && `${language === 'it' ? 'Isola di Calore' : 'Heat Island'}: ${feature.data.zoneName}`}
                {feature.type === 'lagoonWater' && `${language === 'it' ? 'Acque ARPAV' : 'ARPAV Water Quality'}: ${feature.data.stationName}`}
                {feature.type === 'accommodation' && `${language === 'it' ? 'Pressione Ricettiva' : 'Tourism Accommodation Density'}: ${feature.data.zoneName}`}
                {feature.type === 'bikeRoute' && feature.data.routeName}
                {feature.type === 'pollenStation' && feature.data.stationName}
                {feature.type === 'tributaryRiver' && `${language === 'it' ? 'Fiume Scolante' : 'Tributary River'}: ${feature.data.riverName}`}
                {feature.type === 'parking' && feature.data.name}
              </h2>
              <span className="text-[11px] font-mono text-[var(--ink-2)]">
                {feature.type === 'speedLimit' && `${feature.data.zoneType} · Max ${feature.data.maxSpeedKmh} km/h`}
                {feature.type === 'bridgeClearance' && `${language === 'it' ? 'Franco zero marea' : 'Air draft at zero tide'}: ${feature.data.clearanceCmZeroMarea} cm`}
                {feature.type === 'subsidence' && `${feature.data.satellite} · Trend: ${feature.data.trend}`}
                {feature.type === 'trainLive' && `${feature.data.origin} → ${feature.data.destination}`}
                {feature.type === 'nizioleto' && `${language === 'it' ? 'Sestiere' : 'District'} ${feature.data.sestiere} · ${language === 'it' ? 'Civico' : 'Street No.'} ${feature.data.civicNumber}`}
                {feature.type === 'emergencyDock' && `SUEM 118 · ${feature.data.hospital}`}
                {feature.type === 'heatIsland' && `${language === 'it' ? 'Temp. Superficiale' : 'Surface Temp'}: ${feature.data.surfaceTempCelsius}°C`}
                {feature.type === 'lagoonWater' && `${language === 'it' ? 'Bacino' : 'Basin'} ${feature.data.subBasin.replace(/_/g, ' ')} · ${language === 'it' ? 'Stato Trofico' : 'Trophic State'}: ${feature.data.trophicState}`}
                {feature.type === 'accommodation' && `${language === 'it' ? 'Densità' : 'Density'}: ${feature.data.densityCategory} · ${feature.data.bedsPerResidentRatio} ${language === 'it' ? 'posti letto per residente' : 'beds per resident'}`}
                {feature.type === 'bikeRoute' && `${language === 'it' ? 'Lunghezza' : 'Length'}: ${feature.data.lengthKm} km · ${feature.data.section}`}
                {feature.type === 'pollenStation' && `${language === 'it' ? 'Rischio Allergico' : 'Allergy Risk'}: ${feature.data.overallAllergyRisk} · ${feature.data.locationName}`}
                {feature.type === 'tributaryRiver' && `${language === 'it' ? 'Portata' : 'Flow Rate'}: ${feature.data.avgFlowM3s} m³/s · ${feature.data.mouthZone}`}
                {feature.type === 'parking' && `${feature.data.location} · ${feature.data.operator}`}
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Velocità Massima' : 'Maximum Speed'}</span>
                  <p className="text-2xl font-bold font-mono text-amber-400">{feature.data.maxSpeedKmh} km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Controllo Elettronico' : 'Electronic Enforcement'}</span>
                  <p className="text-base font-bold font-mono text-cyan-400 mt-1">
                    {feature.data.isBarcavelox 
                      ? (language === 'it' ? 'BARCAVELOX ATTIVO' : 'BARCAVELOX RADAR ACTIVE') 
                      : (language === 'it' ? 'PATTUGLIAMENTO POLIZIA' : 'POLICE PATROL')}
                  </p>
                </div>
              </div>
              <p className="text-[var(--ink)]">{feature.data.description}</p>
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]">
                <b>{language === 'it' ? 'Regolamento:' : 'Regulation:'}</b> {feature.data.ordinanza}
              </div>
            </>
          )}

          {/* BRIDGE CLEARANCE */}
          {feature.type === 'bridgeClearance' && (
            <>
              {(() => {
                const tideKnown = currentTideLevelCm !== undefined;
                const liveClearance = feature.data.clearanceCmZeroMarea - (currentTideLevelCm ?? 0);
                const isNavigable = liveClearance >= 160;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                        <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">
                          {tideKnown
                            ? (language === 'it' ? `Franco attuale (marea CPSM ${currentTideLevelCm} cm)` : `Current clearance (CPSM tide ${currentTideLevelCm} cm)`)
                            : (language === 'it' ? 'Franco a zero mareografico (marea n.d.)' : 'Clearance at tide datum (tide n/a)')}
                        </span>
                        <p className={`text-2xl font-bold font-mono ${isNavigable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {liveClearance} cm
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                        <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Marea Max Transito' : 'Max Navigable Tide'}</span>
                        <p className="text-2xl font-bold font-mono text-cyan-400">+{feature.data.minNavigableTideCm} cm</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isNavigable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <span className="font-semibold">{language === 'it' ? 'Transito Imbarcazioni:' : 'Vessel Clearance:'}</span>
                      <span className="font-mono font-bold">
                        {isNavigable 
                          ? (language === 'it' ? 'TRANSITABILE ORA' : 'NAVIGABLE NOW') 
                          : (language === 'it' ? 'ATTENZIONE: ALTEZZA CRITICA' : 'WARNING: CRITICAL CLEARANCE')}
                      </span>
                    </div>
                    <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
                    <div className="text-[11px] text-[var(--ink-3)]">
                      {language === 'it' ? 'Gradini ponte:' : 'Bridge steps:'} <b>{feature.data.stepsCount}</b> · {language === 'it' ? 'Rampa accessibile:' : 'Accessible ramp:'} <b>{feature.data.isAccessibleRamp ? (language === 'it' ? 'Sì' : 'Yes') : 'No'}</b>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Gondole Operative' : 'Active Gondolas'}</span>
                  <p className="text-2xl font-bold font-mono text-purple-400">{feature.data.activeGondolas}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Tariffa Regolata' : 'Standard Tariff'}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">€ {feature.data.priceEur.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">{language === 'it' ? 'Orari di servizio:' : 'Operating hours:'} <b>{feature.data.openingHours}</b></p>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Gestione:' : 'Operated by:'} <b>{feature.data.managedBy}</b>
              </div>
            </>
          )}

          {/* SUBSIDENCE InSAR */}
          {feature.type === 'subsidence' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Velocità Movimento Suolo' : 'Ground Motion Velocity'}</span>
                  <p className="text-2xl font-bold font-mono text-rose-400">{feature.data.velocityMmYear} mm/anno</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Affidabilità Radar (Coerenza)' : 'Radar Reliability (Coherence)'}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{Math.round(feature.data.coherence * 100)}%</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                {language === 'it' 
                  ? "Dati interferometrici satellitari elaborati dal programma Copernicus EGMS (European Ground Motion Service). I riflettori permanenti monitorano l'assestamento millimetrico dei carichi lagunari e l'eustatismo adriatico."
                  : "Satellite interferometric radar data processed by Copernicus EGMS (European Ground Motion Service). Persistent scatterers monitor millimeter-level lagoon subsidence and Adriatic eustasy."}
              </p>
            </>
          )}

          {/* LAGOON MORPHOLOGY */}
          {feature.type === 'lagoonMorphology' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Superficie Protetta' : 'Protected Area'}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.areaHectares} ha</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Quota Media Fondale' : 'Average Seabed Depth'}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.avgDepthMeters} m</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
                <b>{language === 'it' ? 'Tutela:' : 'Protection Status:'}</b> {feature.data.protectionDirective}
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.floraFauna}</p>
            </>
          )}

          {/* MARINE WIND */}
          {feature.type === 'marineWind' && (
            <>
              {/* Station Type Pill & Position */}
              <div className="flex items-center justify-between text-xs pb-0.5">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30 uppercase">
                  {feature.data.stationType === 'AEROPORTO' && (language === 'it' ? 'Stazione Aeronautica Militare / ENAV (LIPZ)' : 'Air Force / ENAV Station (LIPZ)')}
                  {feature.data.stationType === 'PIATTAFORMA_OFFSHORE' && (language === 'it' ? 'Piattaforma CNR-ISMAR (15 km Offshore)' : 'CNR-ISMAR Ocean Platform (15 km Offshore)')}
                  {feature.data.stationType === 'BOCCA_DI_PORTO' && (language === 'it' ? 'Bocca di Porto Lagunare (MOSE)' : 'Lagoon Inlet (MOSE Barrier)')}
                  {feature.data.stationType === 'CENTRO_STORICO' && (language === 'it' ? 'Laguna Centro Storico' : 'Historic Center Lagoon')}
                  {feature.data.stationType === 'TERRAFERMA' && (language === 'it' ? 'Terraferma Mestre (ARPAV)' : 'Mainland Mestre (ARPAV)')}
                </span>
                <span className="text-[10px] text-[var(--ink-3)] font-mono">
                  {feature.data.lat.toFixed(4)}°N, {feature.data.lon.toFixed(4)}°E
                </span>
              </div>

              {/* Anemometer & Wave Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" /> {language === 'it' ? 'Vento & Direzione' : 'Wind & Direction'}
                  </span>
                  <p className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                    {feature.data.windDirection} ({feature.data.windDirectionDeg}°)
                  </p>
                  <span className="text-xs font-mono text-[var(--ink)] block mt-0.5">
                    {feature.data.windSpeedKmh} km/h · {feature.data.windSpeedKnots} kt
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">
                    {language === 'it' ? 'Raffica' : 'Gust'}: {feature.data.gustSpeedKmh} km/h ({feature.data.gustSpeedKnots} kt)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono flex items-center gap-1">
                    <Waves className="w-3 h-3 text-cyan-400" /> {language === 'it' ? "Altezza d'Onda Hs" : 'Wave Height Hs'}
                  </span>
                  <p className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {feature.data.waveHeightMeters} m
                  </p>
                  <span className="text-[10px] text-[var(--ink-3)] block mt-0.5">
                    {feature.data.waveHeightMeters > 1.5 
                      ? (language === 'it' ? 'Mare molto mosso / agitato' : 'Very rough sea') 
                      : feature.data.waveHeightMeters > 0.5 
                      ? (language === 'it' ? 'Mare mosso' : 'Moderate chop') 
                      : (language === 'it' ? 'Laguna calma / poco mosso' : 'Calm lagoon')}
                  </span>
                </div>
              </div>

              {/* Atmospheric Parameters */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{language === 'it' ? 'Temperatura' : 'Temperature'}</span>
                  <span className="font-mono font-bold text-[var(--ink)] text-sm">
                    {feature.data.airTempCelsius ?? 18}°C
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{language === 'it' ? 'Pressione' : 'Pressure'}</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                    {feature.data.pressureHpa ?? 1015} hPa
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{language === 'it' ? 'Umidità Rel.' : 'Humidity'}</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                    {feature.data.humidityPercent ?? 75}%
                  </span>
                </div>
              </div>

              {/* Tide Surge & Hydrodynamic push */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                feature.data.tidePushRisk === 'CRITICO' || feature.data.tidePushRisk === 'ALTO'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> {language === 'it' ? 'Spinta Idrodinamica verso la Laguna:' : 'Hydrodynamic Surge Push towards Lagoon:'}
                  </span>
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-black/30">
                    {language === 'it' ? 'RISCHIO' : 'RISK'} {feature.data.tidePushRisk}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {feature.data.windTypeDescription}
                </p>
              </div>

              {/* Dedicated METAR Bulletin box if available (Airport LIPZ) */}
              {feature.data.metar && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5" /> {language === 'it' ? 'Bollettino Ufficiale METAR Aeronautica Militare' : 'Official METAR Aviation Bulletin'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                      {feature.data.metar.flightCategory}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-sunken)] border border-[var(--rule)] font-mono text-[11px] text-sky-600 dark:text-sky-300 select-all break-all">
                    {feature.data.metar.rawMetar}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)]">
                    <span>QNH: <b>{feature.data.metar.qnhHpa} hPa</b> · {language === 'it' ? 'Pista' : 'Runway'}: <b>{feature.data.metar.activeRunway}</b></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{feature.data.metar.runwayCondition}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* RFI RAILWAY INFRASTRUCTURE */}
          {feature.type === 'trainLive' && (
            <>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Infrastruttura / Nodo' : 'Infrastructure / Node'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.trainNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Dotazione Binari / Impianto' : 'Track Capacity / System'}</span>
                  <span className="font-semibold text-cyan-400">{feature.data.platform}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Connessione di Linea' : 'Line Connection'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.origin} → {feature.data.destination}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Ubicazione' : 'Location'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.currentLocation}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {language === 'it'
                    ? "Anagrafica infrastrutturale del nodo ferroviario (fonte: Prospetto Informativo della Rete RFI). Non riporta la circolazione dei treni in tempo reale."
                    : "Infrastructure reference data for the rail node (source: RFI Network Statement). Does not show real-time train circulation."}
                </span>
              </div>
            </>
          )}

          {/* CERTIFIED PARKING INFRASTRUCTURE */}
          {feature.type === 'parking' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Capienza Certificata' : 'Certified Capacity'}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">
                    {feature.data.totalSpots} <span className="text-xs text-[var(--ink-2)] font-normal">{language === 'it' ? 'posti' : 'spots'}</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Ambito Territoriale' : 'Territorial Area'}</span>
                  <p className="text-lg font-bold font-mono text-emerald-400 truncate">
                    {feature.data.location === 'Piazzale Roma' || feature.data.location === 'Tronchetto' ? (language === 'it' ? 'Venezia Insulare' : 'Venice Island') : (language === 'it' ? 'Terraferma / Mestre' : 'Mainland / Mestre')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Tariffa Ufficiale / Oraria' : 'Official Tariff / Hourly'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.rateHourly}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Gestore Istituzionale' : 'Operator'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.operator}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Località / Nodo' : 'Hub Node'}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.location}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {language === 'it'
                    ? "Dato istituzionale verificato AVM S.p.A. / Metropark FS. Il Comune di Venezia non pubblica tramite API aperte l'occupazione istantanea delle spire (visibile solo da PMV stradali fisici). La piattaforma esclude rigorosamente stime o dati sintetici non certificati."
                    : "Verified institutional data from AVM S.p.A. / Metropark FS. Real-time induction loop counts are not published via open APIs by the Municipality (only shown on roadside PMV signs). The platform strictly excludes unverified synthetic estimates."}
                </span>
              </div>
            </>
          )}

          {/* NIZIOLETO */}
          {feature.type === 'nizioleto' && (
            <>
              <div className="p-4 rounded-xl bg-neutral-100 text-neutral-900 border-2 border-neutral-900 font-serif text-center shadow-lg">
                <span className="text-xs uppercase tracking-widest text-neutral-600 block">{language === 'it' ? 'Toponomastica Tradizionale' : 'Traditional Toponymy'}</span>
                <p className="text-lg font-bold tracking-wider mt-1">{feature.data.nizioletoText}</p>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
              <div className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Sestiere' : 'District'}: <b>{feature.data.sestiere}</b> · {language === 'it' ? 'Numero Civico' : 'Street No.'}: <b>{feature.data.civicNumber}</b>
              </div>
            </>
          )}

          {/* VENICE WELL */}
          {feature.type === 'veniceWell' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Epoca Storica' : 'Historical Era'}</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.century}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Profondità Cisterna' : 'Cistern Depth'}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.cisternaDepthMeters} m</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                {language === 'it' ? 'Materiale' : 'Material'}: <strong>{feature.data.material.replace(/_/g, ' ')}</strong> · {language === 'it' ? 'Stile' : 'Style'}: <strong>{feature.data.style}</strong>
              </p>
            </>
          )}

          {/* BELL TOWER */}
          {feature.type === 'bellTower' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Altezza Torre' : 'Tower Height'}</span>
                  <p className="text-2xl font-bold font-mono text-orange-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Inclinazione (Pendenza)' : 'Lean / Tilt Angle'}</span>
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
                <span className="font-bold">{language === 'it' ? 'Accesso Sanitario Riservato SUEM 118' : 'Emergency Medical Dock (SUEM 118)'}</span>
                <p className="text-xs text-[var(--ink-2)] mt-1">{language === 'it' ? 'Pontile prioritario per idroambulanze ed emergenze di soccorso medico urgente.' : 'Priority dock reserved for water ambulances and urgent medical response.'}</p>
              </div>
              <p className="text-[var(--ink-2)]">{language === 'it' ? 'Ospedale di riferimento:' : 'Reference Hospital:'} <b>{feature.data.hospital}</b></p>
              <p className="text-[var(--ink-2)]">{language === 'it' ? 'Rampa diretta ospedale:' : 'Direct hospital ramp:'} <b>{feature.data.hasDirectHospitalRamp ? (language === 'it' ? 'Presente' : 'Available') : (language === 'it' ? 'Non presente' : 'Not available')}</b></p>
            </>
          )}

          {/* HEAT ISLAND */}
          {feature.type === 'heatIsland' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Temp. Superficie LST' : 'LST Surface Temp'}</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.surfaceTempCelsius > 32 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {feature.data.surfaceTempCelsius}°C
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Delta Microclimatico' : 'Microclimate Delta'}</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.airTempDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {feature.data.airTempDelta > 0 ? `+${feature.data.airTempDelta}°C` : `${feature.data.airTempDelta}°C`}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Superficie' : 'Surface'}: <b>{feature.data.surfaceType.replace(/_/g, ' ')}</b> · {language === 'it' ? 'Missione' : 'Mission'}: <b>{feature.data.satelliteMission}</b>
              </div>
            </>
          )}

          {/* PASSERELLE (existing fallback) */}
          {feature.type === 'passerella' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Lunghezza' : 'Length'}</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.lengthMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Soglia Attivazione' : 'Activation Threshold'}</span>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Luce' : 'Light'}</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">{feature.data.lightColor}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Fondale' : 'Depth'}</span>
                  <p className="text-sm font-bold font-mono text-cyan-400">-{feature.data.depthMeters}m</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Pali' : 'Piles'}</span>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? "Altezza Onda Hs" : 'Wave Height Hs'}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.waveHeightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Temp. Acqua' : 'Water Temp'}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.waterTempC} °C</p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Operatore:' : 'Operator:'} <b>{feature.data.operator}</b> · {language === 'it' ? 'Salinità:' : 'Salinity:'} <b>{feature.data.salinityPsu} PSU</b>
              </div>
            </>
          )}

          {/* TREE */}
          {feature.type === 'urbanTree' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Altezza' : 'Height'}</span>
                  <p className="text-2xl font-bold font-mono text-green-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'CO₂ Assorbita/Anno' : 'CO₂ Absorbed/Year'}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.co2AbsorbedKgYear} kg</p>
                </div>
              </div>
            </>
          )}

          {/* EV & WIFI */}
          {feature.type === 'evCharging' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Prese Disponibili' : 'Available Sockets'}</span>
              <p className="text-2xl font-bold font-mono text-yellow-400">
                {feature.data.availableSockets} / {feature.data.totalSockets}
              </p>
              <span className="text-xs text-[var(--ink-2)]">{language === 'it' ? 'Potenza:' : 'Power:'} {feature.data.powerKw} kW</span>
            </div>
          )}

          {feature.type === 'wifiHotspot' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Utenti Connessi' : 'Connected Users'}</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{feature.data.usersConnected}</p>
              <span className="text-xs text-[var(--ink-2)]">{language === 'it' ? 'Velocità stimata:' : 'Estimated speed:'} {feature.data.speedMbps} Mbps</span>
            </div>
          )}

          {/* Generic fallback for remaining types */}
          {feature.type === 'publicDock' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Sosta Massima Consentita' : 'Max Permitted Mooring'}</span>
              <p className="text-2xl font-bold font-mono text-blue-400">{feature.data.maxStayMinutes} min</p>
            </div>
          )}

          {feature.type === 'fortressIsland' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
              <span className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Epoca:' : 'Era:'} <b>{feature.data.era.replace(/_/g, ' ')}</b> · {language === 'it' ? 'Stato:' : 'Status:'} <b>{feature.data.status.replace(/_/g, ' ')}</b>
              </span>
            </div>
          )}

          {feature.type === 'publicDae' && (
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <b>{language === 'it' ? 'Defibrillatore Salvavita Pubblico DAE' : 'Public Lifesaving AED Defibrillator'}</b>
                <p className="text-xs text-[var(--ink-2)] mt-1">{language === 'it' ? 'Accesso immediato:' : 'Immediate access:'} {feature.data.accessType.replace(/_/g, ' ')}</p>
              </div>
              <span className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Gestore:' : 'Operator:'} <b>{feature.data.operator}</b> · {language === 'it' ? 'Ultima ispezione:' : 'Last inspected:'} <b>{feature.data.lastInspected}</b>
              </span>
            </div>
          )}

          {feature.type === 'pharmacy' && (
            <div className="flex flex-col gap-2">
              <div className={`p-3 rounded-xl border ${feature.data.isOnDutyNow ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-black/20 border-[var(--rule)]'}`}>
                <b>{feature.data.isOnDutyNow ? (language === 'it' ? 'APERTA DI TURNO' : 'OPEN ON DUTY') : (language === 'it' ? 'APERTA ORARI ORDINARI' : 'OPEN REGULAR HOURS')}</b>
                {feature.data.isNightShift && <span className="block text-xs text-amber-300 mt-1">{language === 'it' ? 'Servizio Notturno Attivo' : 'Night Service Active'}</span>}
              </div>
              <span className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Indirizzo:' : 'Address:'} <b>{feature.data.address}</b> · {language === 'it' ? 'Telefono:' : 'Phone:'} <b>{feature.data.phone}</b>
              </span>
            </div>
          )}

          {feature.type === 'wasteBoat' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">{language === 'it' ? 'Zona assegnata:' : 'Assigned zone:'} <b>{feature.data.assignedZone}</b></p>
              <span className="text-[11px] text-[var(--ink-3)]">
                {language === 'it' ? 'Frazione raccolta:' : 'Collection waste type:'} <b>{feature.data.collectionType.replace(/_/g, ' ')}</b> · {language === 'it' ? 'Orario:' : 'Schedule:'} <b>{feature.data.scheduleHours}</b>
              </span>
            </div>
          )}

          {feature.type === 'lagoonWater' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">{language === 'it' ? 'Stato Trofico Lagunare' : 'Lagoon Trophic State'}</span>
                  <p className="text-lg font-bold text-[var(--ink)]">{feature.data.trophicState}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{language === 'it' ? 'Profondità Sonda' : 'Probe Depth'}</span>
                  <p className="text-sm font-mono font-bold text-cyan-300">-{feature.data.monitoringDepthMeters} m</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Salinità' : 'Salinity'}</span>
                  <p className="text-base font-bold font-mono text-cyan-400">{feature.data.salinityPsu} <span className="text-xs">PSU</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Temp. Acqua' : 'Water Temp'}</span>
                  <p className="text-base font-bold font-mono text-amber-400">{feature.data.waterTempCelsius}°C</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">pH</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.ph}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Ossigeno O₂' : 'Oxygen O₂'}</span>
                  <p className="text-base font-bold font-mono text-blue-400">{feature.data.dissolvedOxygenPercent}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Torbidità' : 'Turbidity'}</span>
                  <p className="text-base font-bold font-mono text-slate-300">{feature.data.turbidityNtu} <span className="text-xs">NTU</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Conducibilità' : 'Conductivity'}</span>
                  <p className="text-base font-bold font-mono text-purple-400">{feature.data.conductivityMsCm} <span className="text-xs">mS/cm</span></p>
                </div>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Fonte:' : 'Source:'} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'accommodation' && (
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl border ${feature.data.densityCategory === 'CRITICA' ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold">{language === 'it' ? 'Indice Overtourism' : 'Overtourism Index'}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20">{feature.data.densityCategory}</span>
                </div>
                <p className="text-sm mt-1 text-[var(--ink)]">
                  {language === 'it' ? 'Rapporto:' : 'Ratio:'} <b>{feature.data.bedsPerResidentRatio} {language === 'it' ? 'posti letto turistici per ciascun residente' : 'tourist beds per resident'}</b>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Posti Letto Totali' : 'Total Beds'}</span>
                  <p className="text-xl font-bold font-mono text-fuchsia-400">{feature.data.totalBeds.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Strutture Censite' : 'Registered Accommodations'}</span>
                  <p className="text-xl font-bold font-mono text-purple-400">{feature.data.totalStructures.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Settore Alberghiero (Hotel):' : 'Hotel Sector:'}</span>
                  <span className="font-bold font-mono text-[var(--ink)]">
                    {feature.data.hotelCount} hotel ({language === 'it' ? `5 stelle: ${feature.data.starRatingBreakdown.fiveStar}, 4 stelle: ${feature.data.starRatingBreakdown.fourStar}, 3 stelle: ${feature.data.starRatingBreakdown.threeStar}` : `5-star: ${feature.data.starRatingBreakdown.fiveStar}, 4-star: ${feature.data.starRatingBreakdown.fourStar}, 3-star: ${feature.data.starRatingBreakdown.threeStar}`})
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--rule)] pt-1.5">
                  <span className="text-[var(--ink-2)]">{language === 'it' ? 'Extra-Alberghiero (B&B e Locazioni):' : 'Non-Hotel Sector (B&B & Rentals):'}</span>
                  <span className="font-bold font-mono text-fuchsia-400">{feature.data.extraHotelCount} ({language === 'it' ? 'Locazioni' : 'Rentals'}: {feature.data.starRatingBreakdown.holidayHomes}, B&B: {feature.data.starRatingBreakdown.bAndB})</span>
                </div>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Fonte:' : 'Source:'} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'bikeRoute' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">{language === 'it' ? 'Lunghezza' : 'Length'}</span>
                  <p className="text-lg font-bold font-mono text-emerald-300">{feature.data.lengthKm} km</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Fondo Stradale' : 'Road Surface'}</span>
                  <p className="text-xs font-bold text-[var(--ink)] mt-1">{feature.data.surfaceType.replace(/_/g, ' ')}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Difficoltà' : 'Difficulty'}</span>
                  <p className="text-xs font-bold text-cyan-400 mt-1">{feature.data.difficulty.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{language === 'it' ? 'Interscambio Lagunare Intermodale:' : 'Intermodal Lagoon Interchange:'}</span>
                <p className="text-[var(--ink)] mt-0.5 font-medium">{feature.data.ferryInterchange}</p>
              </div>

              <p className="text-xs text-[var(--ink-2)] leading-relaxed">{feature.data.description}</p>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Fonte:' : 'Source:'} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'pollenStation' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-lime-400 font-bold">{language === 'it' ? 'Rischio Allergico Attuale' : 'Current Allergy Risk'}</span>
                  <p className="text-lg font-bold text-[var(--ink)]">{feature.data.overallAllergyRisk}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{language === 'it' ? 'Campionatore' : 'Air Sampler'}</span>
                  <p className="text-xs font-mono text-[var(--ink-2)]">{feature.data.samplerType.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase">{language === 'it' ? 'Famiglie Botaniche Rilevate (grani / m³):' : 'Detected Plant Families (grains / m³):'}</span>
                {feature.data.pollens.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-[var(--rule)] text-xs">
                    <div>
                      <b className="text-[var(--ink)]">{p.family}</b>
                      <span className="block text-[10px] text-[var(--ink-3)]">{p.commonName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{p.concentrationGrainsM3} gr/m³</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${p.level === 'ALTO' ? 'bg-rose-500/20 text-rose-300' : p.level === 'MEDIO' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {p.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Fonte:' : 'Source:'} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'tributaryRiver' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] text-sky-400 uppercase font-mono font-bold">{language === 'it' ? 'Portata Media' : 'Average Discharge'}</span>
                  <p className="text-lg font-bold font-mono text-sky-300">{feature.data.avgFlowM3s} m³/s</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Bacino Scolante' : 'Drainage Basin'}</span>
                  <p className="text-base font-bold font-mono text-[var(--ink)]">{feature.data.basinAreaKm2} km²</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{language === 'it' ? 'Stato Qualità' : 'Quality Status'}</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.waterQualityState}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex flex-col gap-1 text-xs">
                <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{language === 'it' ? 'Consorzio di Bonifica Competente:' : 'Drainage Authority:'}</span>
                <p className="font-bold text-[var(--ink)]">{feature.data.managementConsortium}</p>
                <p className="text-[var(--ink-2)] mt-1">{feature.data.freshwaterInputNotes}</p>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {language === 'it' ? 'Fonte:' : 'Source:'} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
