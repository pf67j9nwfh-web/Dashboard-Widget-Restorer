.PHONY: all tls test test-js package release
all:
	sh scripts/build.sh
tls:
	sh scripts/rebuild-tls.sh
test:
	sh scripts/test-native.sh
test-js:
	node tests/unit.js
package:
	/usr/bin/python scripts/package.py
release:
	sh scripts/release.sh
