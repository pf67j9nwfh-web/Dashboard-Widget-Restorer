# Offline airport map coordinates

Source: https://github.com/datasets/airport-codes
Data file: https://raw.githubusercontent.com/datasets/airport-codes/main/data/airport-codes.csv
Downloaded November 8, 2026. Origin: OurAirports public data.

The publisher describes the underlying OurAirports data as Public Domain and
its selection/formatting under the Open Data Commons PDDL. Preserve the supplied
ATTRIBUTION.txt. Data is not guaranteed accurate or current.

`scripts/make-airports.py` selects non-closed facilities with three-letter IATA
codes and valid coordinates, preferring large/medium airports on duplicate codes.
It produces `src/airports.js` for the original Flight Tracker map. The complete
CSV is vendored so rebuilding does not require a live data download.

These coordinates are airport positions, not real-time aircraft tracking data.
