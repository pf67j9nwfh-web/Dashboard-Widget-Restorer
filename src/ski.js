/* Weather-model feed for Apple's original Ski Report scene and controls. MIT. */
function twSkiLocations(query,callback) {
    return twRequest(['place-geocode',encodeURIComponent(query)],function(data){
        if(data.error){callback(data);return;}
        var rows=data.features || [],resorts=[];
        for(var i=0;i<rows.length;i++){
            var p=rows[i].properties || {},c=rows[i].geometry && rows[i].geometry.coordinates;
            if(!c || !p.name)continue;
            resorts[resorts.length]={name:p.name,location:[p.state || p.city || '',String(p.countrycode || '').toUpperCase()].join(', '),uid:'om:'+c[1]+':'+c[0]+':'+encodeURIComponent(p.name)};
        }
        callback({error:false,resorts:resorts,refine:false});
    });
}
function validateSkiResort(query,callback){return twSkiLocations(query,callback);}
function validateSkiLocation(query,callback){return twSkiLocations(query,callback);}
function twSkiSnowState(depth,code){
    if(typeof depth=='number' && depth>0)return 'snow';
    if(/^(71|73|75|77|85|86)$/.test(String(code)))return 'snow';
    return typeof depth=='number'?'none':'unknown';
}
function twSkiSnowSymbol(state){
    var icon=document.getElementById('tw-ski-snow-symbol');
    if(!icon){icon=document.createElement('canvas');icon.id='tw-ski-snow-symbol';icon.width=26;icon.height=26;icon.style.position='absolute';icon.style.left='216px';icon.style.top='112px';document.getElementById('front').appendChild(icon);}
    icon.style.display='block';var c=icon.getContext('2d');c.clearRect(0,0,26,26);c.save();c.strokeStyle='white';c.fillStyle='white';c.lineWidth=1.5;c.lineCap='round';
    if(state=='unknown'){c.beginPath();c.arc(13,8,5,Math.PI,Math.PI*2.5,false);c.lineTo(13,18);c.stroke();c.beginPath();c.arc(13,23,1,0,Math.PI*2,false);c.fill();}
    else{
        c.translate(13,13);
        for(var i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,-9);c.moveTo(-3,-5);c.lineTo(0,-3);c.lineTo(3,-5);c.stroke();c.restore();}
        if(state=='none'){c.beginPath();c.arc(0,0,11,0,Math.PI*2,false);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(-8,8);c.lineTo(8,-8);c.stroke();}
    }
    c.restore();icon.title=state=='snow'?'Snow present in weather-model data':state=='none'?'No modeled snow cover or current snowfall':'Snow presence unavailable';
    return icon.title;
}
function fetchWeatherData(callback,key) {
    var cancelled=false,pending=null;
    function fetch(id){var p=twGeoPoint(id);pending=twRequest(['ski',p.latitude,p.longitude],function(data){
        if(cancelled)return;
        if(data.error || !data.current || !data.daily){callback(data.error?data:constructError('Weather unavailable'));return;}
        var depth=null,h=data.hourly || {},times=h.time || [],depths=h.snow_depth || [];
        for(var i=0;i<times.length;i++)if(times[i]<=data.current.time && typeof depths[i]=='number')depth=depths[i];
        var snowfall=data.daily.snowfall_sum[0];
        callback({error:false,temp:Math.round(data.current.temperature_2m*9/5+32),newPowder:typeof snowfall=='number'?Math.round(snowfall/2.54):null,base:depth===null?null:Math.round(depth/0.0254),snowState:twSkiSnowState(depth,data.current.weather_code),snowCondition:'',openTrails:'—',closed:false,model:true,url:'https://open-meteo.com/',pointName:p.name});
    });}
    if(String(key).indexOf('om:')==0)fetch(key);
    else pending=twSkiLocations(Number(key)==916004?'Heavenly ski resort California':String(resort || resortName || key),function(data){
        if(cancelled)return;if(data.error || !data.resorts.length){callback(constructError('Select a resort on the back of the widget'));return;}fetch(data.resorts[0].uid);
    });
    return {abort:function(){cancelled=true;if(pending)pending.abort();}};
}
function createGoToURL(){return 'https://open-meteo.com/';}
var twSkiOriginalData=handleDataFetched;
handleDataFetched=function(data){
    var unknownBase=data.base===null,unknownNew=data.newPowder===null;
    if(unknownBase)data.base=0;if(unknownNew)data.newPowder=0;
    twSkiOriginalData(data);
    if(data.error || data.closed){var icon=document.getElementById('tw-ski-snow-symbol');if(icon)icon.style.display='none';return;}
    if(unknownBase){twText('base','—');twText('baseunit','');document.getElementById('snow').style.display='none';}
    if(unknownNew)twText('new','—');
    twText('trails','--');
    var state=data.snowState || 'unknown';twText('snowLabel',state=='snow'?'Snow':state=='none'?'No snow':'Unknown');
    var description=twSkiSnowSymbol(state);document.getElementById('snowCondition').style.display='none';
    var label=document.getElementById('snowLabel');
    var nested=label.parentNode.id=='signs';label.style.left=nested?'185px':'205px';label.style.top=nested?'32px':'140px';label.style.width='47px';
    label.style.font='10px Helvetica';label.style.lineHeight='16px';
    label.style.textAlign='center';label.style.display='block';
    document.getElementById('snowLabel').title=description+'. Open-Meteo estimate; snow texture and resort observations unavailable.';
    document.getElementById('resortName').title='Model location: '+data.pointName;
    document.getElementById('trails').title='Open trail counts are not supplied by this service.';
};
