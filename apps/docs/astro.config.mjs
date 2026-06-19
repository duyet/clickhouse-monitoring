import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
//
// Native Astro Starlight docs theme. The theme (layout, sidebar, search via
// Pagefind, dark mode, table of contents, edit links) is owned by Starlight —
// there is no custom shell to maintain.
//
// Content source of truth: docs/content/** (committed). scripts/sync-docs.mjs
// transforms it into the Starlight content collection (src/content/docs/**,
// gitignored) on every build. There is no per-release versioning; the working
// docs are served directly at the site root.
export default defineConfig({
  // Static HTML at build time → dist/ → Cloudflare Workers ASSETS (no SSR).
  output: 'static',
  site: 'https://docs.chmonitor.dev',
  integrations: [
    starlight({
      title: 'chmonitor',
      description:
        'Documentation for chmonitor — a real-time ClickHouse monitoring dashboard.',
      logo: { src: './public/favicon.svg', alt: 'chmonitor' },
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/duyet/clickhouse-monitoring',
        },
      ],
      // "Copy page" / "Open as Markdown" actions next to the page title. Backed
      // by the raw-markdown route at src/pages/[...slug].md.ts.
      components: {
        PageTitle: './src/components/PageTitle.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://docs.chmonitor.dev/og/og.png' },
        },
      ],
      // Curated top-level order; pages within each section are listed
      // automatically (alphabetically, Overview first via sidebar.order).
      sidebar: [
        { label: 'Getting Started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'Deployment', items: [{ autogenerate: { directory: 'deploy' } }] },
        { label: 'Features', items: [{ autogenerate: { directory: 'features' } }] },
        { label: 'AI Agent', items: [{ autogenerate: { directory: 'ai-agent' } }] },
        { label: 'Authentication', items: [{ autogenerate: { directory: 'authentication' } }] },
        { label: 'Advanced', items: [{ autogenerate: { directory: 'advanced' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Migrating', items: [{ autogenerate: { directory: 'migrating' } }] },
        { label: 'Releases', items: [{ autogenerate: { directory: 'releases' } }] },
        { label: 'More', items: [{ slug: 'faq' }, { slug: 'settings' }] },
      ],
    }),
    sitemap(),
  ],
})
