"""
Funzioni comuni agli orari dei bus letti dai PDF degli operatori (ATVO, Dolomiti Bus).

- percorso stradale fra le fermate dal router OSRM (dati OpenStreetMap, ODbL): una sola richiesta per linea e
  solo quando il PDF cambia;
- festività nazionali italiane, per le corse «feriali» e «festive»;
- corse nel formato di FlixBus (secondi UTC dalla mezzanotte UTC della data, date UTC), così mappa e planner le
  leggono con lo stesso codice.
"""
from __future__ import annotations

import json
import math
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from vod_http import fetch_bytes

ROME = ZoneInfo("Europe/Rome")
OSRM = "https://router.project-osrm.org/route/v1/driving/"


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distanza in metri fra (lat, lon)"""
    (la1, lo1), (la2, lo2) = a, b
    p1, p2 = math.radians(la1), math.radians(la2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def road_shape(stops: list[tuple[float, float]]) -> tuple[list[list[float]], list[float]]:
    """
    Percorso stradale per le fermate (lat, lon) in ordine: [[lon, lat, distanza progressiva m], ...] e la
    distanza di ogni fermata sul percorso. Se il router non risponde: segmenti diretti fra le fermate.
    """
    coords = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in stops)
    try:
        res = json.loads(fetch_bytes(f"{OSRM}{coords}", params={"overview": "full", "geometries": "geojson", "steps": "false"}, timeout=60, retries=2))
        route = res["routes"][0]
        line = route["geometry"]["coordinates"]
        legs = [leg["distance"] for leg in route["legs"]]
    except Exception:  # noqa: BLE001 - senza router il percorso resta indicativo
        line = [[lon, lat] for lat, lon in stops]
        legs = [haversine(stops[i - 1], stops[i]) for i in range(1, len(stops))]
    shape, total = [], 0.0
    for i, (lon, lat) in enumerate(line):
        if i:
            total += haversine((line[i - 1][1], line[i - 1][0]), (lat, lon))
        shape.append([round(lon, 6), round(lat, 6), round(total)])
    # distanze delle fermate in proporzione alla lunghezza delle tratte del router
    scale = total / sum(legs) if sum(legs) else 1
    at, acc = [0.0], 0.0
    for d in legs:
        acc += d * scale
        at.append(acc)
    return simplify(shape), at


# riquadro della mappa (lon min, lat min, lon max, lat max), lo stesso di web/src/lib/simulation-data.ts
FRAME = (12.135, 45.205, 12.47, 45.555)


def simplify(shape: list[list[float]], in_frame_m: float = 60, outside_m: float = 1500) -> list[list[float]]:
    """
    Toglie i punti troppo vicini al precedente: dettaglio pieno dentro la mappa, dove il bus si vede, e un punto
    ogni outside_m fuori, dove serve solo la distanza percorsa.
    """
    inside = lambda p: FRAME[0] <= p[0] <= FRAME[2] and FRAME[1] <= p[1] <= FRAME[3]  # noqa: E731
    out = [shape[0]]
    for p in shape[1:-1]:
        if p[2] - out[-1][2] >= (in_frame_m if inside(p) or inside(out[-1]) else outside_m):
            out.append(p)
    out.append(shape[-1])
    return out


def easter(y: int) -> date:
    a, b, c = y % 19, y // 100, y % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7  # noqa: E741
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return date(y, month, day)


def italian_holiday(d: date) -> bool:
    """Festività nazionali (più il patrono di Venezia, San Marco, che coincide con il 25 aprile)"""
    fixed = {(1, 1), (6, 1), (25, 4), (1, 5), (2, 6), (15, 8), (1, 11), (8, 12), (25, 12), (26, 12)}
    return (d.day, d.month) in fixed or d == easter(d.year) + timedelta(days=1)


def is_festive(d: date) -> bool:
    """Domenica o festivo: per le corse «F»"""
    return d.weekday() == 6 or italian_holiday(d)


def utc_trips(base: dict, stops_local: list[tuple[float, str, bool, int]], dates: list[date]) -> list[dict]:
    """
    Corse in UTC per le date indicate. stops_local: (distanza m, nome, fermata veneziana, secondi locali).
    Le date si raggruppano per offset (ora solare/legale): una corsa per gruppo.
    """
    groups: dict[int, list[str]] = {}
    for d in dates:
        off = int(datetime(d.year, d.month, d.day, 12, tzinfo=ROME).utcoffset().total_seconds())
        groups.setdefault(off, []).append(d.strftime("%Y%m%d"))
    out = []
    for off, ymds in sorted(groups.items()):
        stops = [[round(dist), s - off, s - off, name, venice] for dist, name, venice, s in stops_local]
        out.append({**base, "id": f"{base['id']}-{off // 3600}", "start": stops[0][1], "end": stops[-1][1], "dates": ymds, "stops": stops})
    return out
