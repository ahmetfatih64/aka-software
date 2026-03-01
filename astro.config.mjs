// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://akasoftware.com',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()],
  server: {
    port: 1003
  }
});