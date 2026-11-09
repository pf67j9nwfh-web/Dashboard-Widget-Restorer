/* Optional real cinema schedules; retain the no-key Apple catalog by default. MIT. */
var twCinemaEnabled=false,twCinemaBusy=false,twCinemaOriginalFetch=fetchAllData,twCinemaOriginalBack=showBack,twCinemaOriginalFront=showFront,twCinemaBookings={};
function twCinemaCommand(action,value,callback){
    var p=widget.system('/usr/bin/python '+twQuote('/Library/Application Support/TigerWidgets/source/scripts/flight-key.py')+' '+action+' cinema',function(r){if(r.status!=0){callback(null,r.errorString);return;}try{callback(twJSON(r.outputString),null);}catch(e){callback(null,'Unable to read settings.');}});
    if(action=='save'){p.write(value+'\n');p.close();}
}
function twCinemaStatus(text){twText('tw-cinema-status',text);}
function twCinemaLoad(){twCinemaCommand('status',null,function(d,e){if(e){twCinemaStatus(e);return;}twCinemaEnabled=d.configured;$('tw-cinema-key').value='';$('tw-cinema-clear').style.display=d.configured?'inline':'none';twCinemaStatus(d.configured?'Key saved. Blank keeps it.':'Catalog needs no key.');$('locationTextField').disabled=!twCinemaEnabled;$('dateSelect').disabled=!twCinemaEnabled;$('theatersButton').disabled=!twCinemaEnabled;$('locationLabel').innerText=twCinemaEnabled?'City, state for showtimes':'Apple movie catalog';$('validateLabel').innerText=twCinemaEnabled?'25 km around this location':'No account or API key needed.';$('fandangoLogo').innerText=twCinemaEnabled?'API Cinema / TMDB':'Apple Movies';twText('tw-movies-provider-notice',twCinemaEnabled?'Up to 100 local showtimes; coverage varies.':'Posters and previews. Local theater showtimes unavailable.');});}
showBack=function(){twCinemaOriginalBack();twCinemaLoad();};
showFront=function(){
    if(twCinemaBusy)return;var value=$('tw-cinema-key').value.replace(/^\s+|\s+$/g,'');
    if(value){if(!/^[A-Za-z0-9_-]{1,128}$/.test(value)){twCinemaStatus('Paste only the API key.');return;}twCinemaBusy=true;twCinemaCommand('save',value,function(d,e){twCinemaBusy=false;if(e){twCinemaStatus(e);return;}twCinemaEnabled=true;$('tw-cinema-key').value='';showFront();});return;}
    if(twCinemaEnabled){var location=$('locationTextField').value;setInstanceAndGlobalPreferenceForKey(location,kLocationKey);}
    checkLocation.locationChanged=true;var check=checkLocation;checkLocation=function(){checkLocation.locationChanged=true;return true;};twCinemaOriginalFront();checkLocation=check;
};
function twCinemaClear(){if(twCinemaBusy)return;twCinemaCommand('clear',null,function(d,e){if(e){twCinemaStatus(e);return;}twCinemaEnabled=false;twCinemaLoad();markShouldFetchNewData();});}
validateLocation=function(location){$('validateLabel').innerText='Location is checked when loading showtimes.';};
function twCinemaConvert(data){
    var rows=data.data || [];initAllMoviesTable();initAllTheatersTable();posterMovieIds=[];twCinemaBookings={};
    for(var i=0;i<rows.length;i++){
        var r=rows[i],film=r.movie,venue=r.cinema;if(!film || !venue || !r.startsAt || r.removedAt)continue;
        var mid=film.id,tid=venue.id,m=allMoviesTable[mid],t=allTheatersTable[tid];
        if(!m){m=new Movie(mid,film.title || film.rawTitle);m.rating=film.certification || '';m.releaseDate=String(film.year || '');m.runtime=film.durationMin?film.durationMin+' min':'';m.synopsis=film.synopsis || '';m.genres=film.genres || [];m.cast=[];m.directors=film.director?[film.director]:[];m.complete=true;m.remotePoster=film.posterUrl || null;allMoviesTable[mid]=m;}
        if(!t){t=new Theater(tid,venue.name,false,[]);t.address={street:venue.address || '',city:venue.city,state:venue.region || '',zip:venue.postalCode || '',country:venue.country,phone:venue.phone || ''};t.mapUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([t.address.street,t.address.city].join(', '));allTheatersTable[tid]=t;}
        if(!m.times[tid]){m.times[tid]=[];m.theaters.push(t);t.movies.push(m);}
        var date=r.startsAt.substr(0,10).split('-'),clock=r.startsAt.substr(11,5).split(':'),hour=Number(clock[0]),time=new Time(date[1]+'/'+date[2]+'/'+date[0],String(hour%12 || 12)+':'+clock[1]+(hour>=12?'pm':'am'));
        time.id=r.id;m.times[tid].push(time);if(/^https:\/\//.test(r.bookingUrl || '')){twCinemaBookings[r.id]=r.bookingUrl;t.canBuyTickets=true;}
    }
    allMoviesList=getSortedArrayForTable(allMoviesTable);allTheatersList=getSortedArrayForTable(allTheatersTable);
    if(allMoviesList.length)currentMovieId=allMoviesList[0].id;if(allTheatersList.length)currentTheaterId=allTheatersList[0].id;
    return allMoviesList.length;
}
fetchAllData=function(){
    twCinemaCommand('status',null,function(d,e){
        if(e || !d.configured){twCinemaEnabled=false;twCinemaOriginalFetch();return;}twCinemaEnabled=true;
        $('theatersButton').disabled=false;$('dateSelect').disabled=false;
        var query=getLocation() || 'Cupertino, CA';twRequest(['place-geocode',encodeURIComponent(query)],function(loc){
            var point=loc.features && loc.features[0] && loc.features[0].geometry.coordinates;if(!point){twCinemaOriginalFetch();return;}
            twRequest(['cinema',String(point[1]),String(point[0]),getDate()],function(data){
                if(data.error || !twCinemaConvert(data)){twCinemaOriginalFetch();return;}
                twRequest(['movies'],function(apple){
                    twCinemaMergeAppleCatalog(apple);
                sortByMovies=true;markLastMovieDataFetchDate();stopProgressAnimation();Utils.hideElement($('errorMsgBox'));
                if(isInCompactView()){currentPosterId=currentMovieId;posterClicked({shiftKey:false});}else displayAllMovieInfo();
                function poster(index){if(index>=allMoviesList.length)return;var m=allMoviesList[index];if(!m.remotePoster){poster(index+1);return;}twMovieMedia(m.remotePoster,function(path){if(path){m.posterUrl=path;if(m.id==currentMovieId){$('currentPoster').src=path;Utils.hideElement($('currentPosterTitle'));}}poster(index+1);});}poster(0);
                });
            });
        });
    });
};
getTicketPurchasePageUrl=function(movie,theater,time){return twCinemaBookings[time.id] || allTheatersTable[theater].mapUrl;};

logoClicked=function(){widget.openURL(twCinemaEnabled?'https://api-cinema.com/en/docs':'https://www.apple.com/tv/');};

/* Cinema owns schedules; Apple independently supplies matching movie previews. */
function twMovieTitleKey(title){return String(title || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');}
function twCinemaAppleMatch(movie,data){
    var rows=data.results || [],matches=[],year=parseInt(movie.releaseDate,10);
    for(var i=0;i<rows.length;i++){
        var r=rows[i],ry=parseInt(r.releaseDate,10);
        if(r.kind!='feature-movie' || !/^https:\/\/video-ssl\.itunes\.apple\.com\//.test(r.previewUrl || ''))continue;
        if(twMovieTitleKey(r.trackName)!=twMovieTitleKey(movie.title))continue;
        if(year && (!ry || Math.abs(year-ry)>1))continue;
        matches.push(r);
    }
    if(matches.length!=1)return null;
    var r=matches[0],dimensions=/\.([0-9]+)x([0-9]+)\./.exec(r.previewUrl);
    return {url:r.previewUrl,height:dimensions?Math.round(Number(dimensions[2])*480/Number(dimensions[1])):270,remote:true};
}
function twCinemaAppleTrailer(movie){
    if(movie.twAppleLookup)return;movie.twAppleLookup=true;
    twRequest(['movie-search',encodeURIComponent(movie.title).replace(/[!'()*]/g,function(c){return '%'+c.charCodeAt(0).toString(16);})],function(data){
        if(data.error){movie.twAppleLookup=false;return;}
        var trailer=twCinemaAppleMatch(movie,data);if(trailer)movie.trailer=trailer;
        if(currentMovieId==movie.id){
            $('trailerButton').title=trailer?'Play Apple trailer':'Apple has no matching trailer for this film.';
            if(trailer)$('trailerButton').className='enabledActionButton';
        }
    });
}
var twCinemaOriginalInfo=populateInfoPaneWithMovieInfo;
populateInfoPaneWithMovieInfo=function(movie){
    twCinemaOriginalInfo(movie);
    if(twCinemaEnabled && movie.trailer.url=='#'){
        $('trailerButton').title=movie.twAppleLookup?'Apple has no matching trailer for this film.':'Looking for an Apple trailer...';
        twCinemaAppleTrailer(movie);
    }else $('trailerButton').title='Play Apple trailer';
};

function twCinemaMergeAppleCatalog(data){
    var catalog=twMoviesConvert(data);
    for(var i=0;i<catalog.length;i++){
        var apple=catalog[i],match=null;
        for(var j=0;j<allMoviesList.length;j++){
            var cinema=allMoviesList[j];
            if(twMovieTitleKey(cinema.title)==twMovieTitleKey(apple.title) && Math.abs(parseInt(cinema.releaseDate,10)-parseInt(apple.releaseDate.replace(/.*(\d{4}).*/,'$1'),10))<=1){match=cinema;break;}
        }
        if(match){if(apple.trailer && apple.trailer.url!='#')match.trailer=apple.trailer;}
        else {apple.id='apple-'+apple.id;allMoviesTable[apple.id]=apple;}
    }
    allMoviesList=getSortedArrayForTable(allMoviesTable);
}
