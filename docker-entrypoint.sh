#!/bin/sh
set -e
mkdir -p /data
if [ ! -f /data/astro.db ]; then
  echo "[entrypoint] ilk calistirma - tohum veritabani kopyalaniyor"
  cp /seed/astro.db /data/astro.db
fi
exec node dist/server/entry.mjs
