# Contributing

Keep runtime JavaScript compatible with Tiger's ES3-era WebKit. Avoid `fetch`,
Promises, JSON.parse, ES5 array helpers, or modern syntax in `src/`. Parse remote
responses as data, never with eval or innerHTML. Prefer text nodes/innerText.

Installer/build Python must run on Tiger's Python 2.3. Do not add pip runtime
dependencies, modern Python syntax, or imports such as hashlib/subprocess that
are absent from that interpreter. Use POSIX shell for `.command` and build scripts.

Keep project adapters in `TW-`-prefixed installed files when their names would
collide with Apple controllers on case-insensitive HFS+. Never commit Apple's
widget code, user API keys, or generated user preferences.

Run `node tests/unit.js` on the modern development host. Rebuild and run
`make test` on a development Tiger machine after installing the patched modules.
For packaging/restore changes, build packages and run
`sudo python tests/lifecycle.py`; it uninstalls and reinstalls the suite, so use
a backed-up development VM. Record any untested optional provider honestly.

Use `make release` to produce the legacy packages, HFS+ DMG, ZIP, and full source
archive. Keep upstream TLS/CA provenance and license notices in distribution.
Document API endpoint stability, data age, limits, and any reduction in feature
coverage. Do not present modeled data as observed resort operations or missing
data as a real zero.
