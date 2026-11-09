#!/bin/sh
# Build and run on either supported system with Xcode and the vendored libraries.
set -eu
cd "$(dirname "$0")/.."
TLS="$PWD/third_party/mbedtls"
TW_TEST_ARCH=i386
if [ "$(uname -p)" = "powerpc" ]; then TW_TEST_ARCH=ppc; fi
gcc -O2 -std=gnu99 -arch "$TW_TEST_ARCH" -mmacosx-version-min=10.4 \
  -isysroot /Developer/SDKs/MacOSX10.4u.sdk \
  "-DMBEDTLS_USER_CONFIG_FILE=\"$TLS/tb_config.h\"" \
  -I"$TLS" -I"$TLS/include" tests/http-test.c "$TLS/lib/libmbedtls32.a" -lpthread -o build/http-test
./build/http-test
