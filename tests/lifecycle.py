#!/usr/bin/python
# Run as root on the development Tiger VM after scripts/package.py.
import os, sys, sha, pwd, stat
ROOT='/Library/Application Support/TigerWidgets'
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def snapshot(path):
    found={}
    for parent,dirs,files in os.walk(path):
        for name in dirs+files:
            full=os.path.join(parent,name);relative=full[len(path):]
            if os.path.islink(full):found[relative]=('link',os.readlink(full))
            elif os.path.isfile(full):
                f=open(full,'rb');found[relative]=('file',sha.new(f.read()).hexdigest());f.close()
            else:found[relative]=('directory',)
    return found
def pkg(name):
    target=os.path.join(REPO,'dist',name+'-1.0.pkg')
    code=os.spawnv(os.P_WAIT,'/usr/sbin/installer',['installer','-pkg',target,'-target','/'])
    if code:raise RuntimeError('Installer failed: '+name+' '+str(code))
if os.geteuid()!=0:sys.exit('Run this lifecycle test with sudo.')
user=pwd.getpwuid(os.stat('/dev/console').st_uid)
keypath=os.path.join(user.pw_dir,'Library/Application Support/TigerWidgets/aviationstack.key')
keybefore=open(keypath,'rb').read()
f=open(os.path.join(ROOT,'installed.txt'));names=f.read().splitlines();f.close()
originals={}
for name in names:originals[name]=snapshot(os.path.join(ROOT,'backups',name+'.wdgt'))
pkg('Uninstall-DashboardWidgetRestorer')
for name in names:
    assert snapshot(os.path.join('/Library/Widgets',name+'.wdgt'))==originals[name],name+' did not restore exactly'
assert not os.path.exists(os.path.join(ROOT,'bin'))
print 'PASS: uninstall package restored every original bundle byte-for-byte and removed the runtime.'
pkg('DashboardWidgetRestorer')
pkg('DashboardWidgetRestorer')
for name in names:assert snapshot(os.path.join(ROOT,'backups',name+'.wdgt'))==originals[name],name+' original backup changed'
assert os.path.isfile(os.path.join(ROOT,'bin','tw-fetch'))
assert os.path.getsize('/Library/Widgets/Weather.wdgt/Weather.js')>30000
assert os.path.isfile('/Library/Widgets/Weather.wdgt/TW-weather.js')
print 'PASS: native package install/reinstall succeeded and preserved original backups.'

assert open(keypath,'rb').read()==keybefore
assert os.stat(keypath).st_uid==user.pw_uid
assert stat.S_IMODE(os.stat(keypath).st_mode)==0600
print 'PASS: installer created private user configuration and retained the saved API key.'
