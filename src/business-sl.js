/* Feed modern business results into Snow Leopard's existing XSLT list. MIT. */
var twBusinessSLMaps={};
function twXMLText(value){return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
sendValidationRequest=function(query){return twGeoSearch(query,function(data){var names=[],cities=data.cities || [];for(var i=0;i<cities.length;i++)names.push(cities[i].name+', '+twGeoShortState(cities[i].state));showLocationValidationResults(names);});};
sendSearchRequest=function(command){
    if(gLastSearchRequest)gLastSearchRequest.abort();
    var term=command.searchString;
    if(command.isKeyword)for(var i=0;i<gCategories.length;i++)if(gCategories[i].code==term){term=gCategories[i].title;break;}
    var query={term:term,location:command.location,start:command.startIndex,radius:command.searchRadius};
    gLastSearchRequest=performXMLRequest('search',query,function(data,error){
        var rows=data && data.businesses || [],xml='<AppleResults><total>'+rows.length+'</total><items>';
        for(var i=0;i<rows.length;i++){var b=rows[i],id='tw'+i;twBusinessSLMaps[id]=b.mapLink;
            xml+='<anyType><encrypted_id>'+id+'</encrypted_id><businessname>'+twXMLText(b.name)+'</businessname><phone></phone><address>'+twXMLText(b.address)+'</address><city>'+twXMLText(b.city)+'</city><state>'+twXMLText(b.state)+'</state><zipcode>'+twXMLText(b.zip)+'</zipcode></anyType>';
        }xml+='</items></AppleResults>';gTotalResults=rows.length;handleSearchResults(new DOMParser().parseFromString(xml,'text/xml'));
    });
};
getVendorHomepageUrl=function(){return 'https://www.openstreetmap.org/copyright';};
getBizMapUrl=getBizProfileUrl=function(id){return twBusinessSLMaps[id] || 'https://www.openstreetmap.org/';};

var twSLAddressData=getCurrentAddressData;getCurrentAddressData=function(){var d=twSLAddressData();if(d.phone.replace(/\s/g,'')=='Notlisted')d.phone='';return d;};
