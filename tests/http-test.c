/* Exercise the HTTP parser without requiring a network connection. MIT. */
#include <assert.h>
#include "../src/https.c"
static int test(const char *s,char *out,size_t capacity,size_t *length,int *status){size_t size=strlen(s);unsigned char *raw=malloc(size+1);int r;memcpy(raw,s,size+1);r=decode_http(raw,size,(unsigned char *)out,capacity,length,status);free(raw);return r;}
int main(void){char out[128];size_t n;int status;
    assert(test("HTTP/1.1 200 OK\r\nContent-Length: 7\r\n\r\n{\"a\":1}",out,sizeof(out),&n,&status)==0 && n==7 && status==200);
    assert(test("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n4\r\n{\"a\"\r\n3\r\n:1}\r\n0\r\n\r\n",out,sizeof(out),&n,&status)==0 && n==7);
    assert(test("HTTP/1.1 200 OK\r\nContent-Length: 8\r\n\r\nshort",out,sizeof(out),&n,&status)!=0);
    assert(test("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nff\r\nshort",out,sizeof(out),&n,&status)!=0);
    assert(test("HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\n\r\nx",out,sizeof(out),&n,&status)!=0);
    assert(!public_address(0x7f000001UL) && !public_address(0xc0a80101UL) && !public_address(0x0a000001UL) && public_address(0x08080808UL));
    assert(tw_https_get_authorized("https://example.com/","missing",(unsigned char *)out,sizeof(out),&n,&status,"bad\r\nHeader")!=0);
    puts("PASS: bounded HTTP bodies, chunking, truncation rejection, encoding rejection, address filtering.");return 0;
}
