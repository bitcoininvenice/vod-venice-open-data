"""
Test delle funzioni pure e dell'integrazione della pipeline Geoportale SIT Venezia.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import import_geoportale as geo  # noqa: E402


def test_simplify_ring_keeps_endpoints():
    ring = [[0.0, 0.0], [0.5, 0.00001], [1.0, 0.0], [0.0, 0.0]]
    simplified = geo.simplify_ring(ring, tol=0.001)
    assert len(simplified) < len(ring)
    assert simplified[0] == [0.0, 0.0]
    assert simplified[-1] == [0.0, 0.0]


def test_compute_bbox_and_centroid():
    pts = [[12.0, 45.0], [12.2, 45.0], [12.2, 45.4], [12.0, 45.4]]
    bbox = geo.compute_bbox(pts)
    assert bbox == [12.0, 45.0, 12.2, 45.4]

    centroid = geo.compute_centroid(pts)
    assert centroid == [12.1, 45.2]


def test_parse_geoportale_catalog_structure():
    fixture_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fixtures", "geoportale_site_map.json")
    assert os.path.exists(fixture_path), "Fixture geoportale_site_map.json deve esistere"

    with open(fixture_path, encoding="utf-8") as f:
        site_map = json.load(f)

    services = geo.parse_geoportale_catalog(site_map)
    assert len(services) == 28, f"Attesi 28 servizi, trovati {len(services)}"

    # Verifica campi obbligatori di ogni servizio
    for s in services:
        assert "id" in s
        assert "name" in s
        assert "theme" in s
        assert "layers" in s
        assert "deepLinkUrl" in s
        assert "openDataStatus" in s
        assert s["deepLinkUrl"].startswith("https://geoportale.comune.venezia.it")
        assert len(s["layers"]) == s["layerCount"]


def test_parse_municipalita_creates_all_six():
    mun_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fixtures", "dbgt_municipalita.json")
    assert os.path.exists(mun_path), "Fixture dbgt_municipalita.json deve esistere"

    with open(mun_path, encoding="utf-8") as f:
        dbgt_data = json.load(f)

    municipalities = geo.parse_municipalita(dbgt_data, {})
    assert len(municipalities) == 6, f"Attese 6 municipalita, trovate {len(municipalities)}"

    names = [m["name"] for m in municipalities]
    assert any("Venezia insulare" in n for n in names)
    assert any("Mestre centro" in n for n in names)
    assert any("Marghera" in n for n in names)

    for m in municipalities:
        assert len(m["rings"]) > 0
        assert len(m["bbox"]) == 4
        assert len(m["centroid"]) == 2


def test_build_tutela_zones_contains_normative():
    zones = geo.build_tutela_zones()
    assert len(zones) >= 4
    for z in zones:
        assert "normative" in z
        assert "level" in z
        assert len(z["centroid"]) == 2


def test_geoportale_output_json_integrity():
    out_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "web", "src", "data", "geoportale-venezia.json")
    assert os.path.exists(out_file), "geoportale-venezia.json deve essere generato"

    with open(out_file, encoding="utf-8") as f:
        data = json.load(f)

    assert data["source"].startswith("Comune di Venezia")
    assert data["license"].startswith("IODL 2.0")
    assert data["nature"] == "measured"
    assert data["stats"]["totalServices"] == 28
    assert data["stats"]["totalLayers"] >= 300
    assert len(data["municipalities"]) == 6
    assert len(data["sestieri"]) >= 6
