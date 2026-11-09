/* Small, bounded HTTPS/1.1 GET client for Tiger. SPDX-License-Identifier: MIT
   mbedTLS handles TLS, hostname verification, and chain validation. No redirects. */
#include "https.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <netdb.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include "mbedtls/ssl.h"
#include "mbedtls/net_sockets.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#include "mbedtls/x509_crt.h"
#include "psa/crypto.h"

static int public_address(unsigned long a) {
    return (a>>24)!=0 && (a>>24)!=10 && (a>>24)!=127 && (a>>24)<224 &&
      (a>>16)!=0xa9fe && (a>>20)!=0xac1 && (a>>16)!=0xc0a8 && (a>>22)!=0x191;
}
static int connect_public(const char *host) {
    struct addrinfo hint,*addresses=NULL,*p; int fd=-1;
    memset(&hint,0,sizeof(hint)); hint.ai_family=AF_INET; hint.ai_socktype=SOCK_STREAM;
    if(getaddrinfo(host,"443",&hint,&addresses))return -1;
    for(p=addresses;p;p=p->ai_next) {
        int flags,error=0; socklen_t error_size=sizeof(error); fd_set writable; struct timeval timeout;
        if(!public_address(ntohl(((struct sockaddr_in *)p->ai_addr)->sin_addr.s_addr)))continue;
        fd=socket(p->ai_family,p->ai_socktype,p->ai_protocol);if(fd<0)continue;
        flags=fcntl(fd,F_GETFL,0);if(flags<0 || fcntl(fd,F_SETFL,flags|O_NONBLOCK)<0){close(fd);fd=-1;continue;}
        if(connect(fd,p->ai_addr,p->ai_addrlen)<0 && errno!=EINPROGRESS){close(fd);fd=-1;continue;}
        FD_ZERO(&writable);FD_SET(fd,&writable);timeout.tv_sec=12;timeout.tv_usec=0;
        if(select(fd+1,NULL,&writable,NULL,&timeout)<=0 || getsockopt(fd,SOL_SOCKET,SO_ERROR,&error,&error_size)<0 || error){close(fd);fd=-1;continue;}
        if(fcntl(fd,F_SETFL,flags)<0){close(fd);fd=-1;continue;}
        timeout.tv_sec=25;timeout.tv_usec=0;setsockopt(fd,SOL_SOCKET,SO_SNDTIMEO,&timeout,sizeof(timeout));
        break;
    }
    freeaddrinfo(addresses);return fd;
}
static int load_roots(mbedtls_x509_crt *roots,const char *path) {
    FILE *f=fopen(path,"rb");long size;unsigned char *pem;int r;
    if(!f)return -1;fseek(f,0,SEEK_END);size=ftell(f);rewind(f);
    if(size<=0 || size>2097152){fclose(f);return -1;}
    pem=malloc(size+1);if(!pem){fclose(f);return -1;}
    if(fread(pem,1,size,f)!=(size_t)size){fclose(f);free(pem);return -1;}
    fclose(f);pem[size]=0;r=mbedtls_x509_crt_parse(roots,pem,size+1);free(pem);return r;
}
static int decode_http(unsigned char *raw,size_t size,unsigned char *out,size_t capacity,size_t *length,int *status) {
    unsigned char *end,*p,*payload;size_t body_size;int chunked=0;long declared=-1;
    raw[size]=0;end=(unsigned char *)strstr((char *)raw,"\r\n\r\n");if(!end || end-raw>65536)return -1;
    if(sscanf((char *)raw,"HTTP/%*d.%*d %d",status)!=1)return -1;
    p=(unsigned char *)strstr((char *)raw,"\r\n");if(!p)return -1;p+=2;
    while(p<end){unsigned char *line=(unsigned char *)strstr((char *)p,"\r\n");if(!line)return -1;
        if(!strncasecmp((char *)p,"Transfer-Encoding:",18)) {unsigned char *v=p+18;while(v<line && *v==' ')v++;if(line-v==7 && !strncasecmp((char *)v,"chunked",7))chunked=1;else return -1;}
        if(!strncasecmp((char *)p,"Content-Length:",15)){char *tail;declared=strtol((char *)p+15,&tail,10);if(declared<0 || tail!= (char *)line)return -1;}
        if(!strncasecmp((char *)p,"Content-Encoding:",17)){unsigned char *v=p+17;while(v<line && *v==' ')v++;if(line-v!=8 || strncasecmp((char *)v,"identity",8))return -1;}
        p=line+2;
    }
    payload=end+4;body_size=size-(payload-raw);*length=0;
    if(!chunked){if((declared>=0 && (size_t)declared!=body_size) || body_size>capacity)return -1;memcpy(out,payload,body_size);*length=body_size;return 0;}
    p=payload;
    while(p<raw+size){char *tail;unsigned long n=strtoul((char *)p,&tail,16);unsigned char *line=(unsigned char *)strstr((char *)p,"\r\n");
        if(!line || tail==(char *)p || (tail!=(char *)line && *tail!=';'))return -1;
        p=line+2;if(n==0)return 0;
        if(n>capacity-*length || n>(size_t)(raw+size-p) || (size_t)(raw+size-p)-n<2)return -1;
        memcpy(out+*length,p,n);*length+=n;p+=n;if(p[0]!='\r' || p[1]!='\n')return -1;p+=2;
    }
    return -1;
}
int tw_https_get_authorized(const char *url,const char *ca_path,unsigned char *body,size_t capacity,size_t *length,int *status,const char *bearer) {
    char host[256],request[10000],authorization[512]="";const char *path,*p;size_t host_length,used=0,sent=0;int result=-1,n;
    unsigned char *raw=NULL;size_t raw_capacity=capacity+65536;
    mbedtls_ssl_context ssl;mbedtls_ssl_config config;mbedtls_x509_crt roots;
    mbedtls_entropy_context entropy;mbedtls_ctr_drbg_context random;mbedtls_net_context socket;
    if(strncmp(url,"https://",8))return -1;path=strchr(url+8,'/');if(!path)return -1;host_length=path-(url+8);
    if(!host_length || host_length>=sizeof(host))return -1;
    memcpy(host,url+8,host_length);host[host_length]=0;
    for(p=host;*p;p++)if(!strchr("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-",*p))return -1;
    for(p=path;*p;p++)if((unsigned char)*p<=32 || (unsigned char)*p>=127)return -1;
    if(bearer){for(p=bearer;*p;p++)if(!strchr("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",*p))return -1;if(strlen(bearer)>256)return -1;snprintf(authorization,sizeof(authorization),"Authorization: Bearer %s\r\n",bearer);}
    n=snprintf(request,sizeof(request),"GET %s HTTP/1.1\r\nHost: %s\r\nUser-Agent: Mozilla/5.0 (compatible; DashboardWidgetRestorer/1.0)\r\nAccept: application/json\r\nAccept-Encoding: identity\r\n%sConnection: close\r\n\r\n",path,host,authorization);
    if(n<0 || n>=(int)sizeof(request))return -1;
    mbedtls_ssl_init(&ssl);mbedtls_ssl_config_init(&config);mbedtls_x509_crt_init(&roots);
    mbedtls_entropy_init(&entropy);mbedtls_ctr_drbg_init(&random);mbedtls_net_init(&socket);
    raw=malloc(raw_capacity+1);if(!raw)goto done;
    if(psa_crypto_init()!=PSA_SUCCESS || load_roots(&roots,ca_path)!=0)goto done;
    if(mbedtls_ctr_drbg_seed(&random,mbedtls_entropy_func,&entropy,(const unsigned char *)"TigerWidgets",12))goto done;
    if(mbedtls_ssl_config_defaults(&config,MBEDTLS_SSL_IS_CLIENT,MBEDTLS_SSL_TRANSPORT_STREAM,MBEDTLS_SSL_PRESET_DEFAULT))goto done;
    mbedtls_ssl_conf_authmode(&config,MBEDTLS_SSL_VERIFY_REQUIRED);
    mbedtls_ssl_conf_ca_chain(&config,&roots,NULL);mbedtls_ssl_conf_rng(&config,mbedtls_ctr_drbg_random,&random);
    mbedtls_ssl_conf_read_timeout(&config,25000);
    if(mbedtls_ssl_setup(&ssl,&config) || mbedtls_ssl_set_hostname(&ssl,host))goto done;
    socket.fd=connect_public(host);if(socket.fd<0)goto done;
    mbedtls_ssl_set_bio(&ssl,&socket,mbedtls_net_send,mbedtls_net_recv,mbedtls_net_recv_timeout);
    do {n=mbedtls_ssl_handshake(&ssl);}while(n==MBEDTLS_ERR_SSL_WANT_READ || n==MBEDTLS_ERR_SSL_WANT_WRITE);
    if(n || mbedtls_ssl_get_verify_result(&ssl)!=0)goto done;
    while(sent<strlen(request)) {n=mbedtls_ssl_write(&ssl,(const unsigned char *)request+sent,strlen(request)-sent);if(n==MBEDTLS_ERR_SSL_WANT_READ || n==MBEDTLS_ERR_SSL_WANT_WRITE)continue;if(n<=0)goto done;sent+=n;}
    while(used<raw_capacity){n=mbedtls_ssl_read(&ssl,raw+used,raw_capacity-used);if(n==MBEDTLS_ERR_SSL_WANT_READ || n==MBEDTLS_ERR_SSL_WANT_WRITE)continue;if(n==0 || n==MBEDTLS_ERR_SSL_PEER_CLOSE_NOTIFY)break;if(n<0)goto done;used+=n;}
    if(used==raw_capacity)goto done;
    result=decode_http(raw,used,body,capacity,length,status);
done:
    free(raw);mbedtls_net_free(&socket);mbedtls_ssl_free(&ssl);mbedtls_ssl_config_free(&config);
    mbedtls_x509_crt_free(&roots);mbedtls_ctr_drbg_free(&random);mbedtls_entropy_free(&entropy);
    return result;
}

int tw_https_get(const char *url,const char *ca_path,unsigned char *body,size_t capacity,size_t *length,int *status){return tw_https_get_authorized(url,ca_path,body,capacity,length,status,NULL);}
