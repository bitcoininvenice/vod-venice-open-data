# Dataset hints

Run `python scripts/vod.py datasets` (or the MCP tool `list_datasets`) for the live catalogue. Typical choices:

| Question | Dataset id | Tip |
|---|---|---|
| Tide now / acqua alta forecast | `tide` | `context.reference`, `context.forecast` with issue time |
| Wind, waves, air temperature | `weather_stations`, `wind_forecast`, `marine_platform` | stations are measurements, grid is a forecast |
| Air quality | `air_quality` | annual ARPAV means + hourly CAMS forecast in `forecast` |
| Pollen | `pollen` | forecast; the Venezia point also has the ARPAV measured calendar |
| Lagoon water | `lagoon_probes` | last ARPAV sampling per station, with date |
| Ships in the lagoon (AIS) | `ships` | real AIS positions heard in the last 30 minutes; `lastSeen` per ship |
| Waterbus stops / live boats | `public_transport_stops`, `realtime_vehicles` | live GPS only when the ACTV feed is up; `delay` = seconds, status, next stop; `source=position` computed from GPS against the official timetable and checked with ACTV (`actvSeconds`), `source=actv` reported by ACTV; `delayConflict` = values disagree, no delay shown; only if updated < 2 min ago |
| Pharmacies, defibrillators | `pharmacies`, `defibrillators` | duty rota is not open data |
| Drinking fountains (working / not working) | `drinking_fountains` | Venice Tap Water (venicetapwater.org, primary; always cite it with the link) + OpenStreetMap |
| Recycling, libraries, car parks, EV | `recycling_centres`, `libraries`, `parkings`, `ev_charging` | OpenStreetMap |
| Fibre at an address | `fiber_coverage` | `near` with radius 100-200 m |
| Canals and channel markers | `canals`, `channel_markers` | not for navigation |
| Public works | `public_works` | positions are approximate; field `bdap` adds actual stage, dates, cost and funding when the CUP is in the State monitoring |
| Works under construction, public spending on works | `public_works_bdap` | State Public Works Monitoring (BDAP); `meta.summary` has all City projects by stage, sector and funding |
| Venetian house numbers ("Cannaregio 3450") | `house_numbers` | OpenStreetMap, partial coverage (poor in Dorsoduro); numbering is by sestiere, Giudecca has its own |
| Parks, public gardens, playgrounds, dog parks, nature reserves | `parks` | OpenStreetMap; no official open dataset from the City; private places excluded |
| Marinas, boat fuel, slipways, moorings | `nautical` | OpenStreetMap; City concessions and time-limited berths are not open data |
| Sport courts, outdoor fitness, clubs | `sports` | CAMPO community reports (hours, parish courts) + OpenStreetMap; cite “Dati forniti dalla comunità di CAMPO Venezia” (CC BY 4.0) for `source=CAMPO` |
| Wi-Fi in hotels, bars, libraries (not the City network) | `wifi_venues` | OpenStreetMap; `access`: free, customers, paid or unknown |
| LoRaWAN radio network (The Things Network) | `lora_gateways` | online gateways only, position as published by the owner, no owner identifiers |
| Residents, age, households, empty or non-resident homes by sestiere, island, municipality | `census` | ISTAT 2021 census, sections summed by OSM outline; the City publishes no open data by sestiere |
| Tourism and municipal statistics | `tourism`, `municipal_profile` | yearly figures by municipality |
| Is a source up to date? | `sources_status` | |
