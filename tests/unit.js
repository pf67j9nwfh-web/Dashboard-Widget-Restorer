// Run on a modern development host: node tests/unit.js
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const src=path.join(__dirname,'../src');
function context(extra){const c=Object.assign({window:{},document:{}},extra);vm.createContext(c);return c;}
function load(c,file){vm.runInContext(fs.readFileSync(path.join(src,file),'utf8'),c,{filename:file});}
for(const file of fs.readdirSync(src).filter(x=>x.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(src,file),'utf8'),{filename:file});
const json=context();load(json,'common.js');
assert.deepStrictEqual(JSON.parse(JSON.stringify(json.twJSON('{"s":"café\\n\\u2603","n":-12.3e2,"a":[true,false,null]}'))),{s:'café\n☃',n:-1230,a:[true,false,null]});
for(const bad of ['{"x":1};alert(1)','[1,]','{"a":NaN}','{"__proto__":{}}','01','"\n"'])assert.throws(()=>json.twJSON(bad));
const e={zip:{value:'Paris, France',postal:'old-coordinate'},validate:{style:{}}};
let callback,autoSearch,frontCalls=0,menus=0;
const picker=context({showfront:()=>frontCalls++,validationCallbackDelayed:()=>{menus++;e.zip.value='Paris, FR';e.zip.postal='om:48.85:2.35:Paris';},isShowingFront:false,zip:'Dallas',zipValidated:false,validateTimerData:null,setTimeout:fn=>{autoSearch=fn;return 1;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},getLocalizedString:s=>s,document:{getElementById:id=>e[id]},validateWeatherLocation:(q,cb)=>{callback=cb;return {abort(){}}},validationCallback:()=>picker.validationCallbackDelayed()});
const front=picker.showfront,validation=picker.validationCallbackDelayed;load(picker,'weather-picker.js');
assert.strictEqual(picker.twWeatherOriginalFront,front);assert.strictEqual(picker.twWeatherOriginalValidation,validation);
picker.zipTyping({});assert.strictEqual(e.zip.postal,null);assert.strictEqual(typeof autoSearch,'function');autoSearch();callback({cities:[{name:'Paris'}]});assert.strictEqual(e.zip.postal,'om:48.85:2.35:Paris');assert.strictEqual(menus,1);picker.showfront({});assert.strictEqual(frontCalls,1);
e.zip.value='London';picker.zipTyping({});autoSearch();const stale=callback;e.zip.value='Berlin';picker.zipTyping({});autoSearch();stale({cities:[{name:'London'}]});assert.strictEqual(e.zip.postal,null);assert.strictEqual(menus,1);picker.showfront({});assert.strictEqual(frontCalls,2);
assert(!fs.readFileSync(path.join(src,'weather-picker.js'),'utf8').includes('createElement'));
assert(fs.readFileSync(path.join(__dirname,'../scripts/manage.py'),'utf8').includes("PANELS = {'ESPN':'sports'}"));
const translate=context({document:{getElementById:()=>({value:'Hello'})},twRequest:(args,cb)=>{assert.deepStrictEqual(Array.from(args),['translate','Hello','en','es']);cb({responseStatus:200,responseData:{translatedText:'Hola &amp; adiós'}});return {};}});load(translate,'geo.js');load(translate,'translation.js');let translation;translate.performXMLRequest('','','en_es',s=>translation=s);assert.strictEqual(translation,'Hola & adiós');
translate.twRequest=(args,cb)=>{cb({responseStatus:200,responseData:{translatedText:''},matches:[{translation:'',match:1},{translation:'こんにちは',match:1},{translation:'unrelated',match:.5}]});return {};};
translate.performXMLRequest('','','en_ja',s=>translation=s);assert.strictEqual(translation,'こんにちは');
const flights=context({showbackside:()=>{},donePressed:()=>{},drawFlightPath:()=>{},drawCurvedPaths:()=>{},updateStatusInfo:()=>{},twAirports:{JFK:{latitude:'40N',longitude:'73W'},LHR:{latitude:'51N',longitude:'0W'}}});load(flights,'flight.js');let flight=flights.twFlightConvert({data:[{flight:{number:'100'},airline:{name:'American'},flight_status:'active',departure:{iata:'JFK',scheduled:'2026-11-08T10:00:00+00:00'},arrival:{iata:'LHR',scheduled:'2026-11-08T17:00:00+00:00'}}]},'AAL');assert.strictEqual(flight.flights[0].legs[0].status,'Enroute');assert.strictEqual(flight.flights[0].number,'100');assert.strictEqual(flight.airports.JFK.latitude,'40N');
const currency=context({displayCurrencyStatusText:()=>{},computeSymmetricPrecision:()=>4,twRequest:(args,cb)=>cb([{date:'2026-11-06',quote:'EUR',rate:.86}]),ConverterPlugin:{currencyNameForCode:()=>({})},constructError:s=>({error:true,errorString:s})});currency.window.ConverterPlugin=currency.ConverterPlugin;load(currency,'currency.js');
let converted;currency.performXMLRequest(d=>converted=d);assert.strictEqual(converted.data.length,2);assert.strictEqual(converted.data[0].name,'EUR');assert(Math.abs(converted.data[0].toBase*converted.data[0].fromBase-1)<1e-12);
let releases=0,processCallback,xhr;
const transport=context({widget:{system:(cmd,cb)=>{if(cmd.includes(' release ')){releases++;cb({status:0});}else processCallback=cb;return {cancel(){}}}},XMLHttpRequest:function(){xhr=this;this.overrideMimeType=()=>{};this.open=()=>{};this.send=()=>{};this.abort=()=>{};}});load(transport,'common.js');load(transport,'transport.js');
let response;transport.twRequest(['geocode','Paris'],d=>response=d);processCallback({status:0,outputString:'{"path":"/Users/test/Library/Caches/TigerWidgets/response-abc123"}'});xhr.responseText=JSON.stringify({large:'x'.repeat(12000)});xhr.onload();assert.strictEqual(response.large.length,12000);assert.strictEqual(releases,1);
// Installer must avoid HFS+'s Weather.js/weather.js and Stocks.js/stocks.js collisions.
assert(fs.readFileSync(path.join(__dirname,'../scripts/manage.py'),'utf8').includes("installed_name = 'TW-'+file"));
console.log('PASS: automatic native city search, stale responses, original UI routing, translation, flight mapping, currencies, JSON, >4 KB responses, HFS+ naming.');

assert.strictEqual(flights.isPlaneLocationAllowed({status:'Enroute',leg:{tracking:{latitude:'51N',longitude:'0W'}}},{}),true);
assert.strictEqual(flights.isPlaneLocationAllowed({status:'Enroute',leg:{tracking:null}},{}),false);
const ski=context({handleDataFetched:()=>{}});load(ski,'ski.js');
assert.strictEqual(ski.twSkiSnowState(.001,0),'snow');assert.strictEqual(ski.twSkiSnowState(0,0),'none');assert.strictEqual(ski.twSkiSnowState(null,0),'unknown');assert.strictEqual(ski.twSkiSnowState(0,73),'snow');

assert.strictEqual(flights.twFlightCode('null'),'-');
// Real provider-shaped showtimes populate only real movies, theaters and booking links.
const movieContext=context({populateInfoPaneWithMovieInfo(){},fetchAllData(){},showBack(){},showFront(){},Movie:function(id,title){this.id=id;this.title=title;this.times={};this.theaters=[];},Theater:function(id,name){this.id=id;this.name=name;this.movies=[];},Time:function(date,time){this.date=date;this.time=time;},initAllMoviesTable(){movieContext.allMoviesTable={};},initAllTheatersTable(){movieContext.allTheatersTable={};},getSortedArrayForTable:t=>Object.values(t)});
load(movieContext,'movies-cinema.js');
assert.strictEqual(movieContext.twCinemaConvert({data:[{id:'s1',startsAt:'2026-11-08T20:30:00',bookingUrl:'https://cinema.example/book',movie:{id:'m1',title:'Example',year:2026,genres:['Drama']},cinema:{id:'c1',name:'Example Cinema',city:'Dallas',country:'US'}}]}),1);
assert.strictEqual(movieContext.allMoviesTable.m1.times.c1[0].time,'8:30pm');assert.strictEqual(movieContext.allTheatersTable.c1.canBuyTickets,true);assert.strictEqual(movieContext.twCinemaBookings.s1,'https://cinema.example/book');
assert.strictEqual(movieContext.twCinemaConvert({data:[]}),0);

const appleResult={kind:'feature-movie',trackName:'Example',releaseDate:'2026-01-01',previewUrl:'https://video-ssl.itunes.apple.com/example.640x360.m4v'};
assert.strictEqual(movieContext.twCinemaAppleMatch({title:'Example',releaseDate:'2026'},{results:[appleResult]}).height,270);
assert.strictEqual(movieContext.twCinemaAppleMatch({title:'Different',releaseDate:'2026'},{results:[appleResult]}),null);
assert.strictEqual(movieContext.twCinemaAppleMatch({title:'Example',releaseDate:'1980'},{results:[appleResult]}),null);
assert.strictEqual(movieContext.twCinemaAppleMatch({title:'Example',releaseDate:'2026'},{results:[appleResult,appleResult]}),null);
console.log('PASS: independent Apple trailer matching preserves cinema schedules and rejects wrong titles, remakes and ambiguous matches.');
movieContext.twCinemaConvert({data:[{id:'show',startsAt:'2026-11-08T20:30:00',movie:{id:'cinema-id',title:'Example',year:2026},cinema:{id:'venue',name:'Cinema'}}]});
movieContext.twMoviesConvert=()=>[{id:'1',title:'Example',releaseDate:'November 1, 2026',trailer:{url:appleResult.previewUrl}},{id:'2',title:'Catalog only',releaseDate:'2000',trailer:{url:appleResult.previewUrl}}];
movieContext.twCinemaMergeAppleCatalog({});
assert.strictEqual(movieContext.allMoviesList.length,2);
assert.strictEqual(movieContext.allMoviesTable['cinema-id'].times.venue[0].id,'show');
assert.strictEqual(movieContext.allMoviesTable['cinema-id'].trailer.url,appleResult.previewUrl);
assert.strictEqual(movieContext.allTheatersList.length,1);
assert.strictEqual(movieContext.allMoviesTable['apple-2'].title,'Catalog only');
