/* SPDX-License-Identifier: MIT */
#include <stddef.h>
int tw_https_get(const char *url, const char *ca_path, unsigned char *body,
                 size_t capacity, size_t *length, int *status);

int tw_https_get_authorized(const char *url, const char *ca_path, unsigned char *body,
                 size_t capacity, size_t *length, int *status, const char *bearer);
