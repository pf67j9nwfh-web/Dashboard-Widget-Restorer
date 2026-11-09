#!/bin/sh
# Build on Tiger with Xcode 2.5; no network access required.
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
TLS="$PWD/third_party/mbedtls"
gcc -O2 -std=gnu99 -arch ppc -arch i386 -mmacosx-version-min=10.4 \
  -isysroot /Developer/SDKs/MacOSX10.4u.sdk \
  "-DMBEDTLS_USER_CONFIG_FILE=\"$TLS/tb_config.h\"" \
  -I"$TLS" -I"$TLS/include" src/tw-fetch.c src/https.c \
  "$TLS/lib/libmbedtls32.a" -lpthread -o build/tw-fetch
cp "$TLS/cacert.pem" build/cacert.pem
echo 'Built universal PowerPC/i386 HTTPS helper in build/.'
