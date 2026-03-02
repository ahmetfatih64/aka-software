// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  site: 'https://akasoftware.com',
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap(), db()],
  server: {
    port: 1003
  }
});