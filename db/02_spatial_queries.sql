-- ============================================================================
-- VOD: Venice Open Data - Spatial Analysis Functions & Views
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Query Spaziale: fermate ACTV entro un raggio dalle opere pubbliche localizzate
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_stops_near_cantieri(buffer_meters DOUBLE PRECISION DEFAULT 200.0)
RETURNS TABLE (
    stop_id VARCHAR(50),
    stop_name VARCHAR(255),
    transport_mode VARCHAR(50),
    stop_lat DOUBLE PRECISION,
    stop_lon DOUBLE PRECISION,
    cantiere_id INT,
    cantiere_titolo VARCHAR(255),
    cantiere_tipologia VARCHAR(100),
    cantiere_categoria VARCHAR(100),
    cantiere_stato VARCHAR(50),
    distanza_metri DOUBLE PRECISION,
    stop_geom_geojson TEXT,
    cantiere_geom_geojson TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stop_id,
        s.stop_name,
        s.transport_mode,
        s.stop_lat,
        s.stop_lon,
        c.id AS cantiere_id,
        c.titolo AS cantiere_titolo,
        c.tipologia AS cantiere_tipologia,
        c.categoria AS cantiere_categoria,
        c.stato AS cantiere_stato,
        ROUND(ST_Distance(s.geom::geography, c.geom::geography)::numeric, 1)::double precision AS distanza_metri,
        ST_AsGeoJSON(s.geom) AS stop_geom_geojson,
        ST_AsGeoJSON(c.geom) AS cantiere_geom_geojson
    FROM stops s
    JOIN comune_cantieri c 
      ON ST_DWithin(s.geom::geography, c.geom::geography, buffer_meters)
    ORDER BY distanza_metri ASC;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. View: GeoJSON Percorsi ACTV
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW view_routes_geojson AS
SELECT 
    r.route_id,
    r.route_short_name,
    r.route_long_name,
    r.route_type,
    r.route_color,
    r.route_text_color,
    r.mode_category,
    s.shape_id,
    ST_AsGeoJSON(s.geom)::json AS geometry
FROM routes r
JOIN trips t ON t.route_id = r.route_id
JOIN shapes s ON s.shape_id = t.shape_id
GROUP BY r.route_id, r.route_short_name, r.route_long_name, r.route_type, 
         r.route_color, r.route_text_color, r.mode_category, s.shape_id, s.geom;

-- ----------------------------------------------------------------------------
-- 3. View: GeoJSON Fermate ACTV con Linee Servite
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW view_stops_with_routes AS
SELECT 
    s.stop_id,
    s.stop_name,
    s.transport_mode,
    s.stop_lat,
    s.stop_lon,
    ARRAY_AGG(DISTINCT r.route_short_name ORDER BY r.route_short_name) AS linee_servite,
    COUNT(DISTINCT r.route_id) AS numero_linee,
    ST_AsGeoJSON(s.geom)::json AS geometry
FROM stops s
JOIN stop_times st ON st.stop_id = s.stop_id
JOIN trips t ON t.trip_id = st.trip_id
JOIN routes r ON r.route_id = t.route_id
GROUP BY s.stop_id, s.stop_name, s.transport_mode, s.stop_lat, s.stop_lon, s.geom;

-- ----------------------------------------------------------------------------
-- 4. View: GeoJSON Cantieri Comune di Venezia
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW view_cantieri_geojson AS
SELECT 
    id,
    codice,
    titolo,
    localizzazione,
    quartiere,
    tipologia,
    stato,
    importo_lavori,
    ente_responsabile,
    categoria,
    cup,
    provvedimento,
    posizione_approssimata,
    dettagli,
    ST_AsGeoJSON(geom)::json AS geometry
FROM comune_cantieri;

-- ----------------------------------------------------------------------------
-- 5. Funzione Statistiche Generali della Piattaforma
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_routes', (SELECT COUNT(*) FROM routes),
        'routes_navigazione', (SELECT COUNT(*) FROM routes WHERE route_type = 4),
        'routes_automobilistico', (SELECT COUNT(*) FROM routes WHERE route_type IN (0, 3)),
        'total_stops', (SELECT COUNT(*) FROM stops),
        'total_trips', (SELECT COUNT(*) FROM trips),
        'active_cantieri', (SELECT COUNT(*) FROM comune_cantieri),
        'total_investment_cantieri', (SELECT COALESCE(SUM(importo_lavori), 0) FROM comune_cantieri),
        'occupazioni_attive', (SELECT COUNT(*) FROM comune_occupazione_suolo WHERE data_fine >= CURRENT_DATE),
        'stops_near_worksites_200m', (
            SELECT COUNT(DISTINCT s.stop_id) 
            FROM stops s 
            JOIN comune_cantieri c ON ST_DWithin(s.geom::geography, c.geom::geography, 200)
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
