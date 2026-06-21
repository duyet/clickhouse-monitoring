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
        // Open Graph / Twitter card image. Starlight emits canonical, og:title,
        // og:description and twitter:card by default, but not the image tags —
        // add the dimensions and an explicit twitter:image so the card renders
        // a large preview instead of relying on the og:image fallback.
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://docs.chmonitor.dev/og/og.png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://docs.chmonitor.dev/og/og.png' },
        },
        // Complete the icon set. Starlight's `favicon` option only emits the
        // single SVG link; reference the PNG fallbacks (older browsers) and the
        // apple-touch-icon (iOS home screen) that already ship in public/.
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
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
