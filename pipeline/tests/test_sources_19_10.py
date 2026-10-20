"""Test delle pipeline aggiunte il 19/10/2026: treni BusOne, PDF ATVO e Dolomiti Bus, OSM (depositi, lampioni,
edifici), GeoIDS, Inside Airbnb e prezzi MIMIT. Solo funzioni pure, nessuna rete."""
import io
import os
import sys
import zipfile
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import coach_common  # noqa: E402
import import_atvo as atvo  # noqa: E402
import import_busone_trains as trains  # noqa: E402
import import_dolomitibus as dolomiti  # noqa: E402
import import_geoids as geoids  # noqa: E402
import import_inside_airbnb as airbnb  # noqa: E402
import import_mimit_fuel as mimit  # noqa: E402
import import_osm_buildings as buildings  # noqa: E402
import import_osm_luggage as luggage  # noqa: E402
import import_osm_street_lamps as lamps  # noqa: E402


def test_festivita_italiane_e_pasquetta():
    assert coach_common.easter(2027) == date(2027, 3, 28)
    assert coach_common.italian_holiday(date(2027, 3, 29))  # Pasquetta
    assert coach_common.is_festive(date(2026, 12, 25))
    assert coach_common.is_festive(date(2026, 10, 25))  # domenica
    assert not coach_common.is_festive(date(2026, 10, 20))


def test_corse_in_utc_raggruppate_per_ora_legale():
    trips = coach_common.utc_trips(
        {"id": "x", "line": "35"},
        [(0, "A", True, 8 * 3600), (1000, "B", True, 8 * 3600 + 1200)],
        [date(2026, 10, 24), date(2026, 10, 26)],
    )
    # 24/10 ora legale (UTC+2), 26/10 ora solare (UTC+1): due corse con orari UTC diversi
    assert sorted(t["start"] for t in trips) == [6 * 3600, 7 * 3600]
    assert all(len(t["dates"]) == 1 for t in trips)


def _gtfs_zip(files: dict[str, str]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, text in files.items():
            z.writestr(name, text)
    return buf.getvalue()


def test_treni_che_fermano_a_santa_lucia_e_mestre_senza_bus_sostitutivi():
    raw = _gtfs_zip({
        "stops.txt": "stop_id,stop_name,platform_code\n02593,VENEZIA S.LUCIA,\n02589,VENEZIA MESTRE,\n00001,PADOVA,\n",
        "routes.txt": "route_id,route_short_name,route_type\nR1,RV,2\nB1,BUS,3\n",
        "trips.txt": "route_id,service_id,trip_id,trip_headsign,trip_short_name\nR1,S1,T1,PADOVA,3637\nB1,S1,T2,MESTRE,9000\n",
        "calendar.txt": "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nS1,1,1,1,1,1,1,1,20260101,20271231\n",
        "stop_times.txt": "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
        "T1,08:00:00,08:00:00,02593,1\nT1,08:11:00,08:12:00,02589,2\nT1,08:40:00,08:40:00,00001,3\n"
        "T2,09:00:00,09:00:00,02593,1\nT2,09:20:00,09:20:00,02589,2\n",
    })
    out = trains.trains_from_feed("Trenitalia", raw, date(2026, 10, 19))
    assert len(out) == 1
    t = out[0]
    assert t["trainNumber"] == "RV 3637" and t["direction"] == "OUTBOUND"
    assert (t["departureSeconds"], t["arrivalSeconds"]) == (8 * 3600, 8 * 3600 + 660)
    assert t["days"] == "1" * trains.DAYS


PAGE_72 = """LINEA 72 VENEZIA - CORTINA
Venezia P.le Roma 06:20 18:20
Mestre FS 06:40 18:40
Venezia Aeroporto 07:00 19:00
Peaio 09:00 12:00
Cortina Scuole 09:30 21:30
Nessun servizio il 25 dicembre. No service on 25 December.
VALIDO DAL 01/10/2026
LUNEDÌ - DOMENICA  /  MONDAY - SUNDAY
"""


def test_pdf_dolomiti_bus_orari_fuori_sequenza_scartati():
    page = dolomiti.parse_page(PAGE_72)
    assert page["validFrom"] == date(2026, 10, 1) and page["validTo"] is None
    assert page["weekdays"] == list(range(7)) and (25, 12) in page["closed"]
    trips, warnings = dolomiti.trips_of(page)
    assert len(trips) == 2
    assert "Peaio" not in [n for n, _ in trips[1]["stops"]]
    assert any("Peaio 12:00" in w for w in warnings)


PDF_35B = """A / TO AEROPORTO
AIRPORT MARCO POLO
4:20 fF 5:00 fF 5:55 f 6:40 F 7:00 f 7:20 f 7:40 fF 8:00 f 8:15 fF 8:20 fF 11:40 SC
A / TO
MESTRE FS
6:10 fF 7:00 fF 7:23 fF 7:50 f 8:10 F 8:20 f 8:25 F 8.40 F 8:45 f 8:53 fF
fF TUTTI I GIORNI everyday www.atvo.it
Nei giorni 25/12/2026 e 01/01/2027 il presente orario subirà delle variazioni.
dal / from 05/10/2026 al / to 24/04/2027
TEMPO DI PERCORRENZA 20 MINUTI
"""


def test_pdf_atvo_tipo_di_giorno_e_variazioni():
    p = atvo.parse(PDF_35B)
    assert p["minutes"] == 20 and p["validTo"] == date(2027, 4, 24)
    assert date(2026, 12, 25) in p["changes"]
    to_airport, to_city = p["directions"]
    assert to_airport["toAirport"] and not to_city["toAirport"]
    assert ("8.40", "F", "") in to_city["departures"]
    assert atvo.runs_on("f", date(2026, 10, 25)) is False  # domenica
    assert atvo.runs_on("SC", date(2026, 10, 20)) is None
    assert atvo.secs("00:40") == 86400 + 40 * 60


def test_osm_depositi_e_lampioni_senza_gestore():
    el = {"type": "node", "id": 1, "lat": 45.48, "lon": 12.23, "tags": {"amenity": "left_luggage", "name": "KiPoint", "operator": "Mario Rossi", "payment:cash": "yes"}}
    s = luggage.spot(el)
    assert s["type"] == "staffed" and s["payment"] == ["cash"] and "Mario Rossi" not in str(s)
    assert lamps.lamp({"id": 7, "lat": 45.43, "lon": 12.33, "tags": {"support": "wall_mounted", "light:method": "LED"}}) == [12.33, 45.43, 1, 1, 7]


def test_edifici_sagoma_reale_e_wikidata_dentro():
    square = [{"lon": 12.33, "lat": 45.43}, {"lon": 12.331, "lat": 45.43}, {"lon": 12.331, "lat": 45.431}, {"lon": 12.33, "lat": 45.431}, {"lon": 12.33, "lat": 45.43}]
    ring = buildings.encode_ring(square)
    assert ring and len(ring) == 8  # 4 vertici, delta-encoded
    assert buildings.point_in_ring(12.3305, 45.4305, [(c["lon"], c["lat"]) for c in square])
    osm = {"elements": [{"type": "way", "id": i, "geometry": square, "tags": {"building": "yes"}} for i in range(buildings.MIN_BUILDINGS)]}
    wd = [{"qid": "Q1", "name": "Palazzo Prova", "lon": 12.3305, "lat": 45.4305, "inceptions": ["1500-06-01T00:00:00Z"], "style": None, "height": None, "floors": None, "architects": ["Mauro Codussi"]}]
    data = buildings.build(osm, wd)
    dated = [b for b in data["buildings"] if b.get("y")]
    assert len(dated) == 1 and dated[0]["ys"] == "wikidata" and dated[0]["ar"] == "Mauro Codussi"
    assert data["stats"]["withYear"] == 1  # nessuna data inventata per gli altri


def test_geoids_coordinate_e_privacy():
    lon, lat = geoids.lonlat("X: 1373958.29134289, Y: 5690490.9578169, Z: NaN")
    assert 12.3 < lon < 12.4 and 45.4 < lat < 45.5
    base = {"DENOMINAZIONE_STRUTTURA": "", "RAGIONE_SOCIALE": geoids.HIDDEN, "INDIRIZZO": "CASTELLO,4915", "SITOWEB": geoids.HIDDEN,
            "TIPOLOGIA_STRUTTURA": "", "CLASSIFICAZIONE": "", "TELEFONO": "041123", "INDIRIZZO_EMAIL": "a@b.it", "ZONA_IDS": "CENTRO STORICO",
            "PERCENTUALE_RIDUZIONE": "0", "NUMERO_STANZE": "2", "NUMERO_LETTI": "4", "geometry": "X: 1373958.29, Y: 5690490.95, Z: NaN", "_municipality": "Venezia-Murano-Burano"}
    private = [{**base, "DENOMINAZIONE_STRUTTURA": f"MARIO ROSSI {i}", "TIPO_STRUTTURA": "LOCAZIONI TURISTICHE ART.27 BIS L.R.V. 11/2013"} for i in range(geoids.MIN_ROWS)]
    hotel = {**base, "DENOMINAZIONE_STRUTTURA": "HOTEL PROVA", "RAGIONE_SOCIALE": "PROVA SRL", "TIPO_STRUTTURA": "STRUTTURE RICETTIVE ALBERGHIERE"}
    data = geoids.build(private + [hotel], date(2026, 10, 18))
    assert [b["name"] for b in data["businesses"]] == ["HOTEL PROVA"]
    assert data["businesses"][0]["company"] == "PROVA SRL"
    text = str(data)
    assert "MARIO ROSSI" not in text and "041123" not in text and "a@b.it" not in text
    assert data["privateCells"][0][2] == geoids.MIN_ROWS


def test_airbnb_niente_punti_isolati():
    lone = [12.20, 45.30, 0, 100, 1, 0, 0, 1, 0]
    group = [[12.33, 45.43, 0, 100, 1, 0, 0, 1, 0]] * 3
    assert airbnb.drop_isolated([lone, *group]) == group


def test_mimit_ora_di_venezia_in_utc():
    assert mimit.communicated_at("16/01/2026 07:30:00") == "2026-01-16T06:30:00.000Z"
    assert mimit.communicated_at("16/07/2026 07:30:00") == "2026-07-16T05:30:00.000Z"


def test_mimit_solo_prezzi_con_i_distributori_salvati():
    existing = {"stationsItaly": 23000, "stations": [{"id": "1", "lat": 45.4, "lon": 12.3, "prices": [{"fuel": "Benzina", "self": True, "price": 2.0, "communicatedAt": None}]}], "listedWithoutPrices": [{"id": "2", "lat": 45.5, "lon": 12.2, "prices": []}]}
    csv_text = "Estrazione del 2026-10-19\nidImpianto|descCarburante|prezzo|isSelf|dtComu\n2|Benzina|1.9|1|19/10/2026 07:00:00\n99|Benzina|1.5|1|19/10/2026 07:00:00\n"
    d = mimit.reprice(existing, csv_text)
    assert d["extractedAt"] == "2026-10-19"
    assert [s["id"] for s in d["stations"]] == ["2"]  # solo i distributori dell'area, con i prezzi nuovi
    assert [s["id"] for s in d["listedWithoutPrices"]] == ["1"]
