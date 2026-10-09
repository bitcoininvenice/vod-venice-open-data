---
name: venice-open-data
description: Answers questions about Venice (Venezia) and its lagoon with verified public data from Venice Open Data (VOD) - tide and acqua alta, MOSE, ships (AIS), weather and wind, air quality, pollen, lagoon water, ACTV waterbus stops and live vehicles, Alilaguna, pharmacies, defibrillators, drinking fountains, recycling centres, libraries, car parks, EV charging, fibre coverage, canals and briccole, public works, tourism and municipal statistics. Use it whenever the user asks about Venice, Mestre, Lido, Murano, Burano, Chioggia or the Venetian lagoon, even without naming VOD.
---

# Venice Open Data (VOD)

VOD (https://venice-open-data.vercel.app) publishes open data about Venice and its lagoon, always with
source, licence and the **nature of each value** declared. Your job is to answer with that data and
to keep those labels visible to the user.

## How to get the data

1. **If the VOD MCP connector is available** (tools `list_datasets` and `query_dataset`), use it.
2. **Otherwise run the bundled CLI** (Python 3, no dependencies, needs network access):

```bash
python scripts/vod.py datasets                         # catalogue: id, kind, source, licence
python scripts/vod.py place "Rialto"                   # coordinates of a known place
python scripts/vod.py query pharmacies --near 45.4380,12.3358 --radius 500 --limit 5
python scripts/vod.py query canals --text "Canal Grande" --limit 3
python scripts/vod.py health                           # freshness and availability of every source
```

Recommended sequence: look up the place (`place`, or `reference/places.md`), pick the dataset from the
catalogue, then query with a small `limit` and a `near` radius (300-1000 m in the historic centre).
Never download whole datasets to answer one question.

## Reading the results

Every dataset declares a `kind`. Say it in the answer:

| kind | meaning | how to phrase it |
|---|---|---|
| `live` | measured now (tide, weather, flights, GPS) | "misurato alle 10:30" |
| `forecast` | model forecast (wind, pollen, air, sea) | "previsto dal modello, valido alle…" |
| `simulated` | positions computed from the timetable (Alilaguna) | "posizione stimata dall'orario" |
| `dataset` | official open dataset (ARPAV, Comune, AGCOM…) | cite the body and the year |
| `osm` | OpenStreetMap (ODbL) | "mappato su OpenStreetMap" |
| `curated` | project list to be verified | "elenco del progetto, da verificare" |

Also report the `caveat` field when it matters (for example "copertura della rete, non servizio attivo",
"non usare per la navigazione", "i turni delle farmacie non sono open data").

## Rules

- Cite source and licence briefly at the end of the answer (e.g. "Fonte: ARPAV, CC BY 4.0").
- Never present a forecast as a measurement, or a curated list as official data.
- Tide heights are in cm above the Punta della Salute datum; acqua alta starts around +80/+110 cm.
- For emergencies tell the user to call **112**; for duty pharmacies link https://www.aulss3.veneto.it/Farmacie-di-turno.
- Answer in the user's language (VOD data and labels are mostly in Italian).
- For socio-economic indicators of other Italian municipalities, the AgID **Cruscotto Italia** MCP server
  (`https://cruscotto-italia-mcp.agid.workers.dev/mcp`) is the right source; VOD covers Venice, Chioggia and Cavallino-Treporti.

## Good citizenship

The CLI sends a recognisable User-Agent and waits when the server answers `429` (it honours `Retry-After`).
Keep to a few requests per question; the public limit is 60 MCP requests per minute.

See `reference/places.md` for coordinates of common places and `reference/datasets.md` for dataset hints.
