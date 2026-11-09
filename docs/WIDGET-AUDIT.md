# Leopard support — version 1.0 retained

Leopard 10.5.8 has the full Business, People, ESPN and Movies bundles. Weather
still uses the AccuWeather-era format and Stocks the older chart model, so they
use the compatible earlier adapters. Translation's newer field names, nested
Ski signs, Business XML/XSLT, full ESPN, Movies and People are covered by the
existing adaptive paths. The Intel Leopard machine is runtime-tested; PowerPC
Leopard is not separately runtime-tested. Widget originals stay local to each Mac.

# Snow Leopard audit addition — 0.4.0

Snow Leopard's complete ESPN and Movies interfaces are retained. Business,
Translation, Weather, Stocks and Flight have changed controller contracts;
platform adapters now cover those differences. People retains its original form
and opens Whitepages web results by explicit user choice. It is not represented
as a working inline people-directory feed. Movies has a no-key Apple store
catalog and optional API Cinema schedules. Historical flight dates, public
telephone data in OSM and commercial directory subscriptions are not invented.
Snow Leopard i386 and Tiger PowerPC are the tested runtime architectures.

The earlier Tiger audit follows for historical context.

# Widget audit — 0.3.0

The earlier 0.2.0 redesign was not the intended result. Version 0.3.0 restores
Apple's original interfaces and replaces their service adapters instead.

- **Weather:** original scene, back-side field and native location menu; automatic
  validation after typing. Open-Meteo current model conditions and forecast.
- **Phone Book:** original yellow artwork, native input, categories, preferences,
  list, scrolling/paging and address-book actions. Photon/OSM names, addresses,
  approximate distance and map links; missing phones read “Not listed”. The old
  complete telephone directory cannot be recreated from this free data source.
- **Translation:** original blue globe, language menus, swap, text areas and typing
  behavior; MyMemory with UTF-8, including the legacy Asian-language selections.
- **Flight Tracker:** original gray form, native selectors, list, map and tracking
  view; Aviationstack adapter plus offline airport coordinates. A user key is
  still required. No real authenticated flight data was available for testing.
- **Ski Report:** original wooden scene, resort finder and unit controls; Photon
  finds the location, and Open-Meteo supplies model weather/snow. “Model” is shown
  in the existing scene. Open trail counts and surface observations are unavailable.
- **Stocks/Currency:** their original interfaces were already preserved; providers
  remain Yahoo public endpoints and Frankfurter reference rates respectively.
- **Google:** original design; escaped query and HTTPS URL repair.
- **ESPN:** the machine's original directory had only partial resources, no
  Info.plist/HTML/controller. Its fallback scoreboard is the only replacement UI.

People/white-pages has no established free equivalent and remains untouched.
Calculator, Calendar, Address Book, Stickies, Tile Game, local Dictionary and
non-currency unit conversions are not provider-replacement projects. World Clock
still uses Tiger's potentially outdated timezone database. Local iTunes and
modern Safari/site compatibility are outside this patch.

Apple implementation files and reusable graphics are not bundled for installation;
they are patched locally. Documentation screenshots show local renders. i386 is
compiled but not runtime-tested. Native packages target Tiger 10.4.11, and free
or unofficial provider endpoints can change independently of this project.
