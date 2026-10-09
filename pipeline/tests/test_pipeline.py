"""Test delle funzioni pure della pipeline (nessun accesso a rete o database)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import zipfile  # noqa: E402

import export_simulation_data as sim  # noqa: E402
import import_arpav_air as arpav  # noqa: E402
import import_opere_pubbliche as opere  # noqa: E402
import import_osm_surveillance as osm  # noqa: E402
import import_osm_defibrillators as osm_dae  # noqa: E402
import import_osm_pharmacies as osm_pharm  # noqa: E402
import import_osm_poi as osm_poi  # noqa: E402
import import_alilaguna_gtfs as ali  # noqa: E402
import import_agcom_fiber as fiber  # noqa: E402
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


def test_calendar_problems_flags_days_without_trips():
    from datetime import date
    calendar = [{"service_id": "FER", "start_date": "20261005", "end_date": "20261205", "monday": "1", "tuesday": "1",
                 "wednesday": "1", "thursday": "1", "friday": "1", "saturday": "0", "sunday": "0"}]
    trips = {"t1": {"service_id": "FER"}}
    days = {"weekday": date(2026, 10, 9), "sunday": date(2026, 10, 11)}
    assert sim.calendar_problems("nav", calendar, [], trips, days) == ["nav: nessuna corsa attiva il 2026-10-11 (sunday)"]
    expired = {"weekday": date(2026, 12, 7)}
    assert sim.calendar_problems("nav", calendar, [], trips, expired) == ["nav: nessuna corsa attiva il 2026-12-07 (weekday)"]
    extra = [{"service_id": "FER", "date": "20261011", "exception_type": "1"}]
    assert sim.calendar_problems("nav", calendar, extra, trips, {"sunday": date(2026, 10, 11)}) == []

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


def test_osm_defibrillator_mapping():
    node = {"id": 42, "lat": 45.4341234, "lon": 12.3398765,
            "tags": {"emergency": "defibrillator", "opening_hours": "24/7", "operator": "Comune",
                     "defibrillator:location:it": "Sotto il portico", "check_date": "2025-03-01"}}
    d = osm_dae.to_dae(node)
    assert d["id"] == "osm_42"
    assert d["accessType"] == "PUBBLICO_H24"
    assert d["location"] == "Sotto il portico"
    assert d["checkDate"] == "2025-03-01"
    assert d["sourceUrl"].endswith("/node/42")
    # senza orari dichiarati non si assume H24
    bare = osm_dae.to_dae({"id": 1, "lat": 45.4, "lon": 12.3, "tags": {"emergency": "defibrillator"}})
    assert bare["accessType"] == "NON_INDICATO"
    assert bare["operator"] == "Non indicato"


def test_osm_pharmacy_mapping():
    way = {"type": "way", "id": 7, "center": {"lat": 45.43, "lon": 12.33},
           "tags": {"amenity": "pharmacy", "name": "Farmacia X", "addr:street": "Calle Larga",
                    "addr:housenumber": "12", "phone": "+39 041 000000"}}
    p = osm_pharm.to_pharmacy(way)
    assert p["id"] == "osm_way_7"
    assert p["address"] == "Calle Larga 12"
    assert p["phone"] == "+39 041 000000"
    assert "dispensing" not in p
    para = osm_pharm.to_pharmacy({"type": "node", "id": 8, "lat": 45.4, "lon": 12.3,
                                  "tags": {"amenity": "pharmacy", "dispensing": "no"}})
    assert para["dispensing"] is False
    assert osm_pharm.to_pharmacy({"type": "way", "id": 9, "tags": {}}) is None


def test_osm_poi_helpers():
    assert osm_poi.to_int("120 posti") == 120 and osm_poi.to_int(None) is None
    assert osm_poi.to_float("3,5 m") == 3.5
    assert osm_poi.power_kw({"socket:type2:output": "22 kW", "maxpower": "50000"}) == 50
    assert osm_poi.zone(45.437, 12.33) == "Venezia centro storico"
    assert osm_poi.zone(45.47, 12.50) == "Cavallino-Treporti / litorale"
    assert osm_poi.zone(45.50, 12.34) == "Tessera / Aeroporto"
    assert osm_poi.zone(45.49, 12.24) == "Mestre"


def test_osm_poi_ev_mapping():
    el = {"type": "node", "id": 7, "lat": 45.44, "lon": 12.32}
    tags = {"amenity": "charging_station", "operator": "Enel X", "capacity": "2", "socket:type2": "2", "socket:type2:output": "22 kW"}
    item = osm_poi.ev(el, tags, 45.44, 12.32)
    assert item["id"] == "osm_node_7" and item["sourceUrl"].endswith("/node/7")
    assert item["totalSockets"] == 2 and item["powerKw"] == 22 and item["socketTypes"] == ["Type 2"]


def test_alilaguna_gtfs_helpers():
    assert ali.gtfs_seconds("25:10:30") == 25 * 3600 + 10 * 60 + 30
    shape = [[12.0, 45.0], [12.01, 45.0], [12.02, 45.0]]
    cum = ali.cumulative(shape)
    assert cum[0] == 0 and cum[1] < cum[2]
    first = ali.project_on_shape(shape, cum, 12.0, 45.0, 0)
    last = ali.project_on_shape(shape, cum, 12.0, 45.0, cum[1])  # non torna indietro lungo il percorso
    assert first == 0 and last >= cum[1]


def test_agcom_fiber_parsing():
    assert fiber.tech_class("300 - 2500 [FTTH]") == 3
    assert fiber.tech_class("50 - 100 [FTTC-200]") == 2
    assert fiber.tech_class("2 - 10 [ADSL]") == 1
    assert fiber.tech_class(None) == 0
    assert fiber.operator_mask("TIM Wholesale;Open Fiber") == 3
    assert fiber.operator_mask("Fibersurf") == 4
    assert fiber.operator_mask(None) == 0


def test_agcom_latest_service_skips_dynamic_layers():
    folders = ["Grid20", "Grid20_2025", "Grid20_2026", "Grid100_2026"]
    services = {
        "Grid20_2025": ["Grid20_2025/grid20_speed_down_20251003"],
        "Grid20_2026": ["Grid20_2026/grid20_speed_down_20260706", "Grid20_2026/grid20_speed_down_dyn_20261231"],
    }
    assert fiber.latest_service(folders, services) == "Grid20_2026/grid20_speed_down_20260706"


def test_agcom_aggregate_keeps_best_technology():
    lon, lat = fiber.FRAME[0] + 0.0001, fiber.FRAME[1] + 0.0001
    cells = fiber.aggregate([(lon, lat, 1, 0), (lon + 0.0002, lat, 3, 1), (lon, lat + 0.0003, 2, 2)])
    assert cells == {(0, 0): (3, 1, 3)}  # operatori FTTH solo dalle celle FTTH
    assert fiber.ring_centroid([[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]) == (1, 1)


def test_safe_extract_rejects_path_traversal(tmp_path):
    archive = tmp_path / "evil.zip"
    with zipfile.ZipFile(archive, "w") as zf:
        for name in ["agency.txt", "routes.txt", "trips.txt", "stops.txt", "stop_times.txt"]:
            zf.writestr(name, "x")
        zf.writestr("../escape.txt", "x")
    assert safe_extract(str(archive), str(tmp_path / "out")) is False
    assert not (tmp_path / "escape.txt").exists()
