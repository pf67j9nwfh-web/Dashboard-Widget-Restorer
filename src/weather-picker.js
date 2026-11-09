/* Preserve Apple's original city field and native popup; validate after typing. MIT. */
var twWeatherTimer=null,twWeatherRequest=null,twWeatherSequence=0;
var twWeatherOriginalFront=showfront,twWeatherOriginalValidation=validationCallbackDelayed;
function twWeatherCancel() {
    if(twWeatherTimer!==null){clearTimeout(twWeatherTimer);twWeatherTimer=null;}
    if(twWeatherRequest){twWeatherRequest.abort();twWeatherRequest=null;}
    if(validateTimerData){clearInterval(validateTimerData.timer);validateTimerData=null;}
}
function zipTyping(event) {
    twWeatherSequence++;twWeatherCancel();
    zipValidated=false;document.getElementById('zip').postal=null;
    var text=document.getElementById('zip').value.replace(/^\s+|\s+$/g,'');
    if(text.length>=2)twWeatherTimer=setTimeout(function(){twWeatherTimer=null;zipChanged();},600);
}
function zipChanged() {
    twWeatherCancel();var seq=++twWeatherSequence;
    var status=document.getElementById('validate');status.style.display='block';status.innerText=getLocalizedString('Validating');
    validateTimerData={timer:setInterval('validateTimer();',500),pos:3,forward:true};
    twWeatherRequest=validateWeatherLocation(document.getElementById('zip').value,function(data){
        if(seq!=twWeatherSequence || isShowingFront)return;
        validationCallback(data);
    });
}
function zipKeyPress(event) {
    if(event.keyCode==13 || event.keyCode==3 || event.keyCode==9){zipChanged();if(event.keyCode!=9 && event.preventDefault)event.preventDefault();}
}
validationCallbackDelayed=function() {
    twWeatherOriginalValidation();
    var input=document.getElementById('zip');zipValidated=!!input.postal;
};
showfront=function(event) {
    twWeatherSequence++;twWeatherCancel();twWeatherOriginalFront(event);
};
