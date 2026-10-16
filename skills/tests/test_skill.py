"""Test della skill venice-open-data: formato di SKILL.md, CLI offline e ZIP pubblicato aggiornato."""

import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import build_skill_zip  # noqa: E402

spec = importlib.util.spec_from_file_location("vod", os.path.join(ROOT, "venice-open-data", "scripts", "vod.py"))
vod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vod)


def test_skill_frontmatter():
    text = open(os.path.join(ROOT, "venice-open-data", "SKILL.md"), encoding="utf-8").read()
    m = re.match(r"^---\nname: (.+)\ndescription: (.+)\n---\n", text)
    assert m, "frontmatter con name e description"
    name, description = m.group(1), m.group(2)
    assert re.fullmatch(r"[a-z0-9-]{1,64}", name)
    assert 50 < len(description) <= 1024


def test_cli_parsing_and_places():
    assert vod.parse_near("45.4380,12.3358") == (45.438, 12.3358)
    assert vod.find_place("rialto")[0][1] == (45.438, 12.3358)
    assert len(vod.load_places()) >= 15


def test_cli_calculation_commands():
    args = vod.build_parser().parse_args(["route", "Ferrovia", "Murano Colonna", "--time", "10:00", "--mode", "water"])
    assert vod.calc_request(args) == ("/api/come-arrivare", {"from": "Ferrovia", "to": "Murano Colonna", "time": "10:00", "mode": "water"})
    args = vod.build_parser().parse_args(["route", "a", "b", "--mode", "private", "--resident"])
    assert vod.calc_request(args)[1]["resident"] == "1"
    args = vod.build_parser().parse_args(["route", "a", "b", "--fare", "veneziaUnica", "--litres-per-hour", "8"])
    assert vod.calc_request(args)[1] | {} == {"from": "a", "to": "b", "mode": "fastest", "fare": "veneziaUnica", "litresPerHour": 8.0}
    assert vod.calc_request(vod.build_parser().parse_args(["departures", "Rialto"])) == ("/api/partenze", {"stop": "Rialto", "minutes": 90})
    assert vod.calc_request(vod.build_parser().parse_args(["flood", "--level", "130", "--from", "Ferrovia", "--to", "Rialto"])) == (
        "/api/acqua-alta", {"levelCm": 130, "from": "Ferrovia", "to": "Rialto"})
    assert vod.calc_request(vod.build_parser().parse_args(["find", "marco polo"])) == ("/api/luoghi", {"q": "marco polo"})
    assert vod.calc_request(vod.build_parser().parse_args(["airport"])) == ("/api/aeroporto", {})


def test_skill_mentions_every_calculation_tool():
    text = open(os.path.join(ROOT, "venice-open-data", "SKILL.md"), encoding="utf-8").read()
    for tool in ("plan_trip", "stop_departures", "flood_simulation", "airport_connections", "find_place", "vodUrl", "sources"):
        assert tool in text, tool


def test_published_zip_is_up_to_date(tmp_path):
    fresh = build_skill_zip.build(str(tmp_path / "skill.zip"))
    published = build_skill_zip.OUT_FILE
    assert os.path.exists(published), "eseguire python skills/build_skill_zip.py"
    with open(fresh, "rb") as a, open(published, "rb") as b:
        assert a.read() == b.read(), "ZIP non aggiornato: eseguire python skills/build_skill_zip.py"
