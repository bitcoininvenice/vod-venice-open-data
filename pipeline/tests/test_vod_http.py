"""Test del modulo HTTP condiviso, con urlopen e sleep sostituiti (nessun accesso alla rete)."""

import io
import json
import os
import sys
import urllib.error

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import vod_http  # noqa: E402


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


@pytest.fixture
def net(monkeypatch):
    """Coda di risposte (bytes o eccezioni) per urlopen; registra richieste e attese."""
    state = {"queue": [], "requests": [], "sleeps": []}

    def urlopen(req, timeout=None):
        state["requests"].append(req)
        item = state["queue"].pop(0)
        if isinstance(item, Exception):
            raise item
        return FakeResponse(item)

    monkeypatch.setattr(vod_http.urllib.request, "urlopen", urlopen)
    monkeypatch.setattr(vod_http.time, "sleep", lambda s: state["sleeps"].append(s))
    return state


def http_error(code, retry_after=None):
    headers = {"Retry-After": retry_after} if retry_after else {}
    return urllib.error.HTTPError("https://x", code, "err", headers, None)


def test_user_agent_e_parametri(net):
    net["queue"].append(b"ok")
    assert vod_http.fetch_bytes("https://example.org/a", params={"q": "Rialto"}) == b"ok"
    req = net["requests"][0]
    assert req.full_url == "https://example.org/a?q=Rialto"
    assert req.get_header("User-agent") == vod_http.USER_AGENT


def test_riprova_con_attesa_crescente(net):
    net["queue"] += [OSError("down"), OSError("down"), b"ok"]
    assert vod_http.fetch_bytes("https://x", retries=3, backoff=10) == b"ok"
    assert net["sleeps"] == [10, 20]


def test_rispetta_retry_after_dopo_429(net):
    net["queue"] += [http_error(429, "42"), b"ok"]
    vod_http.fetch_bytes("https://x", retries=2)
    assert net["sleeps"] == [42.0]


def test_errore_dopo_l_ultimo_tentativo(net):
    net["queue"] += [OSError("down"), OSError("down")]
    with pytest.raises(OSError):
        vod_http.fetch_bytes("https://x", retries=2)


def test_testo_con_bom(net):
    net["queue"].append("﻿a;b\n".encode("utf-8"))
    assert vod_http.fetch_text("https://x") == "a;b\n"


def test_overpass_passa_all_istanza_successiva(net, monkeypatch):
    monkeypatch.setattr(vod_http, "OVERPASS_URLS", ["https://a/api", "https://b/api"])
    net["queue"] += [http_error(504), json.dumps({"elements": [{"id": 1}]}).encode()]
    payload = vod_http.overpass("node(1);out;")
    assert payload["elements"] == [{"id": 1}]
    assert [r.full_url for r in net["requests"]] == ["https://a/api", "https://b/api"]
    assert net["requests"][0].data == b"data=node%281%29%3Bout%3B"


def test_overpass_risposta_senza_elements_non_e_valida(net, monkeypatch):
    monkeypatch.setattr(vod_http, "OVERPASS_URLS", ["https://a/api"])
    net["queue"] += [b'{"remark": "timeout"}', b'{"remark": "timeout"}']
    with pytest.raises(RuntimeError):
        vod_http.overpass("q", rounds=2)


def test_nominatim_distanzia_le_richieste(net, monkeypatch):
    clock = iter([100.0, 100.2, 100.6, 100.7])  # prima chiamata finita a 100.2, seconda a 100.6
    monkeypatch.setattr(vod_http.time, "monotonic", lambda: next(clock))
    monkeypatch.setattr(vod_http, "_last_nominatim", 0.0)
    net["queue"] += [b"[]", b"[]"]
    vod_http.nominatim("search", {"q": "Rialto"})
    vod_http.nominatim("search", {"q": "Lido"})
    assert net["sleeps"] == [pytest.approx(0.7)]
    assert "format=jsonv2" in net["requests"][0].full_url
