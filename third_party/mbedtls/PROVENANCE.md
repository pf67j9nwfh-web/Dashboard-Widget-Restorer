# TLS provenance

Version: mbedTLS **3.6.7**, used under **Apache-2.0**.

Upstream archive:
https://github.com/Mbed-TLS/mbedtls/releases/download/mbedtls-3.6.7/mbedtls-3.6.7.tar.bz2

Archive SHA-256 (verified during repository creation):
`a7e8bcbec0e6f761b4af24f25677626b35f762f68eef79c08677a363212d11f6`

The old-Mac configuration and patch came from the user's existing TigerBuild
port at `/Users/JR/third_party/mbedtls`. `fetch.sh` verifies the upstream archive,
applies `old-macs.patch`, and copies its public headers. The complete patched
upstream source is vendored under `src/mbedtls`; upstream license files and
notices are retained. No fetch is required for the normal offline build.

Changes provide a monotonic-clock implementation on old macOS and disable
compiler/assembly paths unsuitable for the old toolchain. See the actual
`old-macs.patch` and `tb_config.h` for authoritative details.

`lib/libmbedtls32.a` was rebuilt on the development PowerPC Tiger VM for ppc
and i386 using `scripts/rebuild-tls.sh`. Existing 64-bit archives are retained
as historical inputs but are not linked by this release.

The project's HTTPS transport is `src/https.c` at the repository root. It does
not depend on or redistribute TigerBuild's separate TBNet wrapper.

`cacert.pem` is the supplied public Mozilla CA bundle. Preserve its embedded
provenance/license notice and refresh it from a trusted source as roots change.
