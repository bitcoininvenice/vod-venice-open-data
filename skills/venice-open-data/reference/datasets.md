# Dataset hints

Run `python scripts/vod.py datasets` (or the MCP tool `list_datasets`) for the live catalogue. Typical choices:

| Question | Dataset id | Tip |
|---|---|---|
| Tide now / acqua alta forecast | `tide` | `context.reference`, `context.forecast` with issue time; CPSM data: reuse under CC BY-SA 3.0 (cite "Comune di Venezia – Centro Maree") |
| Wind, waves, air temperature | `weather_stations`, `wind_forecast`, `marine_platform` | stations are measurements, grid is a forecast |
| Air quality | `air_quality` | annual ARPAV means + hourly CAMS forecast in `forecast` |
| Pollen | `pollen` | forecast; the Venezia point also has the ARPAV measured calendar |
| Lagoon water | `lagoon_probes` | last ARPAV sampling per station, with date |
| Is my line running late right now? Bunched boats, trips without GPS | `service_now` | snapshot of this moment, no history; `withoutGps` is a hint, not proof of cancellation |
| Last waterbus from a stop tonight | `last_departures` | today's day type from the official timetable; `afterMidnight`; strikes and same-day changes not included |
| Does the timetable require speeding? | `schedule_speed` | computed from the timetable, not measured; `tooFast` = timetable incompatible with known limits (60 s rounding tolerance, 10% route margin); Harbour Office channels excluded |
| Is my stop moved or my line diverted? | `actv_notices` | latest official ACTV notices with stops and lines cited; link `url` to the notice, which prevails |
| Long-distance coaches (FlixBus) through Venice today | `flixbus` | timetable only (no real time); cite © FlixMobility, ODbL |
| Bus stops (Mestre, Lido, Pellestrina) | `bus_stops` | all ACTV bus stops with lines and GTFS codes |
| Waterbus stops / live boats | `public_transport_stops`, `realtime_vehicles` | live GPS only when the ACTV feed is up; `delay` = seconds, status, next stop; `source=position` computed from GPS against the official timetable and checked with ACTV (`actvSeconds`), `source=actv` reported by ACTV; `delayConflict` = values disagree, no delay shown; only if updated < 2 min ago |
| Pharmacies, defibrillators | `pharmacies`, `defibrillators` | duty rota is not open data |
| Drinking fountains (working / not working) | `drinking_fountains` | Venice Tap Water (venicetapwater.org, primary; always cite it with the link) + OpenStreetMap |
| Recycling, libraries, car parks, EV | `recycling_centres`, `libraries`, `parkings`, `ev_charging` | OpenStreetMap |
| Fibre at an address | `fiber_coverage` | `near` with radius 100-200 m |
| Canals and channel markers | `canals`, `channel_markers` | not for navigation |
| Canal closures, works, events, road changes, city-wide orders (City orders) | `city_orders` | orders in force or starting within 7 days, every area, mainland-only excluded; link `url` to the act, which prevails; `positionSource` comune/place/canal, some have no position; `status=unverified` = validity not read |
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

Ships (AIS) and flights (ADS-B) are shown on the VOD map only and are not available through MCP: their sources do not allow redistribution.
