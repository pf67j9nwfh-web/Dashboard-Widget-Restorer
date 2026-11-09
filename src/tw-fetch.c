/* Dashboard Widget Restorer HTTPS transport. SPDX-License-Identifier: MIT */
#include "https.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <limits.h>
#include <math.h>
#include <pwd.h>
#include <sys/stat.h>
#include <sys/file.h>
#include <fcntl.h>
#include <time.h>
#include <dirent.h>
#include <errno.h>

#define MAX_BODY (4*1024*1024)
typedef struct { int status; size_t length; unsigned char *data; } Response;
static int number(const char *s, double limit) {
    char *end; double n=strtod(s,&end);
    return *s && !*end && isfinite(n) && n>=-limit && n<=limit;
}
static int token(const char *s, size_t max) {
    const char *p=s;
    if (!*s || strlen(s)>max) return 0;
    for (;*p;p++) if (!strchr("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~%",*p)) return 0;
    return 1;
}
static int folder(const char *path) {
    struct stat st;
    if (mkdir(path,0700) && errno!=EEXIST) return -1;
    if (lstat(path,&st) || !S_ISDIR(st.st_mode) || st.st_uid!=getuid()) return -1;
    return 0;
}
static void jsonString(const char *s) {
    const unsigned char *p=(const unsigned char *)s; putchar('"');
    for (;*p;p++) { if (*p=='"' || *p=='\\') printf("\\%c",*p); else if (*p<32) printf("\\u%04x",*p); else putchar(*p); }
    putchar('"');
}
static int servicekey(const char *home, const char *service, char *key, size_t size) {
    char path[PATH_MAX]; FILE *f; struct stat st;
    snprintf(path,sizeof(path),"%s/Library/Application Support/TigerWidgets/%s.key",home,service);
    if (lstat(path,&st) || !S_ISREG(st.st_mode) || st.st_uid!=getuid() || (st.st_mode&0077)) return -1;
    f=fopen(path,"rb"); if (!f) return -1;
    if (!fgets(key,size,f)) { fclose(f); return -1; } fclose(f);
    key[strcspn(key,"\r\n ")]=0;
    return token(key,128) ? 0 : -1;
}
static int keyfile(const char *home,char *key,size_t size){return servicekey(home,"aviationstack",key,size);}
static void clean(const char *directory) {
    DIR *d=opendir(directory); struct dirent *e; char path[PATH_MAX]; struct stat st;
    if (!d) return;
    while ((e=readdir(d))) {
        if (strncmp(e->d_name,"response-",9)) continue;
        snprintf(path,sizeof(path),"%s/%s",directory,e->d_name);
        if (!lstat(path,&st) && S_ISREG(st.st_mode) && st.st_uid==getuid() && time(NULL)-st.st_mtime>3600) unlink(path);
    }
    closedir(d);
}
int main(int argc, char **argv) {
    char url[8192], ca_path[PATH_MAX], path[PATH_MAX], cache[PATH_MAX], directory[PATH_MAX], key[256], *slash;
    FILE *f; long size; Response r; size_t capacity=MAX_BODY;
    const char *executable=argv[0], *bearer=NULL;
    struct passwd *pw=getpwuid(getuid()); struct stat st; unsigned long hash=2166136261UL;
    int result, ttl=300, stdoutMode=0, mediaRoute=0, fd; size_t j;
    alarm(65); umask(077);
    if (!pw) return 3;
    snprintf(directory,sizeof(directory),"%s/Library/Caches/TigerWidgets",pw->pw_dir);
    if (folder(directory)) { fprintf(stderr,"Cannot create a private TigerWidgets cache\n"); return 3; }
    clean(directory);
    if (argc>1 && !strcmp(argv[1],"--stdout")) { stdoutMode=1; argv++; argc--; }
    if (argc==3 && !strcmp(argv[1],"release") && token(argv[2],100) && !strncmp(argv[2],"response-",9)) {
        snprintf(path,sizeof(path),"%s/%s",directory,argv[2]); return unlink(path) && errno!=ENOENT ? 1:0;
    }
    if (argc==3 && !strcmp(argv[1],"geocode") && token(argv[2],2000)) {
        snprintf(url,sizeof(url),"https://geocoding-api.open-meteo.com/v1/search?name=%s&count=20&language=en&format=json",argv[2]); ttl=86400;
    } else if (argc==4 && (!strcmp(argv[1],"forecast") || !strcmp(argv[1],"ski")) && number(argv[2],90) && number(argv[3],180)) {
        if (!strcmp(argv[1],"ski")) snprintf(url,sizeof(url),"https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,weather_code&hourly=snow_depth&daily=snowfall_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5",argv[2],argv[3]);
        else snprintf(url,sizeof(url),"https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&timezone=auto&forecast_days=7",argv[2],argv[3]);
        ttl=900;
    } else if (argc==2 && !strcmp(argv[1],"currency")) {
        snprintf(url,sizeof(url),"https://api.frankfurter.dev/v2/rates?base=USD"); ttl=21600;
    } else if (argc==3 && !strcmp(argv[1],"stock-search") && token(argv[2],200)) {
        snprintf(url,sizeof(url),"https://query1.finance.yahoo.com/v1/finance/search?q=%s&quotesCount=10&newsCount=0",argv[2]); ttl=3600;
    } else if (argc==4 && !strcmp(argv[1],"stock") && token(argv[2],100) && token(argv[3],10)) {
        if (strcmp(argv[3],"1d") && strcmp(argv[3],"5d") && strcmp(argv[3],"1mo") && strcmp(argv[3],"3mo") && strcmp(argv[3],"6mo") && strcmp(argv[3],"1y") && strcmp(argv[3],"2y") && strcmp(argv[3],"5y") && strcmp(argv[3],"max")) return 2;
        snprintf(url,sizeof(url),"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=%s&range=%s",argv[2],!strcmp(argv[3],"1d")?"5m":!strcmp(argv[3],"5d")?"30m":"1d",argv[3]); ttl=900;
    } else if (argc==5 && !strcmp(argv[1],"places") && number(argv[3],90) && number(argv[4],180)) {
        const char *tag="amenity", *kind=argv[2]; char endpoint[2048]="https://overpass-api.de/api/interpreter";
        if (!strcmp(kind,"hotel")) tag="tourism";
        else if (!strcmp(kind,"supermarket")) tag="shop";
        else if (strcmp(kind,"restaurant") && strcmp(kind,"cafe") && strcmp(kind,"pharmacy") && strcmp(kind,"fuel") && strcmp(kind,"bank") && strcmp(kind,"hospital")) return 2;
        f=fopen("/Library/Application Support/TigerWidgets/places-provider.txt","rb");
        if (f) { char base[2048]; if (fgets(base,sizeof(base),f)) { base[strcspn(base,"\r\n")]=0; if (!strncmp(base,"https://",8) && !strchr(base,'?') && !strchr(base,'@')) snprintf(endpoint,sizeof(endpoint),"%s",base); } fclose(f); }
        snprintf(url,sizeof(url),"%s?data=%%5Bout%%3Ajson%%5D%%5Btimeout%%3A20%%5D%%3Bnwr%%28around%%3A3000%%2C%s%%2C%s%%29%%5B%%22%s%%22%%3D%%22%s%%22%%5D%%3Bout%%20tags%%20center%%2020%%3B",endpoint,argv[3],argv[4],tag,kind); ttl=3600;
    } else if ((argc==5 || argc==6) && !strcmp(argv[1],"business-search") && token(argv[2],500) && number(argv[3],90) && number(argv[4],180)) {
        double lat=strtod(argv[3],NULL),lon=strtod(argv[4],NULL),dy=.05,dx=.05;
        if(argc==6){if(!number(argv[5],100) || strtod(argv[5],NULL)<=0)return 2;dy=strtod(argv[5],NULL)*1.609344/111.32;dx=dy/fmax(.01,cos(lat*3.141592653589793/180));}
        snprintf(url,sizeof(url),"https://photon.komoot.io/api/?q=%s&lat=%s&lon=%s&limit=20&bbox=%.6f,%.6f,%.6f,%.6f",argv[2],argv[3],argv[4],fmax(-180,lon-dx),fmax(-90,lat-dy),fmin(180,lon+dx),fmin(90,lat+dy)); ttl=3600;
    } else if (argc==3 && !strcmp(argv[1],"place-geocode") && token(argv[2],2000)) {
        snprintf(url,sizeof(url),"https://photon.komoot.io/api/?q=%s&limit=10",argv[2]); ttl=86400;
    } else if (argc==6 && !strcmp(argv[1],"flight-query") && token(argv[2],4) && token(argv[3],8) && token(argv[4],4) && token(argv[5],4)) {
        size_t used;
        if (keyfile(pw->pw_dir,key,sizeof(key))) { fprintf(stderr,"Optional Aviationstack API key required. See the widget's About/provider link or README.\n"); return 4; }
        snprintf(url,sizeof(url),"https://api.aviationstack.com/v1/flights?access_key=%s&limit=20",key);
        used=strlen(url);
        if(strcmp(argv[2],"-")) { snprintf(url+used,sizeof(url)-used,"&airline_%s=%s",strlen(argv[2])==3?"icao":"iata",argv[2]); used=strlen(url); }
        if(strcmp(argv[3],"-")) { snprintf(url+used,sizeof(url)-used,"&flight_number=%s",argv[3]); used=strlen(url); }
        if(strcmp(argv[4],"-")) { snprintf(url+used,sizeof(url)-used,"&dep_iata=%s",argv[4]); used=strlen(url); }
        if(strcmp(argv[5],"-")) snprintf(url+used,sizeof(url)-used,"&arr_iata=%s",argv[5]);
        ttl=1800;
    } else if (argc==3 && !strcmp(argv[1],"flight") && token(argv[2],20)) {
        if (keyfile(pw->pw_dir,key,sizeof(key))) { fprintf(stderr,"Flight tracking needs your optional free Aviationstack key. See Settings in the widget.\n"); return 4; }
        snprintf(url,sizeof(url),"https://api.aviationstack.com/v1/flights?access_key=%s&flight_iata=%s&limit=10",key,argv[2]); ttl=1800;
    } else if (argc==3 && !strcmp(argv[1],"sports") && (!strcmp(argv[2],"nfl") || !strcmp(argv[2],"nba") || !strcmp(argv[2],"mlb") || !strcmp(argv[2],"nhl"))) {
        const char *sport=!strcmp(argv[2],"nfl")?"football":!strcmp(argv[2],"nba")?"basketball":!strcmp(argv[2],"mlb")?"baseball":"hockey";
        snprintf(url,sizeof(url),"https://site.api.espn.com/apis/site/v2/sports/%s/%s/scoreboard",sport,argv[2]); ttl=300;
    } else if (argc==4 && !strcmp(argv[1],"espn") && token(argv[2],40) && (!strcmp(argv[3],"news") || !strcmp(argv[3],"scoreboard"))) {
        const char *sport=NULL;
        if(!strcmp(argv[2],"nfl") || !strcmp(argv[2],"college-football"))sport="football";
        else if(!strcmp(argv[2],"mlb"))sport="baseball";
        else if(!strcmp(argv[2],"nhl"))sport="hockey";
        else if(!strcmp(argv[2],"nba") || !strcmp(argv[2],"wnba") || !strcmp(argv[2],"mens-college-basketball") || !strcmp(argv[2],"womens-college-basketball"))sport="basketball";
        if(!sport)return 2;
        snprintf(url,sizeof(url),"https://site.api.espn.com/apis/site/v2/sports/%s/%s/%s",sport,argv[2],argv[3]);ttl=300;
    } else if (argc==5 && !strcmp(argv[1],"cinema") && number(argv[2],90) && number(argv[3],180) && token(argv[4],10)) {
        if(servicekey(pw->pw_dir,"cinema",key,sizeof(key))){fprintf(stderr,"Add a free API Cinema key in Movies settings for local showtimes.\n");return 4;}
        bearer=key;
        snprintf(url,sizeof(url),"https://api.api-cinema.com/v1/showtimes?near=%s,%s&radius_km=25&date=%s&include=movie,cinema&limit=100",argv[2],argv[3],argv[4]);ttl=1800;
    } else if (argc==2 && !strcmp(argv[1],"movies")) {
        snprintf(url,sizeof(url),"https://itunes.apple.com/us/rss/topmovies/limit=25/json");ttl=21600;
    } else if (argc==3 && !strcmp(argv[1],"movie-search") && token(argv[2],1000)) {
        snprintf(url,sizeof(url),"https://itunes.apple.com/search?term=%s&entity=movie&country=us&limit=25",argv[2]);ttl=21600;
    } else if (argc==3 && !strcmp(argv[1],"movie-media")) {
        const char *input=argv[2];size_t k=0;int allowed=0;
        const char *hosts[]={"https://images.fandango.com/ImageRenderer/","https://image.tmdb.org/t/p/","https://video-ssl.itunes.apple.com/","https://is1-ssl.mzstatic.com/","https://is2-ssl.mzstatic.com/","https://is3-ssl.mzstatic.com/","https://is4-ssl.mzstatic.com/","https://is5-ssl.mzstatic.com/"};
        while(*input && k<sizeof(url)-1){if(*input=='%' && input[1] && input[2]){char hex[3];char *end;long c;hex[0]=input[1];hex[1]=input[2];hex[2]=0;c=strtol(hex,&end,16);if(*end || c<32)return 2;url[k++]=(char)c;input+=3;}else url[k++]=*input++;}url[k]=0;
        if(*input)return 2;
        for(k=0;k<sizeof(hosts)/sizeof(hosts[0]);k++)if(!strncmp(url,hosts[k],strlen(hosts[k])))allowed=1;
        if(!allowed)return 2;mediaRoute=1;capacity=!strncmp(url,"https://video-",14)?64*1024*1024:4*1024*1024;ttl=86400;
    } else if (argc==5 && !strcmp(argv[1],"translate") && token(argv[2],1500) && strlen(argv[3])>=2 && strlen(argv[4])>=2 && token(argv[3],8) && token(argv[4],8)) {
        snprintf(url,sizeof(url),"https://api.mymemory.translated.net/get?q=%s&langpair=%s%%7C%s",argv[2],argv[3],argv[4]); ttl=86400;
    } else { fprintf(stderr,"Unknown route or invalid arguments. See docs/PROVIDERS.md.\n"); return 2; }
    for (j=0;url[j];j++) { hash^=(unsigned char)url[j]; hash=(hash*16777619UL)&0xffffffffUL; }
    snprintf(cache,sizeof(cache),"%s/cache-%08lx.%s",directory,hash,mediaRoute?(!strncmp(url,"https://video-",14)?"m4v":"png"):"json");
    memset(&r,0,sizeof(r)); r.data=malloc(capacity); if (!r.data) return 3;
    if (!lstat(cache,&st) && S_ISREG(st.st_mode) && st.st_uid==getuid() && st.st_size>0 && st.st_size<=(long)capacity && time(NULL)-st.st_mtime<ttl) {
        f=fopen(cache,"rb"); if (f) { r.length=fread(r.data,1,st.st_size,f); fclose(f); if (r.length!=(size_t)st.st_size) r.length=0; }
    }
    if (!r.length) {
        if (!realpath(executable,path) || !(slash=strrchr(path,'/'))) return 3;
        j=(slash+1)-path;
        if (j+sizeof("cacert.pem")>sizeof(ca_path)) return 3;
        memcpy(ca_path,path,j); memcpy(ca_path+j,"cacert.pem",sizeof("cacert.pem"));
        if (!strcmp(argv[1],"places")) {
            int lock; snprintf(path,sizeof(path),"%s/places.lock",directory); lock=open(path,O_CREAT|O_RDWR,0600);
            if (lock<0 || flock(lock,LOCK_EX)) return 3;
            if (!fstat(lock,&st) && time(NULL)-st.st_mtime<2) sleep(2);
            ftruncate(lock,0); write(lock,"1",1); flock(lock,LOCK_UN); close(lock);
        }
        result=tw_https_get_authorized(url,ca_path,r.data,capacity,&r.length,&r.status,bearer);
        if (result || r.status!=200) { fprintf(stderr,"HTTPS service unavailable (transport %d, HTTP %d). Retry later.\n",result,r.status); free(r.data); return 1; }
        /* A non-JSON response is never handed to the widget as executable content. */
        for (j=0;j<r.length && (r.data[j]==' ' || r.data[j]=='\n' || r.data[j]=='\r');j++);
        if (!mediaRoute && (j==r.length || (r.data[j]!='{' && r.data[j]!='['))) { fprintf(stderr,"Service returned an unsupported response.\n"); return 1; }
        snprintf(path,sizeof(path),"%s/cache-new-XXXXXX",directory); fd=mkstemp(path);
        if (fd>=0) { f=fdopen(fd,"wb"); if (f) { size=fwrite(r.data,1,r.length,f); if (fclose(f)==0 && size==(long)r.length) rename(path,cache); else unlink(path); } else close(fd); }
    }
    if(mediaRoute){
        if(r.length<12 || (memcmp(r.data,"\x89PNG",4) && !(r.data[0]==0xff && r.data[1]==0xd8) && memcmp(r.data+4,"ftyp",4))){free(r.data);return 1;}
        if(lstat(cache,&st) || !S_ISREG(st.st_mode) || st.st_uid!=getuid()){free(r.data);return 3;}
        printf("{\"path\":");jsonString(cache);printf(",\"length\":%lu}\n",(unsigned long)r.length);free(r.data);return 0;
    }
    if (stdoutMode) { fwrite(r.data,1,r.length,stdout); free(r.data); return 0; }
    snprintf(path,sizeof(path),"%s/response-XXXXXX",directory); fd=mkstemp(path);
    if (fd<0 || !(f=fdopen(fd,"wb"))) return 3;
    size=fwrite(r.data,1,r.length,f); free(r.data);
    if (fclose(f) || size!=(long)r.length) { unlink(path); return 3; }
    printf("{\"path\":"); jsonString(path); printf("}\n"); return 0;
}
