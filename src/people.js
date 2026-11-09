/* Original White Pages form, explicit browser results instead of a defunct directory. MIT. */
buildSearchRequest=function(data,address){return {first:data.firstName || '',last:data.lastName || '',location:address && (address[3] || [address[1],address[2]].join(' ')) || ''};};
performXMLRequest=function(kind,query,callback){
    if(kind=='locationValidation')return twGeoSearch(query.location,function(d){var rows=[];for(var i=0;i<(d.cities || []).length;i++)rows.push({city:d.cities[i].name,state:twGeoShortState(d.cities[i].state)});callback({error:0,locationMatchData:rows,totalPossibleResults:rows.length},'');});
    var name=[query.first,query.last].join(' ').replace(/^\s+|\s+$/g,'');
    var url='https://www.whitepages.com/name/'+encodeURIComponent(name.replace(/\s+/g,'-'))+'/'+encodeURIComponent(query.location.replace(/\s+/g,'-'));
    widget.openURL(url);callback({error:0,businesses:[],totalPossibleResults:0},'');
    if(gPhoneBookMainView)gPhoneBookMainView.setNoResults('Results opened in Whitepages.');
    return {abort:function(){}};
};
clickOnProvider=function(){widget.openURL('https://www.whitepages.com/');};
