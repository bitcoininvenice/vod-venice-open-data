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
import import_agcom_fiber as fiber  # noqa: E402
import import_osm_waterways as waterways  # noqa: E402
import import_arpav_pollen as arpav_pollen  # noqa: E402
import import_cciaa_turismo as cciaa  # noqa: E402
import import_arpav_lagoon as arpav_lagoon  # noqa: E402
import import_cruscotto_italia as cruscotto  # noqa: E402
import import_bdap_opere as bdap  # noqa: E402
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
