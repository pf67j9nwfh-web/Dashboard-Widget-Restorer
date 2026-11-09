/* Shared city lookup for the original widget adapters. MIT. */
function twGeoKey(city) {
    return 'om:' + city.latitude + ':' + city.longitude + ':' + encodeURIComponent(city.name);
}
function twGeoSearch(query, callback) {
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
            var entry = {name:city.name, state:(city.admin1 ? city.admin1 + ', ' : '') + (city.country_code || city.country || ''), zip:twGeoKey(city)};
            cities[cities.length] = entry;
            if (hint && (hint == String(city.admin1).toLowerCase() || hint == String(city.country_code).toLowerCase() || hint == String(city.country).toLowerCase())) preferred[preferred.length] = entry;
        }
        if (hint) cities = preferred;
        callback({error:false, cities:cities, refine:!hint && list.length >= 20});
    });
}

function twGeoPoint(key) {var p=String(key).split(':');return {latitude:p[1],longitude:p[2],name:decodeURIComponent(p[3] || '')};}
function twDecodeEntities(text) {
    return String(text).replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi,function(all,key){
        var names={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};key=key.toLowerCase();
        if(key.charAt(0)!='#')return names[key];
        var n=key.charAt(1)=='x'?parseInt(key.substring(2),16):parseInt(key.substring(1),10);
        if(n<0 || n>1114111)return all;
        return n<65536?String.fromCharCode(n):String.fromCharCode(55296+((n-65536)>>10),56320+((n-65536)&1023));
    });
}
function twGeoShortState(state) {
    var full=String(state || '').split(',')[0];
    var names='AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia'.split('|');
    for(var i=0;i<names.length;i++){var p=names[i].split(':');if(full==p[1])return p[0];}return full;
}
