# Architecture — 0.3.0

The original widget HTML, CSS, images and controllers are restored from the
first-install backups. Project ES3 adapters are loaded after those controllers
and translate modern provider responses into their original callback contracts.
No replacement page is used for Weather, Phone Book, Translation, Flight Tracker,
Ski Report, Stocks or Currency. Only the incomplete ESPN bundle uses a fallback.

The original native plugins are preserved: Phone Book's yellow native search
input, Flight Tracker's airline/airport combo boxes and Translation's text/font
helper. Existing animation, paging, language/unit menus and map drawing remain
in Apple's controllers. New adapter filenames are prefixed where needed to
avoid HFS+'s case-insensitive Weather.js/weather.js collisions.

Weather attaches a 600 ms typing debounce to the existing location input, then
calls the original native validation menu. Editing clears coordinates and
invalidates old responses. The original Done behavior is retained; no additional
button or HTML select is injected. Translation uses its original typing delay,
and passes the text directly as UTF-8 to the new service.

The common bridge runs a named route in `tw-fetch`, which performs bounded HTTPS
GETs using the vendored mbedTLS 3.6.7 library. Certificate and hostname checks,
connect/read/overall timeouts, no-redirect behavior, chunk decoding and the
4 MiB response limit remain. Responses are private local files, referenced by
small receipts and released after JavaScript reads them. This avoids Tiger's
4 KB widget.system output limit. JSON is parsed without eval.

Successful responses are cached per URL: city/place geocoding 24 hours;
weather/snow/stocks 15 minutes; currency six hours; business search one hour;
flight 30 minutes; sports five minutes; translation 24 hours. Flight keys are
read from the user's private key file, not placed in JavaScript or command lines.

Original Flight Tracker maps use a generated offline airport-coordinate table.
Provider legs, statuses, times and optional tracking data are converted to the
legacy model. Actual authenticated provider results require the user's key;
missing information is not filled with fabricated live positions.

The installer stages selected bundles, preserves first-install backups, records
successful replacements, and rejects concurrent changes. The native uninstall
package restores those originals and retains preferences/keys/recovery copies.
No listener, proxy, daemon or login item is installed.

## Snow Leopard (0.4.0)

`manage.py` accepts 10.4.11, 10.5.8 and 10.6.8, restores each machine's own originals,
and selects platform adapters. All project scripts use a `TW-` filename prefix
so HFS+ cannot overwrite original ESPN.js or Movies.js. A complete ESPN uses
its original controller; only an incomplete Tiger bundle gets the fallback.
Snow Leopard Business consumes generated XML through its original XSLT list.
Movies uses the original Movie/Theater/Time models and browser, with a native
HTML5 video bridge implementing the controller's old QuickTime methods.
Optional cinema credentials use the same private per-user config helper.
Movies and cinema images are downloaded to private, bounded, cached media files;
JSON is never interpreted as JavaScript. Bearer headers are validated and never
forwarded through redirects (redirects are rejected).

Leopard keeps the older Weather and Stocks paths while sharing compatible
controller adapters for its other built-ins. Support is added under version 1.0;
configuration and backup paths are unchanged for upgrade compatibility.
