/* Only the incomplete ESPN bundle uses this fallback UI. Built-in widgets keep theirs. MIT. */
var twPending=null,twSequence=0;
function twElement(tag,text,cls){var e=document.createElement(tag);if(text!==null && text!==undefined)e.innerText=String(text);if(cls)e.className=cls;return e;}
function twAdd(tag,text,parent,cls){var e=twElement(tag,text,cls);(parent || document.getElementById('form')).appendChild(e);return e;}
function twFitResults(){var r=document.getElementById('results'),f=document.getElementById('footer'),top=0,e=r;while(e && e.id!='shell'){top+=e.offsetTop;e=e.offsetParent;}r.style.height=Math.max(75,f.offsetTop-top-30)+'px';}
function twStatus(text){twText('status',text);twFitResults();}
function twSportsLoad(){
    var select=document.createElement('select');select.id='league';
    var leagues=[['nfl','NFL'],['nba','NBA'],['mlb','MLB'],['nhl','NHL']];
    twAdd('label','League').htmlFor='league';document.getElementById('form').appendChild(select);
    for(var i=0;i<leagues.length;i++){var o=twAdd('option',leagues[i][1],select);o.value=leagues[i][0];if(o.value==widget.preferenceForKey('tw-sports-league'))o.selected=true;}
    var button=twAdd('button','Refresh scores');button.onclick=function(){
        var seq=++twSequence;if(twPending)twPending.abort();twStatus('Loading...');
        widget.setPreferenceForKey(select.value,'tw-sports-league');
        twPending=twRequest(['sports',select.value],function(data){
            if(seq!=twSequence)return;if(data.error){twStatus(data.errorString);return;}
            var results=document.getElementById('results');while(results.firstChild)results.removeChild(results.firstChild);
            var rows=data.events || [];
            for(var i=0;i<rows.length;i++){
                var event=rows[i],contest=event.competitions && event.competitions[0],teams=contest && contest.competitors || [],label='';
                for(var j=0;j<teams.length;j++)label+=(j?' · ':'')+(teams[j].team.abbreviation || teams[j].team.displayName)+' '+(teams[j].score || '0');
                var card=twAdd('div',null,results,'card');twAdd('div',event.shortName || event.name,card,'name');twAdd('div',label+' — '+(event.status && event.status.type && event.status.type.detail || event.date),card,'detail');
            }
            twStatus(rows.length?'Latest returned scoreboard. Cached five minutes.':'No events on this scoreboard.');
        });
    };
}
function twPanelLoad(){
    twText('title','Sports Scores');twText('subtitle','Refresh the leagues you follow');twText('footer','ESPN public scoreboard · Best effort');
    twSportsLoad();twStatus('Ready. Refresh to load scores.');window.resizeTo(432,502);
    widget.onhide=function(){twSequence++;if(twPending)twPending.abort();};
}
