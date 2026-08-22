// @ts-check
import { defineConfig } from 'astro/config';
import { mkdirSync } from 'fs';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import db from '@astrojs/db';
import node from '@astrojs/node';

// ── DB bootstrap ──────────────────────────────────────────────────────────
// @astrojs/db reads ASTRO_DATABASE_FILE in the astro:build:start hook,
// which runs BEFORE Vite/Astro loads .env files. We must set the default
// here — in astro.config.mjs — so it is always available regardless of
// whether a .env file exists (critical for CI/CD and fresh environments).
mkdirSync('.astro', { recursive: true });
if (!process.env.ASTRO_DATABASE_FILE) {
  process.env.ASTRO_DATABASE_FILE = './.astro/astro.db';
}
// ─────────────────────────────────────────────────────────────────────────

// https://astro.build/config
export default defineConfig({
  site: 'https://akasoftware.com.tr',
  // Tek sunucu kurulumu: API rotalari ve admin paneli SSR gerektiriyor.
  output: 'server',
  adapter: node({ mode: 'standalone', host: true }),
  vite: {
    plugins: [tailwindcss()]
  },
  // Ters proxy arkasinda Astro istegin genel adresini goremiyor; checkOrigin
  // acilirsa tum POST istekleri (sohbet, iletisim formu) 403 olur.
  security: {
    checkOrigin: false
  },
  integrations: [
    sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/admin') }),
    db()
  ],
  server: {
    port: parseInt(process.env.PORT || '1003'),
    host: true
  }
});
