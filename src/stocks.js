/* Yahoo Finance public chart/search adapters; best effort, potentially delayed. MIT. */
function twStockSymbol(s) { return s=='INDU'?'^DJI':s=='COMPX'?'^IXIC':s; }
function twStockResult(data) {
    if(data.error) return data;
    if(!data.chart || data.chart.error || !data.chart.result || !data.chart.result.length) return constructError('Symbol unavailable');
    return data.chart.result[0];
}
function fetchStockData(callback,symbols) {
    var quotes=[], index=0, cancelled=false, request=null;
    function next() {
        if(cancelled) return;
        if(index==symbols.length) {callback({error:false,quotes:quotes,open:true});return;}
        var symbol=symbols[index++];
        request=twRequest(['stock',encodeURIComponent(twStockSymbol(symbol)),'5d'],function(data){
            var result=twStockResult(data), m=result.meta || {}, price=m.regularMarketPrice, previous=m.chartPreviousClose;
            var close=result.indicators && result.indicators.quote && result.indicators.quote[0].close;
            if(close) { for(var i=close.length-2;i>=0;i--) if(typeof close[i]=='number') {previous=close[i];break;} }
            var available=typeof price=='number' && isFinite(price);
            var delta=available && typeof previous=='number'?price-previous:null;
            quotes[quotes.length]={symbol:symbol,lasttrade:available?price:'N/A',change:delta===null?'N/A':delta,pctchange:delta===null || !previous?'N/A':delta/previous*100,open:false,link:'https://finance.yahoo.com/quote/'+encodeURIComponent(twStockSymbol(symbol))+'/'};
            next();
        });
    }
    next(); return {abort:function(){cancelled=true;if(request) request.abort();}};
}
function validateSymbol(callback,symbol) {
    return twRequest(['stock-search',encodeURIComponent(symbol)],function(data){
        if(data.error) {callback(data);return;}
        var results=[], quotes=data.quotes || [];
        for(var i=0;i<quotes.length;i++) if(quotes[i].symbol) results[results.length]={symbol:quotes[i].symbol,name:quotes[i].shortname || quotes[i].longname || quotes[i].symbol,exchange:quotes[i].exchange || '',link:'https://finance.yahoo.com/quote/'+encodeURIComponent(quotes[i].symbol)+'/'};
        callback({error:false,symbols:results});
    });
}
function fetchChartData(symbol,range,callback) {
    range=range=='1w'?'5d':range=='1m'?'1mo':range=='3m'?'3mo':range=='6m'?'6mo':range;
    return twRequest(['stock',encodeURIComponent(twStockSymbol(symbol)),range],function(data){
        var result=twStockResult(data);
        if(result.error) {callback(result);return;}
        var points=[], times=result.timestamp || [], values=result.indicators.quote[0].close;
        for(var i=0;i<times.length;i++) if(typeof values[i]=='number' && isFinite(values[i])) points[points.length]={date:new Date(times[i]*1000),close:values[i]};
        callback(points.length?{error:false,data:points}:constructError('No chart data for this range'));
    });
}

if(typeof selectDone=='function'){
/* Keep the provider notice in Apple's footer; body-level positioning overlaps charts. */
var twStocksOriginalStatus=updateStatusText;
updateStatusText=function(){
    twStocksOriginalStatus();
    var status=document.getElementById('delayed');
    status.title=status.innerText;
    status.innerText='Yahoo Finance - may be delayed';
    status.style.left='40px';status.style.fontSize='8px';
    status.style.width='150px';status.style.whiteSpace='nowrap';
};
/* Tiger clears a canvas when Dashboard resizes it during a settings flip.
   Repaint the loaded series after the original controller finishes that layout. */
var twStocksChart=null,twStocksRedrawTimer=null,twStocksOriginalChart=chart_callback;
function twStocksChartKey(){return currentSelection?currentSelection.getAttribute('tag')+'|'+currentChartMode:null;}
chart_callback=function(data){
    if(!data.error && data.data && data.data.length)twStocksChart={key:twStocksChartKey(),data:data};
    twStocksOriginalChart(data);
};
function twStocksRedraw(){
    if(twStocksRedrawTimer)clearTimeout(twStocksRedrawTimer);
    twStocksRedrawTimer=setTimeout(function(){
        twStocksRedrawTimer=null;
        if(isShowingFront && showingCharts && twStocksChart && twStocksChart.key==twStocksChartKey())twStocksOriginalChart(twStocksChart.data);
    },350);
}
var twStocksOriginalDone=selectDone,twStocksOriginalPercent=updateShowPercentUI;
selectDone=function(){twStocksOriginalDone();twStocksRedraw();};
updateShowPercentUI=function(value){twStocksOriginalPercent(value);twStocksRedraw();};

var twStocksOriginalSetup=setupWidget,twStocksOriginalQuotes=xml_callback;
setupWidget=function(){twStocksOriginalSetup();updateStatusText();};
xml_callback=function(data){twStocksOriginalQuotes(data);updateStatusText();};

window.addEventListener('resize',twStocksRedraw,false);

}
