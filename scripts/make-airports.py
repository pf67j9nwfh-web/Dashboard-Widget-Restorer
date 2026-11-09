#!/usr/bin/python
# Build the offline map lookup from the vendored public airport data. Python 2.3+.
import os,sys,csv
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
source=os.path.join(ROOT,'third_party','airports','airport-codes.csv')
if sys.version_info[0]>=3:f=open(source,'r',encoding='utf-8',newline='')
else:f=open(source,'rb')
records={};ranks={};priority={'large_airport':4,'medium_airport':3,'small_airport':2,'heliport':1}
for row in csv.DictReader(f):
    code=row['iata_code'];kind=row['type']
    if len(code)!=3 or not code.isalpha() or kind=='closed':continue
    try:lat,lon=[float(x) for x in row['coordinates'].split(',')]
    except ValueError:continue
    rank=priority.get(kind,0)
    if code in ranks and rank<=ranks[code]:continue
    records[code]=(row['name'],str(abs(lat))+('S' if lat<0 else 'N'),str(abs(lon))+('W' if lon<0 else 'E'));ranks[code]=rank
f.close()
def quote(s):
    if not isinstance(s,type(u'')):s=s.decode('utf-8')
    return u'"'+s.replace(u'\\',u'\\\\').replace(u'"',u'\\"').replace(u'\r',u'\\r').replace(u'\n',u'\\n')+u'"'
keys=list(records.keys());keys.sort();lines=[]
for code in keys:
    name,lat,lon=records[code]
    lines.append(quote(code)+u':{name:'+quote(name)+u',latitude:'+quote(lat)+u',longitude:'+quote(lon)+u'}')
script=u'/* Airport map coordinates from OurAirports / datasets/airport-codes. See third_party/airports. */\nvar twAirports={\n'+u',\n'.join(lines)+u'\n};\n'
f=open(os.path.join(ROOT,'src','airports.js'),'wb');f.write(script.encode('utf-8'));f.close()
print('Built airport lookup: '+str(len(records)))
