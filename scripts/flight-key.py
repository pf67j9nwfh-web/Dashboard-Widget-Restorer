#!/usr/bin/python
# Python 2.3 compatible. Private, per-user Flight Tracker configuration. MIT.
import os, sys, pwd, stat, tempfile, re

def config(action, value=None, service="aviationstack"):
    if service not in ["aviationstack","cinema"]:raise RuntimeError("Unknown service")
    home=pwd.getpwuid(os.getuid()).pw_dir
    directory=os.path.join(home,'Library/Application Support/TigerWidgets')
    if not os.path.exists(directory): os.makedirs(directory,0700)
    st=os.lstat(directory)
    if not stat.S_ISDIR(st.st_mode) or st.st_uid!=os.getuid(): raise RuntimeError('Invalid configuration directory')
    os.chmod(directory,0700)
    path=os.path.join(directory,service+'.key')
    if (os.path.exists(path) or os.path.islink(path)):
        st=os.lstat(path)
        if not stat.S_ISREG(st.st_mode) or st.st_uid!=os.getuid(): raise RuntimeError('Invalid API key file')
        os.chmod(path,0600)
    else:
        fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0600);os.close(fd)
    if action in ['save','clear']:
        if action=='clear': value=''
        else:
            value=value.strip()
            if not re.match(r'^[A-Za-z0-9_-]{1,128}$',value): raise RuntimeError('Paste a valid API key.')
        fd,temporary=tempfile.mkstemp('.tmp','flight-key-',directory)
        try:
            f=os.fdopen(fd,'w');f.write(value+'\n');f.close();os.chmod(temporary,0600);os.rename(temporary,path)
        finally:
            if os.path.exists(temporary):os.unlink(temporary)
    f=open(path,'r');value=f.read(256).strip();f.close()
    return bool(value)

if __name__=='__main__':
    try:
        action=len(sys.argv) in [2,3] and sys.argv[1] or ''
        service=len(sys.argv)==3 and sys.argv[2] or 'aviationstack'
        if action=='init-all':config('init',None,'cinema');action='init'
        if action not in ['init','status','save','clear']:raise RuntimeError('Unknown configuration action')
        value=None
        if action=='save':value=sys.stdin.readline(131)
        configured=config(action,value,service)
        if configured:print '{"configured":true}'
        else:print '{"configured":false}'
    except Exception, error:
        sys.stderr.write(str(error)+'\n');sys.exit(1)
