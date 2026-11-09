/* Frankfurter daily reference rates, USD base. SPDX-License-Identifier: MIT */
function performXMLRequest(callback) {
    return twRequest(['currency'],function(rows){
        if(rows.error) {callback(rows);return;}
        var data=[], updated=null;
        for(var i=0;i<rows.length;i++) {
            var row=rows[i]; if(typeof row.rate!='number' || row.rate<=0 || !isFinite(row.rate)) continue;
            var date=row.date.split('-'); updated=new Date(Date.UTC(Number(date[0]),Number(date[1])-1,Number(date[2])));
            var name=row.quote;
            if(window.ConverterPlugin) {var translated=ConverterPlugin.currencyNameForCode(row.quote); if(typeof translated=='string' && translated.length)name=translated;}
            data[data.length]={name:name,iso:row.quote,lastUpdated:updated,toBase:1/row.rate,fromBase:row.rate,precision:computeSymmetricPrecision(1/row.rate,row.rate)};
        }
        if(!data.length) {callback(constructError('No exchange rates returned'));return;}
        data[data.length]={name:'US Dollar',iso:'USD',lastUpdated:updated,toBase:1,fromBase:1,precision:2};
        data.sort(function(a,b){return a.name<b.name?-1:a.name>b.name?1:0;});
        callback({error:false,data:data,nextUpdate:(new Date()).valueOf()+21600000});
    });
}
var twCurrencyStatus=displayCurrencyStatusText;
displayCurrencyStatusText = function() {
    twCurrencyStatus();
    document.getElementById('currency-status').title='Frankfurter daily reference rates. Not live trading rates.';
};
