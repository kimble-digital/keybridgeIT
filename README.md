# Keybridge IT — Website

Astro static site. Dark, high-tech, kinetic-typography design. Deploys to Vercel.

## Run locally
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # preview the production build
```

## Deploy to Vercel
1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel, "Add New Project" → import the repo.
3. Framework preset: **Astro** (auto-detected). No adapter needed — static build.
4. Deploy. Set your domain (keybridgeit.com) in Vercel project settings.

## Before launch — checklist
- [ ] **Logo**: replace the placeholder chevron in `src/components/Logo.astro` with the real SVG (mono + colour variants). Same mark is used in `public/favicon.svg`.
- [ ] **Contact form**: in `src/pages/contact.astro`, set `FORMSPREE_ID` to your Formspree form ID (free at formspree.io). Or set `ENDPOINT = "/api/lead"` to use the included Vercel serverless function at `api/lead.js` and configure an email provider there.
- [ ] **Legal pages**: complete `privacy.astro`, `terms.astro`, `cookies.astro` with a qualified adviser.
- [ ] **Domain/site URL**: confirm `site` in `astro.config.mjs` (used by sitemap + canonical).
- [ ] **Analytics/cookie banner**: none included by default (no non-essential cookies). Add if needed, then update the cookie policy.

## Editing content
All shared content (nav, services, stats, industries, testimonials, contact details)
lives in **`src/data/site.ts`** — one file. This is the seam to swap for a CMS
(e.g. Contentful) later without touching templates.

## Structure
- `src/layouts/Base.astro` — head, fonts, GSAP, nav, footer, global scroll-reveal
- `src/components/` — Hero (kinetic), Nav, Footer, PageHero, Prose, ServiceGrid, Faq, CtaBand, Testimonials, Logo
- `src/pages/` — all routes (services, industries/, ai/, company, legal, 404)
- `src/styles/global.css` — design system + brand tokens

## Animation
GSAP + ScrollTrigger via CDN. Respects `prefers-reduced-motion`. Reveal content is
shown by default and animates only when JS is active, so nothing can get stuck hidden.
