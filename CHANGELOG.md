# Changelog

## 1.0 — 2026-11-08

- Preserve Apple catalog/trailer playback with cinema configured; independently
  match cinema films to Apple previews without replacing their real showtimes.

- Verify authenticated cinema schedules and support Fandango poster images.

- Add and verify Leopard 10.5.8 support without changing the 1.0 version.

- Name the project Dashboard Widget Restorer and publish the 1.0 release.
- Rename installer, uninstaller, release files and repository folder.
- Retain compatible runtime paths so existing keys, preferences and backups survive updates.

## 0.4.0 — 2026-11-08

- Support Snow Leopard 10.6.8 alongside Tiger 10.4.11 with reversible installers.
- Adapt Snow Leopard Weather, Stocks, Business, Translation, Ski and Flight
  controllers while preserving each system’s original interfaces.
- Restore Snow Leopard’s original ESPN scores and news with current feeds.
- Restore Movies using Apple’s no-key catalog, cached posters and H.264 previews,
  with an HTML5 video bridge behind the existing controls.
- Add optional API Cinema schedules and private key entry on Movies settings.
- Keep People’s original form and open Whitepages web results, as requested.
- Prefix all added scripts to avoid case-insensitive filesystem collisions.

## 0.3.3 — 2026-11-08

- Fix selected airline/route attributes in Flight Tracker detail requests.
- Remove the obsolete North-America-only plane marker restriction. Use reported
  coordinates worldwide, without snapping them to the route. Missing positions
  show the route and a clear unavailable label; no location is invented.
- Replace Ski Report’s Model word with snow/no-snow symbols and labels, with an
  unknown state for missing snow data. Weather-model attribution stays in tooltips.

## 0.3.2 — 2026-11-08

- Add private API key entry, signup link and removal to Flight Tracker’s original
  settings side. Done saves a new key; blank input keeps an existing key.
- Initialize private per-user configuration during installation without replacing
  saved keys. Pass key input through stdin rather than command arguments.

## 0.3.1 — 2026-11-08

- Recover Japanese translations when MyMemory returns an empty primary result
  but supplies a valid high-confidence translation in its alternatives.
- Move the Stocks provider/delay notice into the original footer with ASCII text.
- Repaint the stock chart after percentage settings and Dashboard resizing.
- Center the Ski Report model marker within its original red sign.

## 0.3.0 — 2026-11-08

- Restore Apple's original Phone Book, Translation, Flight Tracker, and Ski Report
  HTML, artwork, native controls, animations, and existing result views.
- Put the service changes behind the original parser/callback interfaces.
- Restore Weather's native city-results menu and automatic validation after typing;
  remove the added Find button and custom dropdown.
- Preserve Translation's original automatic typing delay and language controls.
- Add offline public airport coordinates for the original flight map and adapt
  airline/flight/airport filters to Aviationstack. A user key is still required.
- Respect the yellow Phone Book's distance setting and preserve its results list.
- Keep missing phone/trail/surface information clearly unavailable.

## 0.2.0 — 2026-11-08

- Consolidate the Weather prototype into a self-contained source repository.
- Vendor complete patched mbedTLS 3.6.7 source and build the archive offline.
- Add project-owned TLS/HTTP transport, private caching, and lossless local-file
  responses for Tiger's 4 KB command-output limitation.
- Replace Weather city popup; clear stale coordinates and reject stale searches.
- Keep original Weather/Stocks/Currency interfaces while changing providers.
- Add snow, business-search, optional flight, sports, and translation panels.
- Add backups, module selection, repeatable installs, restore-based uninstall,
  native Tiger Installer packages, and regression/integration tests.
- Document unrepaired gaps and data-provider limitations explicitly.
