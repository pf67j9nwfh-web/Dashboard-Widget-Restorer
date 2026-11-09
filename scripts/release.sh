#!/bin/sh
# Run on Tiger after build/tests; PackageMaker and hdiutil are system/Xcode tools.
set -eu
cd "$(dirname "$0")/.."
/usr/bin/python scripts/package.py
RELEASE="$PWD/dist/DashboardWidgetRestorer-1.0-release"
mkdir -p "$RELEASE"
ditto dist/DashboardWidgetRestorer-1.0.pkg "$RELEASE/DashboardWidgetRestorer-1.0.pkg"
ditto dist/Uninstall-DashboardWidgetRestorer-1.0.pkg "$RELEASE/Uninstall-DashboardWidgetRestorer-1.0.pkg"
cp README.md "$RELEASE/README.txt"
cp LICENSE "$RELEASE/LICENSE.txt"
cp docs/PROVIDERS.md "$RELEASE/PROVIDERS.txt"
hdiutil create -ov -volname 'Dashboard Widget Restorer 1.0' -srcfolder "$RELEASE" \
  -fs HFS+ -format UDZO dist/DashboardWidgetRestorer-1.0.dmg
ditto -c -k --keepParent "$RELEASE" dist/DashboardWidgetRestorer-1.0.zip
tar -czf dist/DashboardWidgetRestorer-1.0-source.tar.gz --exclude './.git' \
  --exclude './build' --exclude './dist' .
echo 'Release image, installer ZIP, and full source archive are in dist/.'
