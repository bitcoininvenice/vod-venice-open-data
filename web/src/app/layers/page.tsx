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
  Info,
  Gauge,
  BarChart3,
  Layers,
  Activity
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type LayerGroupKey = 'all' | 'mobility' | 'lagoon' | 'city';
type DataRegimeKey = 'all' | 'realtime' | 'simulated' | 'static' | 'curated';
type AcquisitionKey = 'all' | 'api' | 'local';

interface LayerDocItem {
  id: string;
  nameIt: string;
  nameEn: string;
  group: 'mobility' | 'lagoon' | 'city';
  regime: 'realtime' | 'simulated' | 'static' | 'curated';
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
    descriptionIt: 'Posizione dei vaporetti calcolata dall\'orario ufficiale ACTV (simulata, non GPS), con eventuale sovrapposizione delle posizioni GTFS-Realtime quando il feed AVM è disponibile.',
    descriptionEn: 'Waterbus positions computed from the official ACTV timetable (simulated, not GPS), overlaid with GTFS-Realtime positions when the AVM feed is available.',
    technicalNotesIt: 'Simulato da orario: le coordinate sono interpolate tra le fermate del GTFS statico ACTV (CC BY) lungo i percorsi, sincronizzate con l\'orologio o con la timeline 24h. Non è un tracciamento GPS.',
    technicalNotesEn: 'Simulated from timetable: positions are interpolated between stops of the ACTV static GTFS (CC BY) along route shapes, synced to the clock or the 24h timeline. Not GPS tracking.',
    endpointOrFile: 'GTFS ACTV (actv-shapes.json) + /api/realtime/vehicles'
  },
  {
    id: 'rotte_actv',
    nameIt: 'Rotte di Navigazione ACTV',
    nameEn: 'ACTV Navigation Routes',
    group: 'mobility',
    regime: 'static',
    acquisition: 'local',
    institution: 'ACTV / AVM S.p.A. (GTFS, CC BY)',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'actv.avmspa.it (GTFS)',
    descriptionIt: 'Polilinee georeferenziate dei canali e delle tratte di navigazione autorizzate per i mezzi pubblici.',
    descriptionEn: 'Georeferenced vector polylines of authorized public transit water channels.',
    technicalNotesIt: 'Percorsi (shapes) del GTFS statico ACTV, licenza CC BY, convertiti in GeoJSON dalla pipeline del progetto.',
    technicalNotesEn: 'Route shapes from the ACTV static GTFS (CC BY), converted to GeoJSON by the project pipeline.',
    endpointOrFile: 'actv-shapes.json'
  },
  {
    id: 'fermate_actv',
    nameIt: 'Fermate & Pontili ACTV',
    nameEn: 'ACTV Waterbus Stops & Docks',
    group: 'mobility',
    regime: 'static',
    acquisition: 'api',
    institution: 'ACTV / AVM S.p.A. (GTFS, CC BY)',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Censimento dei pontili e approdi di navigazione con dettaglio accessibilità PRM e prossime partenze.',
    descriptionEn: 'Inventory of public boat docks with PRM accessibility details and scheduled departures.',
    technicalNotesIt: 'Approdi georeferenziati serviti da /api/stops a partire dal GTFS ACTV (CC BY); le prossime partenze vengono dall\'orario, non da tabelloni in tempo reale.',
    technicalNotesEn: 'Georeferenced stops served by /api/stops from the ACTV GTFS (CC BY); next departures come from the timetable, not live boards.',
    endpointOrFile: '/api/stops'
  },
  {
    id: 'navi_ais',
    nameIt: 'Banchine Portuali & Ormeggi Commerciali (AdSP)',
    nameEn: 'Port Berths & Commercial Moorings (AdSP)',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'api',
    institution: 'Elenco curato del progetto · rif. AdSP Mare Adriatico Settentrionale',
    portalUrl: 'https://www.port.venice.it',
    portalName: 'port.venice.it (Autorità Portuale)',
    descriptionIt: 'Banchine e ormeggi tra Tronchetto, San Basilio, Fusina e Porto Marghera con navi di riferimento e il quadro del D.L. 103/2021 (grandi navi fuori dal bacino di San Marco).',
    descriptionEn: 'Berths between Tronchetto, San Basilio, Fusina and Porto Marghera with reference ships and the Decree-Law 103/2021 framework (large ships kept out of St Mark\'s basin).',
    technicalNotesIt: 'Non sono posizioni AIS: le navi sono un elenco di riferimento con banchina assegnata. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'These are not AIS positions: ships are a reference list with an assigned berth. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: '/api/ships (Banchine e canali ufficiali)'
  },
  {
    id: 'rotte_marittime',
    nameIt: 'Rotte & Canali Marittimi',
    nameEn: 'Deep-Water Shipping Channels',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Capitaneria di Porto di Venezia',
    portalUrl: 'https://www.guardiacostiera.gov.it/venezia',
    portalName: 'guardiacostiera.gov.it',
    descriptionIt: 'Canali navigabili ad alto pescaggio (Canale dei Petroli, Bocca di Malamocco, Canale San Nicolò, Tronchetto).',
    descriptionEn: 'Deep-draft navigable commercial fairways across the lagoon and port inlets.',
    technicalNotesIt: 'Tracciati semplificati dei canali; i fondali indicati sono valori nominali. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Simplified channel tracks; depths are nominal values. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'simulation-data.ts (MARITIME_CHANNELS)'
  },
  {
    id: 'alilaguna',
    nameIt: 'Linee, Pontili & Flotta Alilaguna (GTFS Twin)',
    nameEn: 'Alilaguna Routes, Docks & Fleet (GTFS Twin)',
    group: 'mobility',
    regime: 'simulated',
    acquisition: 'api',
    institution: 'Alilaguna S.p.A. (GTFS dell\'operatore)',
    portalUrl: 'https://www.alilaguna.it',
    portalName: 'alilaguna.it (GTFS) · Transitland f-u20f-alilagunaspa',
    descriptionIt: 'Rete ufficiale e flotta dei collegamenti acquei tra Marco Polo VCE, Murano, Canal Grande, Lido e Terminal Passeggeri.',
    descriptionEn: 'Official network and fleet of water connections between Marco Polo VCE, Murano, Grand Canal, Lido, and Cruise Terminal.',
    technicalNotesIt: 'Simulazione da orario: corse, fermate e percorsi dal GTFS ufficiale Alilaguna (alilaguna.it, importato con pipeline/import_alilaguna_gtfs.py); le posizioni sono interpolate tra le fermate. Non è un tracciamento GPS. L\'orario ha una validità stagionale: fuori dal periodo non vengono mostrate barche.',
    technicalNotesEn: 'Timetable simulation: trips, stops and shapes from the official Alilaguna GTFS (alilaguna.it, imported with pipeline/import_alilaguna_gtfs.py); positions are interpolated between stops. Not GPS tracking. The timetable is seasonal: outside its validity no boats are shown.',
    endpointOrFile: '/api/alilaguna'
  },
  {
    id: 'voli_vce',
    nameIt: 'Voli Aerei Spazio VCE (OpenSky Network)',
    nameEn: 'VCE Airport Flight Radar (OpenSky Network)',
    group: 'mobility',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'OpenSky Network (ADS-B)',
    portalUrl: 'https://opensky-network.org',
    portalName: 'opensky-network.org (ADS-B Live)',
    descriptionIt: 'Traffico aereo in tempo reale nello spazio aereo e nell\'area terminale di controllo (TMA) di Venezia Marco Polo.',
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
    institution: 'OpenStreetMap contributors (ODbL) + elenco curato',
    portalUrl: 'https://www.openstreetmap.org',
    portalName: 'openstreetmap.org (amenity=parking)',
    descriptionIt: 'Parcheggi con capienza dichiarata di almeno 100 posti mappati su OpenStreetMap, più le autorimesse principali di un elenco curato del progetto quando non trovano riscontro in OSM.',
    descriptionEn: 'Car parks with a declared capacity of at least 100 spaces mapped on OpenStreetMap, plus the main garages from a curated project list when OSM has no match.',
    technicalNotesIt: 'Import con pipeline/import_osm_poi.py (amenity=parking con capacity ≥ 100, ODbL). Le voci curate (tariffe incluse) restano solo se non c\'è un parcheggio OSM entro 150 m e sono segnate "da verificare". Nessun dato di occupazione in tempo reale: AVM non lo pubblica come open data.',
    technicalNotesEn: 'Imported with pipeline/import_osm_poi.py (amenity=parking with capacity ≥ 100, ODbL). Curated entries (rates included) are kept only if no OSM car park lies within 150 m and are marked "to be verified". No live occupancy: AVM does not publish it as open data.',
    endpointOrFile: '/api/city-assets (src/data/osm-poi.json)'
  },
  {
    id: 'limiti_velocita',
    nameIt: 'Limiti Velocità & Barcavelox',
    nameEn: 'Speed Limits & Barcavelox Radar',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. regolamento comunale della circolazione acquea',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Regolamentazione del moto ondoso: limiti di velocità vigenti (5, 7, 11, 20 km/h) e postazioni fisse Barcavelox.',
    descriptionEn: 'Wake reduction speed regulations (5, 7, 11, 20 km/h) and radar enforcement locations.',
    technicalNotesIt: 'Limiti e postazioni riassunti dal regolamento comunale; fa fede il testo vigente pubblicato dal Comune. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Limits and checkpoints summarised from the municipal regulation; the official text in force prevails. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_CANAL_SPEED_LIMITS)'
  },
  {
    id: 'franchi_ponti',
    nameIt: 'Franchi di Tiro Ponti vs Marea',
    nameEn: 'Bridge Clearances vs Tide Level',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Insula S.p.A.; marea: CPSM',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Altezza libera sotto una selezione di ponti, ricalcolata con il livello di marea misurato.',
    descriptionEn: 'Clearance under a selection of bridges, recalculated with the measured tide level.',
    technicalNotesIt: 'La marea è reale (CPSM, dati.venezia.it); le altezze dei ponti allo zero mareografico vengono da un elenco curato e vanno verificate. Non usare per la navigazione. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'The tide is real (CPSM, dati.venezia.it); bridge heights above tide datum come from a curated list and must be verified. Do not use for navigation. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_BRIDGE_CLEARANCES)'
  },
  {
    id: 'gondole',
    nameIt: 'Traghetti da Parada & Stazi Gondole',
    nameEn: 'Gondola Ferries & Traditional Stations',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Ente Gondola',
    portalUrl: 'https://www.entegondola.it',
    portalName: 'entegondola.it',
    descriptionIt: 'I traghetti tradizionali a remi sul Canal Grande (S. Sofia, S. Tomà, Giglio, Carbon) e le basi operative dei gondolieri.',
    descriptionEn: 'Traditional gondola ferry crossings across Grand Canal and historic gondolier boarding stations.',
    technicalNotesIt: 'Postazioni, numero di gondole e tariffe sono indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Stations, gondola counts and fares are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_GONDOLA_STATIONS)'
  },
  {
    id: 'rive_merci',
    nameIt: 'Rive Merci & Taxi Acquei',
    nameEn: 'Freight Docks & Water Taxi Berths',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Comune di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Banchine pubbliche di carico/scarico per l\'approvvigionamento merci e stalli del servizio pubblico taxi acqueo.',
    descriptionEn: 'Public freight loading/unloading docks and licensed municipal water taxi stands.',
    technicalNotesIt: 'Fasce orarie e soste sono indicative. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Time windows and stay limits are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_PUBLIC_DOCKS)'
  },
  {
    id: 'treni_ponte',
    nameIt: 'Infrastruttura Ferroviaria RFI (Ponte della Libertà & Stazioni)',
    nameEn: 'RFI Railway Infrastructure (Libertà Viaduct & Stations)',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'api',
    institution: 'Elenco curato del progetto · rif. RFI – Prospetto Informativo della Rete',
    portalUrl: 'https://www.rfi.it',
    portalName: 'rfi.it (PIR RFI)',
    descriptionIt: 'Nodi ferroviari di testa e di transito (Santa Lucia, Mestre), viadotto lagunare quadruplicato a 4 binari (Km 262-267) e fascio merci Porto Marghera.',
    descriptionEn: 'Terminal and junction railway stations (Santa Lucia, Mestre), 4-track lagoon viaduct (Km 262-267), and Porto Marghera freight yard.',
    technicalNotesIt: 'Anagrafica dei nodi ferroviari: nessuna posizione o ritardo dei treni in tempo reale. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Railway node inventory: no live train positions or delays. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: '/api/rail-logistics'
  },
  {
    id: 'battelli_veritas',
    nameIt: 'Pontili di Conferimento & Rifiuti Veritas',
    nameEn: 'Veritas Waste Collection Docks & Barges',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Gruppo Veritas',
    portalUrl: 'https://www.gruppoveritas.it',
    portalName: 'gruppoveritas.it',
    descriptionIt: 'Pontili e ormeggi dei battelli compattatori adibiti all\'asporto rifiuti nei canali con fasce orarie mattutine (06:30 - 08:30).',
    descriptionEn: 'Canal collection docks and waste barge moorings with official morning schedules (06:30 - 08:30).',
    technicalNotesIt: 'Pontili, orari e frazioni sono indicativi; nessuna posizione dei battelli in tempo reale. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Docks, times and waste streams are indicative; no live boat positions. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_VERITAS_WASTE_BOATS)'
  },
  {
    id: 'ciclovie_veneto',
    nameIt: 'Ciclovie Isole & Gronda del Veneto',
    nameEn: 'Veneto Island & Coastal Bike Routes',
    group: 'mobility',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Regione Veneto',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Rete di 6 itinerari ciclabili protetti lungo le isole di Venezia e la gronda lagunare: Lido, Pellestrina, Dolomiti-Venezia I4, Riviera del Brenta, Cavallino Lio Piccolo e Ponte della Libertà.',
    descriptionEn: 'Network of 6 protected cycle routes across barrier islands and the lagoon fringe: Lido, Pellestrina, Dolomiti-Venice I4, Riviera del Brenta, Cavallino Lio Piccolo, and Libertà Bridge.',
    technicalNotesIt: 'Tracciati semplificati, tipo di fondo e interscambi indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Simplified tracks; surface type and interchanges are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
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
    institution: 'Comune di Venezia – CPSM (marea); anagrafica MOSE',
    portalUrl: 'https://www.mosevenezia.eu',
    portalName: 'mosevenezia.eu & Provveditorato OO.PP.',
    descriptionIt: 'Marea misurata e prevista dal Centro Maree, con l\'anagrafica delle 78 paratoie alle bocche di Lido, Malamocco e Chioggia.',
    descriptionEn: 'Measured and forecast tide from the Tide Centre, with the inventory of the 78 gates at the Lido, Malamocco and Chioggia inlets.',
    technicalNotesIt: 'Livelli di marea reali dalla rete mareografica CPSM (dati.venezia.it, aggiornamento ogni 5 minuti) e previsione degli estremali con data di emissione. Lo stato operativo delle paratoie non è pubblicato come open data: viene indicato come non disponibile.',
    technicalNotesEn: 'Real tide levels from the CPSM gauge network (dati.venezia.it, 5-minute updates) and forecast extremes with issue time. Floodgate operating status is not published as open data and is shown as unavailable.',
    endpointOrFile: '/api/tide'
  },
  {
    id: 'passerelle',
    nameIt: 'Passerelle Acqua Alta CPSM',
    nameEn: 'CPSM High-Water Elevated Walkways',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Comune di Venezia – CPSM',
    portalUrl: 'https://www.comune.venezia.it/it/content/centro-maree-previsioni',
    portalName: 'comune.venezia.it/maree',
    descriptionIt: 'Rete dei percorsi sopraelevati su cavalletti in legno installati dalla Protezione Civile in caso di marea superiore a +110 cm.',
    descriptionEn: 'Network of elevated timber walkways deployed during high water events exceeding +110 cm.',
    technicalNotesIt: 'Percorsi e soglie di posa indicativi; lo stato di montaggio non è un dato in tempo reale. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Routes and installation thresholds are indicative; mounting status is not live. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'passerelleData.ts'
  },
  {
    id: 'briccole',
    nameIt: 'Briccole & Segnalamenti Canali',
    nameEn: 'Lagoon Channel Markers & Lights',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Provveditorato OO.PP. / Comune di Venezia',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Paline e briccole in legno di quercia che delimitano i bordi navigabili dei canali lagunari e fanali d\'accesso.',
    descriptionEn: 'Traditional oak wooden piles and sector lights marking navigable lagoon channels.',
    technicalNotesIt: 'Codici e fondali indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Codes and depths are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
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
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. ARPAV / Portale Acque Ministero della Salute',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it (Portale Acque)',
    descriptionIt: 'Punti di campionamento microbiologico e idoneità alla balneazione sui litorali di Lido, Pellestrina e Cavallino.',
    descriptionEn: 'Microbiological sampling stations and bathing water quality classifications on coastal beaches.',
    technicalNotesIt: 'Punti e classi indicativi: per idoneità e campionamenti aggiornati consultare il Portale Acque del Ministero della Salute o ARPAV. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Points and classes are indicative: check the Ministry of Health bathing-water portal or ARPAV for current status and samples. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'marineSensorsData.ts'
  },
  {
    id: 'subsidenza_insar',
    nameIt: 'Subsidenza InSAR (Copernicus EGMS)',
    nameEn: 'InSAR Land Subsidence (Copernicus EGMS)',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Copernicus EGMS',
    portalUrl: 'https://egms.land.copernicus.eu',
    portalName: 'egms.land.copernicus.eu',
    descriptionIt: 'Punti di esempio con velocità di abbassamento del suolo, sul modello dei prodotti InSAR (Sentinel-1).',
    descriptionEn: 'Example points with ground subsidence rates, modelled on InSAR products (Sentinel-1).',
    technicalNotesIt: 'I valori non sono scaricati da EGMS: per le serie misurate consultare egms.land.copernicus.eu. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Values are not downloaded from EGMS: see egms.land.copernicus.eu for measured series. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_SUBSIDENCE_INSAR)'
  },
  {
    id: 'morfologia_barene',
    nameIt: 'Morfologia Barene & Velme (Natura 2000)',
    nameEn: 'Salt Marshes & Mudflats (Natura 2000)',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Regione Veneto – Carta degli habitat',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it',
    descriptionIt: 'Zone umide intertidali, barene e velme della Laguna Nord e Sud tutelate dalla Convenzione di Ramsar.',
    descriptionEn: 'Intertidal salt marshes (barene) and mudflats (velme) protected under the Ramsar Convention.',
    technicalNotesIt: 'Aree e quote indicative. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Areas and elevations are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_LAGOON_MORPHOLOGY)'
  },
  {
    id: 'stazioni_vento',
    nameIt: 'Stazioni Vento Meteomarine & Anemometri',
    nameEn: 'Marine Wind Stations & Anemometers',
    group: 'lagoon',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'Centro Maree CPSM, METAR LIPZ (NOAA), previsione Open-Meteo',
    portalUrl: 'https://www.meteoam.it',
    portalName: 'meteoam.it & comune.venezia.it/maree',
    descriptionIt: 'Rete meteo-marina del Centro Maree (vento, raffiche, onde, temperatura, pressione) e METAR dell\'aeroporto di Tessera, con il vento previsto animato su tutta la laguna.',
    descriptionEn: 'Tide Centre meteo-marine network (wind, gusts, waves, temperature, pressure) and the Tessera airport METAR, with the forecast wind animated across the lagoon.',
    technicalNotesIt: 'Stazioni: misure reali ogni 5 minuti dai feed CPSM su dati.venezia.it e METAR LIPZ da NOAA. Animazione: previsione di vento a 10 m da Open-Meteo (modelli DWD ICON / ECMWF, CC BY 4.0) su una griglia di 9×9 punti (circa 4 km), riletta ogni 30 minuti; le particelle seguono il campo interpolato e il colore indica l\'intensità. È un modello, non una misura. L\'indicatore di spinta sulla marea è una semplificazione basata su direzione e intensità del vento.',
    technicalNotesEn: 'Stations: real readings every 5 minutes from CPSM feeds on dati.venezia.it and the LIPZ METAR from NOAA. Animation: 10 m wind forecast from Open-Meteo (DWD ICON / ECMWF models, CC BY 4.0) on a 9×9 grid (about 4 km), refreshed every 30 minutes; particles follow the interpolated field and colour shows strength. It is a model, not a measurement. The tide-push indicator is a simplification based on wind direction and speed.',
    endpointOrFile: '/api/weather + /api/wind-field'
  },
  {
    id: 'fortezze_lagunari',
    nameIt: 'Fortezze Lagunari & Isole Difensive',
    nameEn: 'Lagoon Fortresses & Defense Islands',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Demanio / Archivio di Stato',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Censimento di 12 isole fortificate del sistema difensivo e sanitario storico: Ottagoni (Alberoni, Ca\' Roman), Forte San Felice a Chioggia, Forte Sant\'Andrea, Forte Marghera, Poveglia, Lazzaretti, Certosa, San Servolo e Sant\'Angelo della Polvere.',
    descriptionEn: 'Inventory of 12 historic defense and quarantine islands: Octagons, Chioggia San Felice, Sant\'Andrea, Forte Marghera, Poveglia, Lazarets, Certosa, and San Servolo.',
    technicalNotesIt: 'Epoche, superfici e stato di conservazione indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Periods, areas and condition are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_LAGOON_FORTRESS_ISLANDS)'
  },
  {
    id: 'buffer_spaziale',
    nameIt: 'Buffer Spaziale Cantieri (PostGIS)',
    nameEn: 'Worksite Spatial Buffer (PostGIS)',
    group: 'lagoon',
    regime: 'static',
    acquisition: 'local',
    institution: 'Calcolo del progetto (client-side)',
    portalUrl: 'https://postgis.net',
    portalName: 'VOD',
    descriptionIt: 'Raggio d\'interferenza interattivo (50m - 500m) calcolato in tempo reale tra cantieri comunali e fermate ACTV.',
    descriptionEn: 'Interactive dynamic proximity buffer (50m - 500m) computed between active worksites and ACTV boat stops.',
    technicalNotesIt: 'Distanze calcolate nel browser con la formula dell\'emisenoverso (haversine) tra cantieri geocodificati e fermate ACTV.',
    technicalNotesEn: 'Distances computed in the browser with the haversine formula between geocoded public works and ACTV stops.',
    endpointOrFile: 'SpatialAnalysisModal.tsx'
  },
  {
    id: 'sonde_arpav',
    nameIt: 'Sonde Qualità Acque Lagunari ARPAV',
    nameEn: 'ARPAV Lagoon Water Quality Probes',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'api',
    institution: 'Elenco curato del progetto · rif. ARPAV',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Stazioni di esempio con parametri chimico-fisici delle acque lagunari.',
    descriptionEn: 'Example stations with physico-chemical lagoon water parameters.',
    technicalNotesIt: 'Ossigeno, salinità, temperatura e conducibilità sono valori di esempio, non telemetria ARPAV. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Oxygen, salinity, temperature and conductivity are example values, not ARPAV telemetry. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: '/api/regional-data'
  },
  {
    id: 'fiumi_tributari',
    nameIt: 'Fiumi Immissari in Laguna',
    nameEn: 'Lagoon Tributary Rivers',
    group: 'lagoon',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Regione Veneto / Distretto Alpi Orientali',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it',
    descriptionIt: 'I corsi d\'acqua del Bacino Scolante che scaricano acqua dolce nella Laguna di Venezia (Brenta, Dese, Marzenego, Zero, Silone).',
    descriptionEn: 'Tributary freshwater drainage basin rivers flowing into the Venice Lagoon (Brenta, Dese, Marzenego, Zero, Silone).',
    technicalNotesIt: 'Bacini e portate medie indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Basins and mean flows are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
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
    institution: 'OpenStreetMap contributors (ODbL); ponti: elenco curato del progetto',
    portalUrl: 'https://wiki.openstreetmap.org/wiki/Tag:amenity%3Ddrinking_water',
    portalName: 'openstreetmap.org (amenity=drinking_water)',
    descriptionIt: 'Fontanelle pubbliche mappate su OpenStreetMap nel centro storico e nelle isole (l\'acquedotto è gestito da Veritas S.p.A.) e una selezione di ponti con rampe o montascale.',
    descriptionEn: 'Public drinking fountains mapped on OpenStreetMap in the historic centre and islands (the water network is run by Veritas S.p.A.) and a selection of bridges with ramps or stairlifts.',
    technicalNotesIt: 'Import con pipeline/import_osm_fountains.py (esclusi i punti con drinking_water=no). enrich_fountains.py dà ai punti senza nome il toponimo noto più vicino entro 150 m, indicato come "nei pressi di" (stima, non indirizzo). Funzionamento dei singoli punti non verificato.',
    technicalNotesEn: 'Imported with pipeline/import_osm_fountains.py (points tagged drinking_water=no excluded). enrich_fountains.py names unnamed points after the nearest known place within 150 m, shown as "near" (estimate, not an address). Individual fountains are not verified as working.',
    endpointOrFile: '/api/city-assets'
  },
  {
    id: 'verde_urbano',
    nameIt: 'Alberi Monumentali',
    nameEn: 'Monumental Trees',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'OpenStreetMap contributors (ODbL); codici MASAF',
    portalUrl: 'https://www.openstreetmap.org',
    portalName: 'openstreetmap.org (natural=tree)',
    descriptionIt: 'Alberi monumentali mappati su OpenStreetMap (molti con il codice dell\'Elenco nazionale MASAF), più alcune voci di un elenco curato senza riscontro in OSM.',
    descriptionEn: 'Monumental trees mapped on OpenStreetMap (many with the national MASAF register code), plus a few curated entries with no OSM match.',
    technicalNotesIt: 'Import con pipeline/import_osm_poi.py (natural=tree con denotation, ODbL). Specie, altezza e circonferenza solo se presenti in OSM. Le voci curate restano solo se non c\'è un albero OSM entro 40 m.',
    technicalNotesEn: 'Imported with pipeline/import_osm_poi.py (natural=tree with denotation, ODbL). Species, height and girth only when tagged in OSM. Curated entries are kept only if no OSM tree lies within 40 m.',
    endpointOrFile: '/api/venice-assets (src/data/osm-poi.json)'
  },
  {
    id: 'wifi_hotspots',
    nameIt: 'Wi-Fi VeniceConnected',
    nameEn: 'VeniceConnected Public Wi-Fi',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'Venis S.p.A. & Comune di Venezia',
    portalUrl: 'https://dati.venezia.it/?q=content/hotspot-wifi',
    portalName: 'dati.venezia.it / venis.it',
    descriptionIt: 'Punti di accesso alla rete pubblica Wi-Fi metropolitana in fibra ottica per cittadini, pendolari e visitatori.',
    descriptionEn: 'Public fiber-optic metropolitan Wi-Fi access points for residents, commuters, and visitors.',
    technicalNotesIt: '283 punti di accesso censiti dal dataset ufficiale Open Data del Comune di Venezia (dati.venezia.it, licenza CC BY 4.0), con indicazione dello stato attivo o temporaneamente non attivo.',
    technicalNotesEn: '283 public access points from the official City of Venice Open Data catalog (dati.venezia.it, CC BY 4.0), including active and inactive status.',
    endpointOrFile: 'urbanAssetsVeniceData.ts'
  },
  {
    id: 'colonnine_ev',
    nameIt: 'Colonnine Ricarica EV',
    nameEn: 'EV Charging Stations',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'OpenStreetMap contributors (ODbL)',
    portalUrl: 'https://www.openstreetmap.org',
    portalName: 'openstreetmap.org (amenity=charging_station)',
    descriptionIt: 'Stazioni di ricarica per veicoli elettrici mappate su OpenStreetMap nel territorio comunale, più alcune voci curate senza riscontro in OSM.',
    descriptionEn: 'EV charging stations mapped on OpenStreetMap across the municipality, plus a few curated entries with no OSM match.',
    technicalNotesIt: 'Import con pipeline/import_osm_poi.py (amenity=charging_station, ODbL). Prese, potenza e tipi di connettore solo se dichiarati in OSM. La disponibilità in tempo reale non è pubblicata dai gestori.',
    technicalNotesEn: 'Imported with pipeline/import_osm_poi.py (amenity=charging_station, ODbL). Sockets, power and connector types only when tagged in OSM. Live availability is not published by operators.',
    endpointOrFile: '/api/venice-assets (src/data/osm-poi.json)'
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
    regime: 'curated',
    acquisition: 'api',
    institution: 'Elenco curato del progetto · rif. Comune di Venezia – Smart Control Room, cda.ve.it',
    portalUrl: 'https://cda.ve.it',
    portalName: 'cda.ve.it & comune.venezia.it',
    descriptionIt: '8 varchi pedonali storici monitorati dai sensori ottico/termici della Smart Control Room del Tronchetto e regolamento comunale Contributo di Accesso.',
    descriptionEn: '8 historic pedestrian gateway corridors monitored by Tronchetto Smart Control Room and official Access Fee regulations.',
    technicalNotesIt: 'Varchi e quadro del Contributo di Accesso riassunti dal sito del Comune (fa fede cda.ve.it). La Smart Control Room non pubblica conteggi aperti: nessun valore di flusso viene mostrato. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Gates and the Access Fee framework summarised from the City website (cda.ve.it prevails). The Smart Control Room does not publish open counts: no flow values are shown. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: '/api/pedestrian-flows'
  },
  {
    id: 'satelliti_copernicus',
    nameIt: 'Satelliti Radar SAR (Copernicus / ASI)',
    nameEn: 'Copernicus & ASI Radar Satellites',
    group: 'city',
    regime: 'realtime',
    acquisition: 'api',
    institution: 'CelesTrak (elementi orbitali) – satelliti ESA / ASI',
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
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Comune di Venezia – toponomastica',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'I tradizionali cartelli stradali veneziani dipinti a intonaco bianco ("lenzuolino") con calli, campielli e numerazione civica per sestiere.',
    descriptionEn: 'Traditional painted Venetian street signs and unique sestiere-based continuous civic house numbering.',
    technicalNotesIt: 'Testi, etimologie e civici indicativi. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Texts, etymologies and house numbers are indicative. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_NIZIOLETI_CIVICI)'
  },
  {
    id: 'vere_da_pozzo',
    nameIt: 'Vere da Pozzo Storiche',
    nameEn: 'Vere da Pozzo Historic Cistern Wells',
    group: 'city',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto + OpenStreetMap (ODbL)',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: 'Vere da pozzo storiche con epoca, materiale e stile da un elenco curato, più i pozzi mappati su OpenStreetMap nel centro storico e nelle isole.',
    descriptionEn: 'Historic wellheads with period, material and style from a curated list, plus wells mapped on OpenStreetMap in the historic centre and islands.',
    technicalNotesIt: 'Import con pipeline/import_osm_poi.py (man_made=water_well, ODbL). Ogni voce curata indica se la posizione coincide con un pozzo OSM entro 25 m; epoca, materiale e stile restano da verificare.',
    technicalNotesEn: 'Imported with pipeline/import_osm_poi.py (man_made=water_well, ODbL). Each curated entry shows whether its position matches an OSM well within 25 m; period, material and style remain to be verified.',
    endpointOrFile: '/api/heritage (open-data-catalog.ts + src/data/osm-poi.json)'
  },
  {
    id: 'campanili_pendenti',
    nameIt: 'Campanili & Torri Pendenti',
    nameEn: 'Historic & Leaning Bell Towers',
    group: 'city',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Patriarcato di Venezia, studi pubblicati',
    portalUrl: 'https://dati.venezia.it',
    portalName: 'dati.venezia.it',
    descriptionIt: '10 torri campanarie storiche di Venezia e laguna (San Marco, Santo Stefano, San Giorgio dei Greci, Burano, Frari, Torcello, San Pietro di Castello, San Giorgio Maggiore, Madonna dell\'Orto, San Francesco della Vigna) con dettaglio di altezza e inclinazione.',
    descriptionEn: '10 historic bell towers across Venice and lagoon islands with structural height, construction year, and tilt angle records resulting from soft subsoil.',
    technicalNotesIt: 'Altezze e inclinazioni indicative, da letteratura non verificata voce per voce. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Heights and tilts are indicative, from literature not checked entry by entry. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_BELL_TOWERS)'
  },
  {
    id: 'idroambulanze',
    nameIt: 'Pontili Idroambulanze SUEM 118',
    nameEn: 'SUEM 118 Water Ambulance Docks',
    group: 'city',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto (non ufficiale)',
    portalUrl: 'https://www.aulss3.veneto.it',
    portalName: 'aulss3.veneto.it (SUEM 118)',
    descriptionIt: '8 basi operative e pontili riservati d\'imbarco immediato dei natanti di soccorso idroambulanza (Ospedale Civile SS. Giovanni e Paolo, San Marco Giardinetti, Tronchetto Interscambio, Lido San Camillo, Fondamente Nove, Presidio Giustinian Dorsoduro, Burano PPI, Lido Ospedale al Mare).',
    descriptionEn: '8 emergency water ambulance boat docks and rapid hospital landing stages (SS. Giovanni e Paolo, San Marco, Tronchetto, Lido San Camillo, Fondamente Nove, Giustinian, Burano, Lido San Nicolò).',
    technicalNotesIt: 'Elenco curato del progetto: non esiste un dataset aperto degli approdi SUEM 118. Posizioni, codici e dotazioni sono da verificare; non usarlo per decisioni in emergenza (chiamare il 118).',
    technicalNotesEn: 'Project-curated list: no open dataset of SUEM 118 docks exists. Locations, codes and equipment are unverified; do not rely on it in an emergency (call 118/112).',
    endpointOrFile: 'open-data-catalog.ts (OPEN_EMERGENCY_WATER_DOCKS)'
  },
  {
    id: 'dae_pubblici',
    nameIt: 'Defibrillatori (DAE)',
    nameEn: 'Defibrillators (AED)',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'OpenStreetMap contributors (ODbL)',
    portalUrl: 'https://wiki.openstreetmap.org/wiki/Tag:emergency%3Ddefibrillator',
    portalName: 'openstreetmap.org (emergency=defibrillator)',
    descriptionIt: 'Defibrillatori mappati su OpenStreetMap nell\'area della laguna e di Mestre, più alcune voci di un elenco curato del progetto non ancora confermate (segnalate come "da verificare").',
    descriptionEn: 'Defibrillators mapped on OpenStreetMap across the lagoon and Mestre, plus a few entries from a project-curated list not yet confirmed (marked "to verify").',
    technicalNotesIt: 'Non esiste un dataset aperto ufficiale dei DAE per Venezia (verificato su dati.gov.it, dati.veneto.it, dati.venezia.it). Import con pipeline/import_osm_defibrillators.py. Orari H24 solo se dichiarati in OSM (opening_hours=24/7). Le statistiche usano solo i DAE OSM.',
    technicalNotesEn: 'No official open AED dataset exists for Venice (checked dati.gov.it, dati.veneto.it, dati.venezia.it). Imported with pipeline/import_osm_defibrillators.py. 24/7 only when declared in OSM (opening_hours=24/7). Statistics use OSM AEDs only.',
    endpointOrFile: 'src/data/osm-defibrillators.json + open-data-catalog.ts (CURATED_PUBLIC_DAE)'
  },
  {
    id: 'farmacie_turno',
    nameIt: 'Farmacie',
    nameEn: 'Pharmacies',
    group: 'city',
    regime: 'static',
    acquisition: 'local',
    institution: 'OpenStreetMap contributors (ODbL)',
    portalUrl: 'https://www.aulss3.veneto.it/Farmacie-di-turno',
    portalName: 'openstreetmap.org · turni: aulss3.veneto.it',
    descriptionIt: 'Farmacie mappate su OpenStreetMap (escluse le parafarmacie), più alcune voci di un elenco curato non ancora confermate. I turni non sono open data: la scheda rimanda alla pagina ufficiale ULSS 3.',
    descriptionEn: 'Pharmacies mapped on OpenStreetMap (drugstores excluded), plus a few unconfirmed entries from a curated list. Duty rotas are not open data: the detail card links to the official ULSS 3 page.',
    technicalNotesIt: 'Import con pipeline/import_osm_pharmacies.py. Telefono e orari solo se presenti in OSM. Le statistiche usano solo le farmacie OSM.',
    technicalNotesEn: 'Imported with pipeline/import_osm_pharmacies.py. Phone and hours only when present in OSM. Statistics use OSM pharmacies only.',
    endpointOrFile: 'src/data/osm-pharmacies.json + open-data-catalog.ts (CURATED_PHARMACIES)'
  },
  {
    id: 'isole_calore',
    nameIt: 'Isole di Calore Superficiale (LST Satellitare)',
    nameEn: 'Surface Urban Heat Islands (LST)',
    group: 'city',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Landsat TIRS / Sentinel-3 SLSTR',
    portalUrl: 'https://landsat.gsfc.nasa.gov',
    portalName: 'landsat.gsfc.nasa.gov',
    descriptionIt: 'Zone di esempio con temperatura di superficie (LST) e anomalia termica, per illustrare l\'effetto di acqua e verde.',
    descriptionEn: 'Example zones with land surface temperature (LST) and thermal anomaly, illustrating the effect of water and greenery.',
    technicalNotesIt: 'Le temperature non sono scaricate da Landsat o Sentinel-3. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Temperatures are not downloaded from Landsat or Sentinel-3. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'open-data-catalog.ts (OPEN_HEAT_ISLAND_LST)'
  },
  {
    id: 'strutture_ricettive',
    nameIt: 'Pressione Turistica & Alloggi Registrati',
    nameEn: 'Tourism Density & Registered Lodging',
    group: 'city',
    regime: 'curated',
    acquisition: 'local',
    institution: 'Elenco curato del progetto · rif. Regione Veneto – Osservatorio del Turismo',
    portalUrl: 'https://dati.veneto.it',
    portalName: 'dati.veneto.it (Open Data Regione Veneto)',
    descriptionIt: 'Strutture ricettive e posti letto per zona con rapporto turisti/residenti (valori indicativi).',
    descriptionEn: 'Accommodation and beds per area with tourist/resident ratio (indicative values).',
    technicalNotesIt: 'Conteggi indicativi: per i dati ufficiali consultare l\'Osservatorio del Turismo della Regione Veneto. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Indicative counts: see the Veneto Region Tourism Observatory for official figures. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: 'regionalVenetoData.ts (REGIONAL_TOURIST_ACCOMMODATIONS)'
  },
  {
    id: 'pollini_arpav',
    nameIt: 'Bollettino Pollini ARPAV',
    nameEn: 'ARPAV Airborne Pollen Bulletin',
    group: 'city',
    regime: 'curated',
    acquisition: 'api',
    institution: 'Elenco curato del progetto · rif. ARPAV – rete aerobiologica',
    portalUrl: 'https://www.arpa.veneto.it',
    portalName: 'arpa.veneto.it & dati.veneto.it',
    descriptionIt: 'Stazioni aerobiologiche con concentrazioni di pollini di esempio per famiglia botanica.',
    descriptionEn: 'Aerobiological stations with example pollen concentrations by plant family.',
    technicalNotesIt: 'Le concentrazioni non vengono dal bollettino ARPAV: per i valori della settimana consultare arpa.veneto.it. Elenco curato del progetto: posizioni e valori sono indicativi, da verificare presso la fonte citata; non è un download automatico né una misura aggiornata.',
    technicalNotesEn: 'Concentrations do not come from the ARPAV bulletin: see arpa.veneto.it for this week\'s values. Curated project list: positions and values are indicative and must be checked against the cited source; it is not an automated download or a current measurement.',
    endpointOrFile: '/api/regional-data'
  }
];

export default function LayersDocumentationPage() {
  const { language, toggleLanguage, t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<LayerGroupKey>('all');
  const [selectedRegime, setSelectedRegime] = useState<DataRegimeKey>('all');
  const [selectedAcquisition, setSelectedAcquisition] = useState<AcquisitionKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Statistics
  const totalLayers = LAYER_CATALOG.length;
  const realtimeLayers = LAYER_CATALOG.filter((l) => l.regime === 'realtime').length;
  const simulatedLayers = LAYER_CATALOG.filter((l) => l.regime === 'simulated').length;
  const staticLayers = LAYER_CATALOG.filter((l) => l.regime === 'static').length;
  const curatedLayers = LAYER_CATALOG.filter((l) => l.regime === 'curated').length;
  const layersNav = t('ui.metricsPage.navLayers', { n: totalLayers });

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
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Top Navigation Bar */}
      <header className="border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Brand + Subtitle + Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight block text-[var(--ink)]">
                  VOD – Venice Open Data
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-3)] block -mt-0.5">
                  {t('ui.layersPage.tracciamentoFontiIstituzionaliApiLive')}
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
              /layers
            </span>
          </div>

          {/* Navigation links & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--rule)]/60 hover:bg-[var(--rule)] transition-all cursor-pointer border border-[var(--rule)]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.metricsPage.navMap')}</span>
            </Link>

            <Link
              href="/layers"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{layersNav}</span>
            </Link>

            <Link
              href="/metrics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--rule)]/60 hover:bg-[var(--rule)] transition-all cursor-pointer border border-[var(--rule)]"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.metricsPage.navMetrics')}</span>
            </Link>

            <Link
              href="/sources"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--rule)]/60 hover:bg-[var(--rule)] transition-all cursor-pointer border border-[var(--rule)]"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('ui.metricsPage.navSources')}</span>
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
              title={t('ui.layersPage.switchLanguage')}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Hero Explanation Banner */}
        <section className="glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/20 shadow-xl flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold w-max border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.layersPage.documentazioneDataLineageUfficiale')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              {t('ui.layersPage.comeFunzionanoIDatiGeospaziali')}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.heroBody')}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full md:w-auto shrink-0 font-mono text-center">
            <div className="p-3 rounded-2xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col">
              <span className="text-2xl font-bold text-[var(--ink)]">{totalLayers}</span>
              <span className="text-[10px] text-[var(--ink-3)] uppercase">{t('ui.layersPage.livelliTotali')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">{realtimeLayers}</span>
              <span className="text-[10px] text-emerald-300 uppercase">{t('ui.layersPage.tempoReale')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col">
              <span className="text-2xl font-bold text-amber-400">{simulatedLayers}</span>
              <span className="text-[10px] text-amber-300 uppercase">{t('ui.layersPage.digitalTwin')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col">
              <span className="text-2xl font-bold text-sky-400">{staticLayers}</span>
              <span className="text-[10px] text-sky-300 uppercase">{t('ui.layersPage.censimento')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col">
              <span className="text-2xl font-bold text-orange-400">{curatedLayers}</span>
              <span className="text-[10px] text-orange-300 uppercase">{t('ui.layersPage.curato')}</span>
            </div>
          </div>
        </section>

        {/* Legend Guide Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
              <Radio className="w-4 h-4 shrink-0 motion-safe:animate-pulse" />
              <span>{t('ui.layersPage.tempoRealeGenuinoSensori')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.datiIdrometriciAtmosfericiMariniMisurati')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.simulatoDigitalTwinOrariUfficiali')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.posizionamentoDeterministicoSincronizzat')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-sky-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase font-mono">
              <Database className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.censimentoStaticoOpenData')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.registriCartograficiPatrimonialiCertific')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-orange-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase font-mono">
              <Info className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.curatoLegendTitle')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.curatoLegendBody')}
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
                  t('ui.layersPage.cercaNomeIstituzioneEsActv')
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)] self-end sm:self-auto">
              <span>{t('ui.layersPage.risultatiTrovati')}</span>
              <strong className="text-cyan-400 font-bold text-sm">{filteredLayers.length}</strong>
              <span>/ {totalLayers}</span>
            </div>
          </div>

          {/* Bottom row: Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
            {/* Filter by Group */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {t('ui.layersPage.gruppo')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tuttiIGruppi') },
                { key: 'mobility', label: t('ui.layersPage.n1Mobilita') },
                { key: 'lagoon', label: t('ui.layersPage.n2Laguna') },
                { key: 'city', label: t('ui.layersPage.n3Citta') }
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
                {t('ui.layersPage.regime')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tutti') },
                { key: 'realtime', label: t('ui.layersPage.tempoReale2') },
                { key: 'simulated', label: t('ui.layersPage.digitalTwin') },
                { key: 'static', label: t('ui.layersPage.censimento') },
                { key: 'curated', label: t('ui.layersPage.curato') }
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
                {t('ui.layersPage.acquisizione')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tutte') },
                { key: 'api', label: t('ui.layersPage.acqApi') },
                { key: 'local', label: t('ui.layersPage.localeCache') }
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
                {t('ui.layersPage.nessunLivelloCorrispondeAiFiltri')}
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
                {t('ui.layersPage.reimpostaTuttiIFiltri')}
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
                        {t(`ui.layersPage.group_${layer.group}`)}
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
                          : layer.regime === 'curated'
                            ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${layer.regime === 'realtime'
                          ? 'bg-emerald-400 motion-safe:animate-pulse'
                          : layer.regime === 'simulated'
                            ? 'bg-amber-400'
                            : layer.regime === 'curated'
                              ? 'bg-orange-400'
                              : 'bg-sky-400'
                          }`}
                      />
                      {t(`ui.layersPage.regime_${layer.regime}`)}
                    </span>

                    {/* Acquisition Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)] flex items-center gap-1.5">
                      {layer.acquisition === 'api' ? (
                        <>
                          <Radio className="w-3 h-3 text-cyan-400" />
                          <span>{t('ui.layersPage.acqApi')}</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3 h-3 text-[var(--ink-3)]" />
                          <span>{t('ui.layersPage.localeCache')}</span>
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
                    {t('ui.layersPage.elaborazioneTecnicaTrasparenza')}
                  </span>
                  <p className="text-[var(--ink-2)] leading-relaxed font-sans">
                    {language === 'it' ? layer.technicalNotesIt : layer.technicalNotesEn}
                  </p>
                </div>

                {/* Provenienza e aggiornamento */}
                <div className="p-3 rounded-xl bg-[var(--ground)]/60 border border-[var(--rule)] flex flex-col gap-1 text-[11px]">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    {t('ui.layersPage.aggiornamento')}
                  </span>
                  <p className="text-[var(--ink-2)] leading-relaxed">{t(`ui.layersPage.prov_${layer.regime}`)}</p>
                </div>

                {/* Footer: Source link & Endpoint */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ink-3)] font-mono">{t('ui.layersPage.enteFonte')}</span>
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
                    <span>{t('ui.layersPage.target')}</span>
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
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>{t('ui.metricsPage.footer')}</p>
          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <Link href="/" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navMap')}</Link>
            <Link href="/layers" className="hover:text-cyan-400 transition-colors">{layersNav}</Link>
            <Link href="/metrics" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navMetrics')}</Link>
            <Link href="/sources" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navSources')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
