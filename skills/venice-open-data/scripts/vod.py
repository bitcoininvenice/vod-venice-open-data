#!/usr/bin/env python3
"""
Venice Open Data (VOD) - command-line access to the public dataset API.

No dependencies (Python 3.9+). Same data and filters as the VOD MCP server.

  python vod.py datasets
  python vod.py query <dataset> [--text TEXT] [--near LAT,LON] [--radius M] [--limit N] [--offset N]
  python vod.py place <name>
  python vod.py health
  python vod.py route <from> <to> [--date YYYY-MM-DD] [--time HH:MM] [--mode fastest|walk|water|private] [--resident] [--tide CM]
  python vod.py departures <stop> [--date YYYY-MM-DD] [--time HH:MM] [--minutes N]
  python vod.py flood [--level CM] [--place NAME] [--from NAME --to NAME]
  python vod.py find <query>
  python vod.py airport

Set VOD_BASE_URL to use another deployment (default https://venice-open-data.vercel.app).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("VOD_BASE_URL", "https://venice-open-data.vercel.app").rstrip("/")
USER_AGENT = "VOD-skill-cli/1.0 (+https://venice-open-data.vercel.app/mcp)"
PLACES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reference", "places.md")


def get_json(path: str, params: dict | None = None, retries: int = 2) -> dict:
    query = urllib.parse.urlencode({k: v for k, v in (params or {}).items() if v is not None})
    url = f"{BASE_URL}{path}" + (f"?{query}" if query else "")
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < retries:
                wait = min(int(e.headers.get("Retry-After") or 10), 120)
                print(f"server busy ({e.code}), waiting {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            try:
                return json.loads(e.read().decode("utf-8"))
            except Exception:  # noqa: BLE001
                raise SystemExit(f"HTTP {e.code} for {url}") from e
    raise SystemExit("VOD not reachable")


def parse_near(value: str) -> tuple[float, float]:
    m = re.fullmatch(r"\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*", value or "")
    if not m:
        raise argparse.ArgumentTypeError("use LAT,LON, e.g. 45.4380,12.3358")
    return float(m.group(1)), float(m.group(2))


def load_places() -> dict[str, tuple[float, float]]:
    places = {}
    with open(PLACES_FILE, encoding="utf-8") as fh:
        for line in fh:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) == 3:
                try:
                    places[cells[0]] = (float(cells[1]), float(cells[2]))
                except ValueError:
                    continue
    return places


def find_place(name: str) -> list[tuple[str, tuple[float, float]]]:
    needle = name.lower()
    return [(k, v) for k, v in load_places().items() if needle in k.lower()]


# Strumenti di calcolo (stesso motore della mappa e del server MCP): percorso dell'API e parametri
CALC_ENDPOINTS = {"route": "/api/come-arrivare", "departures": "/api/partenze", "flood": "/api/acqua-alta", "find": "/api/luoghi", "airport": "/api/aeroporto"}


def calc_request(args: argparse.Namespace) -> tuple[str, dict]:
    """Endpoint e parametri per i comandi route, departures, flood, find e airport."""
    if args.cmd == "route":
        params = {"from": args.origin, "to": args.destination, "date": args.date, "time": args.time, "mode": args.mode, "tideCm": args.tide}
        if args.resident:
            params["resident"] = "1"
    elif args.cmd == "departures":
        params = {"stop": args.stop, "date": args.date, "time": args.time, "minutes": args.minutes}
    elif args.cmd == "flood":
        params = {"levelCm": args.level, "place": args.place, "from": args.origin, "to": args.destination}
    elif args.cmd == "find":
        params = {"q": args.query}
    else:
        params = {}
    return CALC_ENDPOINTS[args.cmd], {k: v for k, v in params.items() if v is not None}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Venice Open Data CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("datasets", help="list datasets")
    q = sub.add_parser("query", help="query a dataset")
    q.add_argument("dataset")
    q.add_argument("--text")
    q.add_argument("--near", type=parse_near, help="LAT,LON")
    q.add_argument("--radius", type=int, default=500)
    q.add_argument("--limit", type=int, default=10)
    q.add_argument("--offset", type=int, default=0)
    p = sub.add_parser("place", help="coordinates of a known place")
    p.add_argument("name")
    sub.add_parser("health", help="status of every source")
    r = sub.add_parser("route", help="how to get from A to B (all ACTV and Alilaguna services, walking, own boat)")
    r.add_argument("origin", help="stop, address, house number (Cannaregio 3450), 'airport' or LAT,LON")
    r.add_argument("destination")
    r.add_argument("--date", help="YYYY-MM-DD (Venice time), default today")
    r.add_argument("--time", help="HH:MM (Venice time), default now")
    r.add_argument("--mode", choices=["fastest", "walk", "water", "private"], default="fastest")
    r.add_argument("--resident", action="store_true", help="private boat: resident or water-space concession holder")
    r.add_argument("--tide", type=int, help="simulated tide level in cm")
    d = sub.add_parser("departures", help="next departures from a stop (ACTV and Alilaguna timetables)")
    d.add_argument("stop")
    d.add_argument("--date")
    d.add_argument("--time")
    d.add_argument("--minutes", type=int, default=90)
    f = sub.add_parser("flood", help="acqua alta simulation: flooded city, a place, a dry walking route")
    f.add_argument("--level", type=int, help="tide level in cm (default: measured now)")
    f.add_argument("--place")
    f.add_argument("--from", dest="origin")
    f.add_argument("--to", dest="destination")
    fi = sub.add_parser("find", help="how VOD recognises a place, and similar stops")
    fi.add_argument("query")
    sub.add_parser("airport", help="bus, Alilaguna and FlixBus at Marco Polo airport in the next 90 minutes")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.cmd in CALC_ENDPOINTS:
        path, params = calc_request(args)
        data = get_json(path, params)
        print(json.dumps(data, ensure_ascii=False, indent=1))
        return 0 if data.get("success", True) else 1

    if args.cmd == "datasets":
        data = get_json("/api/datasets")
        out = [{k: d[k] for k in ("id", "title", "kind", "source", "license", "geo", "caveat")} for d in data.get("datasets", [])]
        print(json.dumps({"datasets": out, "relatedServices": data.get("relatedServices", [])}, ensure_ascii=False, indent=1))
    elif args.cmd == "query":
        params = {"text": args.text, "limit": args.limit, "offset": args.offset}
        if args.near:
            params.update({"lat": args.near[0], "lon": args.near[1], "radius": args.radius})
        print(json.dumps(get_json(f"/api/datasets/{urllib.parse.quote(args.dataset)}", params), ensure_ascii=False, indent=1))
    elif args.cmd == "place":
        matches = find_place(args.name)
        print(json.dumps([{"place": k, "lat": v[0], "lon": v[1]} for k, v in matches], ensure_ascii=False, indent=1))
        return 0 if matches else 1
    elif args.cmd == "health":
        data = get_json("/api/health")
        print(json.dumps({"status": data.get("status"), "sources": [{k: s.get(k) for k in ("id", "name", "status", "ageMinutes")} for s in data.get("sources", [])]}, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
