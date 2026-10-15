"""Test delle funzioni pure della pipeline (nessun accesso a rete o database)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json  # noqa: E402
import zipfile  # noqa: E402

import export_simulation_data as sim  # noqa: E402
import import_arpav_air as arpav  # noqa: E402
import import_opere_pubbliche as opere  # noqa: E402
import import_osm_surveillance as osm  # noqa: E402
import import_osm_defibrillators as osm_dae  # noqa: E402
import import_osm_pharmacies as osm_pharm  # noqa: E402
import import_osm_poi as osm_poi  # noqa: E402
import import_alilaguna_gtfs as ali  # noqa: E402
import import_venice_tap_water as vtw  # noqa: E402
import import_agcom_fiber as fiber  # noqa: E402
import import_osm_waterways as waterways  # noqa: E402
import import_arpav_pollen as arpav_pollen  # noqa: E402
import import_cciaa_turismo as cciaa  # noqa: E402
import import_arpav_lagoon as arpav_lagoon  # noqa: E402
import import_cruscotto_italia as cruscotto  # noqa: E402
import import_bdap_opere as bdap  # noqa: E402
from download_gtfs import safe_extract  # noqa: E402


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


def test_osm_poi_civic_mapping():
    el = {"type": "way", "id": 9, "center": {"lat": 45.43, "lon": 12.32}}
    tags = {"amenity": "library", "name": "Biblioteca di Castello", "addr:street": "Via Garibaldi", "addr:housenumber": "1"}
    item = osm_poi.civic(el, tags, 45.43, 12.32, "Biblioteca")
    assert item["id"] == "osm_way_9" and item["address"] == "Via Garibaldi 1"
    assert osm_poi.civic(el, {}, 45.43, 12.32, "Ecocentro")["name"] == "Ecocentro"


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


def test_osm_waterways_marker_kind_and_simplify():
    assert waterways.marker_kind({"man_made": "dolphin"}) == "briccola"
    assert waterways.marker_kind({"man_made": "dolphin", "seamark:type": "pile"}) == "briccola"
    assert waterways.marker_kind({"seamark:type": "pile"}) == "palo"
    assert waterways.marker_kind({"seamark:type": "beacon_lateral"}) == "segnale"
    assert waterways.marker_kind({"seamark:type": "buoy_cardinal"}) == "boa"
    assert waterways.marker_kind({"seamark:type": "light_minor"}) == "fanale"
    line = [[12.0, 45.0], [12.00001, 45.000001], [12.001, 45.0]]
    assert waterways.simplify(line, 4.0) == [[12.0, 45.0], [12.001, 45.0]]


def test_arpav_pollen_monthly_profile():
    csv_text = (
        ",URTICACEAE,GRAMINEAE,Altri,GRAMINEAE\n"
        "01/05/2025,2.00,10.00,1,99\n"
        "02/05/2025,4.00,30.00,1,99\n"
        "01/06/2025,,5.00,1,99\n"
        ",,,,\n"
    )
    p = arpav_pollen.monthly_profile(csv_text)
    assert p["days"] == 3
    assert p["families"]["urticaceae"]["mean"][4] == 3.0 and p["families"]["urticaceae"]["max"][4] == 4.0
    assert p["families"]["gramineae"]["mean"][4] == 20.0  # prima colonna GRAMINEAE, non il duplicato
    assert p["families"]["gramineae"]["mean"][5] == 5.0
    assert p["families"]["urticaceae"]["mean"][0] is None


def test_cciaa_turismo_build():
    tourism = "CODICE COMUNE;DENOMINAZIONE Comune;ARRIVI 2024;PRESENZE 2024\n027042;VENEZIA;100;250\n027008;CHIOGGIA;10;20\n027044;CAVALLINO TREPORTI;5;50\n"
    pop = ("CODICE COMUNE;DENOMINAZIONE;POPOLAZIONE AL 1/01/2024 Maschi;POPOLAZIONE AL 1/01/2024 Femmine;"
           "POPOLAZIONE AL 1/01/2024 Totale;POPOLAZIONE AL 1/01/2024 di cui stranieri\n"
           "027042;VENEZIA;1;1;50;5\n027008;CHIOGGIA;1;1;10;1\n027044;CAVALLINO TREPORTI;1;1;25;2\n")
    d = cciaa.build(tourism, pop)
    assert d["tourismYear"] == 2024 and d["populationDate"] == "2024-01-01"
    ve = d["comuni"][0]
    assert ve["name"] == "Venezia" and ve["presencesPerResident"] == 5.0 and ve["avgStayNights"] == 2.5


def test_arpav_lagoon_latest_surface_and_links():
    header = "Stazione,Laguna,GBO X,GBO Y,Data,Orario,Profondita' (m),Temperatura acqua (gradi C.),Conducibilità (mS/cm),Salinità (psu),Ossigeno disciolto (%),Ossigeno disciolto (ppm),pH,\"Clorofilla \"\"a\"\" (µg/l)\""
    rows = [
        "S1,Venezia,1755000,5034000,10/02/2026,10:00,-0.1,9,40,25,90,8,7.9,2",
        "S1,Venezia,1755000,5034000,15/05/2026,10:00,-1.5,18,45,30,95,8,8.0,3",
        "S1,Venezia,1755000,5034000,15/05/2026,10:00,-0.2,19,46,31,99,8.5,8.1,4",
    ]
    import csv as _csv, io as _io
    st = arpav_lagoon.latest_surface(list(_csv.DictReader(_io.StringIO(header + "\n" + "\n".join(rows)))))
    assert len(st) == 1
    s = st[0]
    assert s["sampledAt"] == "2026-05-15" and s["depthMeters"] == 0.2 and s["waterTempCelsius"] == 19
    assert s["chlorophyllUgL"] == 4 and s["samplingDays"] == 2
    assert 12.2 < s["lon"] < 12.5 and 45.3 < s["lat"] < 45.6
    html = 'href="/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda/sonda_venezia_2022.csv/@@download/file" ' \
           'href="/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda/sonda-venezia-2026.pdf/@@download/file"'
    assert max(arpav_lagoon.files_by_year(html)) == 2026


def test_arpav_bathing_summary_takes_last_year():
    text = ("Anno,variabile,Regione_Veneto,mare_Adriatico\n2024,N° PUNTI TOTALI,170,94\n"
            "2025,N° PUNTI TOTALI,174,95\n2025,% punti Idonei,100,100\n2025,% in classe eccellente,93.7,88.4\n")
    b = arpav_lagoon.bathing_summary(text)
    assert b["year"] == 2025 and b["points"] == 95 and b["excellentPercent"] == 88.4


def test_cruscotto_parse_rpc_json_and_sse():
    payload = {"anagrafica": {"istat": "027042"}, "_generated_at": "x", "_etl_version": "0.3"}
    msg = {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": json.dumps(payload)}]}}
    assert cruscotto.parse_rpc(json.dumps(msg))["anagrafica"]["istat"] == "027042"
    assert cruscotto.parse_rpc("event: message\ndata: " + json.dumps(msg) + "\n\n")["anagrafica"]["istat"] == "027042"
    assert cruscotto.compact(payload) == {"anagrafica": {"istat": "027042"}, "_generated_at": "x"}
    import pytest
    with pytest.raises(RuntimeError):
        cruscotto.parse_rpc(json.dumps({"jsonrpc": "2.0", "id": 1, "error": {"code": -32602, "message": "x"}}))


def test_safe_extract_rejects_path_traversal(tmp_path):
    archive = tmp_path / "evil.zip"
    with zipfile.ZipFile(archive, "w") as zf:
        for name in ["agency.txt", "routes.txt", "trips.txt", "stops.txt", "stop_times.txt"]:
            zf.writestr(name, "x")
        zf.writestr("../escape.txt", "x")
    assert safe_extract(str(archive), str(tmp_path / "out")) is False
    assert not (tmp_path / "escape.txt").exists()


# --- BDAP: Monitoraggio Opere Pubbliche ---

def _bdap_row(**over):
    row = {
        "Codice CUP": "F76D20000060005",
        "Descrizione CUP Integrale": "MUSEO DEL VETRO*ISOLA DI MURANO*AMPLIAMENTO DEL MUSEO",
        "Descrizione Stato CUP": "ATTIVO",
        "Settore Interv Inv": "INFRASTRUTTURE SOCIALI", "Sottosettore Interv Inv": "BENI CULTURALI",
        "Categoria Interv Inv": "MUSEI", "Tipologia Intervento": "AMPLIAMENTO",
        "Inizio progettazione prevista": "", "Inizio progettazione effettiva": "2021-01-10",
        "Inizio esecuzione prevista": "2025-07-01", "Inizio esecuzione effettiva": "2025-07-20",
        "Fine esecuzione prevista": "2026-08-30", "Fine esecuzione effettiva": "",
        "Costo Lavori Previsto": "2500000.00", "Somme a disposizione Previste": "530000.00",
        "Finanziamenti Statali": "1000000", "Finanziamenti Europei": "0", "Finanziamenti Enti Territorial": "2030000",
        "Finanziamenti Privati": "0", "Altre fonti di finanziamento": "0", "Finanziamenti da reperire": "0",
        "Totale Economie": "0",
    }
    row.update(over)
    return row


def test_bdap_descrizione_e_fase():
    assert bdap.split_description("A*B*C*D") == ("A", "B", "C D")
    assert bdap.split_description("SOLO OGGETTO") == ("SOLO OGGETTO", "", "")
    assert bdap.phase(_bdap_row()) == "execution"
    assert bdap.phase(_bdap_row(**{"Fine esecuzione effettiva": "2026-01-01"})) == "completed"
    assert bdap.phase(_bdap_row(**{"Descrizione Stato CUP": "CHIUSO"})) == "completed"
    assert bdap.phase(_bdap_row(**{"Inizio esecuzione effettiva": ""})) == "design"
    assert bdap.phase(_bdap_row(**{"Inizio esecuzione effettiva": "", "Inizio progettazione effettiva": ""})) == "planned"


def test_bdap_progetto_e_riepilogo():
    p = bdap.project(_bdap_row())
    assert p["object"] == "Museo del vetro" and p["place"] == "Isola di murano"
    assert p["costPlannedEur"] == 3030000.0
    assert p["funding"]["local"] == 2030000.0
    s = bdap.summarize([p, bdap.project(_bdap_row(**{"Fine esecuzione effettiva": "2026-01-01"}))])
    assert s["projects"] == 2 and s["openProjects"] == 1
    assert s["byPhase"]["execution"] == 1 and s["byPhase"]["completed"] == 1
    assert s["openCostEur"] == 3030000.0 and s["openBySector"][0]["count"] == 1


def test_bdap_luoghi_solo_se_precisi():
    assert bdap.place_queries("MUSEO DEL VETRO", "ISOLA DI MURANO") == ["Museo Del Vetro, Murano", "Isola Di Murano, Venezia"]
    assert bdap.place_queries("PONTE VINANTI", "DORSODURO, 3771, VE") == ["Ponte Vinanti, Venezia"]
    assert bdap.place_queries("REMIERE S. ALVISE", "CANNAREGIO") == ["Remiere S. Alvise, Venezia"]
    # luoghi generici o ambigui: nessuna posizione
    assert bdap.place_queries("EDILIZIA SPORTIVA", "TERRAFERMA - MUNICIPALITÀ DIVERSE") == []
    assert bdap.place_queries("SCUOLE", "VENEZIA CENTRO STORICO") == []
    assert bdap.place_queries("BIENNALE", "VIA VENEZIA") == []
    assert bdap.place_queries("CAMPO DA ALLENAMENTO", "SPORT") == []


def test_bdap_omonimi_e_punti_coincidenti():
    assert bdap.plausible("Ponte Lungo, Murano", (45.457, 12.353))
    assert not bdap.plausible("Ponte Lungo, Murano", (45.4258, 12.3292))  # il Ponte Lungo della Giudecca
    assert bdap.plausible("Via Fapanni, Mestre", (45.49, 12.24))
    pts = bdap.spread([(45.0, 12.0), (45.0, 12.0), (45.1, 12.1)])
    assert pts[0] != pts[1] and pts[2] == (45.1, 12.1)
    assert all(abs(a - 45.0) < 0.001 for a, _ in pts[:2])


def test_bdap_data_osservazione():
    assert bdap.observed_at("Dati osservati al 30/09/2026. - [X]") == "2026-09-30"
    assert bdap.observed_at("") is None


def test_simulazione_in_file_con_hash(tmp_path, monkeypatch):
    monkeypatch.setattr(sim, "PUBLIC_DATA_DIR", str(tmp_path))
    (tmp_path / "sim-000000000000.json").write_text("{}")  # versione precedente: va rimossa
    (tmp_path / "land-hi-111111111111.json").write_text("[]")  # altro prefisso: resta
    url = sim.write_hashed_json("sim", {"a": 1})
    assert url.startswith("/data/sim-") and url.endswith(".json")
    names = sorted(p.name for p in tmp_path.iterdir())
    assert names == ["land-hi-111111111111.json", url.rsplit("/", 1)[1]]
    # stesso contenuto, stesso nome
    assert sim.write_hashed_json("sim", {"a": 1}) == url
    stats = sim.sim_stats({"routes": [{"n": "1", "c": "vaporetto"}, {"n": "2", "c": "bus"}], "days": {"weekday": {"trips": [[0, 1], [0, 2]]}}})
    assert stats == {"routeModes": ["vaporetto", "bus"], "trips": {"weekday": 2}}


# --- Fontanelle: zona da geocodifica inversa ---
import import_osm_fountains as fnt  # noqa: E402


def test_fontanelle_zona_da_indirizzo():
    # centro storico: il sestiere è in "neighbourhood" (village/town di Nominatim lì sono inaffidabili)
    assert fnt.zone_from_address({"neighbourhood": "Cannaregio", "village": "Murano", "suburb": "Venezia-Murano-Burano"}) == "Cannaregio"
    assert fnt.zone_from_address({"neighbourhood": "Giudecca", "town": "Lido"}) == "Giudecca & Sacca Fisola"
    # isole
    assert fnt.zone_from_address({"suburb": "Venezia-Murano-Burano", "village": "Burano"}) == "Burano / Mazzorbo / Torcello"
    assert fnt.zone_from_address({"suburb": "Lido-Pellestrina", "town": "Lido"}) == "Lido di Venezia"
    # terraferma: la frazione, mai un sestiere
    assert fnt.zone_from_address({"suburb": "Favaro Veneto", "village": "Tessera"}) == "Tessera"
    assert fnt.zone_from_address({"suburb": "Rione Pertini", "village": "Campalto"}) == "Campalto"


def test_fontanelle_ripiego_senza_rete():
    # le fontanelle segnalate (Campalto, Tessera) non sono più "Cannaregio"
    assert fnt.determine_sestiere(45.49807, 12.33124) == "Terraferma"
    assert fnt.determine_sestiere(45.47432, 12.28121) == "Terraferma"
    assert fnt.determine_sestiere(45.4448, 12.3270) == "Cannaregio"
    assert fnt.determine_sestiere(45.4466, 12.3485) == "San Michele (cimitero)"
    assert fnt.reverse_zone(45.4466, 12.3485, {}) == "San Michele (cimitero)"  # senza rete
    # valore in cache usato senza richieste
    assert fnt.reverse_zone(45.5, 12.3, {"reverse:45.50000,12.30000": "Campalto"}) == "Campalto"


def test_osm_wifi_luoghi():
    assert osm_poi.has_wifi({"internet_access": "wlan"}) and osm_poi.has_wifi({"wifi": "free"})
    assert not osm_poi.has_wifi({"internet_access": "terminal"}) and not osm_poi.has_wifi({})
    assert osm_poi.wifi_access({"internet_access:fee": "no"}) == "free"
    assert osm_poi.wifi_access({"wifi": "free"}) == "free"
    assert osm_poi.wifi_access({"internet_access:fee": "customers"}) == "customers"
    assert osm_poi.wifi_access({"internet_access:fee": "yes"}) == "paid"
    assert osm_poi.wifi_access({}) == "unknown"
    assert osm_poi.venue_kind({"tourism": "hotel"}) == "hotel"
    assert osm_poi.venue_kind({"amenity": "pub"}) == "bar"
    assert osm_poi.venue_kind({"shop": "books"}) == "shop"
    el = {"type": "node", "id": 7}
    tags = {"name": "Caffè X", "amenity": "cafe", "internet_access": "wlan", "internet_access:fee": "customers",
            "internet_access:ssid": "CaffeX_Guest", "internet_access:password": "segreta"}
    item = osm_poi.wifi_venue(el, tags, 45.437, 12.33)
    assert item["kind"] == "cafe" and item["access"] == "customers" and item["ssid"] == "CaffeX_Guest"
    assert "segreta" not in json.dumps(item)  # le password non vengono mai salvate


def test_osm_impianti_sportivi():
    assert osm_poi.sport_access({"access": "yes"}) == "public"
    assert osm_poi.sport_access({"access": "customers"}) == "customers"
    assert osm_poi.sport_access({"access": "private"}) == "private"
    assert osm_poi.sport_access({}) == "unknown"
    el = {"type": "way", "id": 9}
    p = osm_poi.sport_place(el, {"leisure": "pitch", "sport": "basketball;volleyball", "lit": "yes", "surface": "asphalt"}, 45.43, 12.35)
    assert p["kind"] == "pitch" and p["sports"] == ["basketball", "volleyball"] and p["lit"] is True
    assert osm_poi.sport_place(el, {"leisure": "fitness_station"}, 45.43, 12.35)["kind"] == "fitness"
    assert osm_poi.sport_place(el, {"leisure": "pitch", "lit": "maybe"}, 45.43, 12.35)["lit"] is None


def test_indice_fermate_gtfs():
    class F:
        stops = {"5001": {"stop_name": 'Lido S.M.E. "B" ', "stop_lat": "45.417992", "stop_lon": "12.368725"},
                 "x": {"stop_name": "senza coordinate", "stop_lat": "", "stop_lon": ""}}
    idx = sim.stops_index([F()])
    assert idx == {"5001": ['Lido S.M.E. "B"', 45.41799, round(12.368725, 5)]}


def test_fermate_della_mappa_nomi_e_linee():
    assert sim.stop_base_name('Lido S.M.E. "B"') == "Lido S.M.E."
    assert sim.stop_base_name("F.te Nove 'A'") == "F.te Nove"
    assert sim.stop_base_name("S. Marcuola-Casino'") == "S. Marcuola-Casino'"
    assert sorted(["N", "10", "2", "4.1", "1", "T1"], key=sim.natural_key) == ["1", "2", "4.1", "10", "N", "T1"]


def test_osm_nautica():
    assert osm_poi.nautical_kind({"leisure": "marina", "mooring": "yes"}) == "marina"
    assert osm_poi.nautical_kind({"waterway": "fuel"}) == "fuel"
    assert osm_poi.nautical_kind({"amenity": "fuel", "boat": "yes"}) == "fuel"
    assert osm_poi.nautical_kind({"amenity": "fuel"}) is None  # distributore per auto
    assert osm_poi.nautical_kind({"mooring": "private"}) == "mooring"
    assert osm_poi.mooring_access("yes") == "allowed" and osm_poi.mooring_access("guest") == "guest"
    assert osm_poi.mooring_access("private") == "private" and osm_poi.mooring_access("no") == "no"
    assert osm_poi.mooring_access(None) is None
    item = osm_poi.nautical({"type": "way", "id": 5}, {"mooring": "guest", "name": "Riva X"}, 45.43, 12.33, "mooring")
    assert item["access"] == "guest" and item["kind"] == "mooring" and item["name"] == "Riva X"


# --- Parchi e giardini (OSM) ---

import import_osm_parks as parks  # noqa: E402


def test_parchi_esclude_privati_e_giardini_domestici():
    assert parks.keep({"leisure": "park"})
    assert not parks.keep({"leisure": "park", "access": "private"})
    assert parks.keep({"leisure": "playground", "access": "customers"})
    # giardini: solo se aperti, di tipo pubblico o con un nome e non domestici
    assert not parks.keep({"leisure": "garden"})
    assert not parks.keep({"leisure": "garden", "name": "Orto di casa", "garden:type": "vegetable_garden"})
    assert parks.keep({"leisure": "garden", "garden:type": "botanical"})
    assert parks.keep({"leisure": "garden", "access": "yes"})
    assert parks.keep({"leisure": "garden", "name": "Giardini Papadopoli"})
    assert parks.access_of({"access": "permissive"}) == "public"
    assert parks.access_of({}) == "unknown"


def test_parchi_multipoligono_ricomposto():
    # due tratti, il secondo invertito, formano un quadrato chiuso
    a = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0]]
    b = [[0.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
    rings = parks.stitch([a, b])
    assert len(rings) == 1 and rings[0][0] == rings[0][-1] and len(rings[0]) == 5


def test_parchi_area_e_baricentro():
    # quadrato di 0.001° a Venezia: circa 78 m x 111 m
    ring = [[12.33, 45.43], [12.331, 45.43], [12.331, 45.431], [12.33, 45.431], [12.33, 45.43]]
    assert 8000 < parks.ring_area_m2(ring) < 9000
    cx, cy = parks.centroid(ring)
    assert abs(cx - 12.3305) < 1e-6 and abs(cy - 45.4305) < 1e-6


def test_parchi_ordinati_dal_piu_grande_e_punti_senza_perimetro():
    small = {"type": "way", "id": 1, "tags": {"leisure": "park", "name": "Piccolo"},
             "geometry": [{"lon": x, "lat": y} for x, y in [[12.33, 45.43], [12.3301, 45.43], [12.3301, 45.4301], [12.33, 45.43]]]}
    big = {"type": "way", "id": 2, "tags": {"leisure": "park"},
           "geometry": [{"lon": x, "lat": y} for x, y in [[12.33, 45.43], [12.34, 45.43], [12.34, 45.44], [12.33, 45.43]]]}
    node = {"type": "node", "id": 3, "lon": 12.3, "lat": 45.4, "tags": {"leisure": "playground"}}
    out = parks.build({"elements": [small, node, big]})
    assert [p["id"] for p in out][:2] == ["osm-way-2", "osm-way-1"]
    pt = next(p for p in out if p["id"] == "osm-node-3")
    assert pt["rings"] == [] and pt["areaM2"] is None


# --- Censimento ISTAT 2021 ---

import io as _io  # noqa: E402
import struct as _struct  # noqa: E402

import import_istat_census as census  # noqa: E402


def _xlsx(rows):
    """xlsx minimo: stringhe condivise per i testi, numeri in linea."""
    strings, sheet_rows = [], []
    for r_i, row in enumerate(rows, start=1):
        cells = []
        for c_i, v in enumerate(row):
            ref = f"{chr(65 + c_i)}{r_i}"
            if isinstance(v, str):
                strings.append(v)
                cells.append(f'<c r="{ref}" t="s"><v>{len(strings) - 1}</v></c>')
            else:
                cells.append(f'<c r="{ref}"><v>{v}</v></c>')
        sheet_rows.append(f'<row r="{r_i}">{"".join(cells)}</row>')
    ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    buf = _io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("xl/sharedStrings.xml", f'<sst {ns}>' + "".join(f"<si><t>{s}</t></si>" for s in strings) + "</sst>")
        z.writestr("xl/worksheets/sheet1.xml", f'<worksheet {ns}><sheetData>{"".join(sheet_rows)}</sheetData></worksheet>')
    return buf.getvalue()


def test_censimento_lettura_xlsx():
    rows = list(census.xlsx_rows(_xlsx([["PROCOM", "SEZ21_ID", "P1"], [27042, 270420000001, 12]])))
    assert rows == [["PROCOM", "SEZ21_ID", "P1"], ["27042", "270420000001", "12"]]
    assert census.col_index("AB7") == 27


def test_censimento_lettura_dbf_e_shp():
    fields = [("PRO_COM", 6), ("SEZ21_ID", 12)]
    header_len = 32 + 32 * len(fields) + 1
    record_len = 1 + sum(n for _, n in fields)
    dbf = bytearray(_struct.pack("<BBBBIHH", 3, 0, 0, 0, 1, header_len, record_len) + b"\0" * 20)
    for name, n in fields:
        dbf += name.encode().ljust(11, b"\0") + b"C" + b"\0" * 4 + bytes([n]) + b"\0" * 15
    dbf += b"\x0d" + b" " + b"27042".ljust(6) + b"270420000001"
    assert list(census.dbf_records(bytes(dbf))) == [{"PRO_COM": "27042", "SEZ21_ID": "270420000001"}]

    pts = [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)]
    content = _struct.pack("<i4dii", 5, 0, 0, 10, 10, 1, len(pts)) + _struct.pack("<i", 0) + b"".join(_struct.pack("<2d", *p) for p in pts)
    shp = b"\0" * 100 + _struct.pack(">ii", 1, len(content) // 2) + content
    (idx, rings), = list(census.shp_polygons(shp, {0}))
    assert idx == 0 and rings[0][2] == [10.0, 10.0]
    cx, cy, area = census.planar_centroid(rings)
    assert (round(cx, 6), round(cy, 6), round(area)) == (5, 5, 100)


def test_censimento_aggregazione_per_zona_e_indicatori():
    square = [[12.0, 45.0], [12.01, 45.0], [12.01, 45.01], [12.0, 45.01], [12.0, 45.0]]
    giudecca = [[12.5, 45.5], [12.51, 45.5], [12.51, 45.51], [12.5, 45.51], [12.5, 45.5]]
    zones = [("sestiere", "San Marco", "San Marco", [square]), ("sestiere", "Dorsoduro", "Giudecca", [giudecca])]
    row = lambda sid, asc, pop, young, old, a3, a8: {  # noqa: E731
        "SEZ21_ID": sid, "COM_ASC1": str(27042000 + asc), "P1": pop, "P14": young, "P27": old, "PF1": pop / 2,
        "PF3": pop / 4, "A3": a3, "A8": a8, "ST1": 1,
    }
    rows = [row("1", 1, 100, 10, 30, 40, 80), row("2", 1, 50, 5, 10, 10, 30), row("3", 4, 1000, 100, 200, 50, 500)]
    centroids = {"1": (12.005, 45.005), "2": (12.5, 45.5), "3": (12.2, 45.4)}
    out = census.build(rows, centroids, zones)
    assert out["city"]["population"] == 1150
    sm = next(x for x in out["sestieri"] if x["name"] == "San Marco")
    assert sm["name"] == "San Marco" and sm["population"] == 100
    assert sm["pctDwellingsEmptyOrNonResident"] == 50.0 and sm["pct65plus"] == 30.0 and sm["oldAgeIndex"] == 300
    assert sm["avgFamilySize"] == 2.0 and sm["pctOnePersonFamilies"] == 50.0
    # la Giudecca non è un sestiere: la sua sezione va a Dorsoduro e compare tra le sue parti
    assert sorted(x["name"] for x in out["sestieri"]) == ["Dorsoduro", "San Marco"]
    dorsoduro = next(x for x in out["sestieri"] if x["name"] == "Dorsoduro")
    assert dorsoduro["population"] == 50 and dorsoduro["parts"][0]["name"] == "Giudecca"
    assert out["historicCentre"]["population"] == 150
    assert out["unassignedInsular"]["population"] == 0
    assert out["municipalities"][0]["population"] == 150 and out["municipalities"][3]["population"] == 1000


def test_colori_ufficiali_delle_linee_di_navigazione():
    from types import SimpleNamespace
    nav = SimpleNamespace(name="navigazione", routes={
        "2_UN": {"route_short_name": "2", "route_color": "ff0000", "route_text_color": "FFFFFF"},
        "SA_UN": {"route_short_name": "SA", "route_color": ""},
    })
    bus = SimpleNamespace(name="automobilistico", routes={"2_UM": {"route_short_name": "2", "route_color": "E31E24"}})
    assert sim.line_colors([nav, bus]) == {"2": {"color": "#FF0000", "text": "#FFFFFF"}}


# --- Numeri civici (OSM) ---

import import_osm_civici as civici  # noqa: E402


def test_civici_sestiere_e_numero():
    assert civici.sestiere_of({"addr:suburb": "Cannaregio"}) == "Cannaregio"
    assert civici.sestiere_of({"addr:place": "S. Polo"}) == "San Polo"
    assert civici.sestiere_of({"addr:street": "Giudecca"}) == "Giudecca"
    assert civici.sestiere_of({"addr:street": "Calle Larga"}) is None
    assert civici.parse_number("3450") == (3450, "")
    assert civici.parse_number("122/A") == (122, "A")
    assert civici.parse_number("2902b") == (2902, "B")
    assert civici.parse_number("snc") is None


def test_civici_build_ordina_e_divide_i_numeri_multipli():
    payload = {"elements": [
        {"type": "node", "lat": 45.44, "lon": 12.33, "tags": {"addr:housenumber": "12;10", "addr:suburb": "Castello"}},
        {"type": "way", "center": {"lat": 45.43, "lon": 12.34}, "tags": {"addr:housenumber": "11a", "addr:suburb": "Castello"}},
        {"type": "node", "lat": 45.5, "lon": 12.4, "tags": {"addr:housenumber": "5", "addr:street": "Via Roma"}},
    ]}
    out = civici.build(payload)
    assert [r[:2] for r in out["Castello"]] == [[10, ""], [11, "A"], [12, ""]]
    assert out["Cannaregio"] == []


# --- Rete pedonale (OSM) ---

import import_osm_walk as walk  # noqa: E402


def test_rete_pedonale_incroci_ponti_e_componenti():
    nodes = [{"type": "node", "id": i, "lon": 12.3 + i * 0.001, "lat": 45.43} for i in range(1, 26)]
    ways = [
        # via principale 1-2-3-4 e traversa 3-5: il nodo 3 è un incrocio
        {"type": "way", "id": 100, "nodes": [1, 2, 3, 4], "tags": {"highway": "pedestrian"}},
        {"type": "way", "id": 101, "nodes": [3, 5], "tags": {"highway": "footway", "bridge": "yes"}},
        {"type": "way", "id": 102, "nodes": [6, 7], "tags": {"highway": "footway", "access": "private"}},
        # catena lunga per superare la soglia delle componenti piccole
        {"type": "way", "id": 103, "nodes": list(range(4, 26)), "tags": {"highway": "pedestrian"}},
    ]
    walk.MIN_COMPONENT = 3
    g = walk.build({"elements": nodes + ways})
    n_edges = len(g["edges"]) // 4
    flags = [g["edges"][4 * e + 3] for e in range(n_edges)]
    assert flags.count(walk.FLAG_STEPS) == 1  # il ponte
    # la via privata non entra nella rete
    xs = {g["nodes"][2 * i] for i in range(len(g["nodes"]) // 2)}
    assert round((12.3 + 6 * 0.001 - walk.LON0) * walk.SCALE) not in xs
    assert walk.walkable({"highway": "footway", "access": "private", "foot": "yes"})


def test_rete_pedonale_da_vie_con_geometria():
    payload = {"elements": [
        {"type": "way", "id": 1, "nodes": [10, 11], "tags": {"highway": "footway"},
         "geometry": [{"lon": 12.3, "lat": 45.43}, {"lon": 12.301, "lat": 45.43}]},
        {"type": "way", "id": 2, "nodes": [10], "tags": {"highway": "footway"}, "geometry": []},
    ]}
    els = walk.geom_elements(payload)
    assert [e["type"] for e in els] == ["node", "node", "way"]
    assert els[0] == {"type": "node", "id": 10, "lon": 12.3, "lat": 45.43}
    assert "geometry" not in els[2]
    assert walk.LON0 <= 12.24 and walk.LAT0 <= 45.20  # rete fino a Chioggia e Mestre
    # le zone si dividono in celle piccole che le coprono tutte
    cs = walk.cells([(45.0, 12.0, 45.06, 12.05)], 0.025)
    assert len(cs) == 3 * 2
    assert min(c[0] for c in cs) == 45.0 and max(c[2] for c in cs) == 45.06 and max(c[3] for c in cs) == 12.05


def test_category_people_mover_e_bus_del_lido():
    # il People Mover è codificato come autobus nel GTFS ACTV
    pm = {"route_short_name": "PM", "route_type": "3", "route_desc": "UM"}
    assert sim.category("automobilistico", pm, []) == "peoplemover"
    assert sim.category("automobilistico", {"route_short_name": "T1", "route_type": "0"}, []) == "tram"
    assert sim.category("automobilistico", {"route_short_name": "A", "route_type": "3", "route_desc": "UL"}, []) == "island"
    assert sim.category("automobilistico", {"route_short_name": "2", "route_type": "3", "route_desc": "UM"}, []) == "bus"


def test_venice_tap_water_stato_e_zona():
    assert vtw.parse_status("Aperta - Pulsante") == ("open", "Pulsante")
    assert vtw.parse_status("Chiusa, con rubinetto") == ("closed", "Con rubinetto")
    assert vtw.parse_status("Chiuso") == ("closed", "")
    assert vtw.parse_status("Fontana su vera da pozzo") == ("unknown", "Fontana su vera da pozzo")
    assert vtw.clean_area("SESTIERE DI SAN POLO") == "San Polo"
    assert vtw.clean_area("SANT'ERASMO e VIGNOLE") == "Sant'Erasmo e Vignole"
    assert vtw.description_text('<img src="x" /><br><br>Aperta  ') == "Aperta"


def test_venice_tap_water_kml():
    kml = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
<Folder><name>SESTIERE DI CASTELLO</name>
<Placemark><name>Campo Bandiera e Moro</name><description><![CDATA[<img src="a.jpg"/><br><br>Aperta - Pulsante]]></description>
<Point><coordinates>12.3456,45.4345,0</coordinates></Point></Placemark>
<Placemark><name>Fuori</name><description>Aperta</description><Point><coordinates>12.19,45.57,0</coordinates></Point></Placemark>
</Folder></Document></kml>"""
    out = vtw.parse_kml(kml)
    assert len(out) == 1
    assert out[0]["area"] == "Castello" and out[0]["status"] == "open" and out[0]["statusNote"] == "Pulsante"
    assert "img" not in json.dumps(out)


# --- Toponimi (OSM) per le ordinanze ---

import import_osm_toponyms as toponyms  # noqa: E402


def _way(i, name, pts, key="name"):
    return {"type": "way", "id": i, "tags": {key: name}, "geometry": [{"lon": x, "lat": y} for x, y in pts]}


def test_toponimi_tratti_contigui_uniti_e_omonimi_lontani_separati():
    a = _way(1, "Calle del Forno", [[12.3300, 45.4300], [12.3305, 45.4300]])
    b = _way(2, "Calle del Forno", [[12.3306, 45.4300], [12.3310, 45.4301]])  # continua il primo
    c = _way(3, "Calle del Forno", [[12.3500, 45.4400], [12.3504, 45.4400]])  # un'altra calle, a 2 km
    names = toponyms.build({"elements": [a, b, c]})
    assert len(names["Calle del Forno"]) == 2


def test_toponimi_grafie_unite_ponti_e_terraferma_esclusa():
    a = _way(1, "Strada Comunale dei Murazzi", [[12.30, 45.27], [12.3001, 45.2701]])
    b = _way(2, "Strada comunale dei Murazzi", [[12.3002, 45.2702], [12.3003, 45.2703]])
    bridge = _way(3, "Ponte dei Carmini", [[12.3240, 45.4340], [12.3241, 45.4340]], key="bridge:name")
    mestre = _way(4, "Via Piave", [[12.23, 45.49], [12.231, 45.49]])
    names = toponyms.build({"elements": [a, b, bridge, mestre]})
    assert list(names) == ["Ponte dei Carmini", "Strada Comunale dei Murazzi"]
    assert len(names["Strada Comunale dei Murazzi"]) == 1
    assert toponyms.is_mainland(12.30, 45.48) and not toponyms.is_mainland(12.335, 45.437)


# --- Fermate bus (GTFS automobilistico) ---

import export_simulation_data as sim_export  # noqa: E402


def test_fermate_bus_corsie_unite_tram_esclusi_e_fuori_area():
    class FakeFeed:
        name = "automobilistico"
        trips = {"t1": {"route_id": "r1"}, "t2": {"route_id": "r2"}, "t3": {"route_id": "rt"}}
        routes = {"r1": {"route_short_name": "A", "route_type": "3"}, "r2": {"route_short_name": "B", "route_type": "3"},
                  "rt": {"route_short_name": "T1", "route_type": "0"}}
        stops = {
            "10": {"stop_name": "Gran Viale", "stop_lat": "45.4160", "stop_lon": "12.3710"},
            "11": {"stop_name": "Gran Viale", "stop_lat": "45.4161", "stop_lon": "12.3712"},  # altra corsia, 15 m
            "20": {"stop_name": "Piazzale Cialdini", "stop_lat": "45.4900", "stop_lon": "12.2400"},  # tram
            "30": {"stop_name": "Padova", "stop_lat": "45.4064", "stop_lon": "11.8767"},  # fuori area
        }
    rows = [{"trip_id": "t1", "stop_id": "10"}, {"trip_id": "t2", "stop_id": "11"}, {"trip_id": "t3", "stop_id": "20"}, {"trip_id": "t1", "stop_id": "30"}]
    out = sim_export.bus_stops(FakeFeed(), rows)
    assert len(out) == 1
    assert out[0]["name"] == "Gran Viale" and out[0]["lines"] == ["A", "B"] and out[0]["gtfsIds"] == ["10", "11"]
    assert out[0]["mode"] == "bus" and out[0]["id"] == "busstop:10"


# --- Alilaguna: linee stagionali dalla pagina ufficiale ---

import import_alilaguna_gtfs as alilaguna  # noqa: E402


def test_alilaguna_linea_stagionale_dalla_pagina():
    rossa = "<h1>Linea Rossa (stagionale estiva)</h1><p>Linea stagionale estiva, attiva da Aprile a Novembre La Linea Rossa collega…</p>"
    blu = "<h1>Linea Blu</h1><p>La Linea Blu collega l'Aeroporto Marco Polo con Murano…</p>"
    assert alilaguna.seasonal_note(rossa) == "Linea stagionale estiva, attiva da Aprile a Novembre"
    assert alilaguna.seasonal_note(blu) is None


# --- FlixBus (GTFS europeo) ---

from datetime import date as _date  # noqa: E402

import import_flixbus as flix  # noqa: E402


def test_flixbus_date_di_servizio_con_eccezioni():
    cal = {"S": {"monday": "1", "tuesday": "0", "wednesday": "1", "thursday": "0", "friday": "0", "saturday": "0", "sunday": "0", "start_date": "20261001", "end_date": "20261031"}}
    exc = {"S": {"20261014": "2", "20261015": "1"}}  # mercoledì soppresso, giovedì aggiunto
    assert flix.service_dates("S", cal, exc, _date(2026, 10, 12), 4) == ["20261012", "20261015"]


def test_flixbus_proiezione_e_ritaglio_sull_area():
    points = [(12.0, 45.40), (12.20, 45.45), (12.30, 45.48)]  # da fuori area verso Mestre
    cum = flix.cumulative(points)
    d_mestre = flix.project(points, cum, (12.30, 45.48))
    assert abs(d_mestre - cum[-1]) < 1
    clipped = flix.clip_window(points, cum, 0, cum[-1])
    assert [p for p, _ in clipped][0] == (12.20, 45.45)  # (12.0, 45.40) è oltre il margine dell'area


# --- Rete dei canali per il planner in barca (OSM + Testo Unico) ---

import import_osm_boat as boat  # noqa: E402


def _canal(way_id, nodes, name=None, **tags):
    """Via d'acqua in formato Overpass «out body geom» con nodi i → (12.30 + i·0,001, 45.43)."""
    geometry = [{"lon": 12.30 + n * 0.001, "lat": 45.43} for n in nodes]
    return {"type": "way", "id": way_id, "nodes": nodes, "geometry": geometry,
            "tags": {"waterway": "canal", **({"name": name} if name else {}), **tags}}


def test_maxspeed_osm():
    assert boat.maxspeed_kmh("11") == 11
    assert boat.maxspeed_kmh("5 knots") == 9.3
    assert boat.maxspeed_kmh(None) is None
    assert boat.maxspeed_kmh("walk") is None


def test_rete_canali_incroci_divieti_e_tratti_lunghi():
    payload = {"elements": [
        _canal(1, list(range(0, 31)), "Canale Lungo", maxspeed="11"),
        _canal(2, [10, 40], "Rio Laterale"),
        _canal(3, [20, 41], "Rio Vietato", motorboat="no"),
        _canal(4, [50, 51], "Isolato"),
    ]}
    boat.MIN_COMPONENT_M = 1000
    g = boat.build_graph(payload)
    names = {e[3] for e in g["edges"]}
    assert names == {"Canale Lungo", "Rio Laterale"}  # motorboat=no escluso, componente piccola scartata
    # nodi agli incroci e almeno ogni SPLIT_M metri
    assert all(e[2] <= boat.SPLIT_M + 80 for e in g["edges"] if e[3] == "Canale Lungo")
    assert {e[5] for e in g["edges"] if e[3] == "Canale Lungo"} == {11}
    # un tratto rettilineo lungo riceve punti intermedi
    g2 = boat.build_graph({"elements": [_canal(5, [0, 30], "Bacino")]})
    assert len(g2["edges"]) >= 2


def test_regole_senso_unico_e_divieto_per_nome():
    payload = {"elements": [
        _canal(1, list(range(0, 21)), "Canal Grande"),
        _canal(2, list(range(20, 41)), "Rio di Prova"),
    ]}
    boat.MIN_COMPONENT_M = 100
    g = boat.build_graph(payload)
    assert boat.junction(g, "Canal Grande", "Rio di Prova") is not None
    rules = [
        {"id": "ow", "kind": "oneway", "ref": "art. 7", "label": "verso est", "names": ["Rio di Prova"],
         "paths": [[{"at": ["Rio di Prova", "Canal Grande"]}, [12.34, 45.43]]]},
        {"id": "ow-back", "kind": "oneway", "ref": "art. 7", "label": "verso ovest", "names": ["Rio di Prova"],
         "paths": [[[12.34, 45.43], {"at": ["Rio di Prova", "Canal Grande"]}]]},
        {"id": "nm", "kind": "noMotor", "ref": "art. 8", "label": "vietato", "names": ["Canal Grande"], "paths": []},
        {"id": "manca", "kind": "oneway", "ref": "art. 7", "label": "?", "names": [],
         "paths": [[{"at": ["Rio di Prova", "Inesistente"]}, [12.34, 45.43]]]},
    ]
    resolved, missing = boat.resolve_rules(g, rules)
    assert missing == ["manca"]
    by_id = {r["id"]: r for r in resolved}
    edges = g["edges"]
    # i nodi crescono verso est: nel senso del percorso ogni arco va da a verso b (codifica e), al contrario ~e
    east = by_id["ow"]["edges"]
    assert east and all(e >= 0 and edges[e][3] == "Rio di Prova" for e in east)
    assert all(e < 0 for e in by_id["ow-back"]["edges"])
    assert {edges[e][3] for e in by_id["nm"]["edges"]} == {"Canal Grande"}
    assert "hours" not in by_id["nm"]


def test_regole_del_testo_unico_ben_formate():
    ids = [r["id"] for r in boat.RULES]
    assert len(ids) == len(set(ids)) == 29
    assert sum(1 for r in boat.RULES if r["kind"] == "oneway") == 19
    for r in boat.RULES:
        assert r["kind"] in ("oneway", "noMotor", "noPleasure")
        assert r["ref"].startswith("art.")
        # i sensi unici hanno sempre un percorso con almeno due punti
        if r["kind"] == "oneway":
            assert r["paths"] and all(len(seg) >= 2 for seg in r["paths"])
        if "hours" in r:
            assert 0 <= r["hours"][0] < r["hours"][1] <= 1440


# --- Guida per chi contribuisce ---

def test_guida_aggiungere_fonte_cita_solo_file_esistenti():
    """I percorsi citati nella guida e nei modelli di GitHub esistono: la guida non invecchia senza che ce ne accorgiamo."""
    import re
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    docs = ["docs/AGGIUNGERE-UNA-FONTE.md", "CONTRIBUTING.md", ".github/PULL_REQUEST_TEMPLATE.md"]
    found = 0
    for doc in docs:
        text = open(os.path.join(root, doc), encoding="utf-8").read()
        for path in re.findall(r"`((?:web|pipeline|docs|skills|\.github)/[^`\s<>*]+)`", text):
            if "<" in path or "*" in path:
                continue
            found += 1
            assert os.path.exists(os.path.join(root, path)), f"{doc}: {path} non esiste"
    assert found >= 20
    for tpl in ["proponi-una-fonte.yml", "segnala-un-errore.yml", "config.yml"]:
        assert os.path.exists(os.path.join(root, ".github", "ISSUE_TEMPLATE", tpl))
