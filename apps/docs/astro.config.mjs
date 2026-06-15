import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

// https://astro.build/config
//
// Custom docs theme (ported from jordienr/astro-design-system) — no Starlight.
// Routing, sidebar, search (Pagefind), and per-release versioning are owned by
// this app. See scripts/sync-docs.mjs and scripts/snapshot-version.mjs.
// GitHub-Flavored Markdown is enabled by Astro's default remark pipeline.
export default defineConfig({
  site: 'https://docs.chmonitor.dev',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
})
