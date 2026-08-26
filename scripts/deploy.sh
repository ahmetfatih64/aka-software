#!/bin/sh
# Rebuilds and restarts the production container.
#
# Runs ON THE SERVER, invoked by /opt/aka/deploy.sh after that bootstrap has
# already pulled main into /opt/aka/app. Kept in the repo so the deploy logic
# is versioned and reviewable — see DEPLOY.md.
set -e

APP=/opt/aka/app
COMPOSE=/opt/n8n
BACKUPS=/opt/aka/backups
KEEP_BACKUPS=10

echo "[deploy] HEAD: $(git -C "$APP" log --oneline -1)"

echo "[deploy] veritabani yedegi"
mkdir -p "$BACKUPS"
docker cp aka:/data/astro.db "$BACKUPS/astro-$(date +%Y%m%d-%H%M%S).db" 2>/dev/null \
  || echo "[deploy] yedek atlandi (konteyner calismiyor olabilir)"
ls -1t "$BACKUPS"/astro-*.db 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f

echo "[deploy] imaj derleniyor"
cd "$COMPOSE"
docker compose build aka

echo "[deploy] konteyner yenileniyor"
docker compose up -d aka

echo "[deploy] saglik kontrolu"
# Must be 127.0.0.1, not localhost: the app binds 0.0.0.0 (IPv4 only), while
# "localhost" resolves to ::1 first inside the container and is refused.
i=0
while [ "$i" -lt 30 ]; do
  if docker exec aka wget -qO- http://127.0.0.1:4321/ >/dev/null 2>&1; then
    echo "[deploy] TAMAM - uygulama yanit veriyor"
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done

echo "[deploy] HATA - uygulama 60sn icinde yanit vermedi"
docker logs aka --tail 30
exit 1
