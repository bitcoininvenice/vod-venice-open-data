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
| Waterbus stops / live boats | `public_transport_stops`, `realtime_vehicles` | live GPS only when the ACTV feed is up |
| Pharmacies, defibrillators | `pharmacies`, `defibrillators` | duty rota is not open data |
| Fountains, recycling, libraries, car parks, EV | `drinking_fountains`, `recycling_centres`, `libraries`, `parkings`, `ev_charging` | OpenStreetMap |
| Fibre at an address | `fiber_coverage` | `near` with radius 100-200 m |
| Canals and channel markers | `canals`, `channel_markers` | not for navigation |
| Public works | `public_works` | positions are approximate |
| Tourism and municipal statistics | `tourism`, `municipal_profile` | yearly figures by municipality |
| Is a source up to date? | `sources_status` | |
