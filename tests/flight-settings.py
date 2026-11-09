#!/usr/bin/python
# Exercise the native UI with a dummy key, restoring the real user configuration.
import os, pwd, sys
home=pwd.getpwuid(os.getuid()).pw_dir
movies=len(sys.argv)>1 and sys.argv[1]=='movies'
service=movies and 'cinema' or 'aviationstack'
path=os.path.join(home,'Library/Application Support/TigerWidgets',service+'.key')
saved=None
if os.path.isfile(path):
    f=open(path,'rb');saved=f.read();f.close()
repo=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    status=os.spawnv(os.P_WAIT,os.path.join(repo,'build/webkit-runner'),[os.path.join(repo,'build/webkit-runner'),movies and '/Library/Widgets/Movies.wdgt' or '/Library/Widgets/Flight Tracker.wdgt',movies and 'movies-settings' or 'flight-settings'])
finally:
    if saved is not None:
        f=open(path,'wb');f.write(saved);f.close();os.chmod(path,0600)
    elif os.path.isfile(path):os.unlink(path)
if status:raise RuntimeError('Native Flight Tracker settings test failed')
