#!/usr/bin/env python3
"""
Venice Open Data (VOD) - command-line access to the public dataset API.

No dependencies (Python 3.9+). Same data and filters as the VOD MCP server.

  python vod.py datasets
  python vod.py query <dataset> [--text TEXT] [--near LAT,LON] [--radius M] [--limit N] [--offset N]
  python vod.py place <name>
  python vod.py health

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


def main(argv: list[str] | None = None) -> int:
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
    args = parser.parse_args(argv)

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
