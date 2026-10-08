#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: genera il dataset di simulazione dei mezzi ACTV dai GTFS ufficiali.

Input : pipeline/data/navigazione/*.txt e pipeline/data/automobilistico/*.txt
        (scaricati con download_gtfs.py; licenza CC BY - Open Data ACTV)
Output: - la costante `D` in web/src/lib/simulation-data.ts (le geometrie LAND e la
          configurazione CFG nello stesso file restano invariate)
        - web/src/data/actv-gtfs-index.json: linee e corse, usato per abbinare le
          posizioni GTFS-Realtime alle linee

Uso: python export_simulation_data.py [--date YYYY-MM-DD]
     La data di riferimento (default: oggi a Venezia) determina il giorno feriale;
     sabato e domenica sono i successivi.
"""

import argparse
import csv
import json
import logging
import math
import os
import re
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SIM_FILE = os.path.join(BASE_DIR, "..", "web", "src", "lib", "simulation-data.ts")
INDEX_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "actv-gtfs-index.json")

# Griglia virtuale condivisa con le geometrie LAND: non modificare senza rigenerare anche LAND.
FRAME = (12.135, 12.47, 45.205, 45.555)  # lon0, lon1, lat0, lat1
W, H = 26194, 38701
KX = W / (FRAME[1] - FRAME[0])
KY = H / (FRAME[3] - FRAME[2])

SIMPLIFY_TOLERANCE = 5.0  # unità di griglia (circa 5 m)
DAY_SECONDS = 86400
WEEKDAYS_IT = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
MONTHS_IT = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
             "agosto", "settembre", "ottobre", "novembre", "dicembre"]
FERRY_STOP_PATTERN = re.compile(r"alberoni|s(an)?\.?\s*maria del mare", re.IGNORECASE)


def read_csv(feed: str, name: str) -> list[dict]:
    path = os.path.join(DATA_DIR, feed, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def gtfs_seconds(value: str) -> int | None:
    if not value:
        return None
    h, m, s = value.strip().split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


def to_grid(lon: float, lat: float) -> tuple[float, float]:
    return (lon - FRAME[0]) * KX, (FRAME[3] - lat) * KY


def simplify(points: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    """Douglas-Peucker iterativo."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1.0
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, idx = d, i
        if best > tol and idx > 0:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, k in zip(points, keep) if k]


def cumulative(points: list[tuple[int, int]]) -> list[float]:
    cum = [0.0]
    for i in range(1, len(points)):
        cum.append(cum[-1] + math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
    return cum


def project_stops(points, cum, stops_xy) -> list[int]:
    """Distanza lungo la forma di ogni fermata, monotona crescente."""
    out = []
    seg_start = 0
    last = 0.0
    n = len(points)
    for sx, sy in stops_xy:
        best_d, best_pos, best_seg = float("inf"), last, seg_start
        for i in range(seg_start, n - 1):
            ax, ay = points[i]
            bx, by = points[i + 1]
            vx, vy = bx - ax, by - ay
            seg_len2 = vx * vx + vy * vy
            t = 0.0 if seg_len2 == 0 else max(0.0, min(1.0, ((sx - ax) * vx + (sy - ay) * vy) / seg_len2))
            px, py = ax + t * vx, ay + t * vy
            d = math.hypot(sx - px, sy - py)
            pos = cum[i] + t * math.sqrt(seg_len2)
            if d < best_d and pos >= last:
                best_d, best_pos, best_seg = d, pos, i
        last = best_pos
        seg_start = best_seg
        out.append(int(round(best_pos)))
    return out


def active_services(calendar: list[dict], calendar_dates: list[dict], day: date) -> set[str]:
    ymd = day.strftime("%Y%m%d")
    dow = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][day.weekday()]
    active = {c["service_id"] for c in calendar if c["start_date"] <= ymd <= c["end_date"] and c.get(dow) == "1"}
    for cd in calendar_dates:
        if cd["date"] != ymd:
            continue
        if cd["exception_type"] == "1":
            active.add(cd["service_id"])
        elif cd["exception_type"] == "2":
            active.discard(cd["service_id"])
    return active


def category(feed: str, route: dict, stop_names: list[str]) -> str:
    name = route["route_short_name"]
    if feed == "navigazione":
        if name == "17":
            return "ferry"
        if name == "11" and any(FERRY_STOP_PATTERN.search(s) for s in stop_names):
            return "ferry"
        return "vaporetto"
    if route["route_type"] == "0":
        return "tram"
    if route.get("route_desc") == "UL":
        return "island"
    return "bus"


def italian_label(day: date) -> str:
    return f"{WEEKDAYS_IT[day.weekday()]} {day.day} {MONTHS_IT[day.month - 1]} {day.year}"


def reference_days(start: date) -> dict[str, date]:
    weekday = start
    while weekday.weekday() >= 5:
        weekday += timedelta(days=1)
    saturday = start + timedelta(days=(5 - start.weekday()) % 7)
    sunday = start + timedelta(days=(6 - start.weekday()) % 7)
    return {"weekday": weekday, "saturday": saturday, "sunday": sunday}


class Feed:
    def __init__(self, name: str):
        self.name = name
        self.routes = {r["route_id"]: r for r in read_csv(name, "routes.txt")}
        self.trips = {t["trip_id"]: t for t in read_csv(name, "trips.txt")}
        self.stops = {s["stop_id"]: s for s in read_csv(name, "stops.txt")}
        self.calendar = read_csv(name, "calendar.txt")
        self.calendar_dates = read_csv(name, "calendar_dates.txt")
        if not self.routes or not self.trips:
            raise SystemExit(f"GTFS {name} mancante in {DATA_DIR}: eseguire prima download_gtfs.py")

        shapes: dict[str, list[tuple[int, float, float]]] = {}
        for row in read_csv(name, "shapes.txt"):
            shapes.setdefault(row["shape_id"], []).append(
                (int(row["shape_pt_sequence"]), float(row["shape_pt_lon"]), float(row["shape_pt_lat"]))
            )
        self.shapes = {sid: [(lon, lat) for _, lon, lat in sorted(pts)] for sid, pts in shapes.items()}

        self.stop_times: dict[str, list[tuple[int, str, int]]] = {}
        for row in read_csv(name, "stop_times.txt"):
            t = gtfs_seconds(row["departure_time"] or row["arrival_time"])
            if t is None:
                continue
            self.stop_times.setdefault(row["trip_id"], []).append((int(row["stop_sequence"]), row["stop_id"], t))
        for seq in self.stop_times.values():
            seq.sort()
        logging.info("%s: %d linee, %d corse, %d forme", name, len(self.routes), len(self.trips), len(self.shapes))


def build(feeds: list[Feed], days: dict[str, date]):
    shapes_out: list[list[int]] = []
    shape_index: dict[tuple, int] = {}
    shape_cache: dict[tuple, tuple[list, list]] = {}
    routes_out: list[dict] = []
    route_index: dict[tuple, int] = {}
    profiles_out: list[list] = []
    profile_index: dict[tuple, int] = {}
    trip_route: dict[str, str] = {}

    def shape_for(feed: Feed, trip: dict, stops_xy):
        key = (feed.name, trip.get("shape_id") or "", tuple(st for st in stops_xy) if not trip.get("shape_id") else None)
        if key in shape_cache:
            return shape_cache[key]
        raw = feed.shapes.get(trip.get("shape_id") or "")
        pts = [to_grid(lon, lat) for lon, lat in raw] if raw and len(raw) >= 2 else list(stops_xy)
        simplified = [(int(round(x)), int(round(y))) for x, y in simplify(pts, SIMPLIFY_TOLERANCE)]
        dedup = [simplified[0]] + [p for i, p in enumerate(simplified[1:], 1) if p != simplified[i - 1]]
        if len(dedup) < 2:
            dedup = dedup * 2
        flat = tuple(v for p in dedup for v in p)
        if flat not in shape_index:
            shape_index[flat] = len(shapes_out)
            shapes_out.append(list(flat))
        result = (shape_index[flat], dedup)
        shape_cache[key] = result
        return result

    pattern_cache: dict[tuple, tuple] = {}

    def profile_for(feed: Feed, trip_id: str):
        trip = feed.trips[trip_id]
        seq = feed.stop_times.get(trip_id)
        if not seq or len(seq) < 2:
            return None
        route = feed.routes.get(trip["route_id"])
        if not route:
            return None

        # Le corse con stessa linea, forma e sequenza di fermate condividono geometria e distanze
        pattern = (feed.name, trip["route_id"], trip.get("shape_id") or "", tuple(stop_id for _, stop_id, _ in seq))
        if pattern not in pattern_cache:
            stop_rows = [feed.stops.get(stop_id, {}) for _, stop_id, _ in seq]
            stops_xy = [to_grid(float(s.get("stop_lon") or 0), float(s.get("stop_lat") or 0)) for s in stop_rows]
            # Esclude le corse che non toccano mai l'area della mappa (tratte extraurbane lontane)
            if not any(0 <= x <= W and 0 <= y <= H for x, y in stops_xy):
                pattern_cache[pattern] = None
                return None
            cat = category(feed.name, route, [s.get("stop_name", "") for s in stop_rows])
            rkey = (route["route_short_name"], cat)
            if rkey not in route_index:
                route_index[rkey] = len(routes_out)
                routes_out.append({"n": route["route_short_name"], "c": cat})
            sidx, pts = shape_for(feed, trip, stops_xy)
            dd = project_stops(pts, cumulative(pts), stops_xy)
            pattern_cache[pattern] = (sidx, dd, cat, rkey)
        if pattern_cache[pattern] is None:
            return None
        sidx, dd, cat, rkey = pattern_cache[pattern]
        trip_route[trip_id] = f"{route['route_short_name']}|{cat}"
        t_first = seq[0][2]
        times = [t - t_first for _, _, t in seq]
        pkey = (sidx, route_index[rkey], tuple(times), tuple(dd))
        if pkey not in profile_index:
            profile_index[pkey] = len(profiles_out)
            profiles_out.append([sidx, route_index[rkey], times, dd])
        return profile_index[pkey], t_first

    days_out = {}
    for label, day in days.items():
        trips_out = []
        for feed in feeds:
            today = active_services(feed.calendar, feed.calendar_dates, day)
            yesterday = active_services(feed.calendar, feed.calendar_dates, day - timedelta(days=1))
            for trip_id, trip in feed.trips.items():
                in_today = trip["service_id"] in today
                in_yesterday = trip["service_id"] in yesterday
                if not (in_today or in_yesterday):
                    continue
                res = profile_for(feed, trip_id)
                if res is None:
                    continue
                pidx, t0 = res
                duration = profiles_out[pidx][2][-1]
                if in_today and t0 < DAY_SECONDS:
                    trips_out.append([pidx, t0])
                # Corse del giorno precedente ancora in servizio dopo mezzanotte (orari GTFS > 24:00)
                if in_yesterday and t0 + duration > DAY_SECONDS:
                    trips_out.append([pidx, t0 - DAY_SECONDS])
        trips_out.sort(key=lambda t: (t[1], t[0]))
        days_out[label] = {"trips": trips_out}
        logging.info("%s (%s): %d corse", label, day.isoformat(), len(trips_out))

    data = {
        "W": W,
        "H": H,
        "frame": list(FRAME),
        "shapes": shapes_out,
        "routes": routes_out,
        "profiles": profiles_out,
        "days": days_out,
    }
    return data, trip_route


def replace_const(content: str, name: str, value) -> str:
    start = content.index(f"export const {name} = ")
    end = content.index("\n", start)
    line = f"export const {name} = " + json.dumps(value, separators=(",", ":"), ensure_ascii=False) + ";"
    return content[:start] + line + content[end:]


def write_simulation(data: dict, days: dict[str, date]) -> None:
    with open(SIM_FILE, encoding="utf-8") as f:
        content = f.read()
    content = replace_const(content, "D", data)
    # CFG.dates riporta le date di riferimento usate per ciascun tipo di giorno
    cfg_start = content.index("export const CFG = ") + len("export const CFG = ")
    cfg_end = content.index("\n", cfg_start)
    cfg = json.loads(content[cfg_start:cfg_end].rstrip(";"))
    cfg["dates"] = {k: italian_label(v) for k, v in days.items()}
    content = replace_const(content, "CFG", cfg)
    with open(SIM_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    logging.info("Aggiornato %s (%d KB)", os.path.relpath(SIM_FILE, BASE_DIR), os.path.getsize(SIM_FILE) // 1024)


def write_index(feeds: list[Feed], trip_route: dict[str, str], generated_for: dict[str, date]) -> None:
    # Le corse GTFS-RT usano lo stesso suffisso numerico del GTFS statico ma a volte un prefisso diverso
    # (es. statico NAV_ACTV_653_5134, realtime AUT_ACTV_653_5134): l'indice usa il suffisso "653_5134".
    trips = {}
    for trip_id, value in trip_route.items():
        m = re.search(r"(\d+_\d+)$", trip_id)
        if m:
            trips[m.group(1)] = value
    routes = {}
    for feed in feeds:
        for r in feed.routes.values():
            routes[r["route_id"]] = {
                "n": r["route_short_name"],
                "long": r["route_long_name"],
                "color": f"#{r['route_color']}" if r.get("route_color") else None,
            }
    out = {
        "generatedAt": datetime.now(ZoneInfo("Europe/Rome")).isoformat(timespec="seconds"),
        "referenceDays": {k: v.isoformat() for k, v in generated_for.items()},
        "license": "Open Data ACTV (CC BY) - fonte: ACTV S.p.A. / AVM S.p.A.",
        "routes": routes,
        "trips": dict(sorted(trips.items())),
    }
    os.makedirs(os.path.dirname(INDEX_FILE), exist_ok=True)
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    logging.info("Scritto %s (%d corse indicizzate)", os.path.relpath(INDEX_FILE, BASE_DIR), len(trips))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Data di riferimento YYYY-MM-DD (default: oggi a Venezia)")
    args = parser.parse_args()
    start = date.fromisoformat(args.date) if args.date else datetime.now(ZoneInfo("Europe/Rome")).date()

    feeds = [Feed("navigazione"), Feed("automobilistico")]
    days = reference_days(start)
    data, trip_route = build(feeds, days)
    write_simulation(data, days)
    write_index(feeds, trip_route, days)
    return 0


if __name__ == "__main__":
    sys.exit(main())
