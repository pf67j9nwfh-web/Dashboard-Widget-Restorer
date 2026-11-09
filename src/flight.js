/* Adapt Aviationstack data to Apple's original flight list, map, and tracking UI. MIT. */
function twFlightCode(value){value=value && value.code!==undefined?value.code:value;value=String(value || '').replace(/\s/g,'').toUpperCase();return value!='NULL' && /^[A-Z0-9]{2,4}$/.test(value)?value:'-';}
function twFlightTime(value){return value?String(value).replace(/\.[0-9]+/,''):'N/A';}
function twFlightEndpoint(data){return {airportCode:data.iata || '',gate:data.gate || 'N/A',terminal:data.terminal || 'N/A',scheduled:twFlightTime(data.scheduled),estimated:twFlightTime(data.estimated),actual:twFlightTime(data.actual),best:twFlightTime(data.actual || data.estimated || data.scheduled)};}
function twFlightConvert(data,airlineCode){
    var flights=[],airports={},rows=data.data || [];
    var statuses={scheduled:'Scheduled',active:'Enroute',landed:'Landed',cancelled:'Cancelled',incident:'Incident',diverted:'Diverted'};
    for(var i=0;i<rows.length;i++){
        var r=rows[i],dep=r.departure || {},arr=r.arrival || {},f=r.flight || {},a=r.airline || {};
        if(!dep.iata || !arr.iata)continue;
        if(twAirports[dep.iata])airports[dep.iata]=twAirports[dep.iata];
        if(twAirports[arr.iata])airports[arr.iata]=twAirports[arr.iata];
        var tracking=null,live=r.live;
        if(live && typeof live.latitude=='number' && typeof live.longitude=='number')tracking={latitude:Math.abs(live.latitude)+(live.latitude<0?'S':'N'),longitude:Math.abs(live.longitude)+(live.longitude<0?'W':'E'),heading:live.direction,speed:typeof live.speed_horizontal=='number'?live.speed_horizontal/1.609344:null,altitude:typeof live.altitude=='number'?Math.round(live.altitude*3.28084):null,timeLeft:null};
        flights[flights.length]={number:String(f.number || ''),airlineCode:airlineCode!='-'?airlineCode:(a.icao || a.iata || ''),airlineName:a.name || a.iata || '',legs:[{status:statuses[r.flight_status] || 'Unknown',duration:'N/A',depart:twFlightEndpoint(dep),arrive:twFlightEndpoint(arr),tracking:tracking}]};
    }
    return {error:0,flights:flights,airports:airports};
}
function performXMLRequest(airline,number,depart,arrive,detail,callback){
    var code=twFlightCode(airline),flight=String(number || (detail && trackingFlightNo) || '-').replace(/\s/g,'');
    if(!/^[0-9]{1,4}[A-Z]?$/.test(flight))flight='-';
    return twRequest(['flight-query',code,flight,twFlightCode(depart),twFlightCode(arrive)],function(data){
        if(data.error){var message=data.errorString || data.error.info || data.error.message || 'Flight service unavailable';callback({error:-1},message);twFlightMessage(message);return;}
        callback(twFlightConvert(data,code),null);
    });
}
function twFlightMessage(text){var e=document.getElementById('status-label');if(e){e.style.display='block';e.innerText=/key.*required|key.*needed/i.test(String(text))?'Add API key in settings':String(text);e.title='Enter your Aviationstack API key on the back of this widget.';}}
setupUpdateTrackFlight=function(animate){
    if(timerInterval!==null){clearInterval(timerInterval);timerInterval=null;}
    function refresh(){if(animate)startServerAccessAnimation();lastXMLRequest=performXMLRequest(trackingAirlineCode,trackingFlightNo,defaultDepartCity,defaultArriveCity,true,trackingDataLoaded);}
    refresh();timerInterval=setInterval(refresh,30*60000);
};

/* Keep key entry on the original flip side. Secrets travel on stdin, never argv. */
var twFlightKeyConfigured=false,twFlightKeyBusy=false;
function twFlightKeyCommand(action,value,callback){
    try{
        var process=widget.system('/usr/bin/python '+twQuote('/Library/Application Support/TigerWidgets/source/scripts/flight-key.py')+' '+action,function(p){
            if(p.status!=0){callback(null,p.errorString || 'Unable to save key.');return;}
            try{callback(twJSON(p.outputString),null);}catch(e){callback(null,'Unable to read key settings.');}
        });
        if(action=='save'){process.write(value+'\n');process.close();}
    }catch(e){callback(null,'Unable to update key settings.');}
}
function twFlightKeyStatus(text){twText('tw-flight-key-status',text);}
function twFlightLoadKey(){
    document.getElementById('tw-flight-key').value='';
    twFlightKeyCommand('status',null,function(data,error){
        if(error){twFlightKeyStatus(error);return;}
        twFlightKeyConfigured=data.configured;
        twFlightKeyStatus(data.configured?'Key saved. Leave blank to keep it.':'Paste your API key, then click Done.');
        document.getElementById('tw-flight-key-clear').style.display=data.configured?'inline':'none';
    });
}
function twFlightClearKey(){
    if(twFlightKeyBusy)return;twFlightKeyBusy=true;
    twFlightKeyCommand('clear',null,function(data,error){twFlightKeyBusy=false;if(error){twFlightKeyStatus(error);return;}twFlightLoadKey();});
}
var twFlightOriginalBack=showbackside,twFlightOriginalDone=donePressed;
showbackside=function(event){twFlightOriginalBack(event);twFlightLoadKey();};
donePressed=function(event){
    if(twFlightKeyBusy)return;
    var field=document.getElementById('tw-flight-key'),value=field.value.replace(/^\s+|\s+$/g,'');
    if(!value){twFlightOriginalDone(event);return;}
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(value)){twFlightKeyStatus('Paste the API key only, without quotes or spaces.');return;}
    twFlightKeyBusy=true;twFlightKeyStatus('Saving key...');
    twFlightKeyCommand('save',value,function(data,error){
        twFlightKeyBusy=false;if(error){twFlightKeyStatus(error);return;}
        field.value='';twFlightKeyConfigured=true;twFlightOriginalDone(event);
        twFlightMessage('Key saved. Ready to search.');
    });
};

/* The old feed restricted plane positions to North America. Aviationstack's
   reported coordinates are usable worldwide; never invent a position if absent. */
function twFlightHasPosition(tracking){return !!(tracking && tracking.latitude!=null && tracking.longitude!=null);}
isPlaneLocationAllowed=function(status,position){
    var allowed=status.status=='Scheduled' || status.status=='Landed' || status.status=='Stopped' || twFlightHasPosition(status.leg.tracking);
    status.isPlaneLocationAllowed=allowed;return allowed;
};
var twFlightOriginalPath=drawFlightPath,twFlightOriginalCurves=drawCurvedPaths,twFlightOriginalStatus=updateStatusInfo;
drawCurvedPaths=function(context,depart,arrive,plane,progress){
    var result=twFlightOriginalCurves(context,depart,arrive,plane,progress);
    return plane?{x:-1,y:-1,angle:0}:result; // keep the reported position, not a projection onto the route
};
drawFlightPath=function(depart,arrive,status){
    if(!status && typeof gOverallFlightStatus!='undefined'){depart=gDepartLocs;arrive=gArriveLocs;status=gOverallFlightStatus;gCurrentXOffset=calcXShiftOffsetForMap();if(!alreadyZoomed)gZoomRect.x=gCurrentXOffset;}
    if(!status.leg.tracking)status.leg.tracking={latitude:null,longitude:null,heading:null,speed:null,altitude:null};
    if(status.status!='Scheduled' && status.status!='Landed' && status.status!='Stopped' && !twFlightHasPosition(status.leg.tracking)){
        var canvas=document.getElementById('canvas'),c=canvas.getContext('2d');
        canvas.style.opacity='1.0';document.getElementById('detailArea').style.display='none';
        c.clearRect(0,0,kCanvasWidth,kCanvasHeight);c.save();setMapImageClip(c);drawMap(true);drawCurvedPaths(c,depart,arrive,null,null);c.restore();
        status.isPlaneLocationAllowed=false;return;
    }
    twFlightOriginalPath(depart,arrive,status);
};
updateStatusInfo=function(status,number,count){
    twFlightOriginalStatus(status,number,count);
    if(status.status=='Enroute' && !twFlightHasPosition(status.leg.tracking)){
        twText('airSpeed-label','');twText('airSpeedUnits-label','');twText('airAltitude-label','');twText('airAltitudeUnits-label','Position unavailable');
    }
};

/* Snow Leopard renamed and generalized the original refresh controller. */
if(typeof setupUpdates=='function')setupUpdates=function(animate){
    if(timerInterval!==null){clearInterval(timerInterval);timerInterval=null;}
    function refresh(){if(animate)startServerAccessAnimation();var detail=applicationMode==kTrackMode;lastXMLRequest=performXMLRequest(detail?trackingAirlineCode:defaultAirlineCode,trackingFlightNo,defaultDepartCity,defaultArriveCity,detail,detail?trackingDataLoaded:searchResultsLoaded);}
    refresh();timerInterval=setInterval(refresh,30*60000);
};
