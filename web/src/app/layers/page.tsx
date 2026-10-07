'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Search,
  ExternalLink,
  ShieldCheck,
  Radio,
  Clock,
  Database,
  Layers,
  Ship,
  Waves,
  Landmark,
  Globe,
  Filter,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type LayerGroupKey = 'all' | 'mobility' | 'lagoon' | 'city';
type DataRegimeKey = 'all' | 'realtime' | 'simulated' | 'static';
type AcquisitionKey = 'all' | 'api' | 'local';

interface LayerDocItem {
  id: string;
  nameIt: string;
  nameEn: string;
  group: 'mobility' | 'lagoon' | 'city';
  regime: 'realtime' | 'simulated' | 'static';
  acquisition: 'api' | 'local';
  institution: string;
  portalUrl: string;
  portalName: string;
  descriptionIt: string;
  descriptionEn: string;
  technicalNotesIt: string;
  technicalNotesEn: string;
  endpointOrFile: string;
}

const LAYER_CATALOG: LayerDocItem[] = [
  // ==========================================
  // GRUPPO 1: MOBILITÀ ACQUEA, AEREA & FERROVIARIA
  // ==========================================
  {
    id: 'vaporetti_live',
    nameIt: 'Vaporetti ACTV Live',
    nameEn: 'ACTV Waterbuses Live',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'local',
    institution: 'AVM S.p.A. / ACTV Venezia',
    portalUrl: 'https://actv.avmspa.it',
    portalName: 'actv.avmspa.it & dati.venezia.it',
    descriptionIt: 'Posizione in tempo reale dei vaporetti in navigazione nella Laguna Centro, Canal Grande e Litorale.',
    descriptionEn: 'Real-time computed positions of waterbuses navigating Central Lagoon, Grand Canal, and Coast.',
    technicalNotesIt: 'Digital Twin deterministico: le coordinate sono calcolate interpolando orari ufficiali GTFS ACTV con matrici cinematiche e velocità effettive di canale, sincronizzate al secondo con l\'orologio o con lo scrubber 24h.',
    technicalNotesEn: 'Deterministic Digital Twin: positions are computed by interpolating official ACTV GTFS timetables with canal speed curves, synchronized down to the second with live clock or 24h timeline.',
    endpointOrFile: 'GTFS Timetables / Engine Canvas Kinematics'
  },
  {
    id: 'rotte_actv',
    nameIt: 'Rotte di Navigazione ACTV',
    nameEn: 'ACTV Navigation Routes',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'ACTV / Comune di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Polilinee georeferenziate dei canali e delle tratte di navigazione autorizzate per i mezzi pubblici.',
    descriptionEn: 'Georeferenced vector polylines of authorized public transit water channels.',
    technicalNotesIt: 'Dataset vettoriale GeoJSON ufficiale estratto dai rilievi comunali della viabilità lagunare.',
    technicalNotesEn: 'Official vector GeoJSON dataset extracted from municipal lagoon hydrographic surveys.',
    endpointOrFile: 'actv-shapes.json'
  },
  {
    id: 'fermate_actv',
    nameIt: 'Fermate & Pontili ACTV',
    nameEn: 'ACTV Waterbus Stops & Docks',
    group: 'mobility',
    regime: 'static',
    acquisition: 'api',
    institution: 'Comune di Venezia & ACTV',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Censimento dei pontili e approdi di navigazione con dettaglio accessibilità PRM e prossime partenze.',
    descriptionEn: 'Inventory of public boat docks with PRM accessibility details and scheduled departures.',
    technicalNotesIt: 'Coordinate catastali e identificativi stop_id georeferenziati via API /api/stops; partenze calcolate da orari di turno.',
    technicalNotesEn: 'Geocoded stop_id coordinates served via /api/stops; upcoming departures computed from official timetable schedules.',
    endpointOrFile: '/api/stops'
  },
  {
    id: 'navi_ais',
    nameIt: 'Navi & Traghetti AIS',
    nameEn: 'AIS Ships & Ferries',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'AdSP Mare Adriatico Settentrionale / MarineTraffic',
    portalUrl: 'https://www.port.venice.it',
    portalName: 'port.venice.it (Autorità Portuale)',
    descriptionIt: 'Traffico marittimo d\'altura, navi passeggeri, portacontainer e conformità alle rotte protette (D.L. 103/2021).',
    descriptionEn: 'Commercial maritime traffic, passenger ships, and compliance with lagoon restriction laws (D.L. 103/2021).',
    technicalNotesIt: 'Telemetria AIS in tempo reale: coordinate, rotta (heading), velocità in nodi, stazza lorda (GT) e verifica automatica della deviazione obbligatoria per Marghera (>25.000 GT).',
    technicalNotesEn: 'Live AIS tracking: coordinates, heading, speed in knots, gross tonnage (GT), and automated compliance checks for Marghera diversion (>25,000 GT).',
    endpointOrFile: '/api/ships'
  },
  {
    id: 'rotte_marittime',
    nameIt: 'Rotte & Canali Marittimi',
    nameEn: 'Deep-Water Shipping Channels',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Capitaneria di Porto di Venezia / Magistrato alle Acque',
    portalUrl: 'https://www.guardiacostiera.gov.it/venezia',
    portalName: 'guardiacostiera.gov.it',
    descriptionIt: 'Canali navigabili ad alto pescaggio (Canale dei Petroli, Bocca di Malamocco, Canale San Nicolò, Tronchetto).',
    descriptionEn: 'Deep-draft navigable commercial fairways across the lagoon and port inlets.',
    technicalNotesIt: 'Censimento nautico ufficiale con batimetria garantita di scavo (-10.5m / -12.0m).',
    technicalNotesEn: 'Official hydrographic fairways with dredged minimum depth guarantees (-10.5m / -12.0m).',
    endpointOrFile: 'simulation-data.ts (MARITIME_CHANNELS)'
  },
  {
    id: 'alilaguna',
    nameIt: 'Navette Alilaguna S.p.A.',
    nameEn: 'Alilaguna Airport Shuttles',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'api',
    institution: 'Alilaguna S.p.A. & Transitland Registry',
    portalUrl: 'https://www.transit.land/feeds/f-u20f-alilagunaspa',
    portalName: 'transit.land (Feed f-u20f-alilagunaspa)',
    descriptionIt: 'Flotta dei collegamenti aeroportuali veloci tra Marco Polo VCE, Venezia Centro, Murano e Lido.',
    descriptionEn: 'Water shuttle connections between Marco Polo VCE Airport, Venice Center, Murano, and Lido.',
    technicalNotesIt: 'Digital Twin derivato dal feed GTFS pubblico registrato su Transitland; natanti sincronizzati su frequenze ufficiali.',
    technicalNotesEn: 'Digital Twin derived from public Transitland GTFS registry feed; boats scheduled according to airport frequencies.',
    endpointOrFile: '/api/alilaguna'
  },
  {
    id: 'voli_vce',
    nameIt: 'Voli Aerei Spazio VCE',
    nameEn: 'VCE Airport Flight Radar',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'SAVE S.p.A. / ENAV / OpenSky Network',
    portalUrl: 'https://www.veneziaairport.it',
    portalName: 'veneziaairport.it & OpenSky ADS-B',
    descriptionIt: 'Traffico aereo in tempo reale nello spazio aereo e nell\'area terminale di controllo (TMA) di Venezia Marco Polo.',
    descriptionEn: 'Live air traffic in the terminal maneuvering area (TMA) of Venice Marco Polo Airport.',
    technicalNotesIt: 'Telemetria ADS-B in tempo reale: callsign, quota barometrica, velocità al suolo e distanza calcolata dalla pista 04R/22L.',
    technicalNotesEn: 'Real-time ADS-B transponder telemetry: callsign, altitude, ground speed, and runway distance.',
    endpointOrFile: '/api/flights'
  },
  {
    id: 'parcheggi',
    nameIt: 'Parcheggi Live Piazzale Roma & Tronchetto',
    nameEn: 'Piazzale Roma & Tronchetto Live Parkings',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'AVM S.p.A. & Garage Comunale ASM',
    portalUrl: 'https://avm.avmspa.it',
    portalName: 'avm.avmspa.it',
    descriptionIt: 'Stato di riempimento degli stalli automobilistici e capienza nei nodi d\'interscambio terra-acqua.',
    descriptionEn: 'Real-time parking space occupancy and capacity at Venice road-water gateway terminals.',
    technicalNotesIt: 'Sensori di spira e barriere d\'accesso con aggiornamento della disponibilità residua.',
    technicalNotesEn: 'Loop detector and gate telemetry providing live remaining capacity metrics.',
    endpointOrFile: '/api/city-assets'
  },
  {
    id: 'limiti_velocita',
    nameIt: 'Limiti Velocità & Barcavelox',
    nameEn: 'Speed Limits & Barcavelox Radar',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Comune di Venezia - Direzione Mobilità Acquea',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Regolamentazione del moto ondoso: limiti di velocità vigenti (5, 7, 11, 20 km/h) e postazioni fisse Barcavelox.',
    descriptionEn: 'Wake reduction speed regulations (5, 7, 11, 20 km/h) and radar enforcement locations.',
    technicalNotesIt: 'Censimento normativo ufficiale basato sulle ordinanze comunali e prefettizie.',
    technicalNotesEn: 'Official regulatory geographic census derived from municipal navigation decrees.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_CANAL_SPEED_LIMITS)'
  },
  {
    id: 'franchi_ponti',
    nameIt: 'Franchi di Tiro Ponti vs Marea',
    nameEn: 'Bridge Clearances vs Tide Level',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'local',
    institution: 'Insula S.p.A. & Centro Maree CPSM',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Altezza libera sotto i 400+ ponti di Venezia ricalcolata in tempo reale in base alla marea idrometrica.',
    descriptionEn: 'Air draft clearance beneath 400+ bridges continuously computed against current tide level.',
    technicalNotesIt: 'Ibrido real-time: l\'altezza fisica intradossale del censimento Insula viene sottratta in tempo reale dal livello idrometrico CPSM corrente per indicare l\'impraticabilità o il transito sicuro.',
    technicalNotesEn: 'Real-time hybrid: structural soffit height from Insula census is dynamically subtracted by current CPSM tide level.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_BRIDGE_CLEARANCES)'
  },
  {
    id: 'gondole',
    nameIt: 'Traghetti da Parada & Stazi Gondole',
    nameEn: 'Gondola Ferries & Traditional Stations',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Ente Gondola Venezia',
    portalUrl: 'https://www.entegondola.it',
    portalName: 'entegondola.it',
    descriptionIt: 'I traghetti tradizionali a remi sul Canal Grande (S. Sofia, S. Tomà, Giglio, Carbon) e le basi operative dei gondolieri.',
    descriptionEn: 'Traditional gondola ferry crossings across Grand Canal and historic gondolier boarding stations.',
    technicalNotesIt: 'Censimento geografico delle postazioni comunali autorizzate con tariffe residenti/turisti.',
    technicalNotesEn: 'Geographic census of authorized municipal boarding docks with regulated fares.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_GONDOLA_STATIONS)'
  },
  {
    id: 'rive_merci',
    nameIt: 'Rive Merci & Taxi Acquei',
    nameEn: 'Freight Docks & Water Taxi Berths',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Comune di Venezia · dati.venezia.it',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Banchine pubbliche di carico/scarico per l\'approvvigionamento merci e stalli del servizio pubblico taxi acqueo.',
    descriptionEn: 'Public freight loading/unloading docks and licensed municipal water taxi stands.',
    technicalNotesIt: 'Censimento georeferenziato con fasce orarie operative e restrizioni di sosta.',
    technicalNotesEn: 'Geocoded inventory with operational time slots and docking regulations.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_PUBLIC_DOCKS)'
  },
  {
    id: 'treni_ponte',
    nameIt: 'Treni Live Ponte della Libertà (RFI)',
    nameEn: 'Live Trains on Libertà Bridge (RFI)',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'api',
    institution: 'Rete Ferroviaria Italiana (RFI) / Trenitalia',
    portalUrl: 'https://www.rfi.it',
    portalName: 'rfi.it & ViaggiaTreno',
    descriptionIt: 'Traffico ferroviario cadenzato sul viadotto lagunare tra Mestre e Venezia Santa Lucia (Frecciarossa, Italo, Regionali).',
    descriptionEn: 'Scheduled passenger and high-speed rail traffic across the lagoon viaduct.',
    technicalNotesIt: 'Digital Twin basato sull\'orario ufficiale cadenzato RFI; i treni attraversano il viadotto di 3.8 km alle velocità reali di linea.',
    technicalNotesEn: 'Digital Twin based on official RFI rail timetable; trains travel the 3.8 km viaduct at realistic operational line speeds.',
    endpointOrFile: '/api/rail-logistics'
  },
  {
    id: 'battelli_veritas',
    nameIt: 'Battelli Veritas Raccolta Rifiuti',
    nameEn: 'Veritas Waste Collection Boats',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'local',
    institution: 'Veritas S.p.A. (Settore Ambientale)',
    portalUrl: 'https://www.gruppoveritas.it',
    portalName: 'gruppoveritas.it',
    descriptionIt: 'Rotte nautiche dei battelli compattatori adibiti all\'asporto rifiuti nei canali e pontili di conferimento.',
    descriptionEn: 'Operating sectors of municipal waste collection boats and collection barge docks.',
    technicalNotesIt: 'Simulazione operativa sincronizzata con le fasce orarie mattutine di raccolta differenziata di Veritas.',
    technicalNotesEn: 'Operational model synchronized with morning municipal waste collection shifts.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_VERITAS_WASTE_BOATS)'
  },
  {
    id: 'ciclovie_veneto',
    nameIt: 'Ciclovie Isole del Veneto',
    nameEn: 'Veneto Island Bike Routes',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Regione Veneto - Direzione Infrastrutture e Trasporti',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Itinerari ciclabili protetti lungo le isole di Venezia: Ciclovia delle Isole, Lido e Pellestrina.',
    descriptionEn: 'Protected cycle path network across the barrier islands of Venice (Lido and Pellestrina).',
    technicalNotesIt: 'Open Data ufficiale della Regione Veneto (tracciati geometrici vettoriali e fondo stradale).',
    technicalNotesEn: 'Official Open Data dataset from Veneto Region containing vector centerlines and surface types.',
    endpointOrFile: 'regionalVenetoData.ts (REGIONAL_BIKE_ROUTES)'
  },

  // ==========================================
  // GRUPPO 2: LAGUNA, IDROGRAFIA & DIFESA MARE
  // ==========================================
  {
    id: 'mose',
    nameIt: 'Barriere MOSE & Bocche di Porto',
    nameEn: 'MOSE Storm Barriers & Port Inlets',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'Ministero Infrastrutture e Trasporti / Consorzio Venezia Nuova',
    portalUrl: 'https://www.mosevenezia.eu',
    portalName: 'mosevenezia.eu & Provveditorato OO.PP.',
    descriptionIt: 'Stato operativo delle 78 paratoie a scomparsa alle bocche di Lido Treporti, S. Nicolò, Malamocco e Chioggia.',
    descriptionEn: 'Operational status of the 78 retractable storm floodgates across the three lagoon port inlets.',
    technicalNotesIt: 'Stato di sollevamento sincronizzato con le previsioni mareografiche del CPSM (soglia di attivazione a +110/+120 cm).',
    technicalNotesEn: 'Raising/lowering status linked with official CPSM tide forecast triggers (+110/+120 cm).',
    endpointOrFile: '/api/tide'
  },
  {
    id: 'passerelle',
    nameIt: 'Passerelle Acqua Alta CPSM',
    nameEn: 'CPSM High-Water Elevated Walkways',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'CPSM - Centro Maree Comune di Venezia',
    portalUrl: 'https://www.comune.venezia.it/it/content/centro-maree-previsioni',
    portalName: 'comune.venezia.it/maree',
    descriptionIt: 'Rete dei percorsi sopraelevati su cavalletti in legno installati dalla Protezione Civile in caso di marea superiore a +110 cm.',
    descriptionEn: 'Network of elevated timber walkways deployed during high water events exceeding +110 cm.',
    technicalNotesIt: 'Tracciati ufficiali georeferenziati con quote idrometriche di posa per sestiere (San Marco, Rialto, Ferrovia).',
    technicalNotesEn: 'Official geocoded deployment routes categorized by installation tide thresholds per neighborhood.',
    endpointOrFile: 'passerelleData.ts'
  },
  {
    id: 'briccole',
    nameIt: 'Briccole & Segnalamenti Canali',
    nameEn: 'Lagoon Channel Markers & Lights',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'Provveditorato OO.PP. & Comune di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Paline e briccole in legno di quercia che delimitano i bordi navigabili dei canali lagunari e fanali d\'accesso.',
    descriptionEn: 'Traditional oak wooden piles and sector lights marking navigable lagoon channels.',
    technicalNotesIt: 'Censimento nautico geolocalizzato con identificativi di canale e codice fanale IALA.',
    technicalNotesEn: 'Geocoded maritime inventory with channel IDs and official IALA buoyage markers.',
    endpointOrFile: 'marineSensorsData.ts'
  },
  {
    id: 'piattaforma_cnr',
    nameIt: 'Piattaforma CNR & Boe Ondametriche',
    nameEn: 'CNR Ocean Platform & Wave Buoys',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'CNR-ISMAR (Istituto di Scienze Marine)',
    portalUrl: 'https://www.ismar.cnr.it',
    portalName: 'ismar.cnr.it',
    descriptionIt: 'Piattaforma oceanografica "Acqua Alta" al largo di Venezia e boe lagunari per il monitoraggio marino profondo.',
    descriptionEn: 'Oceanographic research platform "Acqua Alta" 8 miles offshore and coastal wave sensor buoys.',
    technicalNotesIt: 'Telemetria in tempo reale: altezza significativa d\'onda (Hs), periodo di picco, temperatura superficiale del mare (SST) e salinità.',
    technicalNotesEn: 'Live ocean telemetry: significant wave height (Hs), peak period, sea surface temperature, and offshore wind.',
    endpointOrFile: '/api/marine-sensors'
  },
  {
    id: 'acque_balneazione',
    nameIt: 'Spiagge & Acque Balneazione ARPAV',
    nameEn: 'ARPAV Bathing Waters & Beaches',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'ARPAV Veneto & Ministero della Salute',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it (Portale Acque)',
    descriptionIt: 'Punti di campionamento microbiologico e idoneità alla balneazione sui litorali di Lido, Pellestrina e Cavallino.',
    descriptionEn: 'Microbiological sampling stations and bathing water quality classifications on coastal beaches.',
    technicalNotesIt: 'Bollettino stagionale ufficiale con classificazione quadriennale eccellente/buona (Direttiva 2006/7/CE).',
    technicalNotesEn: 'Official seasonal classification reporting under EU Bathing Water Directive 2006/7/EC.',
    endpointOrFile: 'marineSensorsData.ts'
  },
  {
    id: 'subsidenza_insar',
    nameIt: 'Subsidenza InSAR (Copernicus EGMS)',
    nameEn: 'InSAR Land Subsidence (Copernicus EGMS)',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'ESA / European Ground Motion Service (EGMS)',
    portalUrl: 'https://egms.land.copernicus.eu',
    portalName: 'egms.land.copernicus.eu',
    descriptionIt: 'Velocità di spostamento verticale millimetrico del suolo misurata dai satelliti radar Sentinel-1 DInSAR.',
    descriptionEn: 'Millimeter-scale ground motion velocity mapped by Sentinel-1 radar satellite interferometry.',
    technicalNotesIt: 'Rilievo scientifico consolidato: serie temporali interferometriche con velocità media di abbassamento (mm/anno) calibrate su capisaldi GNSS.',
    technicalNotesEn: 'Consolidated radar interferometry time-series with average vertical velocity (mm/year) calibrated against GNSS stations.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_SUBSIDENCE_INSAR)'
  },
  {
    id: 'morfologia_barene',
    nameIt: 'Morfologia Barene & Velme (Natura 2000)',
    nameEn: 'Salt Marshes & Mudflats (Natura 2000)',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'Regione Veneto - Carta degli Habitat Lagunari',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it',
    descriptionIt: 'Zone umide intertidali, barene e velme della Laguna Nord e Sud tutelate dalla Convenzione di Ramsar.',
    descriptionEn: 'Intertidal salt marshes (barene) and mudflats (velme) protected under the Ramsar Convention.',
    technicalNotesIt: 'Poligoni ecologici georeferenziati con quote di sommergenza rispetto al medio mare.',
    technicalNotesEn: 'Georeferenced ecological habitats with bathymetric submergence levels relative to mean sea level.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_LAGOON_MORPHOLOGY)'
  },
  {
    id: 'stazioni_vento',
    nameIt: 'Stazioni Vento Meteomarine & Anemometri',
    nameEn: 'Marine Wind Stations & Anemometers',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'Aeronautica Militare (LIPZ) & Centro Maree CPSM',
    portalUrl: 'https://www.meteoam.it',
    portalName: 'meteoam.it & comune.venezia.it/maree',
    descriptionIt: 'Rete di anemometri per la misurazione di Scirocco e Bora, con bollettino METAR ufficiale dell\'Aeronautica Militare.',
    descriptionEn: 'Wind sensor network monitoring Sirocco and Bora gusts, integrated with official Air Force METAR bulletin.',
    technicalNotesIt: 'Telemetria in tempo reale: direzione vettoriale del vento in gradi, intensità in nodi/km/h, raffiche e calcolo della spinta idrodinamica sulla Laguna.',
    technicalNotesEn: 'Live sensor telemetry: wind direction in degrees, speed in knots/km/h, peak gusts, and hydrodynamic surge risk push index.',
    endpointOrFile: '/api/weather & /api/marine-sensors'
  },
  {
    id: 'fortezze_lagunari',
    nameIt: 'Fortezze Lagunari & Isole Difensive',
    nameEn: 'Lagoon Fortresses & Defense Islands',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'Polo Museale Veneto & Archivio di Stato',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Isole fortificate del sistema difensivo della Serenissima: Ottagoni, Batterie d\'assedio, Forte Marghera e Sant\'Andrea.',
    descriptionEn: 'Historic fortified defense islands of the Venetian Republic: Octagons, Casemates, and Sea Fortresses.',
    technicalNotesIt: 'Censimento storico-militare con anno di costruzione, tipologia difensiva e stato di conservazione.',
    technicalNotesEn: 'Military architectural inventory with construction era, defensive armament type, and preservation status.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_LAGOON_FORTRESS_ISLANDS)'
  },
  {
    id: 'buffer_spaziale',
    nameIt: 'Buffer Spaziale Cantieri (PostGIS)',
    nameEn: 'Worksite Spatial Buffer (PostGIS)',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'local',
    institution: 'Engine Analitico VOD (PostGIS ST_DWithin)',
    portalUrl: 'https://postgis.net',
    portalName: 'PostGIS Spatial Query Engine',
    descriptionIt: 'Raggio d\'interferenza interattivo (50m - 500m) calcolato in tempo reale tra cantieri comunali e fermate ACTV.',
    descriptionEn: 'Interactive dynamic proximity buffer (50m - 500m) computed between active worksites and ACTV boat stops.',
    technicalNotesIt: 'Calcolo geospaziale client-side in tempo reale basato su formule di geodinamica sferica ad alta precisione.',
    technicalNotesEn: 'Client-side real-time geospatial computing executing spherical spatial intersection tests.',
    endpointOrFile: 'SpatialAnalysisModal.tsx'
  },
  {
    id: 'sonde_arpav',
    nameIt: 'Sonde Qualità Acque Lagunari ARPAV',
    nameEn: 'ARPAV Lagoon Water Quality Probes',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'ARPAV & Regione Veneto',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Sonde multiparametriche fisse di monitoraggio chimico-fisico delle acque lagunari interne.',
    descriptionEn: 'Continuous multiparameter monitoring probes measuring physical and chemical water quality in the lagoon.',
    technicalNotesIt: 'Telemetria sensori ufficiali: ossigeno disciolto (%), salinità (PSU), temperatura dell\'acqua (°C) e conducibilità.',
    technicalNotesEn: 'Official probe telemetry: dissolved oxygen (%), salinity (PSU), water temperature (°C), and conductivity.',
    endpointOrFile: '/api/regional-data'
  },
  {
    id: 'fiumi_tributari',
    nameIt: 'Fiumi Immissari in Laguna',
    nameEn: 'Lagoon Tributary Rivers',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'Regione Veneto - Direzione Difesa del Suolo & Distretto Alpi Orientali',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it',
    descriptionIt: 'I corsi d\'acqua del Bacino Scolante che scaricano acqua dolce nella Laguna di Venezia (Brenta, Dese, Marzenego, Zero, Silone).',
    descriptionEn: 'Tributary freshwater drainage basin rivers flowing into the Venice Lagoon (Brenta, Dese, Marzenego, Zero, Silone).',
    technicalNotesIt: 'Censimento idrografico regionale con bacino imbrifero (km²) e portate idrauliche medie ufficiali (m³/s).',
    technicalNotesEn: 'Regional hydrographic census providing drainage catchment area (km²) and official average discharges (m³/s).',
    endpointOrFile: 'regionalVenetoData.ts (REGIONAL_TRIBUTARY_RIVERS)'
  },

  // ==========================================
  // GRUPPO 3: CITTÀ STORICA, PATRIMONIO & SERVIZI
  // ==========================================
  {
    id: 'cantieri',
    nameIt: 'Cantieri Comunali & Lavori Pubblici',
    nameEn: 'Municipal Worksites & Public Works',
    group: 'city',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'Comune di Venezia - Direzione Lavori Pubblici',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Opere pubbliche attive, ripristino rive, manutenzione manti stradali e ponti nel territorio comunale.',
    descriptionEn: 'Active public works, quay wall restorations, paving maintenance, and bridge renovations.',
    technicalNotesIt: 'Feed amministrativo con date di inizio/fine lavori, importo di bilancio e impatto sulla viabilità acquea e pedonale.',
    technicalNotesEn: 'Administrative live feed detailing start/end dates, allocated public budget, and transport impacts.',
    endpointOrFile: '/api/cantieri'
  },
  {
    id: 'fontanelle_ponti',
    nameIt: 'Fontanelle Potabili & Ponti Accessibili',
    nameEn: 'Drinking Fountains & Accessible Bridges',
    group: 'city',
    regime: 'static',
    acquisition: 'api',
    institution: 'Veritas S.p.A. & Ufficio EBA Comune di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Punti di erogazione gratuita di acqua potabile nei campielli e ponti provvisti di rampe agevolate o montascale.',
    descriptionEn: 'Public drinking fountains across squares and bridges equipped with ramps or disabled access.',
    technicalNotesIt: 'Censimento cartografico verificato a cura della municipalità e del gestore del ciclo idrico Veritas.',
    technicalNotesEn: 'Verified municipal inventory maintained by the city accessibility office and Veritas water utility.',
    endpointOrFile: '/api/city-assets'
  },
  {
    id: 'verde_urbano',
    nameIt: 'Verde Urbano & Alberi Monumentali',
    nameEn: 'Urban Parks & Monumental Trees',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Comune di Venezia - Servizio Verde Pubblico',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Patrimonio arboreo pubblico censito nei parchi storici (Giardini Reali, Biennale) e alberature monumentali.',
    descriptionEn: 'Inventory of public urban forestry and designated monumental trees in historic parks and gardens.',
    technicalNotesIt: 'Censimento botanico con specie tassonomica, diametro del fusto e classe di rischio fitostatico.',
    technicalNotesEn: 'Botanical census including species name, trunk diameter, and arboricultural health class.',
    endpointOrFile: 'urbanAssetsVeniceData.ts'
  },
  {
    id: 'ricarica_ev_wifi',
    nameIt: 'Colonnine EV & Wi-Fi VeniceConnected',
    nameEn: 'EV Chargers & VeniceConnected Wi-Fi',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Venis S.p.A. & Comune di Venezia',
    portalUrl: 'https://www.comune.venezia.it',
    portalName: 'comune.venezia.it / venis.it',
    descriptionIt: 'Punti di accesso alla rete pubblica Wi-Fi metropolitana in fibra ottica e stazioni di ricarica per veicoli elettrici.',
    descriptionEn: 'Public fiber-optic metropolitan Wi-Fi hotspots and municipal electric vehicle charging hubs.',
    technicalNotesIt: 'Infrastruttura tecnologica gestita da Venis S.p.A. per la connettività di cittadini e turisti.',
    technicalNotesEn: 'Technological network infrastructure managed by municipal telecommunications in-house company.',
    endpointOrFile: 'urbanAssetsVeniceData.ts'
  },
  {
    id: 'qualita_aria',
    nameIt: 'Qualità Aria ARPAV',
    nameEn: 'ARPAV Air Quality Stations',
    group: 'city',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'ARPAV - Rete Regionale Aria',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it',
    descriptionIt: 'Stazioni fisse di campionamento atmosferico (Parco Bissuola, Rio Novo, Sacca Fisola) con calcolo dell\'AQI.',
    descriptionEn: 'Fixed air quality sampling stations measuring AQI index and particulate pollutants in real time.',
    technicalNotesIt: 'Telemetria oraria ufficiale con concentrazioni di PM10, PM2.5, Biossido di Azoto (NO2) e Ozono (O3).',
    technicalNotesEn: 'Official hourly sensor telemetry reporting PM10, PM2.5, Nitrogen Dioxide (NO2), and Ozone (O3).',
    endpointOrFile: '/api/environment'
  },
  {
    id: 'flussi_pedonali',
    nameIt: 'Flussi Pedonali Smart Control Room',
    nameEn: 'Smart Control Room Pedestrian Flows',
    group: 'city',
    regime: 'simulated',
    acquisition: 'api',
    institution: 'Comune di Venezia - Smart Control Room Tronchetto',
    portalUrl: 'https://www.comune.venezia.it/it/content/smart-control-room',
    portalName: 'comune.venezia.it (Smart Control Room)',
    descriptionIt: 'Densità di affollamento e passaggi pedonali lungo le direttrici nevralgiche (Lista di Spagna, Strada Nova, Rialto, S. Marco).',
    descriptionEn: 'Pedestrian flow densities and foot traffic along historic city corridors.',
    technicalNotesIt: 'Digital Twin modellato sulle matrici orarie di conteggio dei sensori ottici e delle celle telefoniche aggregate della SCR.',
    technicalNotesEn: 'Digital Twin calibrated on historical hourly flow matrices from municipal Smart Control Room optical sensors.',
    endpointOrFile: '/api/pedestrian-flows'
  },
  {
    id: 'satelliti_copernicus',
    nameIt: 'Satelliti Radar SAR (Copernicus / ASI)',
    nameEn: 'Copernicus & ASI Radar Satellites',
    group: 'city',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'ESA (Copernicus Space Component) & ASI (COSMO-SkyMed)',
    portalUrl: 'https://dataspace.copernicus.eu',
    portalName: 'dataspace.copernicus.eu & asi.it',
    descriptionIt: 'Tracciamento orbitale al secondo e fasce di scansione radar/ottiche dei satelliti di osservazione terrestre (Sentinel-1/2, COSMO-SkyMed, ISS).',
    descriptionEn: 'Live satellite orbital propagation and ground swaths for Earth Observation missions over Venice.',
    technicalNotesIt: 'Telemetria spaziale calcolata in tempo reale con propagatore orbitale SGP4 alimentato dai TLE ufficiali NORAD / CelesTrak; previsione al secondo del prossimo passaggio sopra la Laguna.',
    technicalNotesEn: 'Real-time orbital mechanics calculated via SGP4 propagator fueled by official NORAD / CelesTrak TLE bulletins.',
    endpointOrFile: '/api/satellites'
  },
  {
    id: 'nizioleti',
    nameIt: 'Nizioleti & Toponomastica Storica',
    nameEn: 'Nizioleti Traditional Street Signs',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Comune di Venezia - Servizio Toponomastica',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'I tradizionali cartelli stradali veneziani dipinti a intonaco bianco ("lenzuolino") con calli, campielli e numerazione civica per sestiere.',
    descriptionEn: 'Traditional painted Venetian street signs and unique sestiere-based continuous civic house numbering.',
    technicalNotesIt: 'Open Data geografico ufficiale con etimologia dialettale, sestiere, parrocchia storica e numero civico.',
    technicalNotesEn: 'Official geographic Open Data capturing Venetian dialect etymology, sestiere boundary, and historical parish.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_NIZIOLETI_CIVICI)'
  },
  {
    id: 'vere_da_pozzo',
    nameIt: 'Vere da Pozzo Storiche',
    nameEn: 'Vere da Pozzo Historic Cistern Wells',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Soprintendenza Archeologia, Belle Arti e Paesaggio di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Le cisterne storiche per la raccolta dell\'acqua piovana attraverso la sabbia nei campielli, scolpite in pietra d\'Istria o marmo rosso veronese.',
    descriptionEn: 'Historic stone rainwater cistern wells located in Venetian squares, carved from Istrian stone or Verona marble.',
    technicalNotesIt: 'Censimento artistico e monumentale con epoca storica, materiale scultoreo e stato conservativo.',
    technicalNotesEn: 'Artistic and monumental heritage census documenting construction century, stone material, and relief carvings.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_VENICE_WELLS)'
  },
  {
    id: 'campanili_pendenti',
    nameIt: 'Campanili & Torri Pendenti',
    nameEn: 'Historic & Leaning Bell Towers',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Patriarcato di Venezia & UniPD Ingegneria Geotecnica',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Le torri campanarie storiche di Venezia e Burano con dettaglio dell\'altezza e dell\'inclinazione dovuta ai cedimenti differenziali del caranto.',
    descriptionEn: 'Historic bell towers across Venice and islands with structural height and geotechnical tilt angles.',
    technicalNotesIt: 'Rilievi geodetici e monitoraggi inclinometrici strutturali (es. San Giorgio dei Greci 1.7° di inclinazione, San Martino a Burano 1.83m di fuori piombo).',
    technicalNotesEn: 'Geodetic inclinometric structural monitoring records documenting tilt angles resulting from soft caranto subsoil settlement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_BELL_TOWERS)'
  },
  {
    id: 'idroambulanze',
    nameIt: 'Pontili Idroambulanze SUEM 118',
    nameEn: 'SUEM 118 Water Ambulance Docks',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Azienda ULSS 3 Serenissima - Dipartimento Emergenza Urgenza',
    portalUrl: 'https://www.aulss3.veneto.it',
    portalName: 'aulss3.veneto.it (SUEM 118)',
    descriptionIt: 'Basi operative e pontili riservati d\'imbarco immediato dei natanti di soccorso idroambulanza con camera iperbarica e rianimazione.',
    descriptionEn: 'Emergency water ambulance boat docks and rapid casualty landing stages at hospital piers.',
    technicalNotesIt: 'Rete geolocalizzata dei presidi di pronto soccorso marittimo (Ospedale Civile SS. Giovanni e Paolo, Ospedale dell\'Angelo, Ospedale al Mare).',
    technicalNotesEn: 'Geocoded marine emergency stations serving medical boat crews across the Venetian lagoon.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_EMERGENCY_WATER_DOCKS)'
  },
  {
    id: 'dae_pubblici',
    nameIt: 'Defibrillatori Pubblici DAE H24',
    nameEn: 'Public 24/7 Defibrillators (AED)',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Azienda Zero Regione Veneto & Progetto "Venezia Cuore"',
    portalUrl: 'https://www.regione.veneto.it',
    portalName: 'regione.veneto.it / Azienda Zero',
    descriptionIt: 'Dispositivi salvavita DAE (Defibrillatore Automatico Esterno) installati in teche protette ad accesso libero 24 ore su 24.',
    descriptionEn: 'Publicly accessible 24/7 automated external defibrillators (AED) installed in public squares.',
    technicalNotesIt: 'Registro sanitario ufficiale dei dispositivi accreditati con dettagli sull\'accessibilità e protocolli di manutenzione.',
    technicalNotesEn: 'Official health registry documenting public access defibrillator locations and readiness.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_PUBLIC_DAE)'
  },
  {
    id: 'farmacie_turno',
    nameIt: 'Farmacie di Turno Notturno e Festivo',
    nameEn: 'Night & Holiday Duty Pharmacies',
    group: 'city',
    regime: 'simulated',
    acquisition: 'local',
    institution: 'Ordine dei Farmacisti di Venezia & Federfarma Veneto',
    portalUrl: 'https://www.ordinefarmacistivenezia.it',
    portalName: 'ordinefarmacistivenezia.it',
    descriptionIt: 'Presidi farmaceutici territoriali aperti per il servizio di guardia farmaceutica notturna e festiva continuativa.',
    descriptionEn: 'Licensed neighborhood pharmacies on continuous overnight and public holiday on-duty service.',
    technicalNotesIt: 'Dinamico deterministico: lo stato di apertura/turno viene calcolato in tempo reale al minuto verificando l\'orario del calendario turnario ufficiale.',
    technicalNotesEn: 'Deterministic dynamic: active on-duty status is verified in real time matching official municipal duty schedules.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_PHARMACY_DUTY)'
  },
  {
    id: 'isole_calore',
    nameIt: 'Isole di Calore Superficiale (LST Satellitare)',
    nameEn: 'Surface Urban Heat Islands (LST)',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'NASA / USGS Landsat-9 TIRS-2 & Copernicus Sentinel-3',
    portalUrl: 'https://landsat.gsfc.nasa.gov',
    portalName: 'landsat.gsfc.nasa.gov',
    descriptionIt: 'Mappa radiometrica della temperatura di superficie urbana (Land Surface Temperature) estiva e anomalie termiche relative.',
    descriptionEn: 'Radiometric satellite land surface temperature (LST) mapping revealing summer thermal microclimate anomalies.',
    technicalNotesIt: 'Rilievo satellitare all\'infrarosso termico (TIRS-2) calibrato con emissività superficiale: evidenzia le aree dense con surriscaldamento estivo (Piazzale Roma, Marghera) rispetto alle zone ventilate dalla Laguna.',
    technicalNotesEn: 'Thermal infrared satellite radiometry (TIRS-2) calibrated with emissivity surface models distinguishing paved zones from water-cooled corridors.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_HEAT_ISLAND_LST)'
  },
  {
    id: 'strutture_ricettive',
    nameIt: 'Pressione Turistica & Alloggi Registrati',
    nameEn: 'Tourism Density & Registered Lodging',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Regione Veneto - Osservatorio del Turismo',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Censimento ufficiale delle strutture alberghiere, B&B e locazioni turistiche con calcolo del rapporto turisti/residenti.',
    descriptionEn: 'Official census of registered hotels, B&Bs, and vacation rentals with tourist-to-resident density ratios.',
    technicalNotesIt: 'Open Data ufficiale della Regione Veneto: aggregazione dei posti letto autorizzati e incrocio spaziale con la popolazione anagrafica per sestiere.',
    technicalNotesEn: 'Official Veneto Regional Open Data: authorized bed counts joined with residential population census per sestiere.',
    endpointOrFile: 'regionalVenetoData.ts (REGIONAL_TOURIST_ACCOMMODATIONS)'
  },
  {
    id: 'pollini_arpav',
    nameIt: 'Bollettino Pollini ARPAV',
    nameEn: 'ARPAV Airborne Pollen Bulletin',
    group: 'city',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'ARPAV - Rete Monitoraggio Aerobiologico Veneto',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it & dati.veneto.it',
    descriptionIt: 'Stazioni di campionamento aerobiologico con conteggio dei granuli pollinici allergenici nell\'aria (graminacee, betullacee, parietaria).',
    descriptionEn: 'Aerobiological pollen capture stations measuring allergenic airborne grain concentrations in the city.',
    technicalNotesIt: 'Bollettino settimanale ufficiale ARPAV: valori misurati in granuli/m³ e livello di concentrazione sintetico (basso, medio, alto).',
    technicalNotesEn: 'Official weekly ARPAV aerobiological bulletin: grains/m³ counts and synthetic allergen concentration level indices.',
    endpointOrFile: '/api/regional-data'
  }
];

export default function LayersDocumentationPage() {
  const { language, toggleLanguage } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<LayerGroupKey>('all');
  const [selectedRegime, setSelectedRegime] = useState<DataRegimeKey>('all');
  const [selectedAcquisition, setSelectedAcquisition] = useState<AcquisitionKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Statistics
  const totalLayers = LAYER_CATALOG.length;
  const realtimeLayers = LAYER_CATALOG.filter((l) => l.regime === 'realtime').length;
  const simulatedLayers = LAYER_CATALOG.filter((l) => l.regime === 'simulated').length;
  const staticLayers = LAYER_CATALOG.filter((l) => l.regime === 'static').length;

  // Filtered layers
  const filteredLayers = useMemo(() => {
    return LAYER_CATALOG.filter((item) => {
      // Group filter
      if (selectedGroup !== 'all' && item.group !== selectedGroup) return false;

      // Regime filter
      if (selectedRegime !== 'all' && item.regime !== selectedRegime) return false;

      // Acquisition filter
      if (selectedAcquisition !== 'all' && item.acquisition !== selectedAcquisition) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName =
          item.nameIt.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
        const matchesInst = item.institution.toLowerCase().includes(q);
        const matchesDesc =
          item.descriptionIt.toLowerCase().includes(q) ||
          item.descriptionEn.toLowerCase().includes(q);
        const matchesTech =
          item.technicalNotesIt.toLowerCase().includes(q) ||
          item.technicalNotesEn.toLowerCase().includes(q);

        if (!matchesName && !matchesInst && !matchesDesc && !matchesTech) return false;
      }

      return true;
    });
  }, [selectedGroup, selectedRegime, selectedAcquisition, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 text-xs font-mono font-medium active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">
              {language === 'it' ? 'Torna alla Mappa' : 'Back to Map'}
            </span>
          </Link>

          <div className="h-5 w-px bg-[var(--rule)]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-[var(--ink)]">
                VOD · {language === 'it' ? 'Catalogo Livelli & Trasparenza Dati' : 'Layer Catalog & Data Transparency'}
              </h1>
              <p className="text-[10px] text-[var(--ink-3)] font-mono hidden md:block">
                {language === 'it'
                  ? 'Tracciamento fonti istituzionali, API live, modelli Digital Twin e dati statici'
                  : 'Institutional sources lineage, live APIs, Digital Twin models, and static datasets'}
              </p>
            </div>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer shadow-sm"
            title="Switch Language (IT / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Hero Explanation Banner */}
        <section className="glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/20 shadow-xl flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold w-max border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'it' ? 'DOCUMENTAZIONE & DATA LINEAGE UFFICIALE' : 'OFFICIAL DATA LINEAGE & CATALOG'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              {language === 'it'
                ? 'Come funzionano i dati geospaziali di Venice Open Data'
                : 'How geospatial data works in Venice Open Data'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
              {language === 'it' ? (
                <>
                  In VOD ogni elemento visualizzato sulla mappa ha una provenienza chiara e tracciabile. Per garantire la massima trasparenza scientifica verso cittadini, ricercatori e tecnici, distinguiamo rigorosamente tra <strong>misure strumentali in tempo reale</strong>, <strong>modelli matematici deterministici (Digital Twin)</strong> e <strong>censimenti geografici amministrativi ufficiali</strong>.
                </>
              ) : (
                <>
                  In VOD, every layer mapped has an explicit and auditable lineage. To ensure scientific rigor for citizens, researchers, and public officers, we clearly differentiate between <strong>genuine real-time sensor telemetry</strong>, <strong>deterministic Digital Twin models</strong>, and <strong>official administrative static spatial registries</strong>.
                </>
              )}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0 font-mono text-center">
            <div className="p-3 rounded-2xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col">
              <span className="text-2xl font-bold text-[var(--ink)]">{totalLayers}</span>
              <span className="text-[10px] text-[var(--ink-3)] uppercase">{language === 'it' ? 'Livelli Totali' : 'Total Layers'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">{realtimeLayers}</span>
              <span className="text-[10px] text-emerald-300 uppercase">{language === 'it' ? 'Tempo Reale' : 'Real-Time'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col">
              <span className="text-2xl font-bold text-amber-400">{simulatedLayers}</span>
              <span className="text-[10px] text-amber-300 uppercase">{language === 'it' ? 'Digital Twin' : 'Digital Twin'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col">
              <span className="text-2xl font-bold text-sky-400">{staticLayers}</span>
              <span className="text-[10px] text-sky-300 uppercase">{language === 'it' ? 'Censimento' : 'Open Data'}</span>
            </div>
          </div>
        </section>

        {/* Legend Guide Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
              <Radio className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{language === 'it' ? 'Tempo Reale Genuino (Sensori)' : 'Genuine Real-Time (Sensors)'}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {language === 'it'
                ? 'Dati idrometrici, atmosferici e marini misurati in tempo reale da sonde e centraline sul territorio (CPSM marea, METAR Aeronautica Militare, boe CNR-ISMAR, TLE satellitari, navi AIS).'
                : 'Hydrometric, marine, and atmospheric data collected in real time by deployed physical sensors (CPSM tide, Air Force METAR, CNR-ISMAR wave buoys, satellite TLE, live AIS).'}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{language === 'it' ? 'Simulato / Digital Twin (Orari Ufficiali)' : 'Simulated / Digital Twin (Official Schedules)'}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {language === 'it'
                ? 'Posizionamento deterministico sincronizzato all\'orologio reale o allo scrubber 24h, calcolato interpolando orari ufficiali di servizio, matrici di flusso e velocità di navigazione (vaporetti ACTV GTFS, treni RFI, navette Alilaguna).'
                : 'Deterministic positioning synchronized with live clock or 24h scrubber, computed by interpolating official timetables, transit frequencies, and legal canal speeds (ACTV GTFS, RFI trains, Alilaguna).'}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-sky-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase font-mono">
              <Database className="w-4 h-4 shrink-0" />
              <span>{language === 'it' ? 'Censimento Statico & Open Data' : 'Static Inventory & Open Data'}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {language === 'it'
                ? 'Registri cartografici e patrimoniali certificati di origine comunale e regionale (nizioleti, vere da pozzo, franchi ponti, DAE, pontili SUEM 118, ciclovie, barene, habitat Natura 2000).'
                : 'Certified cartographic and asset registers from municipal and regional portals (nizioleti street signs, historic wells, bridge heights, AEDs, ambulance docks, bike routes, salt marshes).'}
            </p>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="glass-panel p-4 rounded-2xl border border-[var(--rule)] flex flex-col gap-3 shadow-sm">
          {/* Top row: Search input + Results count */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'it'
                    ? 'Cerca per nome, istituzione (es. ACTV, ARPAV, MOSE)...'
                    : 'Search by name or institution (e.g. ACTV, ARPAV, MOSE)...'
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)] self-end sm:self-auto">
              <span>{language === 'it' ? 'Risultati trovati:' : 'Matching layers:'}</span>
              <strong className="text-cyan-400 font-bold text-sm">{filteredLayers.length}</strong>
              <span>/ {totalLayers}</span>
            </div>
          </div>

          {/* Bottom row: Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
            {/* Filter by Group */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {language === 'it' ? 'Gruppo:' : 'Group:'}
              </span>
              {[
                { key: 'all', label: language === 'it' ? 'Tutti i Gruppi' : 'All Groups' },
                { key: 'mobility', label: language === 'it' ? '🚢 1. Mobilità' : '🚢 1. Mobility' },
                { key: 'lagoon', label: language === 'it' ? '🌊 2. Laguna' : '🌊 2. Lagoon' },
                { key: 'city', label: language === 'it' ? '🏛️ 3. Città' : '🏛️ 3. City' }
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key as LayerGroupKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedGroup === g.key
                      ? 'bg-cyan-500 text-white font-bold shadow-sm'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Filter by Regime */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {language === 'it' ? 'Regime:' : 'Status:'}
              </span>
              {[
                { key: 'all', label: language === 'it' ? 'Tutti' : 'All' },
                { key: 'realtime', label: language === 'it' ? '🟢 Tempo Reale' : '🟢 Live Sensors' },
                { key: 'simulated', label: language === 'it' ? '🟡 Digital Twin' : '🟡 Digital Twin' },
                { key: 'static', label: language === 'it' ? '🔵 Censimento' : '🔵 Open Data' }
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRegime(r.key as DataRegimeKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedRegime === r.key
                      ? 'bg-cyan-500 text-white font-bold shadow-sm'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {gRegimeBadge(r.key as DataRegimeKey, r.label)}
                </button>
              ))}
            </div>

            {/* Filter by Acquisition */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {language === 'it' ? 'Acquisizione:' : 'Access:'}
              </span>
              {[
                { key: 'all', label: language === 'it' ? 'Tutte' : 'All' },
                { key: 'api', label: '📡 API Live' },
                { key: 'local', label: '💾 Locale / Cache' }
              ].map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setSelectedAcquisition(a.key as AcquisitionKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedAcquisition === a.key
                      ? 'bg-cyan-500 text-white font-bold shadow-sm'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Layer Cards List */}
        <section className="flex flex-col gap-3">
          {filteredLayers.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center gap-2 border border-[var(--rule)]">
              <Info className="w-8 h-8 text-cyan-400" />
              <p className="text-sm font-semibold text-[var(--ink)]">
                {language === 'it' ? 'Nessun livello corrisponde ai filtri selezionati.' : 'No layers match the selected filters.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('all');
                  setSelectedRegime('all');
                  setSelectedAcquisition('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-mono cursor-pointer shadow-md"
              >
                {language === 'it' ? 'Reimposta tutti i filtri' : 'Reset all filters'}
              </button>
            </div>
          ) : (
            filteredLayers.map((layer) => (
              <div
                key={layer.id}
                className="glass-panel rounded-2xl p-4 sm:p-5 border border-[var(--rule)] hover:border-cyan-500/40 transition-all flex flex-col gap-3 shadow-md group"
              >
                {/* Header row: Name, Group, Regime Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--rule)]/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base sm:text-lg">
                      {layer.group === 'mobility' ? '🚢' : layer.group === 'lagoon' ? '🌊' : '🏛️'}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--ink)] group-hover:text-cyan-400 transition-colors">
                        {language === 'it' ? layer.nameIt : layer.nameEn}
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--ink-3)]">
                        {getGroupLabel(layer.group, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                    {/* Regime Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-sm ${
                        layer.regime === 'realtime'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : layer.regime === 'simulated'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          layer.regime === 'realtime'
                            ? 'bg-emerald-400 animate-pulse'
                            : layer.regime === 'simulated'
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                        }`}
                      />
                      {getRegimeName(layer.regime, language)}
                    </span>

                    {/* Acquisition Badge */}
                    <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)]">
                      {layer.acquisition === 'api' ? '📡 API Live' : '💾 Locale / Cache'}
                    </span>
                  </div>
                </div>

                {/* Body: Functional description */}
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {language === 'it' ? layer.descriptionIt : layer.descriptionEn}
                </p>

                {/* Technical notes callout */}
                <div className="p-3 rounded-xl bg-[var(--rule)]/25 border border-[var(--rule)]/80 flex flex-col gap-1 text-[11px]">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {language === 'it' ? 'Elaborazione Tecnica & Trasparenza:' : 'Technical Processing & Lineage:'}
                  </span>
                  <p className="text-[var(--ink-2)] leading-relaxed font-sans">
                    {language === 'it' ? layer.technicalNotesIt : layer.technicalNotesEn}
                  </p>
                </div>

                {/* Footer: Source link & Endpoint */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ink-3)] font-mono">{language === 'it' ? 'Ente / Fonte:' : 'Authority / Source:'}</span>
                    <a
                      href={layer.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors underline"
                    >
                      <span>{layer.institution}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--ink-3)]">
                    <span>Target:</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--rule)] text-[var(--ink-2)]">
                      {layer.endpointOrFile}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--rule)] bg-[var(--ground)] py-6 px-4 text-center text-xs text-[var(--ink-3)] font-mono">
        <p>
          Venice Open Data (VOD) · Piattaforma Cartografica Trasparente & Open Source per Venezia e Laguna
        </p>
      </footer>
    </div>
  );
}

// Helpers
function getGroupLabel(group: 'mobility' | 'lagoon' | 'city', lang: string) {
  if (group === 'mobility') {
    return lang === 'it' ? '1. Mobilità Acquea, Aerea & Ferroviaria' : '1. Water, Air & Rail Mobility';
  }
  if (group === 'lagoon') {
    return lang === 'it' ? '2. Laguna, Idrografia & Difesa Mare' : '2. Lagoon, Hydrography & Sea Defense';
  }
  return lang === 'it' ? '3. Città Storica, Patrimonio & Servizi' : '3. Historic City, Heritage & Services';
}

function getRegimeName(regime: 'realtime' | 'simulated' | 'static', lang: string) {
  if (regime === 'realtime') {
    return lang === 'it' ? 'Tempo Reale Genuino' : 'Live Telemetry';
  }
  if (regime === 'simulated') {
    return lang === 'it' ? 'Simulato / Digital Twin' : 'Digital Twin Schedule';
  }
  return lang === 'it' ? 'Censimento Open Data' : 'Official Open Data';
}
