/* Modern ESPN JSON behind the original scoreboard, crawl, and league controls. MIT. */
var twESPNLeagues={mlb:'mlb',nba:'nba',WNBA:'wnba',ncb:'mens-college-basketball',ncw:'womens-college-basketball',nfl:'nfl',ncf:'college-football',nhl:'nhl'};
for(var twLeague in gLeagueArray)gLeagueArray[twLeague].staticEnable=!!twESPNLeagues[twLeague];
kESPNLogoClickedURL='https://www.espn.com';
function twESPNBase(league){return {error:false,errorString:null,refresh:300000,league:league,stamp:new Date().getTime(),stories:[],games:[]};}
fetchNews=function(league,callback){return twRequest(['espn',twESPNLeagues[league] || league,'news'],function(d){
    var out=twESPNBase(league);if(d.error){out.error=true;out.errorString=d.errorString;}
    var rows=d.articles || [];for(var i=0;i<rows.length;i++)out.stories.push({headline:rows[i].headline,url:rows[i].links && rows[i].links.web && rows[i].links.web.href || 'https://www.espn.com/'});callback(out);
});};
fetchScores=function(league,callback){return twRequest(['espn',twESPNLeagues[league] || league,'scoreboard'],function(d){
    var out=twESPNBase(league);if(d.error){out.error=true;out.errorString=d.errorString;}
    var events=d.events || [];for(var i=0;i<events.length;i++){
        var e=events[i],c=e.competitions && e.competitions[0];if(!c)continue;
        var away=null,home=null,teams=c.competitors || [];for(var j=0;j<teams.length;j++){var t=teams[j],team={team:t.team.abbreviation || t.team.displayName,score:String(t.score || '0')};if(t.homeAway=='home')home=team;else away=team;}
        if(!home || !away)continue;var status=e.status || c.status || {},type=status.type || {};
        out.games.push({id:e.id,url:e.links && e.links[0] && e.links[0].href || 'https://www.espn.com/',away:away,home:home,statusId:type.completed?3:type.state=='pre'?1:2,statusStr:status.type.shortDetail || status.type.detail || '',statusLineDetailStrs:[]});
    }callback(out);
});};
