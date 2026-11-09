/* Open-Meteo adapter. SPDX-License-Identifier: MIT */
function weatherLocation(city) {
    return 'om:' + city.latitude + ':' + city.longitude + ':' + encodeURIComponent(city.name);
}
function weatherSearch(query, callback) {
    var parts = String(query).split(','), name = parts[0].replace(/^\s+|\s+$/g, '');
    return twRequest(['geocode', encodeURIComponent(name)], function (data) {
        if (data.error) { callback(data); return; }
        var list = data.results || [], cities = [], preferred = [], j, city, hint;
        var states = 'AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia'.split('|');
        hint = parts.length > 1 ? parts[parts.length-1].replace(/^\s+|\s+$/g, '').toLowerCase() : '';
        for (j = 0; j < states.length; j++) { var pair = states[j].split(':'); if (hint == pair[0].toLowerCase()) { hint = pair[1].toLowerCase(); break; } }
        for (j = 0; j < list.length; j++) {
            city = list[j];
            if (typeof city.latitude != 'number' || typeof city.longitude != 'number') continue;
            var entry = {name:city.name, state:(city.admin1 ? city.admin1 + ', ' : '') + (city.country_code || city.country || ''), zip:weatherLocation(city)};
            cities[cities.length] = entry;
            if (hint && (hint == String(city.admin1).toLowerCase() || hint == String(city.country_code).toLowerCase() || hint == String(city.country).toLowerCase())) preferred[preferred.length] = entry;
        }
        if (hint) cities = preferred;
        callback({error:false, cities:cities, refine:!hint && list.length >= 20});
    });
}
function validateWeatherLocation(location, callback) { return weatherSearch(location, callback); }
function weatherCode(code, night) {
    if (code == 0) return night ? 33 : 1;
    if (code == 1) return night ? 34 : 2;
    if (code == 2) return night ? 35 : 3;
    if (code == 3) return 7;
    if (code == 45 || code == 48) return 11;
    if (code == 56 || code == 57 || code == 66 || code == 67) return 26;
    if (code == 71 || code == 73 || code == 75 || code == 77 || code == 85 || code == 86) return 22;
    if (code >= 95) return 15;
    if (code >= 80) return 12;
    if (code >= 51 && code <= 65) return 18;
    return 7;
}
function weatherDescription(code) {
    var names = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Heavy freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light rain showers',81:'Rain showers',82:'Heavy rain showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Severe thunderstorm with hail'};
    return names[code] || 'Cloudy';
}
function weatherTime(text) {
    var m = /T([0-9]{2}):([0-9]{2})/.exec(text || '');
    return m ? {hour:parseInt(m[1],10), minute:parseInt(m[2],10)} : null;
}
function weatherConvert(data, city) {
    var c = data.current, d = data.daily, j;
    if (!c || !d || typeof c.temperature_2m != 'number' || typeof c.weather_code != 'number' || !d.time || d.time.length < 6) return constructError('Incomplete forecast received');
    var icon = weatherCode(c.weather_code, c.is_day == 0);
    var result = {error:false, city:city, temp:Math.round(c.temperature_2m), hi:Math.round(d.temperature_2m_max[0]), lo:Math.round(d.temperature_2m_min[0]), icon:icon, icons:accuweatherIcons[icon-1], description:weatherDescription(c.weather_code), time:weatherTime(c.time), sunrise:weatherTime(d.sunrise[0]), sunset:weatherTime(d.sunset[0]), phases:[], forecast:[]};
    var days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    for (j = 0; j < d.time.length && j < 7; j++) {
        if (typeof d.temperature_2m_max[j] != 'number' || typeof d.temperature_2m_min[j] != 'number' || typeof d.weather_code[j] != 'number') return constructError('Incomplete daily temperatures');
        var date = d.time[j].split('-'), noon = Date.UTC(Number(date[0]), Number(date[1])-1, Number(date[2]), 12), fi = weatherCode(d.weather_code[j], false);
        result.forecast[j] = {hi:Math.round(d.temperature_2m_max[j]), lo:Math.round(d.temperature_2m_min[j]), icon:fi, ouricon:accuweatherMiniIcons[fi-1], description:weatherDescription(d.weather_code[j]), daycode:days[new Date(noon).getUTCDay()]};
        var age = ((noon-Date.UTC(2000,0,6,18,14))/86400000) % 29.530588853;
        if (age < 0) age += 29.530588853;
        result.phases[j] = Math.floor(age / 29.530588853 * 24) + 1;
    }
    return result;
}
function fetchWeatherData(callback, location) {
    var cancelled = false, pending = null;
    var handle = {abort:function () { cancelled = true; if (pending) pending.abort(); }};
    function fetch(key) {
        var p = String(key).split(':'), city;
        if (p.length != 4 || p[0] != 'om' || !isFinite(Number(p[1])) || !isFinite(Number(p[2]))) { callback(constructError('Please select a city on the back of the widget')); return; }
        try { city = decodeURIComponent(p[3]); } catch(e) { callback(constructError('Invalid saved location')); return; }
        pending = twRequest(['forecast',p[1],p[2]], function(data) {
            if (cancelled) return;
            var result;
            try { result = data.error ? data : weatherConvert(data, city); }
            catch(e) { result = constructError('Invalid forecast: ' + e); }
            callback(result);
        });
    }
    if (String(location).indexOf('om:') == 0) fetch(location);
    else pending = weatherSearch(location, function(data) {
        if (cancelled) return;
        if (data.error || !data.cities.length) { callback(data.error ? data : constructError('City not found; choose a city on the back')); return; }
        fetch(data.cities[0].zip);
    });
    return handle;
}
function createGoToURL(location) { return 'https://open-meteo.com/'; }

window.timerInterval = 900000;
