"""Test delle funzioni pure della pipeline (nessun accesso a rete o database)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import zipfile  # noqa: E402

import export_simulation_data as sim  # noqa: E402
import import_arpav_air as arpav  # noqa: E402
import import_opere_pubbliche as opere  # noqa: E402
import import_osm_surveillance as osm  # noqa: E402
from download_gtfs import safe_extract  # noqa: E402
from vod_common import redact  # noqa: E402


def test_redact_hides_credentials():
    assert redact("postgresql://user:secret@db.example.com:5432/venice") == "postgresql://***@db.example.com:5432/venice"


def test_simplify_keeps_endpoints_and_drops_collinear_points():
    pts = [(0, 0), (1, 0.01), (2, 0), (3, 0)]
    out = sim.simplify(pts, 0.5)
    assert out[0] == (0, 0) and out[-1] == (3, 0)
    assert len(out) == 2


def test_project_stops_is_monotonic_along_shape():
    pts = [(0, 0), (100, 0), (100, 100)]
    cum = sim.cumulative(pts)
    dd = sim.project_stops(pts, cum, [(0, 1), (50, -2), (100, 50), (99, 100)])
    assert dd == sorted(dd)
    assert dd[0] == 0 and abs(dd[-1] - 200) <= 1


def test_active_services_applies_calendar_dates():
    from datetime import date
    calendar = [{"service_id": "S1", "start_date": "20260101", "end_date": "20261231", "thursday": "1"}]
    exceptions = [{"service_id": "S1", "date": "20261008", "exception_type": "2"},
                  {"service_id": "S2", "date": "20261008", "exception_type": "1"}]
    assert sim.active_services(calendar, exceptions, date(2026, 10, 8)) == {"S2"}
    assert sim.active_services(calendar, [], date(2026, 10, 8)) == {"S1"}


def test_category_rules():
    assert sim.category("navigazione", {"route_short_name": "17", "route_type": "4"}, []) == "ferry"
    assert sim.category("navigazione", {"route_short_name": "1", "route_type": "4"}, []) == "vaporetto"
    assert sim.category("automobilistico", {"route_short_name": "T1", "route_type": "0"}, []) == "tram"
    assert sim.category("automobilistico", {"route_short_name": "A", "route_type": "3", "route_desc": "UL"}, []) == "island"


def test_parse_amount_handles_italian_format():
    assert opere.parse_amount("788706,16") == 788706.16
    assert opere.parse_amount("1.250.000,50") == 1250000.5
    assert opere.parse_amount("220000") == 220000.0
    assert opere.parse_amount("") == 0.0


def test_place_query_uses_district_and_skips_sport_fields():
    row = {"oggetto": "RESTAURO STRUTTURALE DEL PONTE PRIULI IN CALLE RACHETTA – CANNAREGIO",
           "municipalità": "MUNICIPALITA' DI VENEZIA-MURANO-BURANO"}
    assert opere.place_query(row) == "Ponte Priuli, Cannaregio, Venezia"
    sport = {"oggetto": "RIFACIMENTO CAMPO CALCIO IN MANTO SINTETICO", "municipalità": ""}
    assert opere.place_query(sport) is None


def test_arpav_value_for_exact_year_only():
    row = {"2024 - PM2.5 media anno (μg/m3)": "17", "2025 - PM2.5 media anno (μg/m3)": "-"}
    assert arpav.value_for(row, "PM2.5 media anno (μg/m3)", 2024) == 17.0
    assert arpav.value_for(row, "PM2.5 media anno (μg/m3)", 2025) is None


def test_osm_camera_mapping():
    node = {"id": 1, "lat": 45.434, "lon": 12.338,
            "tags": {"man_made": "surveillance", "surveillance:type": "ALPR", "camera:direction": "90"}}
    cam = osm.to_camera(node)
    assert cam["type"] == "CCTV_ANPR"
    assert cam["bearingDeg"] == 90
    assert cam["sourceUrl"].endswith("/node/1")
    assert cam["operator"] == "Non indicato"


def test_safe_extract_rejects_path_traversal(tmp_path):
    archive = tmp_path / "evil.zip"
    with zipfile.ZipFile(archive, "w") as zf:
        for name in ["agency.txt", "routes.txt", "trips.txt", "stops.txt", "stop_times.txt"]:
            zf.writestr(name, "x")
        zf.writestr("../escape.txt", "x")
    assert safe_extract(str(archive), str(tmp_path / "out")) is False
    assert not (tmp_path / "escape.txt").exists()
