# ── Build ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# @astrojs/db reads ASTRO_DATABASE_FILE in the astro:build:start hook, which
# runs before .env is loaded — it must be a real env var, not a .env entry.
# Baking an absolute path here is what makes the DB survive redeploys.
ENV ASTRO_DATABASE_FILE=/data/astro.db
RUN mkdir -p /data

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
# Seeded database from the build — copied into the volume on first start only.
COPY --from=build /data/astro.db /seed/astro.db
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4321
ENTRYPOINT ["docker-entrypoint.sh"]
