import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://keybridgeit.com',

  // Required so /api/contact deploys as a serverless function on Vercel.
  // Pages stay fast: prerender them individually with `export const prerender = true`,
  // or switch this to 'static' once confirmed working on Astro 5.
  output: 'server',

  // keep the old AI page URL working after the rename
  redirects: {
    '/ai-adoption': '/ai-enablement',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  integrations: [sitemap()],
  adapter: vercel(),
});
