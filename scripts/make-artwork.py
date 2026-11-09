#!/usr/bin/python
# Own fallback artwork for an incomplete ESPN bundle; standard-library Python 2.3+.
import os, struct, zlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMPTY=struct.pack('')
def chunk(kind,data):
    kind=kind.encode('ascii');return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
def png(path,w,h,pixel):
    rows=[]
    for y in range(h):
        row=[struct.pack('B',0)]
        for x in range(w): row.append(struct.pack('BBBB',*pixel(x,y)))
        rows.append(EMPTY.join(row))
    data=struct.pack('8B',137,80,78,71,13,10,26,10)+chunk('IHDR',struct.pack('!2I5B',w,h,8,6,0,0,0))+chunk('IDAT',zlib.compress(EMPTY.join(rows),9))+chunk('IEND',EMPTY)
    f=open(path,'wb');f.write(data);f.close()
def preview(x,y):
    if x<10 or x>421 or y<10 or y>491:return (0,0,0,0)
    if y<72:return (37,61,89,255)
    if 26<x<406 and 170<y<445:
        if (y-170)%55<2:return (220,228,236,255)
        return (255,255,255,255)
    return (237,241,245,255)
def icon(x,y):
    if (x<8 or x>87) or (y<8 or y>87):return (0,0,0,0)
    letters=['11111'+'00100'*6,'10001'*3+'10101'*3+'01010']
    for j in range(2):
        col=(x-(24+j*26))//4;row=(y-32)//4
        if col>=0 and col<5 and row>=0 and row<7 and letters[j][row*5+col]=='1':return (240,248,255,255)
    return (37,61,89,255)
if __name__=='__main__':
    path=os.path.join(ROOT,'src','assets')
    if not os.path.isdir(path):os.makedirs(path)
    png(os.path.join(path,'Default.png'),432,502,preview)
    png(os.path.join(path,'Icon.png'),96,96,icon)
