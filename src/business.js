/* Adapt OSM business/address matches to the original yellow Phone Book. MIT. */
var twBusinessRequest=null,twBusinessValidation=null;
function buildSearchRequest(data,address) {
    address=address || ['','Cupertino','CA',''];var term=String(data.searchTerm || '');
    try{term=decodeURIComponent(term.replace(/\+/g,' '));}catch(e){term=unescape(term);}
    return {term:term,location:address[3] || [address[1] || 'Cupertino',address[2] || 'CA'].join(', '),start:Number(data.RecordsFrom || 0),radius:Number(data.rangeLimit || 20)};
}
function performXMLRequest(kind,query,callback) {
    var cancelled=false,pending=null;
    var handle={abort:function(){cancelled=true;if(pending)pending.abort();}};
    if(kind=='search'){if(twBusinessRequest)twBusinessRequest.abort();twBusinessRequest=handle;}
    else{if(twBusinessValidation)twBusinessValidation.abort();twBusinessValidation=handle;}
    pending=twGeoSearch(query.location,function(data){
        if(cancelled)return;
        if(data.error || !data.cities.length){callback(null,data.errorString || 'Location not found');return;}
        if(kind=='locationValidation'){
            var locations=[];
            for(var i=0;i<data.cities.length;i++)locations[locations.length]={city:data.cities[i].name,state:twGeoShortState(data.cities[i].state)};
            callback({error:0,locationMatchData:locations,totalPossibleResults:locations.length},'');return;
        }
        if(query.start>0){callback({error:0,businesses:[],totalPossibleResults:query.start},'');return;}
        var point=twGeoPoint(data.cities[0].zip);
        pending=twRequest(['business-search',encodeURIComponent(query.term),point.latitude,point.longitude,String(query.radius)],function(results){
            if(cancelled)return;
            if(results.error){callback(null,results.errorString);return;}
            var rows=results.features || [],businesses=[];
            for(var j=0;j<rows.length;j++){
                var coords=rows[j].geometry.coordinates,rad=Math.PI/180,dy=(Number(coords[1])-Number(point.latitude))*rad,dx=(Number(coords[0])-Number(point.longitude))*rad;
                var arc=Math.sin(dy/2)*Math.sin(dy/2)+Math.cos(Number(point.latitude)*rad)*Math.cos(Number(coords[1])*rad)*Math.sin(dx/2)*Math.sin(dx/2);
                var distance=3958.8*2*Math.atan2(Math.sqrt(arc),Math.sqrt(1-arc));if(distance>query.radius)continue;
                var p=rows[j].properties || {},type={N:'node',W:'way',R:'relation'}[p.osm_type],link=type?'https://www.openstreetmap.org/'+type+'/'+p.osm_id:'https://www.openstreetmap.org/';
                businesses[businesses.length]={name:p.name || query.term,address:((p.housenumber || '')+' '+(p.street || '')).replace(/^\s+|\s+$/g,''),city:p.city || p.locality || data.cities[0].name,state:twGeoShortState(p.state || data.cities[0].state),zip:p.postcode || '',phone:'',distance:distance.toFixed(1),mapLink:link,encrypted_id:link};
            }
            businesses.sort(function(a,b){return Number(a.distance)-Number(b.distance);});
            callback({error:0,businesses:businesses,totalPossibleResults:businesses.length},'');
        });
    });return handle;
}
function getProfilePageURL(id){return /^https:\/\/www\.openstreetmap\.org\//.test(id)?id:'https://www.openstreetmap.org/';}
