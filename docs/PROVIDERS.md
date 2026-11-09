# Providers and route reference

Original widget interactions trigger provider requests. Weather validates its
location field automatically after typing; Translation keeps its original typing
delay. Weather and Stocks refresh while shown, and Currency retains its own UI.
Provider limits can change. No paid service is purchased or enabled implicitly.

| Route | Service | Notes |
| --- | --- | --- |
| `geocode QUERY` | Open-Meteo Geocoding | URI-encoded city/postal term; up to 20 matches. |
| `forecast LAT LON` | Open-Meteo Forecast | Fahrenheit for the legacy Weather controller; model-derived current conditions. |
| `ski LAT LON` | Open-Meteo Forecast | Metric temperatures, snow depth and daily snowfall. Not a resort report. |
| `currency` | Frankfurter v2 | USD-base daily reference rates; six-hour local cache. |
| `stock SYMBOL RANGE` | Yahoo Finance public chart | URI-encoded ticker; ranges 1d/5d/1mo/3mo/6mo/1y/2y/5y/max. Unofficial. |
| `stock-search QUERY` | Yahoo Finance public search | Up to 10 quote matches. Unofficial. |
| `business-search QUERY LAT LON [MILES]` | Photon / OpenStreetMap | URI-encoded term, bounded distance setting, up to 20 matches. No phone numbers. |
| `flight-query AIRLINE NUMBER DEP ARR` | Aviationstack | Optional user key; original filters/tracking refresh, 30-minute cache. |
| `sports LEAGUE` | ESPN public scoreboard | nfl/nba/mlb/nhl. Unofficial endpoint. |
| `place-geocode QUERY` | Photon | Original Ski Report location/resort finder. |
| `translate TEXT FROM TO` | MyMemory | URI-encoded text, 500 UTF-8 bytes maximum; language codes including zh-CN/zh-TW. |
| `places CATEGORY LAT LON` | Overpass (experimental) | Up to 20 mapped POIs within 3 km; not used by the default UI. |

Normally the helper prints a receipt for the local response file. Developers
can use `build/tw-fetch --stdout currency` to inspect the JSON directly.
`release response-NAME` removes only a named response file within this user's
private cache.

## Terms and documentation

- Open-Meteo: https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/geocoding-api
  — attribute Open-Meteo; free API is for permitted non-commercial usage.
- Frankfurter: https://frankfurter.dev/ — free reference-rate API, no key;
  rates are not live transaction quotes.
- Yahoo Finance: https://finance.yahoo.com/ — public endpoints are not a
  documented, guaranteed API. Observe Yahoo's terms and service limits.
- Photon: https://github.com/komoot/photon — public demo service allows
  reasonable use but can throttle or change. No autocomplete or background
  bulk jobs are implemented here.
- OpenStreetMap: https://www.openstreetmap.org/copyright — ODbL data attribution.
- Aviationstack: https://aviationstack.com/pricing and
  https://docs.apilayer.com/aviationstack/docs/api-documentation — user account
  and key required. Current free plan is limited; check the account's plan.
- ESPN: https://www.espn.com/ — public scoreboard endpoint, no formal API
  availability commitment assumed.
- MyMemory: https://mymemory.translated.net/doc/spec.php and
  https://mymemory.translated.net/doc/usagelimits.php — free usage quotas and
  500-byte per-query limit. Translation text goes to the service.
- Overpass: https://wiki.openstreetmap.org/wiki/Overpass_API — public instances
  can be overloaded. An administrator may override the experimental endpoint
  by placing an HTTPS interpreter URL, without a query string, in
  `/Library/Application Support/TigerWidgets/places-provider.txt`.

Nominatim's public endpoint is deliberately not used by this release.

## Snow Leopard additions (0.4.0)

- Apple Movies catalog: `https://itunes.apple.com/us/rss/topmovies/limit=25/json`.
  No key; store catalog, posters and previews, not cinema listings. Retained
  alongside configured cinema listings. Apple Search API at
  `https://itunes.apple.com/search?term=...&entity=movie&country=us&limit=25`
  independently resolves selected cinema titles to previews. Exact normalized
  title and release year within one year are required; ambiguous matches fail
  closed. Lookup results cache for six hours.
- ESPN scoreboard and news: `https://site.api.espn.com/apis/site/v2/sports/`;
  the original widget consumes the adapted games and stories. Public, unofficial.
- API Cinema: [documentation](https://api-cinema.com/en/docs), optional private
  key with Bearer authentication. Local showtimes, films and theaters are mapped
  to the original browser. Coverage and quotas belong to the provider. A free
  account is available; no account is created or shipped by this project.
- Whitepages: the user explicitly chose web results from the original People form.
  This is browser handoff, not an authenticated directory API or an inline repair.
- Movie media downloads are restricted to Apple image/video hosts, TMDB image paths and the Fandango ImageRenderer
  path returned by API Cinema. Bodies are bounded to 64 MiB for media; ordinary JSON remains 4 MiB.
  Files stay private in the per-user cache. Keys never travel in command arguments.
