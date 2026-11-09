#!/bin/sh
# Rebuild the bundled 32-bit TLS archive using only the vendored patched sources.
set -eu
cd "$(dirname "$0")/.."
TLS="$PWD/third_party/mbedtls"
OBJ="$PWD/build/tls-objects"
mkdir -p "$OBJ"
for source in "$TLS"/src/mbedtls/library/*.c; do
  gcc -O2 -std=gnu99 -arch ppc -arch i386 -mmacosx-version-min=10.4 \
    -isysroot /Developer/SDKs/MacOSX10.4u.sdk -D_DARWIN_C_SOURCE \
    "-DMBEDTLS_USER_CONFIG_FILE=\"$TLS/tb_config.h\"" \
    -I"$TLS/src/mbedtls/include" -I"$TLS/src/mbedtls/library" \
    -c "$source" -o "$OBJ/$(basename "$source" .c).o"
done
libtool -static -o "$TLS/lib/libmbedtls32.a" "$OBJ"/*.o
echo 'Rebuilt TLS for PowerPC and i386. Run scripts/build.sh next.'
