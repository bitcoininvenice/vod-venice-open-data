#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: sincronizzazione delle posizioni reali dei mezzi dal feed GTFS-Realtime ACTV.

Se il feed non è raggiungibile lo script termina con errore senza scrivere dati:
la tabella gtfs_rt_vehicle_positions contiene solo posizioni realmente pubblicate da ACTV.
Nota: la licenza del feed realtime va confermata con AVM S.p.A. prima di un uso pubblico.
"""

import logging
import os
import sys

from google.transit import gtfs_realtime_pb2
from psycopg2.extras import execute_values

from vod_common import connect
from vod_http import fetch_bytes

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

RT_POSITION_FEEDS = {
    "navigazione": os.environ.get("GTFS_RT_NAV_POSITIONS", "https://tpl.actv.it/nav/GTFSRT/vehiclePositions"),
    "automobilistico": os.environ.get("GTFS_RT_AUT_POSITIONS", "https://tpl.actv.it/aut/GTFSRT/vehiclePositions"),
}

STATUS = {0: "INCOMING_AT", 1: "STOPPED_AT", 2: "IN_TRANSIT_TO"}


def fetch_feed(url: str) -> bytes | None:
    try:
        return fetch_bytes(url, timeout=10)
    except Exception as e:
        logging.warning("Feed non raggiungibile %s: %s", url, e)
        return None


def parse_positions(payload: bytes) -> list[tuple]:
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(payload)
    rows = []
    for entity in feed.entity:
        if not entity.HasField("vehicle") or not entity.vehicle.HasField("position"):
            continue
        v = entity.vehicle
        lat, lon = v.position.latitude, v.position.longitude
        if lat == 0 and lon == 0:
            continue
        rows.append((
            v.vehicle.id or entity.id,
            v.trip.trip_id or None,
            v.trip.route_id or None,
            lat,
            lon,
            v.position.bearing if v.position.HasField("bearing") else None,
            v.position.speed * 3.6 if v.position.HasField("speed") else None,
            STATUS.get(v.current_status) if v.HasField("current_status") else None,
            v.timestamp or None,
            lon,
            lat,
        ))
    return rows


def main() -> int:
    rows = []
    for label, url in RT_POSITION_FEEDS.items():
        payload = fetch_feed(url)
        if payload is None:
            continue
        parsed = parse_positions(payload)
        logging.info("%s: %d veicoli con posizione", label, len(parsed))
        rows.extend(parsed)

    if not rows:
        logging.error("Nessuna posizione reale disponibile: nessun dato scritto.")
        return 1

    conn = connect()
    with conn, conn.cursor() as cur:
        execute_values(
            cur,
            """INSERT INTO gtfs_rt_vehicle_positions
                 (vehicle_id, trip_id, route_id, latitude, longitude, bearing, speed_kmh, current_status, timestamp, geom)
               VALUES %s
               ON CONFLICT (vehicle_id) DO UPDATE SET
                 trip_id = EXCLUDED.trip_id,
                 route_id = EXCLUDED.route_id,
                 latitude = EXCLUDED.latitude,
                 longitude = EXCLUDED.longitude,
                 bearing = EXCLUDED.bearing,
                 speed_kmh = EXCLUDED.speed_kmh,
                 current_status = EXCLUDED.current_status,
                 timestamp = EXCLUDED.timestamp,
                 geom = EXCLUDED.geom""",
            rows,
            template="(%s, %s, %s, %s, %s, %s, %s, %s, COALESCE(to_timestamp(%s), now()), ST_SetSRID(ST_MakePoint(%s, %s), 4326))",
        )
    conn.close()
    logging.info("Aggiornate %d posizioni reali.", len(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
