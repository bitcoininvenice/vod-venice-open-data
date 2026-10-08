-- ============================================================================
-- VOD: Venice Open Data - Database Initialization & Schema
-- PostgreSQL 16 + PostGIS 3.4
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ----------------------------------------------------------------------------
-- 1. ACTV GTFS Core Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agency (
    agency_id VARCHAR(50) PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    agency_url VARCHAR(255),
    agency_timezone VARCHAR(50) DEFAULT 'Europe/Rome',
    agency_lang VARCHAR(10) DEFAULT 'it',
    agency_phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY,
    agency_id VARCHAR(50) REFERENCES agency(agency_id) ON DELETE SET NULL,
    route_short_name VARCHAR(50) NOT NULL,
    route_long_name VARCHAR(255),
    route_desc TEXT,
    route_type INT NOT NULL, -- 0: Tram, 3: Bus, 4: Ferry/Vaporetto/Battello
    route_url VARCHAR(255),
    route_color VARCHAR(10) DEFAULT '#0088cc',
    route_text_color VARCHAR(10) DEFAULT '#ffffff',
    mode_category VARCHAR(50) DEFAULT 'vaporetto' -- vaporetto, motoscafo, motonave, ferry, tram, bus, island
);

CREATE TABLE IF NOT EXISTS calendar (
    service_id VARCHAR(50) PRIMARY KEY,
    monday SMALLINT NOT NULL,
    tuesday SMALLINT NOT NULL,
    wednesday SMALLINT NOT NULL,
    thursday SMALLINT NOT NULL,
    friday SMALLINT NOT NULL,
    saturday SMALLINT NOT NULL,
    sunday SMALLINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_dates (
    service_id VARCHAR(50),
    date DATE NOT NULL,
    exception_type SMALLINT NOT NULL, -- 1: aggiunto, 2: rimosso
    PRIMARY KEY (service_id, date)
);

CREATE TABLE IF NOT EXISTS shapes (
    shape_id VARCHAR(100) PRIMARY KEY,
    point_count INT DEFAULT 0,
    length_meters NUMERIC(10, 2),
    geom GEOMETRY(LineString, 4326)
);

CREATE TABLE IF NOT EXISTS trips (
    trip_id VARCHAR(100) PRIMARY KEY,
    route_id VARCHAR(50) REFERENCES routes(route_id) ON DELETE CASCADE,
    service_id VARCHAR(50),
    trip_headsign VARCHAR(255),
    trip_short_name VARCHAR(100),
    direction_id SMALLINT,
    block_id VARCHAR(100),
    shape_id VARCHAR(100) REFERENCES shapes(shape_id) ON DELETE SET NULL,
    wheelchair_accessible SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    stop_code VARCHAR(50),
    stop_name VARCHAR(255) NOT NULL,
    stop_desc TEXT,
    stop_lat DOUBLE PRECISION NOT NULL,
    stop_lon DOUBLE PRECISION NOT NULL,
    zone_id VARCHAR(50),
    stop_url VARCHAR(255),
    location_type SMALLINT DEFAULT 0,
    parent_station VARCHAR(50),
    wheelchair_boarding SMALLINT DEFAULT 0,
    transport_mode VARCHAR(50) DEFAULT 'navigazione', -- navigazione, bus, tram
    geom GEOMETRY(Point, 4326)
);

CREATE TABLE IF NOT EXISTS stop_times (
    trip_id VARCHAR(100) REFERENCES trips(trip_id) ON DELETE CASCADE,
    arrival_time VARCHAR(10) NOT NULL,
    departure_time VARCHAR(10) NOT NULL,
    arrival_seconds INT,   -- Secondi da mezzanotte (supporta > 86400 per corse notturne)
    departure_seconds INT,
    stop_id VARCHAR(50) REFERENCES stops(stop_id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    stop_headsign VARCHAR(255),
    pickup_type SMALLINT DEFAULT 0,
    drop_off_type SMALLINT DEFAULT 0,
    shape_dist_traveled DOUBLE PRECISION,
    PRIMARY KEY (trip_id, stop_sequence)
);

-- ----------------------------------------------------------------------------
-- 2. Comune di Venezia - Open Data Georeferenziati
-- ----------------------------------------------------------------------------

-- Cantieri stradali, acquei e opere pubbliche
CREATE TABLE IF NOT EXISTS comune_cantieri (
    id SERIAL PRIMARY KEY,
    codice VARCHAR(50) UNIQUE,
    titolo VARCHAR(255) NOT NULL,
    localizzazione VARCHAR(255) NOT NULL,
    quartiere VARCHAR(100), -- San Marco, Cannaregio, Castello, Dorsoduro, Mestre Centro, Marghera, Lido, ecc.
    tipologia VARCHAR(100) NOT NULL, -- 'Manutenzione Pontili', 'Scavo Canali/Fango', 'Manutenzione Rive', 'Opere Stradali', 'Sottoservizi'
    stato VARCHAR(50) NOT NULL DEFAULT 'In corso', -- 'Programmato', 'In corso', 'Concluso'
    data_inizio DATE NOT NULL,
    data_fine_prevista DATE NOT NULL,
    importo_lavori NUMERIC(12, 2) DEFAULT 0,
    ente_responsabile VARCHAR(150) DEFAULT 'Comune di Venezia - LL.PP.',
    impatto_mobilita VARCHAR(50) DEFAULT 'Medio', -- 'Basso', 'Medio', 'Critico'
    dettagli TEXT,
    geom GEOMETRY(Geometry, 4326) NOT NULL
);

-- Occupazione Suolo Pubblico (dehors, ponteggi edili, manifestazioni)
CREATE TABLE IF NOT EXISTS comune_occupazione_suolo (
    id SERIAL PRIMARY KEY,
    protocollo VARCHAR(50) UNIQUE,
    richiedente VARCHAR(255),
    motivo VARCHAR(255) NOT NULL,
    data_inizio DATE NOT NULL,
    data_fine DATE NOT NULL,
    superficie_mq NUMERIC(8, 2) DEFAULT 0,
    canale_o_via VARCHAR(255),
    geom GEOMETRY(Point, 4326) NOT NULL
);

-- Hub intermodali, punti di interesse lagunari e pontili
CREATE TABLE IF NOT EXISTS comune_punti_interesse (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- 'Pontile Principale', 'Stazione Ferroviaria', 'Terminal Bus', 'Terminal Crociere', 'Parcheggio Scambiatore'
    descrizione TEXT,
    accessibilita_prm BOOLEAN DEFAULT TRUE,
    geom GEOMETRY(Point, 4326) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. ACTV GTFS-RT (Real-Time Vehicle Positions & Trip Updates)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gtfs_rt_vehicle_positions (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(100),
    route_id VARCHAR(50),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bearing DOUBLE PRECISION DEFAULT 0,
    speed_kmh DOUBLE PRECISION DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_status VARCHAR(50), -- 'INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO'
    geom GEOMETRY(Point, 4326)
);

CREATE TABLE IF NOT EXISTS gtfs_rt_trip_updates (
    id SERIAL PRIMARY KEY,
    trip_id VARCHAR(100) NOT NULL,
    route_id VARCHAR(50),
    stop_id VARCHAR(50),
    delay_seconds INT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. Indici Spaziali e B-Tree Ottimizzati
-- ----------------------------------------------------------------------------

-- Indici Spaziali GiST
CREATE INDEX IF NOT EXISTS idx_stops_geom ON stops USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_shapes_geom ON shapes USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_cantieri_geom ON comune_cantieri USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_occupazione_geom ON comune_occupazione_suolo USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_rt_vehicles_geom ON gtfs_rt_vehicle_positions USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_poi_geom ON comune_punti_interesse USING GIST(geom);

-- Indici funzionali su geography: le query di prossimità usano ST_DWithin(geom::geography, ...)
-- e senza questi indici il cast impedirebbe l'uso degli indici GiST su geometry.
CREATE INDEX IF NOT EXISTS idx_stops_geog ON stops USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS idx_cantieri_geog ON comune_cantieri USING GIST ((geom::geography));

-- Indici Relazionali GTFS
CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_dep ON stop_times(departure_seconds);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_service ON trips(service_id);
CREATE INDEX IF NOT EXISTS idx_trips_shape ON trips(shape_id);
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(route_type);
CREATE INDEX IF NOT EXISTS idx_routes_mode ON routes(mode_category);
