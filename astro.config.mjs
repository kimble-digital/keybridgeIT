import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// Internal-only routes: kept out of the sitemap and robots.txt, and marked
// noindex via the `noindex` prop on Base.astro. Add new ones here.
const PRIVATE_ROUTES = ['/marketing'];

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
    // Short link for social posts and print. The full audit URL is too long to
    // sit on a social card without wrapping.
    '/audit': '/free-microsoft-365-security-audit',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  integrations: [
    sitemap({
      filter: (page) =>
        !PRIVATE_ROUTES.some((route) => new URL(page).pathname.startsWith(route)),
    }),
  ],
  adapter: vercel(),
});
