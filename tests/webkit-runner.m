/* Integration harness for the actual Tiger WebKit engine. SPDX-License-Identifier: MIT */
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
static id twNativePlugin=nil;
@interface Bridge : NSObject
- (NSString *)runCommand:(NSString *)command input:(NSString *)input;
@end
@implementation Bridge
+ (BOOL)isSelectorExcludedFromWebScript:(SEL)s { return s!=@selector(runCommand:input:) && s!=@selector(runCommand:) && s!=@selector(log:); }
+ (NSString *)webScriptNameForSelector:(SEL)s { if(s==@selector(runCommand:input:))return @"runCommandWithInput";if(s==@selector(runCommand:))return @"runCommand";if(s==@selector(log:))return @"log";return nil; }
- (NSString *)runCommand:(NSString *)command { return [self runCommand:command input:nil]; }
- (NSString *)runCommand:(NSString *)command input:(NSString *)input {
    printf("Command: %s\n",[command UTF8String]);fflush(stdout);
    NSTask *task=[[[NSTask alloc]init]autorelease];NSPipe *out=[NSPipe pipe],*err=[NSPipe pipe];
    [task setLaunchPath:@"/bin/sh"];[task setArguments:[NSArray arrayWithObjects:@"-c",command,nil]];[task setStandardOutput:out];[task setStandardError:err];
    NSPipe *in=nil;if(input){in=[NSPipe pipe];[task setStandardInput:in];}[task launch];
    if(input){[[in fileHandleForWriting]writeData:[input dataUsingEncoding:NSUTF8StringEncoding]];[[in fileHandleForWriting]closeFile];}
    NSData *output=[[out fileHandleForReading]readDataToEndOfFile],*errors=[[err fileHandleForReading]readDataToEndOfFile];[task waitUntilExit];
    NSString *o=[[[NSString alloc]initWithData:output encoding:NSUTF8StringEncoding]autorelease],*e=[[[NSString alloc]initWithData:errors encoding:NSUTF8StringEncoding]autorelease];
    return [NSString stringWithFormat:@"%d\n%@\n--TWERR--\n%@",[task terminationStatus],o?o:@"",e?e:@""];
}
- (void)log:(NSString *)message { printf("JS: %s\n",[message UTF8String]);fflush(stdout); }
- (void)webView:(WebView *)sender windowScriptObjectAvailable:(WebScriptObject *)window {
    printf("Bridge available\n");fflush(stdout);
    [window setValue:self forKey:@"bridge"];
    [sender stringByEvaluatingJavaScriptFromString:@"window.errors=[];window.onerror=function(m,u,l){var desc=typeof m=='object'?(m.type+' '+(m.target && m.target.src || m.target && m.target.tagName || 'unknown')):m+' @ '+l;errors.push(desc);bridge.log(desc);return true;};window.alert=function(m){bridge.log(String(m));};window.getLocalizedString=function(s){return typeof localizedStrings!='undefined' && localizedStrings[s] || s;};window.widget={identifier:'test-tiger-widgets',preferenceForKey:function(k){return this.prefs[k];},setPreferenceForKey:function(v,k){this.prefs[k]=v;},prefs:{},closestCity:function(){return 'Dallas, TX';},setCloseBoxOffset:function(){},setPositionOffset:function(){},prepareForTransition:function(){},performTransition:function(){},openURL:function(){},system:function(cmd,cb){var text=String(bridge.runCommand(cmd)),i=text.indexOf('\\n'),j=text.indexOf('\\n--TWERR--\\n'),p={status:Number(text.substring(0,i)),outputString:text.substring(i+1,j),errorString:text.substring(j+11),cancel:function(){}};if(cb)setTimeout(function(){cb(p);},1);return p;}};"];
    [sender stringByEvaluatingJavaScriptFromString:@"widget.createMenu=function(){window.nativeMenuCount=(window.nativeMenuCount || 0)+1;return {addMenuItem:function(){},setMenuItemEnabledAtIndex:function(){},popup:function(){return 0;}};};widget.setMinimumSize=function(){};widget.resizeAndMoveTo=function(){};widget.usesMetricUnits=function(){return false;};"];
    [sender stringByEvaluatingJavaScriptFromString:@"var originalSystem=widget.system;widget.system=function(cmd,cb){if(cmd.indexOf('flight-key.py')>=0 && / save( cinema)?$/.test(cmd)){var input='';return {write:function(s){input+=s;},close:function(){var text=String(bridge.runCommandWithInput(cmd,input)),i=text.indexOf('\\n'),j=text.indexOf('\\n--TWERR--\\n'),p={status:Number(text.substring(0,i)),outputString:text.substring(i+1,j),errorString:text.substring(j+11)};setTimeout(function(){cb(p);},1);}};}return originalSystem(cmd,cb);};"];
    if(twNativePlugin && [twNativePlugin respondsToSelector:@selector(windowScriptObjectAvailable:)]) [twNativePlugin performSelector:@selector(windowScriptObjectAvailable:) withObject:window];
}
@end
static void spin(double seconds){NSDate *until=[NSDate dateWithTimeIntervalSinceNow:seconds];while([until timeIntervalSinceNow]>0)[[NSRunLoop currentRunLoop]runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];}
static BOOL waitFor(WebView *web,NSString *expression,double timeout){NSDate *until=[NSDate dateWithTimeIntervalSinceNow:timeout];while([until timeIntervalSinceNow]>0){if([[web stringByEvaluatingJavaScriptFromString:expression]isEqualToString:@"yes"])return YES;spin(.1);}return NO;}
static void report(WebView *web,NSString *label,NSString *expression){printf("%s: %s\n",[label UTF8String],[[web stringByEvaluatingJavaScriptFromString:expression]UTF8String]);fflush(stdout);}
int main(int argc,char **argv){
    NSAutoreleasePool *pool=[[NSAutoreleasePool alloc]init];[NSApplication sharedApplication];
    if(argc<3)return 2;
    NSString *bundle=[NSString stringWithUTF8String:argv[1]],*mode=[NSString stringWithUTF8String:argv[2]];
    Bridge *bridge=[[[Bridge alloc]init]autorelease];WebView *web=[[[WebView alloc]initWithFrame:NSMakeRect(0,0,450,520)]autorelease];[web setFrameLoadDelegate:bridge];[[[web mainFrame]frameView]setAllowsScrolling:NO];
    NSWindow *hostWindow=[[[NSWindow alloc]initWithContentRect:NSMakeRect(0,0,450,520) styleMask:NSBorderlessWindowMask backing:NSBackingStoreBuffered defer:NO]autorelease];
    [hostWindow setContentView:web];
    NSArray *paths=[NSArray arrayWithObject:bundle];
    if([web respondsToSelector:@selector(_setAdditionalWebPlugInPaths:)]) [web performSelector:@selector(_setAdditionalWebPlugInPaths:) withObject:paths];
    else if([WebView respondsToSelector:@selector(_setAdditionalWebPlugInPaths:)]) [WebView performSelector:@selector(_setAdditionalWebPlugInPaths:) withObject:paths];
    NSDictionary *widgetInfo=[NSDictionary dictionaryWithContentsOfFile:[bundle stringByAppendingPathComponent:@"Info.plist"]];
    NSString *pluginName=[widgetInfo objectForKey:@"Plugin"];
    if(pluginName){NSBundle *plugin=[NSBundle bundleWithPath:[bundle stringByAppendingPathComponent:pluginName]];Class cls=[plugin principalClass];if(cls && [cls instancesRespondToSelector:@selector(initWithWebView:)])twNativePlugin=[[cls alloc]performSelector:@selector(initWithWebView:) withObject:web];}
    NSString *file=[mode isEqualToString:@"weather"]?@"Weather.html":[mode isEqualToString:@"stocks"]?@"Stocks.html":[mode isEqualToString:@"currency"]?@"UnitConverter.html":@"Main.html";
    if(![[NSFileManager defaultManager]fileExistsAtPath:[bundle stringByAppendingPathComponent:file]]){
        NSDictionary *info=[NSDictionary dictionaryWithContentsOfFile:[bundle stringByAppendingPathComponent:@"Info.plist"]];file=[info objectForKey:@"MainHTML"];
    }
    NSMutableString *html=[NSMutableString stringWithContentsOfFile:[bundle stringByAppendingPathComponent:file]];
    printf("Loading %s (%u characters)\n",[file UTF8String],(unsigned)[html length]);fflush(stdout);
    NSString *localeScript=@"English.lproj/localizedStrings.js";
    if(![[NSFileManager defaultManager]fileExistsAtPath:[bundle stringByAppendingPathComponent:localeScript]])localeScript=@"en.lproj/localizedStrings.js";
    [html replaceOccurrencesOfString:@"src='localizedStrings.js'" withString:[NSString stringWithFormat:@"src='%@'",localeScript] options:0 range:NSMakeRange(0,[html length])];
    [html replaceOccurrencesOfString:@"src=\"localizedStrings.js\"" withString:[NSString stringWithFormat:@"src=\"%@\"",localeScript] options:0 range:NSMakeRange(0,[html length])];
    [[web mainFrame]loadHTMLString:html baseURL:[NSURL fileURLWithPath:[bundle stringByAppendingString:@"/"]]];
    waitFor(web,@"document.body && !document.readyState.match(/loading/) ? 'yes':'no'",30);spin(2);
    BOOL ok=[[web stringByEvaluatingJavaScriptFromString:@"document.readyState"]isEqualToString:@"complete"];
    report(web,@"Runtime",@"typeof widget+' | '+typeof fetchWeatherData+' | '+document.readyState+' | '+String(window.errors)");
    report(web,@"Page state",@"typeof everBeenCalled=='undefined'?'panel':String(everBeenCalled)+' | timer '+String(timer)+' | request '+String(lastWeatherXMLRequest)");
    report(web,@"DOM ids",@"(function(){var a=document.getElementsByTagName('*'),r=[];for(var i=0;i<a.length;i++)if(a[i].id)r.push(a[i].id);return r.join(',');})()");
    if(argc>3)report(web,@"Inspect",[NSString stringWithUTF8String:argv[3]]);
    if([mode isEqualToString:@"weather"]){
        [web stringByEvaluatingJavaScriptFromString:@"if(!everBeenCalled){try{specialFirstLoad();}catch(e){errors.push(String(e));bridge.log(String(e));}}"];
        ok=waitFor(web,@"document.getElementById('temperature').innerText!='--'?'yes':'no'",60) && ok;
        report(web,@"Initial weather",@"document.getElementById('location').innerText+' '+document.getElementById('temperature').innerText");
        [web stringByEvaluatingJavaScriptFromString:@"showbackside({stopPropagation:function(){},preventDefault:function(){}});document.getElementById('zip').value='Paris, France';zipTyping({});"];
        ok=waitFor(web,@"String(document.getElementById('zip').postal).indexOf('om:')==0 && zipValidated?'yes':'no'",60) && ok;
        report(web,@"Automatic validation",@"String(nativeMenuCount)+' native popup(s); Find button: '+String(!!document.getElementById('tw-search'))");
        report(web,@"City selection",@"document.getElementById('zip').value+' | '+document.getElementById('zip').postal");
        [web stringByEvaluatingJavaScriptFromString:@"showfront({});"];
        ok=waitFor(web,@"document.getElementById('location').innerText=='Paris'?'yes':'no'",60) && ok;
        report(web,@"Updated weather",@"document.getElementById('location').innerText+' '+document.getElementById('temperature').innerText");
    }else if([mode isEqualToString:@"currency"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.testCurrency='pending';performXMLRequest(function(d){window.testCurrency=d.error?'error':String(d.data.length);});"];
        ok=waitFor(web,@"Number(window.testCurrency)>30?'yes':'no'",60) && ok;report(web,@"Currencies",@"window.testCurrency");
    }else if([mode isEqualToString:@"stocks"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.testStock='pending';fetchStockData(function(d){window.testStock=String(d.quotes[0].lasttrade);},['AAPL']);"];
        ok=waitFor(web,@"Number(window.testStock)>0?'yes':'no'",60) && ok;report(web,@"AAPL",@"window.testStock");
        ok=waitFor(web,@"typeof gChartData!='undefined' && gChartData.length>0?'yes':'no'",60) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"window.chartPaints=0;var savedPaint=twStocksOriginalChart;twStocksOriginalChart=function(d){chartPaints++;savedPaint(d);};showbackside({stopPropagation:function(){},preventDefault:function(){}});showAsPercentChanged({stopPropagation:function(){},preventDefault:function(){}});selectDone();"];
        ok=waitFor(web,@"chartPaints>0 && (!document.getElementById('chart-grid') || document.getElementById('chart-grid').style.display=='inline')?'yes':'no'",10) && ok;
        report(web,@"Chart after percentage setting",@"String(chartPaints)+' repaint(s); '+(document.getElementById('chart-grid')?document.getElementById('chart-grid').style.display:'canvas')");
        report(web,@"Footer",@"(document.getElementById('delayed') || document.getElementById('quoteUpdateDiv')).innerText");
        ok=[[web stringByEvaluatingJavaScriptFromString:@"(document.getElementById('delayed') || document.getElementById('quoteUpdateDiv')).innerText"]isEqualToString:@"Yahoo Finance - may be delayed"] && ok;
    }else if([mode isEqualToString:@"espn"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.espnCount=-1;switchLeague('nfl',function(){});var scoreEvent={stopPropagation:function(){},preventDefault:function(){}};onScoresButtonMouseDown(scoreEvent,document.getElementById('iScoresButtonText'));scoresButtonMouseUpHandler(scoreEvent);fetchScores('nfl',function(d){window.espnCount=d.error?-2:d.games.length;gCurrentLeague='nfl';scoresModeDataConsumerCallback_Scores(d);});"];
        ok=waitFor(web,@"window.espnCount>=0?'yes':'no'",60) && ok;report(web,@"Original ESPN games",@"String(window.espnCount)");
    }else if([mode isEqualToString:@"business-sl"]){
        [web stringByEvaluatingJavaScriptFromString:@"gSearchCommand=new SearchCommand('cafe','Dallas, TX',20,0,20,false);search();"];
        ok=waitFor(web,@"typeof gTotalResults!='undefined' && gTotalResults>0?'yes':'no'",60) && ok;report(web,@"Business matches",@"String(gTotalResults)");
    }else if([mode isEqualToString:@"people"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.peopleURL='';widget.openURL=function(url){window.peopleURL=url;};performXMLRequest('search',buildSearchRequest({firstName:'Test',lastName:'Example'},['','Cupertino','CA','']),function(){});"];
        ok=[[web stringByEvaluatingJavaScriptFromString:@"peopleURL.indexOf('https://www.whitepages.com/name/')==0?'yes':'no'"]isEqualToString:@"yes"] && ok;report(web,@"Original People web search",@"window.peopleURL");
    }else if([mode isEqualToString:@"movies-settings"]){
        [web stringByEvaluatingJavaScriptFromString:@"showBack();window.cinemaFrontCount=0;twCinemaOriginalFront=function(){cinemaFrontCount++;};"];
        spin(1);
        [web stringByEvaluatingJavaScriptFromString:@"document.getElementById('tw-cinema-key').value='ac_live_TEST_NOT_A_REAL_KEY';showFront();"];
        ok=waitFor(web,@"twCinemaEnabled && cinemaFrontCount==1?'yes':'no'",10) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"showBack();"];
        ok=waitFor(web,@"document.getElementById('tw-cinema-status').innerText.indexOf('Key saved')==0 && document.getElementById('tw-cinema-key').value==''?'yes':'no'",10) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"twCinemaClear();"];
        ok=waitFor(web,@"!twCinemaEnabled && document.getElementById('tw-cinema-status').innerText.indexOf('Catalog')==0?'yes':'no'",10) && ok;
        report(web,@"Private cinema settings",@"String(cinemaFrontCount)+' save; '+document.getElementById('tw-cinema-status').innerText");
    }else if([mode isEqualToString:@"cinema-live"]){
        ok=waitFor(web,@"typeof allMoviesList!='undefined' && allMoviesList && allMoviesList.length>0 && allTheatersList && allTheatersList.length>0?'yes':'no'",60) && ok;
        report(web,@"Cinema movies",@"allMoviesList?String(allMoviesList.length):'none'");
        report(web,@"Cinema theaters",@"allTheatersList?String(allTheatersList.length):'none'");
        ok=waitFor(web,@"document.getElementById('currentPoster').src.indexOf('/Library/Caches/TigerWidgets/cache-')>=0?'yes':'no'",60) && ok;
        report(web,@"Cinema poster",@"document.getElementById('currentPoster').src.indexOf('/Library/Caches/TigerWidgets/cache-')>=0?'local image':'unavailable'");
        [web stringByEvaluatingJavaScriptFromString:@"window.cinemaCounts=[allTheatersList.length,allMoviesList.length];var previews=allMoviesList.filter(function(m){return m.trailer && m.trailer.url!='#';});if(previews.length){currentMovieId=previews[0].id;displayAllMovieInfo();document.getElementById('movie').muted=true;trailerButtonClicked({});}"];
        ok=waitFor(web,@"getMovie() && getMovie().GetTime && getMovie().GetTime()>0?'yes':'no'",60) && ok;
        report(web,@"Apple trailer with cinema configured",@"getMovie() && getMovie().GetTime?String(getMovie().GetTime()):'unavailable'");
        ok=[[web stringByEvaluatingJavaScriptFromString:@"twCinemaEnabled && allTheatersList.length==window.cinemaCounts[0] && allMoviesList.length==window.cinemaCounts[1]?'yes':'no'"]isEqualToString:@"yes"] && ok;
        [web stringByEvaluatingJavaScriptFromString:@"stopMovie(showMovieInfo);"];spin(2);
    }else if([mode isEqualToString:@"movies"]){
        ok=waitFor(web,@"allMoviesList && allMoviesList.length>0 && poster1.src.indexOf('file:')==0?'yes':'no'",60) && ok;report(web,@"Original Movies catalog",@"allMoviesList?String(allMoviesList.length):'none'");
        [web stringByEvaluatingJavaScriptFromString:@"currentPosterId=allMoviesList[0].id;posterClicked({shiftKey:false});"];
        spin(4);report(web,@"Movie details",@"document.getElementById('currentTitle').innerText");
        [web stringByEvaluatingJavaScriptFromString:@"window.previewPath='pending';var selected=allMoviesTable[currentMovieId];twMovieMedia(selected.trailer.url,function(path){window.previewPath=path || 'error';});"];
        ok=waitFor(web,@"window.previewPath!='pending'?'yes':'no'",60) && ok;
        ok=[[web stringByEvaluatingJavaScriptFromString:@"window.previewPath.indexOf('file:')==0?'yes':'no'"]isEqualToString:@"yes"] && ok;report(web,@"Local H264 preview",@"window.previewPath.indexOf('file:')==0?'downloaded':'unavailable'");
        [web stringByEvaluatingJavaScriptFromString:@"var preview=allMoviesTable[currentMovieId].trailer;preview.url=window.previewPath;preview.remote=false;document.getElementById('movie').muted=true;trailerButtonClicked({});"];
        ok=waitFor(web,@"getMovie() && getMovie().GetTime && getMovie().GetTime()>0?'yes':'no'",25) && ok;report(web,@"QuickTime playback",@"getMovie() && getMovie().GetTime?String(getMovie().GetTime()):'plugin unavailable'");
        [web stringByEvaluatingJavaScriptFromString:@"stopMovie(showMovieInfo);"];spin(2);


    }else if([mode isEqualToString:@"sports"]){
        [web stringByEvaluatingJavaScriptFromString:@"document.getElementsByTagName('button')[0].onclick();"];
        ok=waitFor(web,@"document.getElementById('results').childNodes.length>0?'yes':'no'",60) && ok;
        report(web,@"Scoreboard",@"document.getElementById('status').innerText");
    }else if([mode isEqualToString:@"translation"]){
        [web stringByEvaluatingJavaScriptFromString:@"var from=(document.getElementById('from_Language_PopupMenu') || document.getElementById('fromPopup'));from.selectedIndex=3;handleFromLanguageChanged(from);var to=(document.getElementById('to_Language_PopupMenu') || document.getElementById('toPopup')),list=languageData[3].array;for(var n=0;n<list.length;n++)if(list[n]=='es')to.selectedIndex=n;handleToLanguageChanged(to);(document.getElementById('from_text_area') || document.getElementById('fromTextArea')).value='Hello';translateKeyUp({keyCode:72},(document.getElementById('from_text_area') || document.getElementById('fromTextArea')));"];
        ok=waitFor(web,@"(document.getElementById('to_text_area') || document.getElementById('toTextArea')).value.length>0?'yes':'no'",60) && ok;
        report(web,@"Translation",@"(document.getElementById('to_text_area') || document.getElementById('toTextArea')).value");
        [web stringByEvaluatingJavaScriptFromString:@"(document.getElementById('from_text_area') || document.getElementById('fromTextArea')).value='hello';var to=(document.getElementById('to_Language_PopupMenu') || document.getElementById('toPopup')),list=languageData[3].array;for(var n=0;n<list.length;n++)if(list[n]=='ja')to.selectedIndex=n;handleToLanguageChanged(to);"];
        ok=waitFor(web,@"(document.getElementById('to_text_area') || document.getElementById('toTextArea')).value.charCodeAt(0)==12371?'yes':'no'",10) && ok;
        report(web,@"Japanese translation",@"(document.getElementById('to_text_area') || document.getElementById('toTextArea')).value");
    }else if([mode isEqualToString:@"places"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.businessTest='pending';var q=buildSearchRequest({searchTerm:'cafe',RecordsFrom:0,rangeLimit:20},['','Dallas','TX','']);performXMLRequest('search',q,function(d,e){window.businessTest=d?String(d.businesses.length):String(e);if(d){gPhoneBookMainView.growView(true,false);dataLoaded(d,e);}});"];
        ok=waitFor(web,@"Number(window.businessTest)>0?'yes':'no'",60) && ok;report(web,@"Business matches",@"window.businessTest");
    }else if([mode isEqualToString:@"ski"]){
        ok=waitFor(web,@"document.getElementById('tw-ski-snow-symbol')!=null?'yes':'no'",60) && ok;
        report(web,@"Snow model",@"document.getElementById('resortName').innerText+' '+document.getElementById('temp').innerText+' '+document.getElementById('base').innerText");
    }else if([mode isEqualToString:@"flight-settings"]){
        [web stringByEvaluatingJavaScriptFromString:@"showbackside({});"];
        ok=waitFor(web,@"document.getElementById('tw-flight-key-status').innerText.indexOf('Loading')<0?'yes':'no'",10) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"document.getElementById('tw-flight-key').value='TW_TEST_KEY_NOT_A_REAL_KEY';donePressed({});"];
        ok=waitFor(web,@"document.getElementById('behind').style.display=='none' && twFlightKeyConfigured?'yes':'no'",10) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"showbackside({});"];
        ok=waitFor(web,@"document.getElementById('tw-flight-key-status').innerText.indexOf('Key saved')==0 && document.getElementById('tw-flight-key').value==''?'yes':'no'",10) && ok;
        report(web,@"Saved key",@"document.getElementById('tw-flight-key-status').innerText");
        [web stringByEvaluatingJavaScriptFromString:@"donePressed({});showbackside({});"];
        ok=waitFor(web,@"document.getElementById('tw-flight-key-status').innerText.indexOf('Key saved')==0?'yes':'no'",10) && ok;
        [web stringByEvaluatingJavaScriptFromString:@"twFlightClearKey();"];
        ok=waitFor(web,@"document.getElementById('tw-flight-key-status').innerText.indexOf('Paste')==0?'yes':'no'",10) && ok;
        report(web,@"Removed key",@"document.getElementById('tw-flight-key-status').innerText");
    }else if([mode isEqualToString:@"flight-live"]){
        [web stringByEvaluatingJavaScriptFromString:@"window.liveFlightResult='pending';defaultDepartCity='JFK';defaultArriveCity='LHR';performXMLRequest('-','-','JFK','LHR',false,function(d,e){window.liveFlightResult=d.error?'error':String(d.flights.length);if(!d.error)searchResultsLoaded(d,e);});"];
        ok=waitFor(web,@"window.liveFlightResult!='pending'?'yes':'no'",60) && ok;
        report(web,@"Authenticated route results",@"window.liveFlightResult");
        [web stringByEvaluatingJavaScriptFromString:@"window.trackDone=false;window.planePaints=0;var originalPlane=drawPlane;drawPlane=function(c,p,a){planePaints++;originalPlane(c,p,a);};var originalTrack=trackingDataLoaded;trackingDataLoaded=function(d,e){try{originalTrack(d,e);}catch(x){errors.push(String(x));bridge.log(String(x));}window.trackDone=true;};if(typeof trackFlightWithResultIndex=='function')trackFlightWithResultIndex(0);else trackFlight(0);"];
        ok=waitFor(web,@"window.trackDone?'yes':'no'",60) && ok;
        spin(4);
        report(web,@"Selected flight",@"String(trackingAirlineCode)+' '+String(trackingFlightNo)+'; '+document.getElementById('status-label').innerText");
        report(web,@"Plane draws",@"String(window.planePaints)");
        ok=[[web stringByEvaluatingJavaScriptFromString:@"window.planePaints>0?'yes':'no'"]isEqualToString:@"yes"] && ok;
        report(web,@"Tracking",@"gCachedTrackingData && gCachedTrackingData.flights?String(gCachedTrackingData.flights[0].legs[0].tracking && gCachedTrackingData.flights[0].legs[0].tracking.latitude):'missing'");
        [web stringByEvaluatingJavaScriptFromString:@"var sample=gCachedTrackingData,leg=sample.flights[0].legs[0],savedTracking=leg.tracking,savedStatus=leg.status,before=planePaints;leg.tracking=null;leg.status='Enroute';trackingDataLoaded(sample,null);window.noPositionPassed=planePaints==before && document.getElementById('airAltitudeUnits-label').innerText.toLowerCase()=='position unavailable';leg.status='Scheduled';trackingDataLoaded(sample,null);window.scheduledPassed=planePaints>before;before=planePaints;leg.status='Cancelled';trackingDataLoaded(sample,null);window.cancelledPassed=planePaints==before;leg.status='Landed';trackingDataLoaded(sample,null);window.landedPassed=planePaints>before;leg.tracking=savedTracking;leg.status=savedStatus;trackingDataLoaded(sample,null);"];
        ok=[[web stringByEvaluatingJavaScriptFromString:@"noPositionPassed && scheduledPassed && landedPassed && cancelledPassed?'yes':'no'"]isEqualToString:@"yes"] && ok;
        report(web,@"Missing position and ground states",@"String(noPositionPassed)+' / '+String(scheduledPassed)+' / '+String(landedPassed)+' / cancelled '+String(cancelledPassed)");

    }else if([mode isEqualToString:@"flight"]){
        [web stringByEvaluatingJavaScriptFromString:@"performXMLRequest('AA','100','JFK','LHR',false,searchResultsLoaded);"];
        ok=waitFor(web,@"document.getElementById('status-label').innerText.indexOf('key')>=0?'yes':'no'",20) && ok;
        report(web,@"Original Flight Tracker",@"document.getElementById('status-label').innerText");
    }
    if(![mode isEqualToString:@"inspect"]){
        int shotWidth=450,shotHeight=520;
        if([mode isEqualToString:@"movies"] || [mode isEqualToString:@"cinema-live"]){shotWidth=510;shotHeight=430;}
        if([mode isEqualToString:@"espn"]){shotWidth=350;shotHeight=220;}
        if([mode isEqualToString:@"business-sl"]){shotWidth=340;shotHeight=260;}
        if([mode isEqualToString:@"translation"]){shotWidth=328;shotHeight=250;}
        if([mode hasPrefix:@"flight"]){shotWidth=409;shotHeight=220;}
        if([mode isEqualToString:@"places"]){shotWidth=335;shotHeight=440;}
        if([mode isEqualToString:@"ski"]){shotWidth=300;shotHeight=250;}
        if([mode isEqualToString:@"weather"]){shotWidth=450;shotHeight=300;}
        [hostWindow setContentSize:NSMakeSize(shotWidth,shotHeight)];[web setFrame:NSMakeRect(0,0,shotWidth,shotHeight)];
        spin(1);[web setNeedsDisplay:YES];
        NSBitmapImageRep *image=[[[NSBitmapImageRep alloc]initWithBitmapDataPlanes:NULL pixelsWide:shotWidth pixelsHigh:shotHeight bitsPerSample:8 samplesPerPixel:4 hasAlpha:YES isPlanar:NO colorSpaceName:NSCalibratedRGBColorSpace bytesPerRow:0 bitsPerPixel:0]autorelease];
        NSGraphicsContext *context=[NSGraphicsContext graphicsContextWithBitmapImageRep:image];
        [web displayRectIgnoringOpacity:[web bounds] inContext:context];
        [[image representationUsingType:NSPNGFileType properties:[NSDictionary dictionary]]writeToFile:[NSString stringWithFormat:@"build/native-%@.png",mode] atomically:YES];
    }
    report(web,@"Errors",@"window.errors.join('; ')");
    if(![[web stringByEvaluatingJavaScriptFromString:@"String(window.errors.length)"]isEqualToString:@"0"])ok=NO;
    printf("RESULT: %s\n",ok?"PASS":"FAIL");[pool release];return ok?0:1;
}
