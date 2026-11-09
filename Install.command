#!/bin/sh
set -eu
cd "$(dirname "$0")"
sudo /usr/bin/python scripts/manage.py install
echo 'Installation finished. Reload Dashboard to use the updated widgets.'
printf 'Press Return to close: '
read answer
