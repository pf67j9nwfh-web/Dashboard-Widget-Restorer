/* Preserve Snow Leopard's automatic city validation and native results menu. MIT. */
var twSLConvert=weatherConvert,twSLFetch=fetchWeatherData;
weatherConvert=function(data,city){var r=twSLConvert(data,city);if(r.error)return r;
    function clock(v){return v?v.hour*100+v.minute:null;}
    r.time=clock(r.time);r.sunrise=clock(r.sunrise);r.sunset=clock(r.sunset);r.link='https://open-meteo.com/';return r;
};
fetchWeatherData=function(callback,key){
    if(String(key).indexOf('om:')!=0)key=zip || locationString || 'Cupertino, CA';
    return twSLFetch(callback,key);
};
var twSLTyping=zipTyping;
zipTyping=function(event){
    if(validateTypingTimer){clearTimeout(validateTypingTimer);validateTypingTimer=null;}
    document.getElementById('zip').postal=null;zipValidated=false;twSLTyping(event);
};
