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
| DB backups | `/opt/aka/backups/` |
| Deploy script | `/opt/aka/deploy.sh` |

The `aka` service builds from `/opt/aka/app` using the `Dockerfile` in this
repo. The image is not pushed to a registry — it is built on the server.

## Automatic deploys

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes to the
server and runs `/opt/aka/deploy.sh`. That script does a `git fetch` +
`git reset --hard origin/main`, rebuilds the image, and recreates the
container.

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

## Environment variables

`ASTRO_DATABASE_FILE` is baked into the image (see `Dockerfile`) because
`@astrojs/db` reads it in the `astro:build:start` hook, before `.env` is
loaded. Everything else comes from `/opt/aka/app/.env` — see `.env.example`.

**`N8N_WEBHOOK_URL` is inlined at build time**, not read at runtime. Astro
statically replaces `import.meta.env.*` when it compiles. Changing the n8n
address therefore needs a full rebuild; restarting the container is not
enough.
