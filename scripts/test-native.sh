#!/bin/sh
# Installed-widget checks on Tiger, Leopard and Snow Leopard.
set -eu
cd "$(dirname "$0")/.."
sh scripts/test-http.sh
TW_TEST_ARCH=i386
if [ "$(uname -p)" = "powerpc" ]; then TW_TEST_ARCH=ppc; fi
gcc -arch "$TW_TEST_ARCH" -framework Cocoa -framework WebKit tests/webkit-runner.m -o build/webkit-runner
TW_TEST_WIDGETS=/Library/Widgets
run_widget() { ./build/webkit-runner "$TW_TEST_WIDGETS/$1.wdgt" "$2"; }
run_widget Weather weather
run_widget Stocks stocks
run_widget 'Unit Converter' currency
run_widget 'Ski Report' ski
run_widget Translation translation
if [ -d "$TW_TEST_WIDGETS/Business.wdgt" ]; then
  run_widget Business business-sl
else
  run_widget 'Phone Book' places
fi
if [ -f "$TW_TEST_WIDGETS/ESPN.wdgt/ESPN.js" ]; then
  run_widget ESPN espn
else
  run_widget ESPN sports
fi
if [ -d "$TW_TEST_WIDGETS/Movies.wdgt" ]; then
  TW_CINEMA_STATUS=$(/usr/bin/python scripts/flight-key.py status cinema)
  case "$TW_CINEMA_STATUS" in
    *true*) run_widget Movies cinema-live ;;
    *) run_widget Movies movies ;;
  esac
fi
if [ -d "$TW_TEST_WIDGETS/People.wdgt" ]; then run_widget People people; fi
TW_FLIGHT_STATUS=$(/usr/bin/python scripts/flight-key.py status)
case "$TW_FLIGHT_STATUS" in
  *true*) run_widget 'Flight Tracker' flight-live ;;
  *) run_widget 'Flight Tracker' flight ;;
esac
