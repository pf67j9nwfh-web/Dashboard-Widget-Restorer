#!/usr/bin/python
# -*- coding: utf-8 -*-
# Build Tiger-compatible bundle-style Installer packages with Xcode 2.5 PackageMaker.
import os, sys, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PM = '/Developer/Applications/Utilities/PackageMaker.app/Contents/MacOS/PackageMaker'
def mkdir(path):
    if not os.path.isdir(path): os.makedirs(path)
def write(path,text):
    f=open(path,'wb'); f.write(text); f.close()
def plist(values):
    text='<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict>'
    for key,value in values.items(): text+='<key>'+key+'</key>'+value
    return text+'</dict></plist>'
def package(uninstall):
    name='DashboardWidgetRestorer-1.0'
    if uninstall: name='Uninstall-DashboardWidgetRestorer-1.0'
    display=uninstall and 'Uninstall Dashboard Widget Restorer 1.0' or 'Dashboard Widget Restorer 1.0'
    work=os.path.join(ROOT,'build',name); payload=os.path.join(work,'payload'); resources=os.path.join(work,'resources')
    if os.path.isdir(work): shutil.rmtree(work)
    mkdir(payload);mkdir(resources)
    if not uninstall:
        destination=os.path.join(payload,'Library/Application Support/TigerWidgets/package');mkdir(destination)
        for directory in ['src','scripts']:shutil.copytree(os.path.join(ROOT,directory),os.path.join(destination,directory))
        mkdir(os.path.join(destination,'build'))
        for file in ['tw-fetch','cacert.pem']:shutil.copy2(os.path.join(ROOT,'build',file),os.path.join(destination,'build',file))
        mkdir(os.path.join(destination,'licenses'))
        shutil.copy2(os.path.join(ROOT,'LICENSE'),os.path.join(destination,'licenses','DashboardWidgetRestorer-MIT.txt'))
        shutil.copy2(os.path.join(ROOT,'third_party','mbedtls','LICENSE'),os.path.join(destination,'licenses','mbedTLS-LICENSE.txt'))
        shutil.copy2(os.path.join(ROOT,'third_party','mbedtls','PROVENANCE.md'),os.path.join(destination,'licenses','TLS-PROVENANCE.md'))
        shutil.copy2(os.path.join(ROOT,'third_party','airports','ATTRIBUTION.txt'),os.path.join(destination,'licenses','Airports-ATTRIBUTION.txt'))
        tool='/Library/Application Support/TigerWidgets/package/scripts/manage.py'
        post='#!/bin/sh\nexec /usr/bin/python "'+tool+'" install\n'
    else:
        tool='/Library/Application Support/TigerWidgets/source/scripts/manage.py'
        post='#!/bin/sh\nif [ -f "'+tool+'" ]; then\n  exec /usr/bin/python "'+tool+'" uninstall\nfi\nexit 0\n'
    write(os.path.join(resources,'postflight'),post);os.chmod(os.path.join(resources,'postflight'),0755)
    if not uninstall:
        pre='#!/bin/sh\nactual=$(/usr/bin/sw_vers -productVersion)\nif [ "$actual" != "10.4.11" ] && [ "$actual" != "10.5.8" ] && [ "$actual" != "10.6.8" ]; then\n  echo "Dashboard Widget Restorer 1.0 requires Mac OS X 10.4.11, 10.5.8 or 10.6.8; found $actual" >&2\n  exit 1\nfi\nexit 0\n'
        write(os.path.join(resources,'preflight'),pre);os.chmod(os.path.join(resources,'preflight'),0755)
    write(os.path.join(resources,'ReadMe.txt'),readme(uninstall))
    info={'CFBundleIdentifier':'<string>org.dashboardwidgetrestorer.'+name+'</string>','CFBundleName':'<string>'+display+'</string>',
      'CFBundleShortVersionString':'<string>1.0</string>','IFMajorVersion':'<integer>1</integer>','IFMinorVersion':'<integer>0</integer>','IFSubMinorVersion':'<integer>0</integer>',
      'IFPkgFlagAuthorizationAction':'<string>RootAuthorization</string>','IFPkgFlagDefaultLocation':'<string>/</string>',
      'IFPkgFlagRelocatable':'<false/>','IFPkgFlagRootVolumeOnly':'<true/>','IFPkgFlagInstallFat':'<true/>',
      'IFPkgFlagFollowLinks':'<false/>','IFPkgFlagRestartAction':'<string>NoRestart</string>','IFPkgFormatVersion':'<real>0.1</real>'}
    info_path=os.path.join(work,'Info.plist');description=os.path.join(work,'Description.plist');write(info_path,plist(info))
    write(description,plist({'IFPkgDescriptionTitle':'<string>'+display+'</string>','IFPkgDescriptionDescription':'<string>Modern online services for original Tiger, Leopard and Snow Leopard Dashboard widgets.</string>','IFPkgDescriptionVersion':'<string>1.0</string>'}))
    target=os.path.join(ROOT,'dist',name+'.pkg')
    if os.path.isdir(target):shutil.rmtree(target)
    status=os.spawnv(os.P_WAIT,PM,[PM,'-build','-p',target,'-f',payload,'-r',resources,'-i',info_path,'-d',description,'-ds'])
    if status:raise RuntimeError('PackageMaker failed: '+str(status))
    print 'Built '+target
def readme(uninstall):
    if uninstall:return 'Restores the original widgets from your local backups. Keeps preferences, API keys, and backup copies. Close Dashboard before continuing, then reload it afterward.\n'
    return 'Dashboard Widget Restorer 1.0\n\nUpdates Weather, Stocks, currency conversion, Ski Report, Phone Book, Flight Tracker, ESPN, Translation, Google, Leopard/Snow Leopard Business, Movies, and People. Original bundles are backed up before changes. Apple widget code and artwork are not included; they are patched locally.\n\nFlight tracking requires your own optional Aviationstack key. The original built-in interfaces are preserved, including automatic Weather location validation. Ski data is a weather model, not resort lift/trail reports. Phone Book returns mapped business/address results, not a complete telephone directory. Quotes may be delayed and use an unofficial public endpoint.\n\nClose Dashboard before installing, then reopen it afterward. Use the matching Uninstall package to restore originals. Full source, licenses, provider terms, build instructions, and limitations are included in the source repository.\n'
if __name__=='__main__':
    if not os.path.isfile(PM):sys.exit('Build packages on Tiger with Xcode 2.5 PackageMaker installed.')
    mkdir(os.path.join(ROOT,'dist'));package(False);package(True)
