#!/usr/bin/python
# Isolated native Python 2.3 configuration tests; never touches a real key.
import os, tempfile, shutil, imp, stat
module=imp.load_source('flight_key',os.path.join(os.path.dirname(__file__),'../scripts/flight-key.py'))
home=tempfile.mkdtemp()
class User: pw_dir=home
class Users:
    def getpwuid(self,uid): return User()
module.pwd=Users()
try:
    path=os.path.join(home,'Library/Application Support/TigerWidgets/aviationstack.key')
    assert not module.config('init')
    assert stat.S_IMODE(os.stat(path).st_mode)==0600
    assert module.config('save','TW_TEST_KEY_NOT_A_REAL_KEY')
    assert module.config('init')
    assert open(path).read().strip()=='TW_TEST_KEY_NOT_A_REAL_KEY'
    assert module.config('status')
    try: module.config('save','bad;key');raise AssertionError('Invalid key accepted')
    except RuntimeError: pass
    assert module.config('status')
    assert not module.config('init',None,'cinema')
    assert module.config('save','ac_live_TEST', 'cinema')
    assert module.config('status')
    assert not module.config('clear')
    assert os.path.isfile(path)
    assert stat.S_IMODE(os.stat(path).st_mode)==0600
    os.unlink(path);os.symlink(os.path.join(home,'target'),path)
    try: module.config('init');raise AssertionError('Symlink accepted')
    except RuntimeError: pass
    print 'PASS: private initialization, save, preserve, clear, validation, and symlink rejection.'
finally:shutil.rmtree(home)
