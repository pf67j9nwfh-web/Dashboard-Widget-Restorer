/* Feed MyMemory results into Apple's original Translation UI and automatic typing flow. MIT. */
var twTranslationSequence=0;
function twTranslationField(){return document.getElementById('from_text_area') || document.getElementById('fromTextArea');}
function performXMLRequest(encodedText,encodingType,translationType,callback) {
    var text=twTranslationField().value;
    var languages=String(translationType).replace('_','|').split('|');
    if(languages.length!=2 && String(translationType).length==4)languages=[String(translationType).substr(0,2),String(translationType).substr(2,2)];
    for(var i=0;i<languages.length;i++)languages[i]=languages[i]=='zt'?'zh-TW':languages[i]=='zh'?'zh-CN':languages[i];
    var seq=++twTranslationSequence;
    if(!text || unescape(encodeURIComponent(text)).length>500){setTimeout(function(){callback(null,'Maximum 500 UTF-8 bytes.');},0);return {abort:function(){}};}
    return twRequest(['translate',encodeURIComponent(text),languages[0],languages[1]],function(data){
        if(seq!=twTranslationSequence || twTranslationField().value!=text)return;
        if(data.error || data.responseStatus!=200 || !data.responseData){callback(null,data.errorString || data.responseDetails || 'Translation unavailable');return;}
        var translated=data.responseData.translatedText || '',matches=data.matches || [],best=-1;
        // Some successful MyMemory responses have an empty primary translation.
        // Use a nonempty high-confidence memory match instead of reporting no data.
        if(!String(translated).replace(/\s/g,''))for(var j=0;j<matches.length;j++){
            var m=matches[j],score=Number(m.match);
            if(m.translation && String(m.translation).replace(/\s/g,'') && score>=0.9 && score>best){translated=m.translation;best=score;}
        }
        callback(translated?twDecodeEntities(translated):null,translated?null:'No translation returned.');
    });
}
/* Avoid the old provider-specific byte encoder; MyMemory always receives UTF-8. */
fetchTranslatedData=function() {
    if(!twTranslationField().value)return;
    if(gLastTranslationXMLRequest)gLastTranslationXMLRequest.abort();
    gLastTranslationXMLRequest=performXMLRequest('', 'utf-8',getTranslationType(),translationLoaded);
};
