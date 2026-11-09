/* Adapt modern quotes to Snow Leopard's string prices and richer chart model. MIT. */
var twSLQuotes=fetchStockData;
fetchStockData=function(callback,symbols){return twSLQuotes(function(data){for(var i=0;i<data.quotes.length;i++){var q=data.quotes[i];q.lasttrade=String(q.lasttrade);q.change=String(q.change);q.pctchange=String(q.pctchange);}callback(data);},symbols);};
fetchChartData=function(symbol,range,callback){
    range=range=='1w'?'5d':range=='1m'?'1mo':range=='3m'?'3mo':range=='6m'?'6mo':range;
    return twRequest(['stock',encodeURIComponent(twStockSymbol(symbol)),range],function(data){
        var r=twStockResult(data);if(r.error){callback(r);return;}
        var out={error:false,data:[],gaps:[],min:null,max:null,meta:{}},times=r.timestamp || [],values=r.indicators.quote[0].close;
        for(var i=0;i<times.length;i++)if(typeof values[i]=='number' && isFinite(values[i])){var point={date:new Date(times[i]*1000),timestep:times[i],close:values[i]};out.data.push(point);if(!out.min || point.close<out.min.close)out.min=point;if(!out.max || point.close>out.max.close)out.max=point;}
        if(!out.data.length){callback(constructError('No chart data'));return;}
        var trading=r.meta.currentTradingPeriod && r.meta.currentTradingPeriod.regular || {};
        out.meta={symbol:symbol,marketopen:new Date((trading.start || times[0])*1000),marketclose:new Date((trading.end || times[times.length-1])*1000),gmtoffset:(r.meta.gmtoffset || 0)/3600};callback(out);
    });
};
var twStocksOriginalChart=chart_callback,twSLChart=null,twSLRedrawTimer=null;
chart_callback=function(data){if(!data.error){twSLChart={data:data,key:currentSelection && currentSelection.getAttribute('tag')+'|'+currentChartMode};window.gChartData=data.data;}twStocksOriginalChart(data);};
function twSLRedraw(){if(twSLRedrawTimer)clearTimeout(twSLRedrawTimer);twSLRedrawTimer=setTimeout(function(){if(isShowingFront && twSLChart && currentSelection && twSLChart.key==currentSelection.getAttribute('tag')+'|'+currentChartMode)twStocksOriginalChart(twSLChart.data);},350);}
var twSLFront=showFrontside,twSLPercent=updateShowPercentUI;
showFrontside=function(){twSLFront();twSLRedraw();};
updateShowPercentUI=function(value){twSLPercent(value);twSLRedraw();};
window.addEventListener('resize',twSLRedraw,false);
updateStatusText=function(){stopDelayedTextCrossFade();twText('quoteUpdateDiv','Yahoo Finance - may be delayed');twText('messageDiv','');};
var selectDone=showFrontside,showbackside=showBackside;

var twSLOnshow=onshow;onshow=function(){twSLOnshow();updateStatusText();};if(window.widget)widget.onshow=onshow;
