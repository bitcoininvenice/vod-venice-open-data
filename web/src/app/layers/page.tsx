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
  Ship,
  Waves,
  Landmark,
  Globe,
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
    technicalNotesIt: 'Rete di 72 approdi e pontili lagunari georeferenziati via API /api/stops (Canal Grande, Giudecca, Cannaregio, Murano, Burano, Torcello, Sant\'Erasmo, Lido, Pellestrina, Chioggia e interscambi); orari ufficiali di linea.',
    technicalNotesEn: 'Network of 72 georeferenced lagoon docks served via /api/stops (Grand Canal, Giudecca, Cannaregio, Murano, Burano, Torcello, Sant\'Erasmo, Lido, Pellestrina, Chioggia, and hubs); official line timetables.',
    endpointOrFile: '/api/stops'
  },
  {
    id: 'navi_ais',
    nameIt: 'Banchine Portuali & Ormeggi Commerciali (AdSP)',
    nameEn: 'Port Berths & Commercial Moorings (AdSP)',
    group: 'mobility',
    regime: 'static',
    acquisition: 'api',
    institution: 'AdSP Mare Adriatico Settentrionale / Capitaneria di Porto',
    portalUrl: 'https://www.port.venice.it',
    portalName: 'port.venice.it (Autorità Portuale)',
    descriptionIt: '14 banchine e ormeggi autorizzati tra Tronchetto, San Basilio, Fusina e Porto Marghera con verifica dei vincoli del D.L. 103/2021 (divieto grandi navi a San Marco).',
    descriptionEn: '14 authorized port berths across Tronchetto, San Basilio, Fusina, and Porto Marghera with DL 103/2021 regulatory compliance.',
    technicalNotesIt: 'Censimento nautico ufficiale delle strutture di ormeggio e delle prescrizioni per le Grandi Navi (>25.000 GT deviate a Marghera). Esclude categoricamente telemetria AIS sintetica.',
    technicalNotesEn: 'Official hydrographic inventory of docking facilities and nautical restrictions under DL 103/2021. Strictly excludes synthetic AIS telemetry.',
    endpointOrFile: '/api/ships (Banchine e canali ufficiali)'
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
    nameIt: 'Linee, Pontili & Flotta Alilaguna (GTFS Twin)',
    nameEn: 'Alilaguna Routes, Docks & Fleet (GTFS Twin)',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'api',
    institution: 'Alilaguna S.p.A. & Transitland Registry',
    portalUrl: 'https://www.transit.land/feeds/f-u20f-alilagunaspa',
    portalName: 'transit.land (Feed f-u20f-alilagunaspa)',
    descriptionIt: 'Rete ufficiale e flotta dei collegamenti acquei tra Marco Polo VCE, Murano, Canal Grande, Lido e Terminal Passeggeri.',
    descriptionEn: 'Official network and fleet of water connections between Marco Polo VCE, Murano, Grand Canal, Lido, and Cruise Terminal.',
    technicalNotesIt: 'Simulazione da orario: le posizioni delle barche sono interpolate lungo i percorsi a partire dagli orari di partenza (168 corse giornaliere, Linee Blu, Arancio, Rossa, Verde). Non è un tracciamento GPS.',
    technicalNotesEn: 'Timetable simulation: boat positions are interpolated along routes from scheduled departure times (168 daily runs, Blu, Arancio, Rossa, Verde lines). Not GPS tracking.',
    endpointOrFile: '/api/alilaguna'
  },
  {
    id: 'voli_vce',
    nameIt: 'Voli Aerei Spazio VCE (OpenSky Network)',
    nameEn: 'VCE Airport Flight Radar (OpenSky Network)',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'SAVE S.p.A. / ENAV / OpenSky Network',
    portalUrl: 'https://opensky-network.org',
    portalName: 'opensky-network.org (ADS-B Live)',
    descriptionIt: 'Traffico aereo in tempo reale nello spazio aereo e nell\\\'area terminale di controllo (TMA) di Venezia Marco Polo.',
    descriptionEn: 'Live air traffic in the terminal maneuvering area (TMA) of Venice Marco Polo Airport.',
    technicalNotesIt: 'Telemetria ADS-B autentica in tempo reale acquisita via API OpenSky Network. Riporta esclusivamente i velivoli fisicamente captati dai ricevitori terrestri nel bounding box di Venezia, senza voli sintetici simulati di fallback.',
    technicalNotesEn: 'Authentic real-time ADS-B telemetry acquired via OpenSky Network API. Reports strictly aircraft physically detected by terrestrial receivers within the Venice bounding box, without simulated fallback flights.',
    endpointOrFile: '/api/flights'
  },
  {
    id: 'parcheggi',
    nameIt: 'Parcheggi: Venezia & Terraferma Mestre',
    nameEn: 'Parkings: Venice & Mestre Mainland',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'AVM S.p.A., Metropark FS & Garage San Marco',
    portalUrl: 'https://avm.avmspa.it',
    portalName: 'avm.avmspa.it & comune.venezia.it',
    descriptionIt: 'Capienze totali certificate (15 hub per oltre 10.000 posti auto), tariffe orarie e 24h ufficiali tra centro storico lagunare (P.le Roma, Tronchetto) e terraferma (Mestre Centro, Stazione FS, San Giuliano, Marghera, Favaro).',
    descriptionEn: 'Official certified capacities (15 facilities with over 10,000 spots), hourly and 24h rates across Venice lagoon and mainland hubs.',
    technicalNotesIt: 'Tutti i dati di capienza totale, tariffe e coordinate georeferenziate sono ufficiali e certificati da AVM e FS. Poiché AVM non espone un\\\'API REST aperta per i sensori di spira dei varchi in tempo reale (visibili solo su PMV stradali), la piattaforma esclude categoricamente stime sintetiche fittizie.',
    technicalNotesEn: 'All capacity, tariff, and coordinate data are official and certified by AVM and FS. As AVM does not expose an open REST API for live gate loops, the platform strictly excludes unverified synthetic estimates.',
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
    nameIt: 'Infrastruttura Ferroviaria RFI (Ponte della Libertà & Stazioni)',
    nameEn: 'RFI Railway Infrastructure (Libertà Viaduct & Stations)',
    group: 'mobility',
    regime: 'static',
    acquisition: 'api',
    institution: 'Rete Ferroviaria Italiana (RFI) / Gruppo FS',
    portalUrl: 'https://www.rfi.it',
    portalName: 'rfi.it (PIR RFI)',
    descriptionIt: 'Nodi ferroviari di testa e di transito (Santa Lucia, Mestre), viadotto lagunare quadruplicato a 4 binari (Km 262-267) e fascio merci Porto Marghera.',
    descriptionEn: 'Terminal and junction railway stations (Santa Lucia, Mestre), 4-track lagoon viaduct (Km 262-267), and Porto Marghera freight yard.',
    technicalNotesIt: 'Dati ufficiali del Prospetto Informativo della Rete (PIR) di RFI. Riporta capienze di binario, elettrificazione a 3 kV CC e raccordi industriali senza telemetria sintetica.',
    technicalNotesEn: 'Official network statement data from RFI (PIR). Reports certified track capacities, 3 kV DC electrification, and industrial rail sidings without synthetic telemetry.',
    endpointOrFile: '/api/rail-logistics'
  },
  {
    id: 'battelli_veritas',
    nameIt: 'Pontili di Conferimento & Rifiuti Veritas',
    nameEn: 'Veritas Waste Collection Docks & Barges',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Veritas S.p.A. (Settore Ambientale)',
    portalUrl: 'https://www.gruppoveritas.it',
    portalName: 'gruppoveritas.it',
    descriptionIt: 'Pontili e ormeggi dei battelli compattatori adibiti all\\\'asporto rifiuti nei canali con fasce orarie mattutine (06:30 - 08:30).',
    descriptionEn: 'Canal collection docks and waste barge moorings with official morning schedules (06:30 - 08:30).',
    technicalNotesIt: 'Censimento dei pontili di conferimento con orari e frazioni merceologiche autorizzate (indifferenziato, carta, plastica/vetro).',
    technicalNotesEn: 'Official census of municipal canal collection docks with authorized collection fractions and time slots.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_VERITAS_WASTE_BOATS)'
  },
  {
    id: 'ciclovie_veneto',
    nameIt: 'Ciclovie Isole & Gronda del Veneto',
    nameEn: 'Veneto Island & Coastal Bike Routes',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'Regione Veneto - Direzione Infrastrutture e Trasporti',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Rete di 6 itinerari ciclabili protetti lungo le isole di Venezia e la gronda lagunare: Lido, Pellestrina, Dolomiti-Venezia I4, Riviera del Brenta, Cavallino Lio Piccolo e Ponte della Libertà.',
    descriptionEn: 'Network of 6 protected cycle routes across barrier islands and the lagoon fringe: Lido, Pellestrina, Dolomiti-Venice I4, Riviera del Brenta, Cavallino Lio Piccolo, and Libertà Bridge.',
    technicalNotesIt: 'Open Data ufficiale della Regione Veneto (REV) e Comune di Venezia con tracciati geometrici vettoriali, tipo di fondo e nodi d\'interscambio ferry.',
    technicalNotesEn: 'Official Open Data from Veneto Region (REV) and Municipality with vector tracks, surface typology, and ferry interchange nodes.',
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
    technicalNotesIt: 'Livelli di marea reali dalla rete mareografica CPSM (dati.venezia.it, aggiornamento ogni 5 minuti) e previsione degli estremali con data di emissione. Lo stato operativo delle paratoie non è pubblicato come open data: viene indicato come non disponibile.',
    technicalNotesEn: 'Real tide levels from the CPSM gauge network (dati.venezia.it, 5-minute updates) and forecast extremes with issue time. Floodgate operating status is not published as open data and is shown as unavailable.',
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
    technicalNotesIt: 'Onde (Hs), vento e temperatura dell\'acqua della piattaforma "Acqua Alta" dai feed CPSM in tempo reale; le altre stazioni oceanografiche sono in anagrafica senza misure aperte collegate.',
    technicalNotesEn: 'Waves (Hs), wind and water temperature at the "Acqua Alta" platform from real-time CPSM feeds; other oceanographic stations are listed without connected open measurements.',
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
    descriptionIt: 'Rete meteo-marina del Centro Maree (vento, raffiche, onde, temperatura, pressione) più il METAR dell\'aeroporto di Tessera.',
    descriptionEn: 'Tide Centre meteo-marine network (wind, gusts, waves, temperature, pressure) plus the Tessera airport METAR.',
    technicalNotesIt: 'Misure reali ogni 5 minuti dai feed CPSM su dati.venezia.it (vento, onde, temperatura aria, pressione, umidità) e METAR LIPZ da NOAA. Sono mostrate solo le stazioni con coordinate pubblicate. L\'indicatore di spinta sulla marea è una semplificazione basata su direzione e intensità del vento.',
    technicalNotesEn: 'Real measurements every 5 minutes from CPSM feeds on dati.venezia.it (wind, waves, air temperature, pressure, humidity) and the LIPZ METAR from NOAA. Only stations with published coordinates are shown. The tide-push indicator is a simplification based on wind direction and speed.',
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
    descriptionIt: 'Censimento di 12 isole fortificate del sistema difensivo e sanitario storico: Ottagoni (Alberoni, Ca\' Roman), Forte San Felice a Chioggia, Forte Sant\'Andrea, Forte Marghera, Poveglia, Lazzaretti, Certosa, San Servolo e Sant\'Angelo della Polvere.',
    descriptionEn: 'Inventory of 12 historic defense and quarantine islands: Octagons, Chioggia San Felice, Sant\'Andrea, Forte Marghera, Poveglia, Lazarets, Certosa, and San Servolo.',
    technicalNotesIt: 'Censimento storico-militare e demaniale con epoca di fondazione (Serenissima, Napoleonica, Asburgica), superficie in m² e stato di conservazione/accessibilità.',
    technicalNotesEn: 'Military architectural inventory documenting foundation era (Serenissima, Napoleonic, Habsburg), surface area in m², and current preservation/accessibility status.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_LAGOON_FORTRESS_ISLANDS)'
  },
  {
    id: 'buffer_spaziale',
    nameIt: 'Buffer Spaziale Cantieri (PostGIS)',
    nameEn: 'Worksite Spatial Buffer (PostGIS)',
    group: 'lagoon',
    regime: 'static',
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
    regime: 'static',
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
    nameIt: 'Opere pubbliche 2026',
    nameEn: 'Public works 2026',
    group: 'city',
    regime: 'static',
    acquisition: 'api',
    institution: 'Comune di Venezia - Direzione Lavori Pubblici',
    portalUrl: 'https://dati.venezia.it/?q=area-tematica/opere-pubbliche',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Elenco Annuale dei Lavori 2026 del Comune di Venezia: 133 opere con importo, stato del progetto, RUP e CUP.',
    descriptionEn: 'City of Venice Annual Works List 2026: 133 works with amount, project stage, project manager and CUP code.',
    technicalNotesIt: 'Dataset CSV di dati.venezia.it (CC BY) importato con pipeline/import_opere_pubbliche.py. Il file non contiene coordinate: le opere che nominano un luogo sono geocodificate con OpenStreetMap Nominatim (posizione approssimata), le altre restano solo in elenco.',
    technicalNotesEn: 'CSV dataset from dati.venezia.it (CC BY) imported with pipeline/import_opere_pubbliche.py. The file has no coordinates: works naming a place are geocoded with OpenStreetMap Nominatim (approximate position), the others are listed only.',
    endpointOrFile: '/api/cantieri'
  },
  {
    id: 'telecamere_webcam',
    nameIt: 'Telecamere di Video Monitoraggio & Live Webcam',
    nameEn: 'Video Monitoring Cameras & Live Webcams',
    group: 'city',
    regime: 'static',
    acquisition: 'api',
    institution: 'OpenStreetMap contributors (ODbL) & Anopticon / SkylineWebcams / CNR-ISMAR',
    portalUrl: 'https://www.openstreetmap.org/copyright',
    portalName: 'OpenStreetMap, tramaci.org/anopticon & portali webcam',
    descriptionIt: 'Telecamere di videosorveglianza mappate dalla comunità OpenStreetMap (oltre 170 nell\'area) più una selezione Anopticon, e collegamenti alle dirette delle webcam panoramiche pubbliche.',
    descriptionEn: 'Transparent hybrid integration: civic counter-mapping of urban video monitoring cameras (Anopticon) paired with live public panoramic and tidal webcam streams.',
    technicalNotesIt: 'CCTV: 175 telecamere da OpenStreetMap (man_made=surveillance, ODbL, importate con pipeline/import_osm_surveillance.py) più le voci Anopticon non duplicate. Il dataset completo Anopticon (464 telecamere, dati 2010) non è incluso: i termini d\'uso vietano l\'accesso automatico senza autorizzazione. Webcam: solo collegamento alle pagine ufficiali.',
    technicalNotesEn: 'CCTV: 175 cameras from OpenStreetMap (man_made=surveillance, ODbL, imported via pipeline/import_osm_surveillance.py) plus non-duplicate Anopticon entries. The full Anopticon dataset (464 cameras, 2010 data) is not included: its terms forbid automated access without permission. Webcams: link to official pages only.',
    endpointOrFile: '/api/cameras'
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
    descriptionIt: '16 punti di erogazione gratuita di acqua potabile nei campielli e 8 ponti provvisti di rampe agevolate o montascale.',
    descriptionEn: '16 public drinking fountains across city squares and 8 bridges equipped with accessibility ramps or stairlifts.',
    technicalNotesIt: 'Censimento cartografico verificato a cura della municipalità (Ufficio Eliminazione Barriere Architettoniche) e del gestore Veritas.',
    technicalNotesEn: 'Verified municipal accessibility inventory maintained by the EBA office and Veritas water utility.',
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
    technicalNotesIt: 'Hotspot WiFi: 283 punti del dataset ufficiale del Comune (dati.venezia.it, CC BY) con stato attivo/non attivo. Colonnine EV: anagrafica statica, disponibilità in tempo reale non pubblicata dai gestori.',
    technicalNotesEn: 'WiFi hotspots: 283 points from the official City dataset (dati.venezia.it, CC BY) with active/inactive status. EV chargers: static list, real-time availability not published by operators.',
    endpointOrFile: 'urbanAssetsVeniceData.ts'
  },
  {
    id: 'qualita_aria',
    nameIt: 'Qualità Aria ARPAV',
    nameEn: 'ARPAV Air Quality Stations',
    group: 'city',
    regime: 'static',
    acquisition: 'api',
    institution: 'ARPAV - Rete Regionale Aria',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it',
    descriptionIt: '6 stazioni fisse di campionamento atmosferico (Rio Novo, Sacca Fisola, Parco Bissuola, Via Beccaria, Malcontenta, Parco San Giuliano) con calcolo dell\'AQI.',
    descriptionEn: '6 fixed air quality sampling stations (Rio Novo, Sacca Fisola, Bissuola, Beccaria, Malcontenta, San Giuliano) measuring AQI in real time.',
    technicalNotesIt: 'Medie annue validate ARPAV (PM10, PM2.5, NO2 e superamenti giornalieri PM10) dell\'anno più recente, licenza CC BY 4.0, importate con pipeline/import_arpav_air.py. Classificazione rispetto ai limiti UE vigenti e 2030. ARPAV non pubblica un\'API aperta con i dati orari.',
    technicalNotesEn: 'ARPAV validated annual means (PM10, PM2.5, NO2 and PM10 daily exceedances) for the latest year, CC BY 4.0, imported with pipeline/import_arpav_air.py. Classified against current and 2030 EU limits. ARPAV does not publish an open hourly API.',
    endpointOrFile: '/api/environment'
  },
  {
    id: 'flussi_pedonali',
    nameIt: 'Varchi Smart Control Room & Contributo di Accesso (CDA)',
    nameEn: 'Smart Control Room Gates & Venice Access Fee (CDA)',
    group: 'city',
    regime: 'static',
    acquisition: 'api',
    institution: 'Comune di Venezia - Smart Control Room Tronchetto',
    portalUrl: 'https://cda.ve.it',
    portalName: 'cda.ve.it & comune.venezia.it',
    descriptionIt: '8 varchi pedonali storici monitorati dai sensori ottico/termici della Smart Control Room del Tronchetto e regolamento comunale Contributo di Accesso.',
    descriptionEn: '8 historic pedestrian gateway corridors monitored by Tronchetto Smart Control Room and official Access Fee regulations.',
    technicalNotesIt: 'Mappatura dei varchi fisici con sensori stereoscopici ottico/termici e delibera CDA n. 51/2023. Per tutela della privacy e GDPR, la SCR non diffonde numeri orari istantanei aperti; la piattaforma esclude stime numeriche sintetiche.',
    technicalNotesEn: 'Mapping of physical sensor gates and municipal Access Fee regulation. For privacy/GDPR reasons, SCR does not publish live open headcounts; the platform strictly excludes synthetic numbers.',
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
    technicalNotesIt: 'Posizioni calcolate con propagatore SGP4 (satellite.js) dagli elementi orbitali TLE di CelesTrak, aggiornati ogni 6 ore; prossimo passaggio sopra Venezia con elevazione minima 10°. Sulla mappa i satelliti compaiono solo durante i passaggi reali sopra l\'area.',
    technicalNotesEn: 'Positions propagated with SGP4 (satellite.js) from CelesTrak TLE orbital elements, refreshed every 6 hours; next pass over Venice with minimum 10° elevation. Satellites appear on the map only during real passes over the area.',
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
    descriptionIt: '16 cisterne storiche per la raccolta dell\'acqua piovana attraverso la sabbia nei campielli, scolpite in pietra d\'Istria o marmo rosso veronese (San Polo, San Bartolomeo, Sant\'Elena, Santa Marina, San Zan Degola, San Giacomo, Santa Margherita, San Barnaba, Santo Stefano, Sant\'Angelo, Formosa, San Zanipolo, Ghetto, Madonna dell\'Orto, Ca\' d\'Oro, San Trovaso).',
    descriptionEn: '16 historic stone rainwater cistern wells located in Venetian squares, carved from Istrian stone or Verona marble across all six historic sestieri.',
    technicalNotesIt: 'Censimento artistico e monumentale con epoca storica, materiale scultoreo, stile architettonico (gotico, rinascimentale, veneto-bizantino) e profondità della canna cisterna.',
    technicalNotesEn: 'Artistic and monumental heritage census documenting construction century, stone material, style (Gothic, Renaissance, Venetian-Byzantine), and cistern depth.',
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
    descriptionIt: '10 torri campanarie storiche di Venezia e laguna (San Marco, Santo Stefano, San Giorgio dei Greci, Burano, Frari, Torcello, San Pietro di Castello, San Giorgio Maggiore, Madonna dell\'Orto, San Francesco della Vigna) con dettaglio di altezza e inclinazione.',
    descriptionEn: '10 historic bell towers across Venice and lagoon islands with structural height, construction year, and tilt angle records resulting from soft subsoil.',
    technicalNotesIt: 'Rilievi geodetici e monitoraggi inclinometrici strutturali (es. Santo Stefano 2.0°, San Giorgio dei Greci 1.8°, Burano 2.8° con 1.83m di fuori piombo).',
    technicalNotesEn: 'Geodetic structural monitoring records documenting tilt angles (Santo Stefano 2.0°, San Giorgio dei Greci 1.8°, Burano 2.8° with 1.83m top deviation).',
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
    descriptionIt: '8 basi operative e pontili riservati d\'imbarco immediato dei natanti di soccorso idroambulanza (Ospedale Civile SS. Giovanni e Paolo, San Marco Giardinetti, Tronchetto Interscambio, Lido San Camillo, Fondamente Nove, Presidio Giustinian Dorsoduro, Burano PPI, Lido Ospedale al Mare).',
    descriptionEn: '8 emergency water ambulance boat docks and rapid hospital landing stages (SS. Giovanni e Paolo, San Marco, Tronchetto, Lido San Camillo, Fondamente Nove, Giustinian, Burano, Lido San Nicolò).',
    technicalNotesIt: 'Rete geolocalizzata dei presidi di pronto soccorso acqueo operativi H24 con codice pontile e presenza rampa barellabile.',
    technicalNotesEn: 'Geocoded 24/7 emergency water ambulance stations with hospital ramp indications and direct emergency dispatch.',
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
    descriptionIt: '16 dispositivi salvavita DAE (Defibrillatore Automatico Esterno) installati in teche protette ad accesso libero 24 ore su 24 nei nodi strategici urbani (San Marco, Santa Lucia FS, Piazzale Roma, Rialto, Zattere, Arsenale, Murano, Burano, Giudecca, Tronchetto, Mestre FS).',
    descriptionEn: '16 publicly accessible 24/7 automated external defibrillators (AED) installed in high-traffic squares and multimodal transit hubs.',
    technicalNotesIt: 'Registro sanitario ufficiale dei dispositivi accreditati con codice DAE, operatore di riferimento e data di ultima verifica periodica.',
    technicalNotesEn: 'Official health registry documenting public access defibrillator codes, maintenance operators, and inspection dates.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_PUBLIC_DAE)'
  },
  {
    id: 'farmacie_turno',
    nameIt: 'Farmacie Territoriali Storiche',
    nameEn: 'Licensed Neighborhood Pharmacies',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Ordine dei Farmacisti di Venezia & Federfarma Veneto',
    portalUrl: 'https://www.ordinefarmacistivenezia.it',
    portalName: 'ordinefarmacistivenezia.it',
    descriptionIt: '12 presidi farmaceutici territoriali storici accreditati nei sestieri e isole per il servizio di assistenza farmaceutica continuativa.',
    descriptionEn: '12 licensed neighborhood pharmacies accredited across sestieri and islands for continuous community healthcare.',
    technicalNotesIt: 'Registro sanitario ufficiale dei presidi territoriali con codice farmacia, indirizzo, recapiti telefonici e orari di guardia.',
    technicalNotesEn: 'Official health registry detailing pharmacy license codes, street addresses, emergency phone lines, and service shifts.',
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
    descriptionIt: '10 zone radiometriche satellitari della temperatura di superficie urbana (LST) con quantificazione delle anomalie termiche (°C) e dell\'effetto mitigante dell\'acqua e del verde.',
    descriptionEn: '10 satellite land surface temperature (LST) zones quantifying surface temperature anomalies (°C) and the cooling effects of water channels and tree canopy.',
    technicalNotesIt: 'Rilievo satellitare all\'infrarosso termico (Landsat TIRS-2 / Sentinel-3 SLSTR) calibrato su pavimentazioni in masegni, asfalti, tetti in laterizio e canali idrici.',
    technicalNotesEn: 'Thermal infrared satellite radiometry (Landsat TIRS-2 / Sentinel-3 SLSTR) calibrated across stone paving, asphalt, clay tiles, and water cooling corridors.',
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
    regime: 'static',
    acquisition: 'api',
    institution: 'ARPAV - Rete Monitoraggio Aerobiologico Veneto',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it & dati.veneto.it',
    descriptionIt: '4 stazioni di campionamento aerobiologico (Venezia Centro, Mestre Bissuola, Chioggia Sottomarina, San Donà di Piave) con conteggio dei granuli pollinici allergenici.',
    descriptionEn: '4 aerobiological pollen capture stations (Venice Center, Mestre Bissuola, Chioggia Sottomarina, San Donà) measuring airborne pollen concentrations.',
    technicalNotesIt: 'Bollettino settimanale ufficiale ARPAV: valori misurati in granuli/m³ e livello di concentrazione sintetico per famiglie botaniche (Graminacee, Parietaria, Betulacee, Oleacee, Pinacee).',
    technicalNotesEn: 'Official weekly ARPAV aerobiological bulletin: grains/m³ counts and synthetic allergen index by botanical families (Gramineae, Parietaria, Betulaceae, Oleaceae, Pinaceae).',
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
                { key: 'mobility', label: language === 'it' ? '1. Mobilità' : '1. Mobility' },
                { key: 'lagoon', label: language === 'it' ? '2. Laguna' : '2. Lagoon' },
                { key: 'city', label: language === 'it' ? '3. Città' : '3. City' }
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key as LayerGroupKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedGroup === g.key
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
                { key: 'realtime', label: language === 'it' ? 'Tempo Reale' : 'Live Sensors' },
                { key: 'simulated', label: language === 'it' ? 'Digital Twin' : 'Digital Twin' },
                { key: 'static', label: language === 'it' ? 'Censimento' : 'Open Data' }
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRegime(r.key as DataRegimeKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedRegime === r.key
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                >
                  {r.label}
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
                { key: 'api', label: 'API Live' },
                { key: 'local', label: language === 'it' ? 'Locale / Cache' : 'Local / Cache' }
              ].map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setSelectedAcquisition(a.key as AcquisitionKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedAcquisition === a.key
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
                    <span className="p-2 rounded-xl bg-[var(--rule)]/40 flex items-center justify-center">
                      {layer.group === 'mobility' ? (
                        <Ship className="w-5 h-5 text-sky-400" />
                      ) : layer.group === 'lagoon' ? (
                        <Waves className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Landmark className="w-5 h-5 text-emerald-400" />
                      )}
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
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-sm ${layer.regime === 'realtime'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : layer.regime === 'simulated'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${layer.regime === 'realtime'
                          ? 'bg-emerald-400 animate-pulse'
                          : layer.regime === 'simulated'
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                          }`}
                      />
                      {getRegimeName(layer.regime, language)}
                    </span>

                    {/* Acquisition Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)] flex items-center gap-1.5">
                      {layer.acquisition === 'api' ? (
                        <>
                          <Radio className="w-3 h-3 text-cyan-400" />
                          <span>API Live</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3 h-3 text-[var(--ink-3)]" />
                          <span>{language === 'it' ? 'Locale / Cache' : 'Local / Cache'}</span>
                        </>
                      )}
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
    return lang === 'it' ? 'Mobilità Acquea, Aerea & Ferroviaria' : 'Water, Air & Rail Mobility';
  }
  if (group === 'lagoon') {
    return lang === 'it' ? 'Laguna, Idrografia & Difesa Mare' : 'Lagoon, Hydrography & Sea Defense';
  }
  return lang === 'it' ? 'Città Storica, Patrimonio & Servizi' : 'Historic City, Heritage & Services';
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
