'use client';

import { FIBER_CLASS_KEY, FIBER_COLORS, fiberOperators, type FiberCell } from '@/lib/fiber';
import React from 'react';
import { PHARMACY_DUTY_URL } from '@/lib/pharmacies-data';
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
  AirQualityItem,
  CivicPoiItem,
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
  PharmacyItem,
  HeatIslandSurfaceTempItem,
  LagoonWaterQualityItem,
  TouristAccommodationItem,
  RegionalBikeRouteItem,
  PollenMonitoringStationItem,
  LagoonTributaryRiverItem,
  ParkingItem,
  CityAssetItem
} from '@/lib/types';
import { Droplet, Building2, Bike, Flower2, GitBranch, Car } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

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
  | { type: 'pharmacy'; data: PharmacyItem }
  | { type: 'heatIsland'; data: HeatIslandSurfaceTempItem }
  | { type: 'lagoonWater'; data: LagoonWaterQualityItem }
  | { type: 'accommodation'; data: TouristAccommodationItem }
  | { type: 'bikeRoute'; data: RegionalBikeRouteItem }
  | { type: 'pollenStation'; data: PollenMonitoringStationItem }
  | { type: 'tributaryRiver'; data: LagoonTributaryRiverItem }
  | { type: 'parking'; data: ParkingItem }
  | { type: 'fountain'; data: CityAssetItem }
  | { type: 'fiberCell'; data: { cell: FiberCell; dataDate: string } }
  | { type: 'airStation'; data: AirQualityItem }
  | { type: 'civicPoi'; data: CivicPoiItem };

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
  const { t } = useTranslation();
  const panelRef = useDialogA11y(feature !== null, onClose);
  if (!feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-modal-title"
        tabIndex={-1}
        className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none">
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
            {feature.type === 'fountain' && (
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400"><Droplet className="w-5 h-5" /></div>
            )}
            {feature.type === 'fiberCell' && (
              <div className="p-2 rounded-xl bg-green-500/20 text-green-400"><Wifi className="w-5 h-5" /></div>
            )}
            {feature.type === 'airStation' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Wind className="w-5 h-5" /></div>
            )}
            {feature.type === 'civicPoi' && (
              <div className={`p-2 rounded-xl ${feature.data.kind === 'recycling' ? 'bg-green-500/20 text-green-400' : 'bg-violet-500/20 text-violet-400'}`}>
                {feature.data.kind === 'recycling' ? <Trash2 className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
              </div>
            )}

            <div>
              <h2 id="feature-modal-title" className="text-base font-bold leading-tight">
                {feature.type === 'passerella' && feature.data.name}
                {feature.type === 'briccola' && `${feature.data.code} · ${feature.data.channelName}`}
                {feature.type === 'oceanStation' && feature.data.name}
                {feature.type === 'bathingWater' && feature.data.name}
                {feature.type === 'urbanTree' && `${feature.data.commonName} (${feature.data.species})`}
                {feature.type === 'evCharging' && feature.data.name}
                {feature.type === 'wifiHotspot' && feature.data.name}
                {feature.type === 'speedLimit' && `${t('ui.feature.limiteVelocita')}: ${feature.data.channelName}`}
                {feature.type === 'bridgeClearance' && `${feature.data.bridgeName} (${feature.data.rioName})`}
                {feature.type === 'gondolaStation' && feature.data.name}
                {feature.type === 'publicDock' && feature.data.name}
                {feature.type === 'subsidence' && `${t('ui.feature.subsidenzaInsar')}: ${feature.data.location}`}
                {feature.type === 'lagoonMorphology' && feature.data.name}
                {feature.type === 'marineWind' && `${t('ui.feature.stazioneMeteomarina')}: ${feature.data.stationName}`}
                {feature.type === 'trainLive' && feature.data.trainNumber}
                {feature.type === 'wasteBoat' && `${t('ui.feature.battelloVeritas')}: ${feature.data.boatCode}`}
                {feature.type === 'nizioleto' && feature.data.nizioletoText}
                {feature.type === 'veniceWell' && feature.data.name}
                {feature.type === 'bellTower' && feature.data.name}
                {feature.type === 'fortressIsland' && feature.data.name}
                {feature.type === 'emergencyDock' && feature.data.name}
                {feature.type === 'publicDae' && `${t('ui.feature.defibrillatoreDae')}: ${feature.data.code}`}
                {feature.type === 'pharmacy' && feature.data.name}
                {feature.type === 'heatIsland' && `${t('ui.feature.isolaCalore')}: ${feature.data.zoneName}`}
                {feature.type === 'lagoonWater' && `${t('ui.feature.acqueArpav')}: ${feature.data.stationName}`}
                {feature.type === 'accommodation' && `${t('ui.feature.pressioneRicettiva')}: ${feature.data.zoneName}`}
                {feature.type === 'bikeRoute' && feature.data.routeName}
                {feature.type === 'pollenStation' && feature.data.stationName}
                {feature.type === 'tributaryRiver' && `${t('ui.feature.fiumeScolante')}: ${feature.data.riverName}`}
                {feature.type === 'parking' && feature.data.name}
                {feature.type === 'fountain' && feature.data.name}
                {feature.type === 'fiberCell' && t('ui.feature.fiberTitle')}
                {feature.type === 'airStation' && `ARPAV · ${feature.data.stationName}`}
                {feature.type === 'civicPoi' && feature.data.name}
              </h2>
              <span className="text-[11px] font-mono text-[var(--ink-2)]">
                {feature.type === 'speedLimit' && `${feature.data.zoneType} · Max ${feature.data.maxSpeedKmh} km/h`}
                {feature.type === 'bridgeClearance' && `${t('ui.feature.francoZeroMarea')}: ${feature.data.clearanceCmZeroMarea} cm`}
                {feature.type === 'subsidence' && `${feature.data.satellite} · Trend: ${feature.data.trend}`}
                {feature.type === 'trainLive' && `${feature.data.origin} → ${feature.data.destination}`}
                {feature.type === 'nizioleto' && `${t('ui.feature.sestiere')} ${feature.data.sestiere} · ${t('ui.feature.civico')} ${feature.data.civicNumber}`}
                {feature.type === 'emergencyDock' && `SUEM 118 · ${feature.data.hospital}`}
                {feature.type === 'heatIsland' && `${t('ui.feature.tempSuperficiale')}: ${feature.data.surfaceTempCelsius}°C`}
                {feature.type === 'lagoonWater' && `${t('ui.feature.bacino')} ${feature.data.subBasin.replace(/_/g, ' ')} · ${t('ui.feature.statoTrofico')}: ${feature.data.trophicState}`}
                {feature.type === 'accommodation' && `${t('ui.feature.densita')}: ${feature.data.densityCategory} · ${feature.data.bedsPerResidentRatio} ${t('ui.feature.postiLettoResidente')}`}
                {feature.type === 'bikeRoute' && `${t('ui.feature.lunghezza')}: ${feature.data.lengthKm} km · ${feature.data.section}`}
                {feature.type === 'pollenStation' && t('ui.feature.pollenSubtitle')}
                {feature.type === 'airStation' && `${feature.data.location} · ${feature.data.stationType}`}
                {feature.type === 'civicPoi' && `${t(feature.data.kind === 'recycling' ? 'ui.feature.recyclingCentre' : 'ui.feature.library')} · ${feature.data.zone}`}
                {feature.type === 'tributaryRiver' && `${t('ui.feature.portata')}: ${feature.data.avgFlowM3s} m³/s · ${feature.data.mouthZone}`}
                {feature.type === 'parking' && `${feature.data.location} · ${feature.data.operator}`}
                {feature.type === 'fountain' && `${feature.data.sestiere} · ${t('ui.feature.fountainSubtitle')}`}
                {feature.type === 'fiberCell' && t('ui.feature.fiberSubtitle', { date: feature.data.dataDate.split('-').reverse().join('/') })}
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.velocitaMassima')}</span>
                  <p className="text-2xl font-bold font-mono text-amber-400">{feature.data.maxSpeedKmh} km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.controlloElettronico')}</span>
                  <p className="text-base font-bold font-mono text-cyan-400 mt-1">
                    {feature.data.isBarcavelox 
                      ? (t('ui.feature.barcaveloxAttivo')) 
                      : (t('ui.feature.pattugliamentoPolizia'))}
                  </p>
                </div>
              </div>
              <p className="text-[var(--ink)]">{feature.data.description}</p>
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]">
                <b>{t('ui.feature.regolamento')}</b> {feature.data.ordinanza}
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
                            ? t('ui.feature.francoAttualeMarea', { cm: currentTideLevelCm ?? 0 })
                            : (t('ui.feature.francoZeroMareograficoMareaN'))}
                        </span>
                        <p className={`text-2xl font-bold font-mono ${isNavigable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {liveClearance} cm
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                        <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.mareaMaxTransito')}</span>
                        <p className="text-2xl font-bold font-mono text-cyan-400">+{feature.data.minNavigableTideCm} cm</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isNavigable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <span className="font-semibold">{t('ui.feature.transitoImbarcazioni')}</span>
                      <span className="font-mono font-bold">
                        {isNavigable 
                          ? (t('ui.feature.transitabileOra')) 
                          : (t('ui.feature.attenzioneAltezzaCritica'))}
                      </span>
                    </div>
                    <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
                    <div className="text-[11px] text-[var(--ink-3)]">
                      {t('ui.feature.gradiniPonte')} <b>{feature.data.stepsCount}</b> · {t('ui.feature.rampaAccessibile')} <b>{feature.data.isAccessibleRamp ? (t('ui.feature.si')) : 'No'}</b>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.gondoleOperative')}</span>
                  <p className="text-2xl font-bold font-mono text-purple-400">{feature.data.activeGondolas}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.tariffaRegolata')}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">€ {feature.data.priceEur.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">{t('ui.feature.orariServizio')} <b>{feature.data.openingHours}</b></p>
              <div className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {t('ui.feature.gestione')} <b>{feature.data.managedBy}</b>
              </div>
            </>
          )}

          {/* SUBSIDENCE InSAR */}
          {feature.type === 'subsidence' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.velocitaMovimentoSuolo')}</span>
                  <p className="text-2xl font-bold font-mono text-rose-400">{feature.data.velocityMmYear} mm/anno</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.affidabilitaRadarCoerenza')}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{Math.round(feature.data.coherence * 100)}%</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                {t('ui.feature.datiInterferometriciSatellitariElaborati')}
              </p>
            </>
          )}

          {/* LAGOON MORPHOLOGY */}
          {feature.type === 'lagoonMorphology' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.superficieProtetta')}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.areaHectares} ha</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.quotaMediaFondale')}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.avgDepthMeters} m</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
                <b>{t('ui.feature.tutela')}</b> {feature.data.protectionDirective}
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
                  {feature.data.stationType === 'AEROPORTO' && (t('ui.feature.stazioneAeronauticaMilitareEnavLipz'))}
                  {feature.data.stationType === 'PIATTAFORMA_OFFSHORE' && (t('ui.feature.piattaformaCnrIsmar15Km'))}
                  {feature.data.stationType === 'BOCCA_DI_PORTO' && (t('ui.feature.boccaPortoLagunareMose'))}
                  {feature.data.stationType === 'CENTRO_STORICO' && (t('ui.feature.lagunaCentroStorico'))}
                  {feature.data.stationType === 'TERRAFERMA' && (t('ui.feature.terrafermaMestreArpav'))}
                </span>
                <span className="text-[10px] text-[var(--ink-3)] font-mono">
                  {feature.data.lat.toFixed(4)}°N, {feature.data.lon.toFixed(4)}°E
                </span>
              </div>

              {/* Anemometer & Wave Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" /> {t('ui.feature.ventoDirezione')}
                  </span>
                  <p className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                    {feature.data.windDirection} ({feature.data.windDirectionDeg}°)
                  </p>
                  <span className="text-xs font-mono text-[var(--ink)] block mt-0.5">
                    {feature.data.windSpeedKmh} km/h · {feature.data.windSpeedKnots} kt
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">
                    {t('ui.feature.raffica')}: {feature.data.gustSpeedKmh} km/h ({feature.data.gustSpeedKnots} kt)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono flex items-center gap-1">
                    <Waves className="w-3 h-3 text-cyan-400" /> {t('ui.feature.altezzaDOndaHs')}
                  </span>
                  <p className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {feature.data.waveHeightMeters === null ? 'n.d.' : `${feature.data.waveHeightMeters} m`}
                  </p>
                  <span className="text-[10px] text-[var(--ink-3)] block mt-0.5">
                    {feature.data.waveHeightMeters === null
                      ? (t('ui.feature.stazioneNonMisuraOnde'))
                      : feature.data.waveHeightMeters > 1.5
                      ? (t('ui.feature.mareMoltoMossoAgitato'))
                      : feature.data.waveHeightMeters > 0.5 
                      ? (t('ui.feature.mareMosso')) 
                      : (t('ui.feature.lagunaCalmaPocoMosso'))}
                  </span>
                </div>
              </div>

              {/* Atmospheric Parameters */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('ui.feature.temperatura')}</span>
                  <span className="font-mono font-bold text-[var(--ink)] text-sm">
                    {feature.data.airTempCelsius ?? 18}°C
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('ui.feature.pressione')}</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                    {feature.data.pressureHpa ?? 1015} hPa
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('ui.feature.umiditaRel')}</span>
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
                    <ShieldAlert className="w-3.5 h-3.5" /> {t('ui.feature.spintaIdrodinamicaVersoLaguna')}
                  </span>
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-black/30">
                    {t('ui.feature.rischio')} {feature.data.tidePushRisk}
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
                      <Plane className="w-3.5 h-3.5" /> {t('ui.feature.bollettinoUfficialeMetarAeronauticaMilit')}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                      {feature.data.metar.flightCategory}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-sunken)] border border-[var(--rule)] font-mono text-[11px] text-sky-600 dark:text-sky-300 select-all break-all">
                    {feature.data.metar.rawMetar}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)]">
                    <span>QNH: <b>{feature.data.metar.qnhHpa} hPa</b> · {t('ui.feature.pista')}: <b>{feature.data.metar.activeRunway}</b></span>
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
                  <span className="text-[var(--ink-2)]">{t('ui.feature.infrastrutturaNodo')}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.trainNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.dotazioneBinariImpianto')}</span>
                  <span className="font-semibold text-cyan-400">{feature.data.platform}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.connessioneLinea')}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.origin} → {feature.data.destination}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.ubicazione')}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.currentLocation}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {t('ui.feature.anagraficaInfrastrutturaleNodoFerroviari')}
                </span>
              </div>
            </>
          )}

          {/* PARKING */}
          {feature.type === 'parking' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.capienzaDichiarata')}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">
                    {feature.data.totalSpots ?? 'n.d.'} {feature.data.totalSpots !== null && <span className="text-xs text-[var(--ink-2)] font-normal">{t('ui.feature.posti')}</span>}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.zonaIndicativa')}</span>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-1">{feature.data.location}</p>
                </div>
              </div>

              <div className="space-y-2">
                {feature.data.rateHourly && (
                  <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                    <span className="text-[var(--ink-2)]">{t('ui.feature.tariffaIndicativa')}</span>
                    <span className="font-semibold text-[var(--ink)]">{feature.data.rateHourly}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.gestore')}</span>
                  <span className="font-semibold text-[var(--ink)]">{feature.data.operator}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{t('ui.feature.parkingNote')}</span>
              </div>
            </>
          )}

          {/* NIZIOLETO */}
          {feature.type === 'nizioleto' && (
            <>
              <div className="p-4 rounded-xl bg-neutral-100 text-neutral-900 border-2 border-neutral-900 font-serif text-center shadow-lg">
                <span className="text-xs uppercase tracking-widest text-neutral-600 block">{t('ui.feature.toponomasticaTradizionale')}</span>
                <p className="text-lg font-bold tracking-wider mt-1">{feature.data.nizioletoText}</p>
              </div>
              <p className="text-[var(--ink-2)]">{feature.data.historicalNotes}</p>
              <div className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.sestiere')}: <b>{feature.data.sestiere}</b> · {t('ui.feature.numeroCivico')}: <b>{feature.data.civicNumber}</b>
              </div>
            </>
          )}

          {/* VENICE WELL */}
          {feature.type === 'veniceWell' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.epocaStorica')}</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.century ?? '–'}</p>
                </div>
              </div>
              {feature.data.material && (
                <p className="text-[var(--ink-2)]">
                  {t('ui.feature.materiale')}: <strong>{feature.data.material.replace(/_/g, ' ')}</strong> · {t('ui.feature.stile')}: <strong>{feature.data.style}</strong>
                </p>
              )}
            </>
          )}

          {/* BELL TOWER */}
          {feature.type === 'bellTower' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.altezzaTorre')}</span>
                  <p className="text-2xl font-bold font-mono text-orange-400">{feature.data.heightMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.inclinazionePendenza')}</span>
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
                <span className="font-bold">{t('ui.feature.accessoSanitarioRiservatoSuem118')}</span>
                <p className="text-xs text-[var(--ink-2)] mt-1">{t('ui.feature.pontilePrioritarioIdroambulanzeEdEmergen')}</p>
              </div>
              <p className="text-[var(--ink-2)]">{t('ui.feature.ospedaleRiferimento')} <b>{feature.data.hospital}</b></p>
              <p className="text-[var(--ink-2)]">{t('ui.feature.rampaDirettaOspedale')} <b>{feature.data.hasDirectHospitalRamp ? (t('ui.feature.presente')) : (t('ui.feature.nonPresente'))}</b></p>
              <span className="text-[11px] font-mono text-amber-400">{t('ui.feature.emergencyDockToVerify')}</span>
            </>
          )}

          {/* HEAT ISLAND */}
          {feature.type === 'heatIsland' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.tempSuperficieLst')}</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.surfaceTempCelsius > 32 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {feature.data.surfaceTempCelsius}°C
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.deltaMicroclimatico')}</span>
                  <p className={`text-2xl font-bold font-mono ${feature.data.airTempDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {feature.data.airTempDelta > 0 ? `+${feature.data.airTempDelta}°C` : `${feature.data.airTempDelta}°C`}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.superficie')}: <b>{feature.data.surfaceType.replace(/_/g, ' ')}</b> · {t('ui.feature.missione')}: <b>{feature.data.satelliteMission}</b>
              </div>
            </>
          )}

          {/* PASSERELLE (existing fallback) */}
          {feature.type === 'passerella' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.lunghezza')}</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{feature.data.lengthMeters} m</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.sogliaAttivazione')}</span>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.luce')}</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">{feature.data.lightColor}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.fondale')}</span>
                  <p className="text-sm font-bold font-mono text-cyan-400">-{feature.data.depthMeters}m</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.pali')}</span>
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
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.altezzaOndaHs')}</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400">{feature.data.waveHeightMeters === null ? 'n.d.' : `${feature.data.waveHeightMeters} m`}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.tempAcqua')}</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{feature.data.waterTempC === null ? 'n.d.' : `${feature.data.waterTempC} °C`}</p>
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.operatore')} <b>{feature.data.operator}</b> · {feature.data.observedAt ? t('ui.feature.cpsmMeasuredAt', { time: feature.data.observedAt }) : t('ui.feature.noOpenMeasures')}
              </div>
              {feature.data.forecast && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-sky-400 font-bold">
                    {t('ui.feature.marineForecastTitle', { time: feature.data.forecast.validTime.slice(11, 16) })}
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <span>{t('ui.feature.altezzaOndaHs')}: <b>{feature.data.forecast.waveHeightM ?? 'n.d.'} m</b></span>
                    <span>{t('ui.feature.tempAcqua')}: <b>{feature.data.forecast.seaTempC ?? 'n.d.'} °C</b></span>
                    <span>{t('ui.feature.wavePeriod')}: <b>{feature.data.forecast.wavePeriodS ?? 'n.d.'} s</b></span>
                    <span>{t('ui.feature.waveDirection')}: <b>{feature.data.forecast.waveDirectionDeg ?? 'n.d.'}°</b></span>
                  </div>
                  {feature.data.forecast.waveMax72hM !== null && feature.data.forecast.waveMax72hAt && (
                    <span className="text-xs text-[var(--ink-2)]">
                      {t('ui.feature.waveMax72h', {
                        m: feature.data.forecast.waveMax72hM,
                        when: `${feature.data.forecast.waveMax72hAt.slice(8, 10)}/${feature.data.forecast.waveMax72hAt.slice(5, 7)} ${feature.data.forecast.waveMax72hAt.slice(11, 16)}`,
                      })}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--ink-3)]">{t('ui.feature.marineForecastNote')}</span>
                </div>
              )}
            </>
          )}

          {/* TREE */}
          {feature.type === 'urbanTree' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.altezza')}</span>
                  <p className="text-2xl font-bold font-mono text-green-400">{feature.data.heightMeters !== null ? `${feature.data.heightMeters} m` : 'n.d.'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">MASAF</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">{feature.data.masafRef ?? '–'}</p>
                </div>
              </div>
              <p className="text-[var(--ink-2)]">
                {feature.data.location}
                {feature.data.circumferenceMeters ? <> · {t('ui.feature.circonferenza')} <b>{feature.data.circumferenceMeters} m</b></> : null}
              </p>
            </>
          )}

          {/* EV & WIFI */}
          {feature.type === 'evCharging' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.prese')}</span>
              <p className="text-2xl font-bold font-mono text-yellow-400">{feature.data.totalSockets ?? 'n.d.'}</p>
              <span className="text-[11px] text-[var(--ink-3)] block">
                {t('ui.feature.disponibilitaTempoRealeNonPubblicata')}
              </span>
              {feature.data.powerKw !== null && (
                <span className="text-xs text-[var(--ink-2)] block">{t('ui.feature.potenza')} {feature.data.powerKw} kW</span>
              )}
              {feature.data.socketTypes.length > 0 && (
                <span className="text-xs text-[var(--ink-2)] block">{feature.data.socketTypes.join(' · ')}</span>
              )}
              <span className="text-xs text-[var(--ink-2)] block">
                {t('ui.feature.gestore')} <b>{feature.data.operator}</b> · {feature.data.location}
              </span>
              {feature.data.openingHours && (
                <span className="text-[11px] text-[var(--ink-3)] font-mono block">{feature.data.openingHours}</span>
              )}
            </div>
          )}

          {feature.type === 'wifiHotspot' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.statoDatasetComune')}</span>
              <p className={`text-xl font-bold font-mono ${feature.data.status === 'ATTIVO' ? 'text-emerald-400' : 'text-[var(--ink-3)]'}`}>
                {feature.data.status === 'ATTIVO' ? (t('ui.feature.attivo')) : feature.data.status === 'NON_ATTIVO' ? (t('ui.feature.nonAttivo')) : 'n.d.'}
              </p>
              <span className="text-xs text-[var(--ink-2)]">
                {feature.data.networkName} · {feature.data.indoorOutdoor === 'INDOOR' ? (t('ui.feature.interno')) : (t('ui.feature.esterno'))} · {t('ui.feature.fonteDatiVeneziaItCc')}
              </span>
            </div>
          )}

          {/* Generic fallback for remaining types */}
          {feature.type === 'publicDock' && (
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.sostaMassimaConsentita')}</span>
              <p className="text-2xl font-bold font-mono text-blue-400">{feature.data.maxStayMinutes} min</p>
            </div>
          )}

          {feature.type === 'fortressIsland' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">{feature.data.description}</p>
              <span className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.epoca')} <b>{feature.data.era.replace(/_/g, ' ')}</b> · {t('ui.feature.stato')} <b>{feature.data.status.replace(/_/g, ' ')}</b>
              </span>
            </div>
          )}

          {feature.type === 'publicDae' && (
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <b>{t('ui.feature.defibrillatoreSalvavitaPubblicoDae')}</b>
                <p className="text-xs text-[var(--ink-2)] mt-1">{t('ui.feature.accessoImmediato')} {feature.data.accessType.replace(/_/g, ' ')}</p>
              </div>
              {feature.data.openingHours && (
                <span className="text-[11px] text-[var(--ink-3)] font-mono">{feature.data.openingHours}</span>
              )}
              <span className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.gestore')} <b>{feature.data.operator}</b>
                {feature.data.checkDate && (
                  <> · {t('ui.feature.ultimaIspezione')} <b>{feature.data.checkDate}</b></>
                )}
              </span>
              {feature.data.source === 'ELENCO_CURATO' ? (
                <span className="text-[11px] font-mono text-amber-400">{t('ui.feature.daeToVerify')}</span>
              ) : (
                <a
                  href={feature.data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  © OpenStreetMap contributors (ODbL)
                </a>
              )}
            </div>
          )}

          {feature.type === 'pharmacy' && (
            <div className="flex flex-col gap-2">
              <a
                href={PHARMACY_DUTY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border bg-green-500/10 border-green-500/30 text-green-300 text-xs hover:underline"
              >
                {t('ui.feature.pharmacyDutyLink')}
              </a>
              {feature.data.openingHours && (
                <span className="text-[11px] text-[var(--ink-3)] font-mono">{feature.data.openingHours}</span>
              )}
              <span className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.indirizzo')} <b>{feature.data.address}</b>
                {feature.data.phone && (
                  <> · {t('ui.feature.telefono')} <b>{feature.data.phone}</b></>
                )}
              </span>
              {feature.data.source === 'ELENCO_CURATO' ? (
                <span className="text-[11px] font-mono text-amber-400">{t('ui.feature.pharmacyToVerify')}</span>
              ) : (
                <a href={feature.data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-cyan-400 hover:underline">
                  © OpenStreetMap contributors (ODbL)
                </a>
              )}
            </div>
          )}

          {feature.type === 'wasteBoat' && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-2)]">{t('ui.feature.zonaAssegnata')} <b>{feature.data.assignedZone}</b></p>
              <span className="text-[11px] text-[var(--ink-3)]">
                {t('ui.feature.frazioneRaccolta')} <b>{feature.data.collectionType.replace(/_/g, ' ')}</b> · {t('ui.feature.orario')} <b>{feature.data.scheduleHours}</b>
              </span>
              <a
                href="https://www.comune.venezia.it/it/content/raccolta-rifiuti-centro-storico-e-isole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {t('ui.feature.wasteOfficialLink')}
              </a>
            </div>
          )}

          {feature.type === 'lagoonWater' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">{t('ui.feature.statoTroficoLagunare')}</span>
                  <p className="text-lg font-bold text-[var(--ink)]">{feature.data.trophicState}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{t('ui.feature.profonditaSonda')}</span>
                  <p className="text-sm font-mono font-bold text-cyan-300">-{feature.data.monitoringDepthMeters} m</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.salinita')}</span>
                  <p className="text-base font-bold font-mono text-cyan-400">{feature.data.salinityPsu} <span className="text-xs">PSU</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.tempAcqua')}</span>
                  <p className="text-base font-bold font-mono text-amber-400">{feature.data.waterTempCelsius}°C</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">pH</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.ph}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.ossigenoO2')}</span>
                  <p className="text-base font-bold font-mono text-blue-400">{feature.data.dissolvedOxygenPercent}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.torbidita')}</span>
                  <p className="text-base font-bold font-mono text-slate-300">{feature.data.turbidityNtu} <span className="text-xs">NTU</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.conducibilita')}</span>
                  <p className="text-base font-bold font-mono text-purple-400">{feature.data.conductivityMsCm} <span className="text-xs">mS/cm</span></p>
                </div>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {t('ui.feature.riferimento')} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'accommodation' && (
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl border ${feature.data.densityCategory === 'CRITICA' ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold">{t('ui.feature.indiceOvertourism')}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20">{feature.data.densityCategory}</span>
                </div>
                <p className="text-sm mt-1 text-[var(--ink)]">
                  {t('ui.feature.rapporto')} <b>{feature.data.bedsPerResidentRatio} {t('ui.feature.postiLettoTuristiciCiascunResidente')}</b>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.postiLettoTotali')}</span>
                  <p className="text-xl font-bold font-mono text-fuchsia-400">{feature.data.totalBeds.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.struttureCensite')}</span>
                  <p className="text-xl font-bold font-mono text-purple-400">{feature.data.totalStructures.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.settoreAlberghieroHotel')}</span>
                  <span className="font-bold font-mono text-[var(--ink)]">
                    {feature.data.hotelCount} hotel ({t('ui.feature.stelleHotel', { five: feature.data.starRatingBreakdown.fiveStar, four: feature.data.starRatingBreakdown.fourStar, three: feature.data.starRatingBreakdown.threeStar })})
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--rule)] pt-1.5">
                  <span className="text-[var(--ink-2)]">{t('ui.feature.extraAlberghieroBBLocazioni')}</span>
                  <span className="font-bold font-mono text-fuchsia-400">{feature.data.extraHotelCount} ({t('ui.feature.locazioni')}: {feature.data.starRatingBreakdown.holidayHomes}, B&B: {feature.data.starRatingBreakdown.bAndB})</span>
                </div>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {t('ui.feature.riferimento')} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'bikeRoute' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">{t('ui.feature.lunghezza')}</span>
                  <p className="text-lg font-bold font-mono text-emerald-300">{feature.data.lengthKm} km</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.fondoStradale')}</span>
                  <p className="text-xs font-bold text-[var(--ink)] mt-1">{feature.data.surfaceType.replace(/_/g, ' ')}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.difficolta')}</span>
                  <p className="text-xs font-bold text-cyan-400 mt-1">{feature.data.difficulty.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{t('ui.feature.interscambioLagunareIntermodale')}</span>
                <p className="text-[var(--ink)] mt-0.5 font-medium">{feature.data.ferryInterchange}</p>
              </div>

              <p className="text-xs text-[var(--ink-2)] leading-relaxed">{feature.data.description}</p>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {t('ui.feature.riferimento')} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'pollenStation' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-lime-400 font-bold">{t('ui.feature.pollenOverall')}</span>
                  <p className="text-lg font-bold text-[var(--ink)]">{t(`ui.feature.pollenLevel_${feature.data.overallAllergyRisk ?? 'ND'}`)}</p>
                </div>
                {feature.data.validTime && (
                  <span className="text-[10px] font-mono text-[var(--ink-3)] text-right">
                    {t('ui.feature.forecastValidAt', { time: feature.data.validTime.slice(11, 16) })}
                  </span>
                )}
              </div>

              {feature.data.pollens.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase">{t('ui.feature.pollenFamilies')}</span>
                  {feature.data.pollens.map((p) => (
                    <div key={p.key} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-[var(--rule)] text-xs">
                      <div>
                        <b className="text-[var(--ink)]">{t(`ui.feature.pollen_${p.key}`)}</b>
                        <span className="block text-[10px] text-[var(--ink-3)]">{t(`ui.feature.pollenFamily_${p.key}`)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{p.grainsM3 === null ? 'n.d.' : `${p.grainsM3} gr/m³`}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${p.level === 'ALTO' ? 'bg-rose-500/20 text-rose-300' : p.level === 'MEDIO' ? 'bg-amber-500/20 text-amber-300' : p.level === 'BASSO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--rule)] text-[var(--ink-3)]'}`}>
                          {t(`ui.feature.pollenLevel_${p.level}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--ink-2)]">{t('ui.feature.forecastUnavailable')}</p>
              )}

              <p className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">{t('ui.feature.pollenNote')}</p>
            </div>
          )}

          {feature.type === 'tributaryRiver' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] text-sky-400 uppercase font-mono font-bold">{t('ui.feature.portataMedia')}</span>
                  <p className="text-lg font-bold font-mono text-sky-300">{feature.data.avgFlowM3s} m³/s</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.bacinoScolante')}</span>
                  <p className="text-base font-bold font-mono text-[var(--ink)]">{feature.data.basinAreaKm2} km²</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--rule)]">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono">{t('ui.feature.statoQualita')}</span>
                  <p className="text-base font-bold font-mono text-emerald-400">{feature.data.waterQualityState}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex flex-col gap-1 text-xs">
                <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.feature.consorzioBonificaCompetente')}</span>
                <p className="font-bold text-[var(--ink)]">{feature.data.managementConsortium}</p>
                <p className="text-[var(--ink-2)] mt-1">{feature.data.freshwaterInputNotes}</p>
              </div>

              <span className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2">
                {t('ui.feature.riferimento')} <b>{feature.data.officialSource}</b>
              </span>
            </div>
          )}

          {feature.type === 'fountain' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--rule)] flex flex-col gap-1.5 text-xs">
                {feature.data.typology && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.feature.tipologia')}</span>
                    <span className="font-mono text-[var(--ink-2)] text-right">{feature.data.typology}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--rule)] pt-1.5">
                  <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.feature.zonaIndicativa')}</span>
                  <span className="font-bold text-[var(--ink)]">{feature.data.sestiere}</span>
                </div>
                {feature.data.operator && (
                  <div className="flex items-center justify-between border-t border-[var(--rule)] pt-1.5">
                    <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.feature.gestore')}</span>
                    <span className="text-[var(--ink-2)]">{feature.data.operator}</span>
                  </div>
                )}
              </div>

              {feature.data.details && (
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-[var(--ink-2)] leading-relaxed">
                  {feature.data.details}
                </div>
              )}

              <p className="text-[11px] text-[var(--ink-3)]">{t('ui.feature.fountainNote')}</p>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-3)] bg-black/20 p-2 rounded-lg border border-[var(--rule)]">
                <span>{t('ui.feature.coordinate')}</span>
                <span className="text-[var(--ink)]">{feature.data.lat.toFixed(5)}, {feature.data.lon.toFixed(5)}</span>
              </div>
            </div>
          )}

          {feature.type === 'fiberCell' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl border flex items-center gap-3" style={{ borderColor: FIBER_COLORS[feature.data.cell[2]] }}>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: FIBER_COLORS[feature.data.cell[2]] }} />
                <div>
                  <p className="text-base font-bold">{t(`ui.feature.fiber_${FIBER_CLASS_KEY[feature.data.cell[2]]}`)}</p>
                  <span className="text-[11px] text-[var(--ink-2)]">{t(`ui.feature.fiberSpeed_${FIBER_CLASS_KEY[feature.data.cell[2]]}`)}</span>
                </div>
              </div>
              {feature.data.cell[3] > 0 && (
                <p className="text-[var(--ink-2)]">
                  {t('ui.feature.fiberOperators')} <b>{fiberOperators(feature.data.cell[3]).join(', ')}</b>
                </p>
              )}
              <p className="text-[11px] text-[var(--ink-3)]">{t('ui.feature.fiberNote')}</p>
              <a href="https://maps.agcom.it" target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cc-by-88x31.png" alt="CC BY 4.0" width={66} height={23} />
                {t('ui.feature.fiberAttribution')}
              </a>
            </div>
          )}

          {feature.type === 'airStation' && <AirStationBody station={feature.data} />}

          {feature.type === 'civicPoi' && (
            <div className="flex flex-col gap-2">
              {feature.data.address && <p className="text-[var(--ink-2)]">{t('ui.feature.indirizzo')} <b>{feature.data.address}</b></p>}
              {feature.data.operator && <p className="text-[var(--ink-2)]">{t('ui.feature.gestore')} <b>{feature.data.operator}</b></p>}
              {feature.data.openingHours && <span className="text-[11px] font-mono text-[var(--ink-3)]">{feature.data.openingHours}</span>}
              {feature.data.website && (
                <a href={feature.data.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-cyan-400 hover:underline break-all">
                  {feature.data.website}
                </a>
              )}
              <a
                href={feature.data.kind === 'recycling' ? 'https://www.comune.venezia.it/it/content/gestione-rifiuti-ingombranti' : 'https://www.comune.venezia.it/it/content/vuoi-avere-prestito-un-ebook'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 text-xs hover:underline"
              >
                {t(feature.data.kind === 'recycling' ? 'ui.feature.recyclingOfficialLink' : 'ui.feature.libraryOfficialLink')}
              </a>
              <p className="text-[11px] text-[var(--ink-3)]">{t('ui.feature.civicPoiNote')}</p>
            </div>
          )}

          <FeatureProvenance feature={feature} />
        </div>
      </div>
    </div>
  );
};

/** Tipi che vengono da elenchi compilati nel progetto, senza un campo `source` per voce. */
const CURATED_TYPES = new Set<VeniceFeatureSelected['type']>([
  'passerella', 'briccola', 'bathingWater', 'speedLimit', 'bridgeClearance', 'gondolaStation', 'publicDock',
  'subsidence', 'lagoonMorphology', 'trainLive', 'wasteBoat', 'nizioleto', 'bellTower', 'fortressIsland',
  'heatIsland', 'lagoonWater', 'accommodation', 'bikeRoute', 'tributaryRiver',
]);

/** Tipi che mostrano già la propria nota di provenienza nel corpo della scheda. */
const OWN_PROVENANCE = new Set<VeniceFeatureSelected['type']>(['publicDae', 'pharmacy', 'emergencyDock', 'wifiHotspot', 'fiberCell', 'pollenStation', 'airStation']);

/** Nota di provenienza in fondo alla scheda: link OSM, oppure "elenco curato, da verificare". */
const FeatureProvenance: React.FC<{ feature: VeniceFeatureSelected }> = ({ feature }) => {
  const { t } = useTranslation();
  if (OWN_PROVENANCE.has(feature.type)) return null;
  const data = feature.data as { source?: string; sourceUrl?: string; positionConfirmed?: boolean };

  if (CURATED_TYPES.has(feature.type)) {
    return (
      <p className="text-[11px] font-mono text-amber-400 border-t border-[var(--rule)] pt-2">
        {t('ui.feature.curatedExampleValues')}
      </p>
    );
  }
  if (data.source === 'OPENSTREETMAP' && data.sourceUrl) {
    return (
      <a
        href={data.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-mono text-cyan-400 hover:underline border-t border-[var(--rule)] pt-2"
      >
        © OpenStreetMap contributors (ODbL)
      </a>
    );
  }
  if (data.source === 'ELENCO_CURATO') {
    return (
      <div className="flex flex-col gap-1 border-t border-[var(--rule)] pt-2 text-[11px] font-mono">
        <span className="text-amber-400">{t('ui.feature.curatedToVerify')}</span>
        {feature.type === 'veniceWell' && data.positionConfirmed !== undefined && (
          <span className={data.positionConfirmed ? 'text-emerald-400' : 'text-[var(--ink-3)]'}>
            {data.positionConfirmed ? t('ui.feature.wellPositionConfirmed') : t('ui.feature.wellPositionUnconfirmed')}
          </span>
        )}
      </div>
    );
  }
  return null;
};

const AQI_BAND_CLASS: Record<string, string> = {
  good: 'text-emerald-400',
  fair: 'text-lime-400',
  moderate: 'text-amber-400',
  poor: 'text-orange-400',
  veryPoor: 'text-rose-400',
  extremelyPoor: 'text-fuchsia-400',
};

/** Indice europeo (EEA) -> classe; replica lato client della funzione del server. */
function aqiBand(aqi: number | null): string | null {
  if (aqi === null) return null;
  if (aqi <= 20) return 'good';
  if (aqi <= 40) return 'fair';
  if (aqi <= 60) return 'moderate';
  if (aqi <= 80) return 'poor';
  if (aqi <= 100) return 'veryPoor';
  return 'extremelyPoor';
}

/** Scheda stazione aria: medie annue ARPAV (misure) e previsione oraria CAMS (modello), ben separate. */
const AirStationBody: React.FC<{ station: AirQualityItem }> = ({ station }) => {
  const { t } = useTranslation();
  const f = station.forecast;
  const band = f ? aqiBand(f.europeanAqi) : null;
  const max24 = f ? Math.max(1, ...f.aqiNext24h.map((v) => v ?? 0)) : 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
          {t('ui.feature.airAnnualTitle', { year: station.year })}
        </span>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <span>PM10: <b>{station.pm10 ?? 'n.d.'} µg/m³</b></span>
          <span>PM2.5: <b>{station.pm25 ?? 'n.d.'} µg/m³</b></span>
          <span>NO₂: <b>{station.no2 ?? 'n.d.'} µg/m³</b></span>
          <span>{t('ui.feature.airExceedances')}: <b>{station.pm10Exceedances ?? 'n.d.'}</b></span>
        </div>
        <span className="text-xs text-[var(--ink-2)]">{t(`ui.feature.airClass_${station.aqi}`)}</span>
      </div>

      {f ? (
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-sky-400 font-bold">
              {t('ui.feature.forecastValidAt', { time: f.validTime.slice(11, 16) })}
            </span>
            {band && (
              <span className={`text-xs font-bold ${AQI_BAND_CLASS[band]}`}>
                {t('ui.feature.europeanAqi')} {f.europeanAqi} · {t(`ui.feature.aqiBand_${band}`)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <span>PM10: <b>{f.pm10 ?? 'n.d.'} µg/m³</b></span>
            <span>PM2.5: <b>{f.pm25 ?? 'n.d.'} µg/m³</b></span>
            <span>NO₂: <b>{f.no2 ?? 'n.d.'} µg/m³</b></span>
            <span>O₃: <b>{f.o3 ?? 'n.d.'} µg/m³</b></span>
          </div>
          {f.aqiNext24h.length > 1 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--ink-3)]">{t('ui.feature.aqiNext24h')}</span>
              <div className="flex items-end gap-px h-8" aria-hidden>
                {f.aqiNext24h.map((v, i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-sm bg-current ${AQI_BAND_CLASS[aqiBand(v) ?? 'good']}`}
                    style={{ height: `${Math.max(8, ((v ?? 0) / max24) * 100)}%`, opacity: v === null ? 0.2 : 0.8 }}
                  />
                ))}
              </div>
            </div>
          )}
          <span className="text-xs text-[var(--ink-2)]">
            {t('ui.feature.uvIndex')}: <b>{f.uvIndex ?? 'n.d.'}</b>
            {f.uvMaxToday !== null && <> · {t('ui.feature.uvMaxToday')}: <b>{f.uvMaxToday}</b></>}
          </span>
          <span className="text-[10px] text-[var(--ink-3)]">{t('ui.feature.camsNote')}</span>
        </div>
      ) : (
        <p className="text-[var(--ink-2)]">{t('ui.feature.forecastUnavailable')}</p>
      )}
    </div>
  );
};
