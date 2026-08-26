# Deploy

Production runs on a Hetzner VPS at `62.238.105.156`, which also hosts n8n.
`akasoftware.com.tr` resolves straight to that box — there is no CDN and no
managed platform in front of it.

## How it is wired

```
akasoftware.com.tr  ──▶  caddy (container, :80/:443)
                            └──▶  aka (container, :4321)   ← this repo
                            └──▶  n8n (container, :5678)   ← AI assistant backend
```

| Thing | Where |
|---|---|
| Source checkout | `/opt/aka/app` — a git clone of this repo, `main` branch |
| Compose project | `/opt/n8n/docker-compose.yml` (services: `caddy`, `n8n`, `aka`) |
| Reverse proxy config | `/opt/n8n/Caddyfile` |
| Server secrets | `/opt/aka/app/.env` — untracked, never in git |
| Database | Docker volume `n8n_aka_data`, mounted at `/data` |
| DB backups | `/opt/aka/backups/` (last 10 kept) |
| Deploy bootstrap | `/opt/aka/deploy.sh` — server-side, pulls `main` then hands off |
| Deploy logic | `scripts/deploy.sh` in this repo |

The `aka` service builds from `/opt/aka/app` using the `Dockerfile` in this
repo. The image is not pushed to a registry — it is built on the server.

## Automatic deploys

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes to the
server and runs `/opt/aka/deploy.sh`.

That server-side file is deliberately tiny — it pulls `main`, then hands off
to `scripts/deploy.sh` from the freshly pulled checkout:

```sh
#!/bin/sh
set -e
cd /opt/aka/app
git fetch --prune origin
git reset --hard origin/main
exec sh scripts/deploy.sh
```

Everything else — backup, build, restart, health check — lives in
`scripts/deploy.sh` in this repo, so changing the deploy process is an
ordinary reviewed commit. The bootstrap only needs editing if the paths
themselves move.

The workflow authenticates with the `SSH_PRIVATE_KEY` repository secret. Its
public half sits in the server's `authorized_keys` restricted to
`command="/opt/aka/deploy.sh"`, so a leak of that key cannot open a root
shell — it can only trigger a deploy of whatever is on `main`.

## Deploying by hand

If the workflow is unavailable:

```sh
ssh root@62.238.105.156 /opt/aka/deploy.sh
```

Or step by step:

```sh
cd /opt/aka/app
git fetch --prune origin && git reset --hard origin/main
cd /opt/n8n
docker compose build aka && docker compose up -d aka
```

## The database survives redeploys

`docker-entrypoint.sh` copies the seed database into `/data` **only when the
file does not already exist**. Rebuilding the image and recreating the
container leaves the `n8n_aka_data` volume untouched, so contact messages and
chat history are preserved.

Take a backup before anything unusual:

```sh
docker cp aka:/data/astro.db /opt/aka/backups/astro-$(date +%Y%m%d-%H%M%S).db
```

## Environment variables are build-time, not runtime

This is the part that surprises people, so read it before changing a secret.

The `aka` container is started with **no environment variables of its own** —
the compose service defines neither `environment:` nor `env_file:`. Every
value the app uses (`ADMIN_USER`, `ADMIN_PASS`, `ADMIN_SECRET`, the `SMTP_*`
set, `N8N_WEBHOOK_URL`) reaches it because Astro statically replaces
`import.meta.env.*` **while compiling**, reading `/opt/aka/app/.env` at build
time. The values end up compiled into `dist/`.

Two consequences:

1. **`/opt/aka/app/.env` must exist on the server for a build to be correct.**
   It is untracked, so `git reset --hard` in the deploy script leaves it
   alone — but nothing recreates it if it is deleted. Keep a copy somewhere
   safe. `.env.example` lists the keys.
2. **Changing any secret requires a rebuild**, not a restart. `docker compose
   restart aka` will keep serving the old baked-in values.

`ASTRO_DATABASE_FILE` is the exception: it is set as a real `ENV` in the
`Dockerfile`, because `@astrojs/db` reads it in the `astro:build:start` hook,
which runs before `.env` is loaded at all.

### Worth tightening later

Because the secrets are compiled into `dist/`, they live inside the
`aka-software:latest` image. The image is built on the server and never
pushed to a registry, so it is not exposed today — but do not push it
anywhere without moving the runtime secrets to `environment:`/`env_file:` in
compose first. Only the values Astro genuinely needs at build time have to
stay in `.env`.
