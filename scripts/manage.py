#!/usr/bin/python
# -*- coding: utf-8 -*-
# Python 2.3 compatible. No third-party Python packages required.
# SPDX-License-Identifier: MIT
import os, sys, shutil, re, time, glob, pwd, fcntl

ROOT = '/Library/Application Support/TigerWidgets'
WIDGETS = '/Library/Widgets'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULES = ['Weather', 'Stocks', 'Unit Converter', 'Ski Report', 'Phone Book', 'Flight Tracker', 'ESPN', 'Translation', 'Google', 'Business', 'Movies', 'People']
PARSERS = {'Weather':'weatherParser.js', 'Stocks':'stocksParser.js', 'Unit Converter':'unitConverterParser.js', 'Translation':'translationParser.js', 'Phone Book':'phoneBookParser.js', 'Flight Tracker':'flightTrackerParser.js', 'Ski Report':'skiReportParser.js', 'Business':'phoneBookParser.js', 'Movies':'moviesParser.js', 'People':'whitePagesParser.js', 'ESPN':'ESPNParser.js'}
PANELS = {'ESPN':'sports'}

def read(path):
    f = open(path, 'rb'); data = f.read(); f.close(); return data
def write(path, data):
    f = open(path, 'wb'); f.write(data); f.close()
def mkdir(path):
    if not os.path.isdir(path): os.makedirs(path)
def copytree(source, target):
    shutil.copytree(source, target, symlinks=True)
def xmlvalue(info, key):
    m = re.search(r'<key>\s*' + re.escape(key) + r'\s*</key>\s*<string>([^<]*)</string>', info)
    if not m: raise RuntimeError('Missing plist key: ' + key)
    return m.group(1)
def plistset(info, key, value):
    info = re.sub(r'\s*<key>\s*' + re.escape(key) + r'\s*</key>\s*(?:<string>[^<]*</string>|<(?:true|false)\s*/>)', '', info)
    return info.replace('</dict>', '<key>' + key + '</key>' + value + '\n</dict>')
def script(name):
    return '<script type="text/javascript" src="' + name + '" charset="utf-8"></script>\n'
def patch(name, bundle):
    snow = xmlvalue(read('/System/Library/CoreServices/SystemVersion.plist'),'ProductVersion').startswith('10.6.')
    fallback = name in PANELS and not os.path.isfile(os.path.join(bundle,'ESPN.js'))
    info_path = os.path.join(bundle, 'Info.plist')
    if not os.path.isfile(info_path) and fallback:
        info = '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>org.tigerwidgets.'+PANELS[name]+'</string><key>CFBundleDisplayName</key><string>'+name+'</string><key>MainHTML</key><string>Main.html</string></dict></plist>'
        write(info_path,info)
        for file in ['Default.png','Icon.png']:shutil.copy2(os.path.join(REPO,'src','assets',file),os.path.join(bundle,file))
    info = read(info_path)
    html_path = os.path.join(bundle, xmlvalue(info, 'MainHTML'))
    if name == 'Google':
        path = os.path.join(bundle, 'Google.js'); source = read(path)
        source = source.replace('http://www.google.com/search?q=', 'https://www.google.com/search?q=')
        source = source.replace('+ value +', '+ encodeURIComponent(value) +'); write(path, source); return
    info = re.sub(r'\s*<key>Parser</key>\s*<string>[^<]*</string>', '', info)
    info = plistset(info, 'AllowSystem', '<true/>')
    info = plistset(info, 'AllowFileAccessOutsideOfWidget', '<true/>')
    write(info_path, info)
    for file in ['common.js','transport.js']:
        shutil.copy2(os.path.join(REPO,'src',file), os.path.join(bundle,file))
    if fallback:
        for file in ['panel.js','panel.css']:
            shutil.copy2(os.path.join(REPO,'src',file), os.path.join(bundle,file))
        write(html_path, read(os.path.join(REPO,'src','panel.html')).replace('@MODE@',PANELS[name])); return
    parser = os.path.join('/System/Library/WidgetResources/.parsers',PARSERS[name])
    legacy = read(parser)
    try: legacy.decode('utf-8')
    except UnicodeDecodeError: legacy = legacy.decode('mac_roman').encode('utf-8')
    write(os.path.join(bundle,'LegacyParser.js'),legacy)
    html = read(html_path)
    html = re.sub(r'(<script\b[^>]*?)/>', r'\1></script>', html)
    html = re.sub(r'(<canvas\b[^>]*?)/>', r'\1></canvas>', html)
    html = re.sub(r"id=['\"]apple-replace-script['\"]\s*", '', html)
    html = html.replace('file:///System/Library/WidgetResources/.parsers/' + PARSERS[name], 'LegacyParser.js')
    # Sources are loaded after all original scripts, so UI function overrides win.
    files = ['common.js','transport.js']
    if name == 'Weather':
        if snow: files += ['weather-sl-pre.js','weather.js','weather-sl.js']
        else: files += ['weather.js','weather-picker.js']
        # Avoid Apple's global `location` colliding with window.location in WebKit.
        p = os.path.join(bundle,'Weather.js'); source = read(p)
        tokens = r'''("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|//[^\n]*|/\*[\s\S]*?\*/)|\blocation\b'''
        source = re.sub(tokens,lambda m: m.group(1) or 'twDisplayedCity',source)
        write(p,source)
        html = html.replace("<img id='accuweather' src='Images/accuweather.png' onclick='goToAccuWeather(event);'></img>","<div id='accuweather' style='color:white;font:11px Helvetica' onclick='goToAccuWeather(event);'>Open-Meteo.com</div>")
    elif name == 'Translation':
        files += ['geo.js','translation.js']
        p = os.path.join(bundle,'Translation.js'); source = read(p).replace('http://www.systransoft.com','https://mymemory.translated.net')
        write(p,source)
    elif name == 'Business':
        files += ['geo.js','business.js','business-sl.js']
        xsl = os.path.join(bundle,'PhoneBook.xsl'); source = read(xsl)
        source = source.replace('<xsl:value-of select="$phone"/>','<xsl:choose><xsl:when test="string-length($rawPhone)&gt;0"><xsl:value-of select="$phone"/></xsl:when><xsl:otherwise>Not listed</xsl:otherwise></xsl:choose>')
        write(xsl,source)
    elif name == 'Movies':
        files += ['geo.js','movies.js','movies-cinema.js']
        html = html.replace('<div id="doneButton"></div>',read(os.path.join(REPO,'src','movies-settings.html'))+'<div id="doneButton"></div>')
    elif name == 'People':
        files += ['geo.js','people.js']
    elif name == 'ESPN':
        files += ['espn.js']
    elif name == 'Phone Book':
        files += ['geo.js','business.js']
        p = os.path.join(bundle,'PhoneBook.js'); source = read(p)
        source = source.replace('addressSpansContainer.setAttribute("maplink", mapURL );','addressSpansContainer.setAttribute("maplink", singleResult.mapLink || mapURL );')
        source = source.replace('phoneSpan.innerText = singleResult.phone;',"phoneSpan.innerText = singleResult.phone || 'Not listed';")
        source = source.replace('"http://www.daplus.us"','"https://www.openstreetmap.org/copyright"')
        write(p,source)
    elif name == 'Flight Tracker':
        files += ['airports.js','flight.js']
        p = os.path.join(bundle,'FlightTracker.js'); source = read(p).replace('http://www.flytecomm.com','https://aviationstack.com')
        for attribute in ['code','departCity','arriveCity']:
            source = source.replace('flightToTrack[0].children[0].'+attribute,"flightToTrack[0].children[0].getAttribute('"+attribute+"')")
        write(p,source)
        settings = '<div style="position:absolute;left:32px;top:62px;width:345px;color:white;font:11px Helvetica;">' + \
            '<label for="tw-flight-key">Aviationstack API key</label>' + \
            '<input id="tw-flight-key" type="password" autocomplete="off" style="display:block;margin-top:5px;width:339px;height:20px;font:12px Helvetica;" />' + \
            '<div id="tw-flight-key-status" style="margin-top:7px;font-size:10px;">Loading key settings...</div>' + \
            '<a id="tw-flight-key-clear" href="#" onclick="twFlightClearKey();return false;" style="display:none;position:absolute;right:0;top:54px;color:#ddd;">Remove key</a></div>' + \
            """<a href="#" onclick="widget.openURL('https://aviationstack.com/signup/free');return false;" style="position:absolute;left:32px;top:151px;color:white;font:11px Helvetica;">Get a free API key</a>"""
        html = html.replace("<div id='done-button'></div>",settings+"<div id='done-button'></div>")
    elif name == 'Ski Report':
        files += ['geo.js','ski.js']
    elif name == 'Stocks':
        files += ['stocks.js']
        if snow: files += ['stocks-sl.js']
        p = os.path.join(bundle,'Stocks.js'); source = read(p)
        source = source.replace('120000','900000').replace('http://api.apple.go.yahoo.com/appledwf/q?s=', 'https://finance.yahoo.com/quote/').replace('http://api.apple.go.yahoo.com/appledwf/', 'https://finance.yahoo.com/')
        write(p,source)
    elif name == 'Unit Converter':
        files += ['currency.js']
        p = os.path.join(bundle,'UnitConverter.js'); source = read(p)
        source = source.replace('http://api.apple.go.yahoo.com/appledwuc/', 'https://frankfurter.dev/').replace('http://info.yahoo.com/legal/us/yahoo/utos/utos-173.html','https://frankfurter.dev/')
        write(p,source)
    credits = {'People':('backlogo','Whitepages','clickOnProvider();'), 'Business':('logo','OpenStreetMap','widget.openURL(getVendorHomepageUrl());'), 'Movies':('fandangoLogo','Apple Movies','logoClicked(event);'), 'Phone Book':('backlogo','&copy; OpenStreetMap contributors','clickOnProvider();'), 'Translation':('backlogo','MyMemory','clickOnProvider();'), 'Flight Tracker':('backlogo','Aviationstack','backsideLogoClicked();'), 'Ski Report':('logo','Open-Meteo','goToAccuWeather(event);')}
    if name in credits:
        credit_id,credit_text,credit_action = credits[name]
        pattern = r"<img\b(?=[^>]*\bid=['\"]"+credit_id+r"['\"])[^>]*>(?:</img>)?"
        credit = '<div id="'+credit_id+'" onclick="'+credit_action+'" style="font:11px Helvetica;color:white;cursor:pointer;">'+credit_text+'</div>'
        html = re.sub(pattern,lambda m:credit,html)
    injected = ''
    for file in files:
        installed_name = file
        # HFS+ is case insensitive: weather.js would overwrite Apple's Weather.js.
        if file not in ['common.js','transport.js']: installed_name = 'TW-'+file
        if file not in ['common.js','transport.js']: shutil.copy2(os.path.join(REPO,'src',file),os.path.join(bundle,installed_name))
        injected += script(installed_name)
    html = html.replace('</head>',injected+'</head>'); write(html_path,html)

def install(selected):
    version = xmlvalue(read('/System/Library/CoreServices/SystemVersion.plist'),'ProductVersion')
    if version not in ['10.4.11','10.5.8','10.6.8']: raise RuntimeError('Supported systems: Mac OS X 10.4.11, 10.5.8 and 10.6.8; detected '+version)
    if not os.path.isfile(os.path.join(REPO,'build','tw-fetch')): raise RuntimeError('Missing prebuilt helper. Run scripts/build.sh first.')
    for name in selected:
        if not os.path.isdir(os.path.join(WIDGETS,name+'.wdgt')): raise RuntimeError('Missing stock widget: '+name)
    mkdir(ROOT); mkdir(os.path.join(ROOT,'backups')); mkdir(os.path.join(ROOT,'bin'))
    if 'Flight Tracker' in selected or 'Movies' in selected:
        for user in pwd.getpwall():
            if user.pw_uid<500 or not user.pw_dir.startswith('/Users/') or not os.path.isdir(user.pw_dir): continue
            child=os.fork()
            if child==0:
                os.setgid(user.pw_gid);os.setuid(user.pw_uid)
                os.execv('/usr/bin/python',['python',os.path.join(REPO,'scripts','flight-key.py'),('Movies' in selected and 'init-all' or 'init')])
            pid,status=os.waitpid(child,0)
            if status: raise RuntimeError('Unable to prepare Flight Tracker settings for '+user.pw_name)
    existing = []
    state = os.path.join(ROOT,'installed.txt')
    if os.path.isfile(state): existing = read(state).splitlines()
    stage = os.path.join(ROOT,'stage-'+str(os.getpid())); mkdir(stage)
    try:
        for name in selected:
            target = os.path.join(WIDGETS,name+'.wdgt'); backup = os.path.join(ROOT,'backups',name+'.wdgt')
            if not os.path.exists(backup):
                # Migrate the earlier one-off Weather prototype without making it the stock backup.
                original = target
                home = pwd.getpwuid(os.stat('/dev/console').st_uid).pw_dir
                candidates = glob.glob(os.path.join(home,'Library/Application Support/TigerWeather/Backups/Weather-*.wdgt'))
                candidates.sort()
                legacy = ''
                for candidate in candidates:
                    if not os.path.isfile(os.path.join(candidate,'OpenMeteo.js')): legacy = candidate; break
                if name == 'Weather' and os.path.isfile(os.path.join(target,'OpenMeteo.js')) and os.path.isdir(legacy):
                    copytree(target,os.path.join(ROOT,'backups','Weather-prototype.saved'))
                    original = legacy
                copytree(original,backup)
            staged = os.path.join(stage,name+'.wdgt'); copytree(backup,staged); patch(name,staged)
        # Install shared transport before making a patched widget visible.
        for file in ['tw-fetch','cacert.pem']:
            destination = os.path.join(ROOT,'bin',file)
            temporary = destination+'.new'; shutil.copy2(os.path.join(REPO,'build',file),temporary)
            os.chmod(temporary,file == 'tw-fetch' and 0755 or 0644); os.rename(temporary,destination)
        # Keep the exact source used on the target, so later repairs do not need this checkout.
        source = os.path.join(ROOT,'source')
        source_new = os.path.join(stage,'source'); mkdir(source_new)
        for dir in ['src','scripts']:
            copytree(os.path.join(REPO,dir),os.path.join(source_new,dir))
        mkdir(os.path.join(source_new,'build'))
        for file in ['tw-fetch','cacert.pem']: shutil.copy2(os.path.join(REPO,'build',file),os.path.join(source_new,'build',file))
        if os.path.isdir(source): shutil.rmtree(source)
        os.rename(source_new,source)
        for name in selected:
            target = os.path.join(WIDGETS,name+'.wdgt'); previous = os.path.join(stage,name+'.previous')
            os.rename(target,previous)
            try: os.rename(os.path.join(stage,name+'.wdgt'),target)
            except:
                os.rename(previous,target); raise
            if name not in existing: existing.append(name)
            write(state,'\n'.join(existing)+'\n')
        write(os.path.join(ROOT,'VERSION'),'1.0\n')
    finally:
        if os.path.isdir(stage): shutil.rmtree(stage)
    print 'Installed: '+', '.join(selected)
    print 'Originals preserved in '+os.path.join(ROOT,'backups')
    print 'Close and reopen Dashboard (or log out and back in) to load the changes.'

def uninstall():
    state = os.path.join(ROOT,'installed.txt')
    if not os.path.isfile(state): print 'Dashboard Widget Restorer is not installed.'; return
    names = read(state).splitlines()
    for name in names:
        if name not in MODULES: raise RuntimeError('Unexpected entry in installed manifest')
        if not os.path.isdir(os.path.join(ROOT,'backups',name+'.wdgt')): raise RuntimeError('Missing backup for '+name+'; nothing removed.')
    saved = os.path.join(ROOT,'saved-on-uninstall-'+time.strftime('%Y%m%d-%H%M%S')); mkdir(saved)
    for name in names:
        target = os.path.join(WIDGETS,name+'.wdgt'); temporary = target+'.tw-restore'
        copytree(os.path.join(ROOT,'backups',name+'.wdgt'),temporary)
        if os.path.exists(target): os.rename(target,os.path.join(saved,name+'.wdgt'))
        os.rename(temporary,target)
    os.rename(state,os.path.join(saved,'installed.txt'))
    for directory in ['bin','source','package']:
        installed = os.path.join(ROOT,directory)
        if os.path.isdir(installed): shutil.rmtree(installed)
    version = os.path.join(ROOT,'VERSION')
    if os.path.isfile(version): os.unlink(version)
    # Backups remain for recovery; no API keys or preferences are deleted.
    print 'Restored original widgets. Modified copies saved in '+saved
    print 'Your preferences and optional API key files were kept. Close and reopen Dashboard.'

if __name__ == '__main__':
    try:
        if os.geteuid()!=0: raise RuntimeError('Run with sudo to modify /Library/Widgets.')
        if os.path.islink(ROOT): raise RuntimeError('Installation directory must not be a symbolic link.')
        mkdir(ROOT)
        lock = open(os.path.join(ROOT,'.install-lock'),'a')
        try: fcntl.flock(lock.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
        except IOError: raise RuntimeError('Another Dashboard Widget Restorer install or uninstall is already running.')
        if len(sys.argv)>1 and sys.argv[1]=='uninstall': uninstall()
        elif len(sys.argv)>1 and sys.argv[1]=='install':
            selected = sys.argv[2:]
            if not selected:
                selected = [name for name in MODULES if os.path.isdir(os.path.join(WIDGETS,name+'.wdgt'))]
                missing = [name for name in MODULES if name not in selected]
                if missing: print 'Skipped absent bundles: '+', '.join(missing)
            if not selected: raise RuntimeError('No supported stock widget bundles found.')
            for name in selected:
                if name not in MODULES: raise RuntimeError('Unknown widget: '+name)
            install(selected)
        else: raise RuntimeError('Usage: manage.py install [widget names...] | uninstall')
    except Exception, error:
        sys.stderr.write('Dashboard Widget Restorer: '+str(error)+'\n'); sys.exit(1)
