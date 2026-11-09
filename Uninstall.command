#!/bin/sh
set -eu
cd "$(dirname "$0")"
sudo /usr/bin/python scripts/manage.py uninstall
printf 'Press Return to close: '
read answer
