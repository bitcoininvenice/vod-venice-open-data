#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: Ingest ACTV GTFS files into PostgreSQL + PostGIS
"""

import os
import csv
import logging

from vod_common import connect
from psycopg2.extras import execute_batch, execute_values

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

def determine_mode_category(route_short_name: str, route_type: int) -> str:
    r_type = int(route_type)
    name = (route_short_name or "").strip()
    
    if r_type == 0:
        return "tram"
    elif r_type == 4:
        if name in ["11", "12", "13", "14", "15", "22", "NLN"]:
            return "motonave"
        elif name in ["3", "4.1", "4.2", "5.1", "5.2", "6"]:
            return "motoscafo"
        elif name in ["17", "FERRY"]:
            return "ferry"
        return "vaporetto"
    elif r_type == 3:
        if name in ["11", "V", "N", "A", "C", "CO"] or "LIDO" in name.upper():
            return "island"
        return "bus"
    return "bus"

def time_to_seconds(time_str: str) -> int:
    if not time_str:
        return 0
    parts = time_str.strip().split(":")
    if len(parts) != 3:
        return 0
    try:
        h, m, s = int(parts[0]), int(parts[1]), int(parts[2])
        return h * 3600 + m * 60 + s
    except ValueError:
        return 0

def import_folder(conn, folder_path: str, mode_label: str):
    logging.info(f"--- Ingesting {mode_label} from {folder_path} ---")
    if not os.path.isdir(folder_path):
        logging.warning(f"Directory {folder_path} does not exist, skipping.")
        return

    cur = conn.cursor()

    # 1. agency.txt
    agency_file = os.path.join(folder_path, "agency.txt")
    if os.path.exists(agency_file):
        with open(agency_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            agencies = []
            for row in reader:
                agencies.append((
                    row.get("agency_id", "ACTV"),
                    row.get("agency_name", "ACTV S.p.A."),
                    row.get("agency_url", "http://www.actv.it"),
                    row.get("agency_timezone", "Europe/Rome"),
                    row.get("agency_lang", "it"),
                    row.get("agency_phone", "")
                ))
            if agencies:
                execute_values(
                    cur,
                    """INSERT INTO agency (agency_id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone)
                       VALUES %s ON CONFLICT (agency_id) DO NOTHING""",
                    agencies
                )
                logging.info(f"Imported {len(agencies)} agencies.")

    # 2. routes.txt
    routes_file = os.path.join(folder_path, "routes.txt")
    if os.path.exists(routes_file):
        with open(routes_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            routes = []
            for row in reader:
                r_type = int(row.get("route_type", 3))
                r_short = row.get("route_short_name", "")
                cat = determine_mode_category(r_short, r_type)
                color = row.get("route_color", "")
                if color and not color.startswith("#"):
                    color = "#" + color
                routes.append((
                    row.get("route_id"),
                    row.get("agency_id", "ACTV"),
                    r_short,
                    row.get("route_long_name", ""),
                    row.get("route_desc", ""),
                    r_type,
                    row.get("route_url", ""),
                    color or "#0088cc",
                    row.get("route_text_color", "#ffffff"),
                    cat
                ))
            if routes:
                execute_values(
                    cur,
                    """INSERT INTO routes (route_id, agency_id, route_short_name, route_long_name, route_desc, 
                                           route_type, route_url, route_color, route_text_color, mode_category)
                       VALUES %s ON CONFLICT (route_id) DO UPDATE SET
                         route_short_name = EXCLUDED.route_short_name,
                         route_long_name = EXCLUDED.route_long_name,
                         route_color = EXCLUDED.route_color,
                         mode_category = EXCLUDED.mode_category""",
                    routes
                )
                logging.info(f"Imported {len(routes)} routes.")

    # 3. calendar.txt
    calendar_file = os.path.join(folder_path, "calendar.txt")
    if os.path.exists(calendar_file):
        with open(calendar_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            cals = []
            for row in reader:
                cals.append((
                    row.get("service_id"),
                    int(row.get("monday", 0)),
                    int(row.get("tuesday", 0)),
                    int(row.get("wednesday", 0)),
                    int(row.get("thursday", 0)),
                    int(row.get("friday", 0)),
                    int(row.get("saturday", 0)),
                    int(row.get("sunday", 0)),
                    row.get("start_date"),
                    row.get("end_date")
                ))
            if cals:
                execute_values(
                    cur,
                    """INSERT INTO calendar (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
                       VALUES %s ON CONFLICT (service_id) DO NOTHING""",
                    cals
                )
                logging.info(f"Imported {len(cals)} calendar service entries.")

    # 4. shapes.txt (grouped into LineStrings)
    shapes_file = os.path.join(folder_path, "shapes.txt")
    if os.path.exists(shapes_file):
        logging.info("Reading shapes points and building geometries...")
        shape_points = {}
        with open(shapes_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row.get("shape_id")
                if sid not in shape_points:
                    shape_points[sid] = []
                try:
                    seq = int(row.get("shape_pt_sequence", 0))
                    lat = float(row.get("shape_pt_lat", 0))
                    lon = float(row.get("shape_pt_lon", 0))
                    shape_points[sid].append((seq, lon, lat))
                except ValueError:
                    continue

        shapes_to_insert = []
        for sid, pts in shape_points.items():
            pts.sort(key=lambda x: x[0])
            if len(pts) >= 2:
                wkt_coords = ", ".join(f"{lon} {lat}" for _, lon, lat in pts)
                wkt_linestring = f"SRID=4326;LINESTRING({wkt_coords})"
                shapes_to_insert.append((sid, len(pts), wkt_linestring))

        if shapes_to_insert:
            execute_batch(
                cur,
                """INSERT INTO shapes (shape_id, point_count, geom)
                   VALUES (%s, %s, ST_GeomFromEWKT(%s))
                   ON CONFLICT (shape_id) DO UPDATE SET geom = EXCLUDED.geom""",
                shapes_to_insert,
                page_size=500
            )
            logging.info(f"Imported {len(shapes_to_insert)} shapes as PostGIS LineStrings.")

    # 5. trips.txt
    trips_file = os.path.join(folder_path, "trips.txt")
    if os.path.exists(trips_file):
        with open(trips_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            trips = []
            for row in reader:
                trips.append((
                    row.get("trip_id"),
                    row.get("route_id"),
                    row.get("service_id"),
                    row.get("trip_headsign", ""),
                    row.get("trip_short_name", ""),
                    int(row.get("direction_id", 0)) if row.get("direction_id") else 0,
                    row.get("block_id", ""),
                    row.get("shape_id", None),
                    int(row.get("wheelchair_accessible", 0)) if row.get("wheelchair_accessible") else 0
                ))
            if trips:
                execute_values(
                    cur,
                    """INSERT INTO trips (trip_id, route_id, service_id, trip_headsign, trip_short_name, 
                                          direction_id, block_id, shape_id, wheelchair_accessible)
                       VALUES %s ON CONFLICT (trip_id) DO NOTHING""",
                    trips,
                    page_size=1000
                )
                logging.info(f"Imported {len(trips)} trips.")

    # 6. stops.txt
    stops_file = os.path.join(folder_path, "stops.txt")
    if os.path.exists(stops_file):
        with open(stops_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            stops = []
            for row in reader:
                try:
                    lat = float(row.get("stop_lat", 0))
                    lon = float(row.get("stop_lon", 0))
                except ValueError:
                    continue
                stops.append((
                    row.get("stop_id"),
                    row.get("stop_code", ""),
                    row.get("stop_name", ""),
                    row.get("stop_desc", ""),
                    lat,
                    lon,
                    row.get("zone_id", ""),
                    mode_label,
                    f"SRID=4326;POINT({lon} {lat})"
                ))
            if stops:
                execute_batch(
                    cur,
                    """INSERT INTO stops (stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, transport_mode, geom)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))
                       ON CONFLICT (stop_id) DO UPDATE SET stop_name = EXCLUDED.stop_name, geom = EXCLUDED.geom""",
                    stops,
                    page_size=500
                )
                logging.info(f"Imported {len(stops)} stops with PostGIS Points.")

    # 7. stop_times.txt
    stop_times_file = os.path.join(folder_path, "stop_times.txt")
    if os.path.exists(stop_times_file):
        with open(stop_times_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            stop_times = []
            for row in reader:
                arr = row.get("arrival_time", "")
                dep = row.get("departure_time", "")
                stop_times.append((
                    row.get("trip_id"),
                    arr,
                    dep,
                    time_to_seconds(arr),
                    time_to_seconds(dep),
                    row.get("stop_id"),
                    int(row.get("stop_sequence", 0)),
                    row.get("stop_headsign", "")
                ))
            if stop_times:
                execute_values(
                    cur,
                    """INSERT INTO stop_times (trip_id, arrival_time, departure_time, arrival_seconds, departure_seconds, 
                                              stop_id, stop_sequence, stop_headsign)
                       VALUES %s ON CONFLICT (trip_id, stop_sequence) DO NOTHING""",
                    stop_times,
                    page_size=2000
                )
                logging.info(f"Imported {len(stop_times)} stop_times.")

    conn.commit()
    cur.close()
    logging.info(f"Completed ingestion for {mode_label}.")

def main():
    conn = connect()

    import_folder(conn, os.path.join(DATA_DIR, "navigazione"), "navigazione")
    import_folder(conn, os.path.join(DATA_DIR, "automobilistico"), "automobilistico")
    conn.close()
    logging.info("All GTFS data successfully ingested into PostgreSQL / PostGIS!")

if __name__ == "__main__":
    main()
