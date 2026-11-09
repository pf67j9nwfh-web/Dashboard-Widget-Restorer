# Verification — Dashboard Widget Restorer 1.0

Environment: PowerPC Tiger 10.4.11, GCC 4.0.1 / Xcode 2.5 and the 10.4u SDK.
The native helper includes ppc/i386 slices; runtime testing is PowerPC only.
The complete mbedTLS 3.6.7 source/library remains vendored and was rebuilt offline.

## 1.0 Leopard support (version retained)

Leopard 10.5.8 (9L31a), i386, Safari/WebKit 5.0.6 and Python 2.5.1.
The original Leopard Weather and Stocks use their Tiger-era adapter contracts;
other widgets share the newer adaptive controller paths. Original Weather,
Stocks, Translation, currency, Ski Report, Business, ESPN, Movies and People
passed native WebKit checks. The movie video clock advanced using the original
controls. The TLS helper builds from the vendored libraries on Leopard and passes
HTTP parsing, address-filtering and authorization-header validation checks.
The installer admits the exact supported 10.5.8 release and retains version 1.0.
The native test entry point selects the local CPU architecture and available
widget layouts, including Business/Phone Book and original/fallback ESPN.

## 0.4.0 Snow Leopard port

Snow Leopard 10.6.8, native i386 WebKit and original system widget plug-ins:
Weather automatic Paris city selection, stock quotes/chart percentage settings,
Japanese translation, 201 currency rates, Heavenly snow signs, 20 business
matches, 15 NFL scoreboard entries and People browser handoff passed.
Flight selection through the original Snow Leopard controller drew a reported
position; missing-position and scheduled/landed/canceled fixtures passed.
Movies loaded 25 current Apple catalog entries, local posters and an H.264 preview;
the native video clock advanced through the original playback controls. Cinema
settings saved a dummy key through stdin, retained it on reopen, and removed it;
the test restores real configuration. No cinema key was supplied: authenticated
showtimes coverage is unverified, and conversion uses provider-shaped fixtures.

The same package supports both OS versions; original widget source/artwork is
patched locally, never copied between systems or bundled as replacement widgets.
TLS/HTTP tests include rejection of authorization-header injection.

## 0.3.3 map and snow symbols

Native Tiger tests search JFK to LHR, select a result through the original
controller, and require an actual plane draw. Additional native fixtures cover
an active flight without coordinates, canceled flights, scheduled flights, and landed flights.
Unit checks cover worldwide position permission and snow presence, no snow,
current snowfall, and missing snow data. Native screenshots verify both widgets.
The former feed's geographic position restriction and custom-attribute reads
were incompatible with the replacement provider and are corrected.

## 0.3.2 key settings

The original Flight Tracker flip side now has a password field, signup link and
Remove key action. The Tiger WebKit harness exercises saving through stdin,
reopening with a blank masked field and saved-key status, leaving Done blank to
retain the key, and removing it. The harness restores the real key afterward.
Isolated Python 2.3 tests cover private mode 600 creation, ownership, preservation,
validation and symlink rejection. Installer lifecycle tests preserve the saved key.
An authenticated Aviationstack request for AAL flight 100 returned one flight.
Credentials remain in the user's private configuration and are absent from sources.

## 0.3.1 regressions

The actual Tiger WebKit controller tests translate English `hello` to Japanese
`こんにちは`, including the cached provider response with an empty primary result.
The alternatives fallback is also covered by a unit fixture. The Stocks test
flips to settings, changes percentage display, returns to the front, and confirms
the loaded chart is repainted without changing its time range. The provider notice
uses ASCII punctuation in the original footer. Ski's model marker is centered in
its red sign and visually checked in the native rendering.

## Original controllers and controls

The Tiger WebKit integration harness loads the actual restored widget HTML,
controllers and native plugins. Test preferences are isolated from the user's.

- Weather: typed `Paris, France` into the original field and invoked its typing
  handler only. One native results menu appeared; no Find button existed. The
  selected coordinates and displayed city/forecast changed from Dallas to Paris.
- Translation: used the original language menus and original typing handler.
  English `Hello` returned Spanish `Hola` through the original blue globe UI.
- Phone Book: 20 Dallas-area cafe-name/address matches were delivered to the
  original yellow list, with map links and unavailable-phone labels. The original
  distance setting is passed through and results are distance-sorted.
- Flight Tracker: the original gray form/map/native selectors are retained.
  Its existing status area directs users to key settings. Flight response-to-legacy-
  model conversion is fixture-tested and an authenticated provider request passed.
- Ski Report: the original wooden scene rendered Heavenly model temperature and
  snow depth with its unit controls; trails/surface observations remain unavailable.
- Stocks/Currency: original quote/chart and reference-rate paths remain covered
  by the installed-widget native tests.

The harness registers bundled plugins and selects each widget's actual English
localization directory (`English.lproj` or `en.lproj`). Screenshots are rendered
through an offscreen Cocoa window so the original plugin-backed views draw.

## Regression and transport checks

`node tests/unit.js` checks automatic native-menu search, stale-coordinate/search
rejection, retention of original controller functions, absence of replacement UI
routes for the built-in widgets, translation decoding, flight model conversion,
currency conversion, strict JSON, responses above 4 KB and HFS+ filename safety.
Native HTTP tests cover lengths, chunking, truncation, unsupported compression
and private-address rejection.

The 0.3.0 install/uninstall/reinstall lifecycle restored every original bundle
file byte-for-byte and retained backups. The corrected native install and
uninstall packages were executed with Tiger’s Installer.
The development VM is left with the corrected interfaces installed.

## Limits

i386 runtime and long-term provider stability are unverified. Public Overpass instances were unavailable in the earlier audit;
the shipped Phone Book adapter uses Photon instead. Telephone listings, resort
operations, People/white-pages, system timezones and modern Safari compatibility
are not silently fabricated or declared repaired.

## Authenticated cinema activation — version 1.0 retained

A privately supplied API Cinema key was installed in each user's mode-600
configuration file on all three Macs. The API returned 100 showtimes. Native
Movies checks on Leopard and Snow Leopard require populated movie/theater
models and an actual poster file in the private media cache. API Cinema's
Fandango ImageRenderer URLs are now supported; poster rendering does not depend
on a trailer being supplied. No credentials are included in source or packages.

## Apple trailers with cinema configured — version 1.0 retained

Native Movies playback checks passed on Leopard and Snow Leopard with the real
cinema key still configured. The combined browser contained 48 films and 12
theaters. An Apple H.264 trailer played through the original controls with an
advancing video clock; movie/theater counts were unchanged after playback.
Apple's catalog remains browsable in cinema mode. Selected cinema films also
use independent Apple Search API lookups, with strict title/year matching.
Unit checks cover wrong titles, remakes, ambiguous results and merging Apple
previews without losing cinema IDs, real showtimes or booking data. The new
HTTPS lookup route was exercised on Leopard. Keys remain outside the project.
