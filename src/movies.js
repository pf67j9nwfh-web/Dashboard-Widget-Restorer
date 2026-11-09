/* Apple's no-key catalog and previews inside the original Movies browser. MIT. */
function twMovieMedia(url,callback){
    return widget.system(twQuote('/Library/Application Support/TigerWidgets/bin/tw-fetch')+' movie-media '+twQuote(encodeURIComponent(url)),function(p){
        if(p.status!=0){callback(null);return;}
        try{var receipt=twJSON(p.outputString);callback(receipt.path && receipt.path.indexOf('/Library/Caches/TigerWidgets/cache-')>=0?'file://'+encodeURI(receipt.path):null,receipt.length || 0);}catch(e){callback(null);}
    });
}
function twMoviesConvert(data){
    var rows=data.feed && data.feed.entry || [],movies=[];
    for(var i=0;i<rows.length;i++){
        var r=rows[i],id=r.id && r.id.attributes && r.id.attributes['im:id'];if(!id)continue;
        var m=new Movie(id,r['im:name'].label);m.synopsis=r.summary && r.summary.label || '';m.releaseDate=r['im:releaseDate'].attributes.label;m.genres=[r.category.attributes.label];m.cast=[];m.directors=[r['im:artist'].label];m.rating='';m.runtime='';m.complete=true;
        var images=r['im:image'] || [];m.remotePoster=images.length?images[images.length-1].label:null;
        var links=r.link || [];for(var j=0;j<links.length;j++)if(links[j].attributes.rel=='enclosure'){var dimensions=/\.([0-9]+)x([0-9]+)\./.exec(links[j].attributes.href);m.trailer={url:links[j].attributes.href,height:dimensions?Math.round(Number(dimensions[2])*480/Number(dimensions[1])):270,remote:true};}
        movies.push(m);
    }return movies;
}
fetchAllData=function(){
    if(fetchAllData.request)fetchAllData.request.abort();
    fetchAllData.request=twRequest(['movies'],function(data){
        if(data.error){handleNetworkError();return;}
        initAllMoviesTable();initAllTheatersTable();var movies=twMoviesConvert(data);posterMovieIds=[];
        if(!movies.length){handleNoMovieDataAvailable();return;}
        for(var i=0;i<movies.length;i++){allMoviesTable[movies[i].id]=movies[i];posterMovieIds.push(movies[i].id);}
        allMoviesList=getSortedArrayForTable(allMoviesTable);allTheatersList=[];sortByMovies=true;currentMovieId=allMoviesList[0].id;
        markLastMovieDataFetchDate();stopProgressAnimation();Utils.hideElement($('errorMsgBox'));
        function poster(index){if(index>=movies.length)return;var m=movies[index];twMovieMedia(m.remotePoster,function(path){if(path)m.posterUrl=path;if(index==0)afterAllDataFetched();poster(index+1);});}
        poster(0);
    });
};
var twMoviesOriginalLoad=load,twMoviesOriginalTrailer=trailerButtonClicked;
load=function(){twMoviesVideoBridge();twMoviesOriginalLoad();
    $('theatersButton').disabled=true;$('theatersButton').title='Local cinema showtimes are not supplied by this catalog.';
    $('dateSelect').disabled=true;$('locationTextField').disabled=true;
    $('locationLabel').innerText='Apple movie catalog';$('validateLabel').innerText='No account or API key needed.';
    var notice=document.createElement('div');notice.id='tw-movies-provider-notice';notice.style.cssText='position:absolute;left:250px;top:125px;width:220px;font:10px Helvetica;color:white;';notice.innerText='Posters and previews. Local theater showtimes unavailable.';$('back').appendChild(notice);
};
logoClicked=function(){widget.openURL('https://www.apple.com/tv/');};
trailerButtonClicked=function(event){
    var m=allMoviesTable[currentMovieId];if(!m || !m.trailer || m.trailer.url=='#')return;
    if(!m.trailer.remote){twMoviesOriginalTrailer(event);return;}
    if(m.trailer.loading)return;m.trailer.loading=true;
    twMovieMedia(m.trailer.url,function(path,bytes){m.trailer.bytes=bytes;m.trailer.loading=false;if(!path){$('currentPosterTitle').innerText='Preview unavailable. Please retry.';return;}m.trailer.url=path;m.trailer.remote=false;if(currentMovieId==m.id)twMoviesOriginalTrailer(event);});
};

/* Keep Apple's controls, backed by Snow Leopard's native HTML5 video decoder. */
function twMoviesVideoBridge(){
    var old=document.getElementById('movie'),video=document.createElement('video');video.id='movie';video.width=480;video.preload='auto';video.autoplay=true;
    video.style.cssText=old.style.cssText;old.parentNode.replaceChild(video,old);
    function bytes(){var m=allMoviesTable && allMoviesTable[currentMovieId];return m && m.trailer.bytes || 1;}
    video.GetTime=function(){return Math.round(video.currentTime*600);};
    video.GetEndTime=function(){return isFinite(video.duration)?Math.round(video.duration*600):0;};
    video.GetMaxBytesLoaded=function(){return video.readyState>0?bytes():0;};
    video.GetMovieSize=bytes;
    video.GetPluginStatus=function(){return video.error?'error':video.readyState>0?'complete':'waiting';};
    video.GetAutoPlay=function(){return video.autoplay;};
    video.Play=function(){video.play();};video.Stop=function(){video.pause();};video.SetTime=function(time){try{video.currentTime=time/600;}catch(e){}};
    video.addEventListener('error',function(){if(typeof movieFailedToDownload=='function')movieFailedToDownload();},false);
    if(typeof getMovie=='function')getMovie._movie=video;
}

/* Poster availability is independent of whether the provider supplies a trailer. */
var twMoviesOriginalInfo=populateInfoPaneWithMovieInfo;
populateInfoPaneWithMovieInfo=function(movie){
    twMoviesOriginalInfo(movie);
    if(movie.posterUrl && movie.posterUrl!=kDefaultPosterUrl)Utils.hideElement($('currentPosterTitle'));
};
