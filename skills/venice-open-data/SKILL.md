---
name: venice-open-data
description: Answers questions about Venice (Venezia) and its lagoon with verified public data from Venice Open Data (VOD) - how to get from A to B with all ACTV and Alilaguna services, on foot or by own boat, next departures of waterbuses, buses, tram and People Mover, acqua alta simulation and dry walking routes, airport connections, tide and MOSE, weather and wind, air quality, pollen, lagoon water, live vehicles, pharmacies, defibrillators, drinking fountains, recycling centres, libraries, car parks, EV charging, fibre coverage, canals, public works, city orders, tourism and municipal statistics. Use it whenever the user asks about Venice, Mestre, Lido, Murano, Burano, Chioggia or the Venetian lagoon, even without naming VOD.
---

# Venice Open Data (VOD)

VOD (https://venice-open-data.vercel.app) publishes open data about Venice and its lagoon, always with
source, licence and the **nature of each value** declared. Your job is to answer with that data and
to keep those labels visible to the user.

## How to get the data

1. **If the VOD MCP connector is available**, use its tools: `list_datasets` and `query_dataset` for data,
   `plan_trip`, `stop_departures`, `flood_simulation`, `airport_connections` and `find_place` for calculations.
2. **Otherwise run the bundled CLI** (Python 3, no dependencies, needs network access):

```bash
python scripts/vod.py datasets                         # catalogue: id, kind, source, licence
python scripts/vod.py place "Rialto"                   # coordinates of a known place
python scripts/vod.py query pharmacies --near 45.4380,12.3358 --radius 500 --limit 5
python scripts/vod.py query canals --text "Canal Grande" --limit 3
python scripts/vod.py health                           # freshness and availability of every source
python scripts/vod.py route "Ferrovia" "Murano Colonna"          # how to get there, now, with alternatives
python scripts/vod.py route "Cannaregio 3450" aeroporto --time 07:30 --date 2026-10-20
python scripts/vod.py route "45.4318,12.3283" "Zattere" --mode private --resident   # own boat, Testo Unico rules
python scripts/vod.py departures "Rialto" --minutes 60          # next departures (ACTV and Alilaguna timetables)
python scripts/vod.py flood --level 130 --place "Piazza San Marco" --from Ferrovia --to Rialto
python scripts/vod.py airport                                   # bus, Alilaguna and FlixBus at the airport, next 90 min
python scripts/vod.py find "calle minestra"                     # how VOD recognises a place
```

## Calculations (same engine as the VOD map)

| Question | Tool / CLI | Notes |
|---|---|---|
| How do I get from A to B? | `plan_trip` / `route` | All ACTV services (waterbuses, buses, tram, People Mover) and Alilaguna, up to 4 vehicles with walking changes; alternatives with fewer changes; `mode`: fastest, walk, water, private (own boat). Places: stop, address, house number, "aeroporto" or `lat,lon`. Area: Chioggia to Mestre, airport and Treporti. Each itinerary has `cost` (estimated tickets for `fare`: ordinary, veneziaUnica, pass; suburban lines not priced) and `cheapestItinerary`; with `private` and `litresPerHour`, `fuel` is a rough fuel estimate. Always say it is an estimate and that ACTV/Alilaguna fares prevail |
| When is the next boat / bus? | `stop_departures` / `departures` | Official timetable, no delays; if nothing soon, `nextRun` (also tomorrow). For live delays use the `realtime_vehicles` dataset |
| Acqua alta at +X cm? Will I get wet? | `flood_simulation` / `flood` | Flooded share of the historic centre (CPSM table), sirens, MOSE, passerelle; a place's estimated ground level; the driest walking route |
| Airport buses and boats | `airport_connections` / `airport` | Next 90 minutes; flight times are not open data |

Read `hurry` (leave now or you miss it), `ifYouMissIt`, `tomorrowMorning` and `caveat` in the answers and tell
the user. Own-boat routes are **indicative, not for navigation**: always say so.

Recommended sequence: look up the place (`place`, or `reference/places.md`), pick the dataset from the
catalogue, then query with a small `limit` and a `near` radius (300-1000 m in the historic centre).
Never download whole datasets to answer one question.

## Reading the results

Every dataset declares a `kind`. Say it in the answer:

| kind | meaning | how to phrase it |
|---|---|---|
| `live` | measured now (tide, weather, GPS) | "misurato alle 10:30" |
| `forecast` | model forecast (wind, pollen, air, sea) | "previsto dal modello, valido alle…" |
| `simulated` | positions computed from the timetable (Alilaguna) | "posizione stimata dall'orario" |
| `dataset` | official open dataset (ARPAV, Comune, AGCOM…) | cite the body and the year |
| `osm` | OpenStreetMap (ODbL) | "mappato su OpenStreetMap" |
| `curated` | project list to be verified | "elenco del progetto, da verificare" |

Also report the `caveat` field when it matters (for example "copertura della rete, non servizio attivo",
"non usare per la navigazione", "i turni delle farmacie non sono open data").

## Rules

- Cite source and licence briefly at the end of the answer (e.g. "Fonte: ARPAV, CC BY 4.0").
- Calculation tools return `sources` (only the sources actually used, with licence and link) and `vodUrl`
  (the same result on the VOD map): end the answer with them, e.g. "Fonti: orario ACTV (CC BY), OpenStreetMap
  (ODbL) · calcolato da Venice Open Data: <vodUrl>".
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
