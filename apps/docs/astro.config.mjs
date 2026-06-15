import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

// https://astro.build/config
//
// Custom docs theme (ported from jordienr/astro-design-system) — no Starlight.
// Routing, sidebar, search (Pagefind), and per-release versioning are owned by
// this app. See scripts/sync-docs.mjs and scripts/snapshot-version.mjs.
// GitHub-Flavored Markdown is enabled by Astro's default remark pipeline.
export default defineConfig({
  // Static HTML at build time → dist/ → Cloudflare Workers ASSETS (no SSR).
  output: 'static',
  site: 'https://docs.chmonitor.dev',
  build: {
    // Inline CSS into each page's <head> so first paint never waits on a
    // separate /_astro/*.css request (prevents theme/layout flash on load).
    inlineStylesheets: 'always',
  },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
})
