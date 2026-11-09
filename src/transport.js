/* File-based responses avoid Tiger's lossy 4 KB widget.system buffers. */
function constructError(message) { return {error:true, errorString:String(message)}; }
function twQuote(s) { return "'" + String(s).replace(/'/g,"'\\''") + "'"; }
function twText(id, text) { var e=document.getElementById(id); if (e) e.innerText=String(text); }
function twRequest(args, callback) {
    var command=twQuote('/Library/Application Support/TigerWidgets/bin/tw-fetch'), j;
    var process=null, xhr=null, cancelled=false, finished=false, responsePath=null;
    function release() {
        if (!responsePath) return;
        var name=responsePath.substring(responsePath.lastIndexOf('/')+1); responsePath=null;
        widget.system(twQuote('/Library/Application Support/TigerWidgets/bin/tw-fetch')+' release '+twQuote(name),function(){});
    }
    function finish(data) { if (finished) return; finished=true; release(); if (!cancelled) callback(data); }
    var handle={abort:function(){if(finished)return;cancelled=true;finished=true;if(process)process.cancel();if(xhr)xhr.abort();release();}};
    for(j=0;j<args.length;j++) command+=' '+twQuote(args[j]);
    try {
        process=widget.system(command,function(p){
            if(cancelled) return;
            if(p.status!=0) { finish(constructError(p.errorString || 'Service unavailable. Please retry.')); return; }
            try {
                var receipt=twJSON(p.outputString);
                if(!receipt.path || receipt.path.indexOf('/Library/Caches/TigerWidgets/response-')<0) throw new Error('Invalid response file');
                responsePath=receipt.path;
                xhr=new XMLHttpRequest();
                xhr.overrideMimeType('application/json');
                xhr.onload=function(){var data; try {data=twJSON(xhr.responseText);} catch(e){data=constructError('Invalid service data: '+e);} finish(data);};
                xhr.onerror=function(){finish(constructError('Unable to read local response file. Reinstall to restore widget permissions.'));};
                xhr.open('GET','file://'+encodeURI(responsePath),true);
                xhr.send(null);
            } catch(e) { finish(constructError(e)); }
        });
    } catch(e) { finish(constructError(e)); }
    return handle;
}
function twLink(url) { if (/^https:\/\//.test(url)) widget.openURL(url); }
