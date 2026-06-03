import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.chmonitor.dev',
  integrations: [
    starlight({
      title: 'chmonitor',
      tagline: 'ClickHouse monitoring dashboard',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'chmonitor',
      },
      favicon: '/favicon.svg',
      customCss: [
        // Geist + Geist Mono — the typefaces used by Vercel / shadcn docs.
        '@fontsource-variable/geist',
        '@fontsource-variable/geist-mono',
        './src/styles/custom.css',
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/duyet/clickhouse-monitoring',
        },
      ],
      // Edit links point back to the source-of-truth content in the repo.
      editLink: {
        baseUrl:
          'https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/',
      },
      lastUpdated: true,
      // Explicit, hand-curated sidebar. Autogenerating from `.` produced an
      // unreliable tree (the root index + `*.mdx` overview pages collided with
      // their same-named directories), which is why the sidebar appeared
      // broken. Groups are defined explicitly here instead.
      sidebar: [
        {
          label: '← Home',
          link: 'https://chmonitor.dev/?ref=docs',
          attrs: { target: '_blank', rel: 'noopener' },
        },
        {
          label: 'Live Dashboard',
          link: 'https://dash.chmonitor.dev/?ref=docs',
          attrs: { target: '_blank', rel: 'noopener' },
          badge: { text: 'demo', variant: 'tip' },
        },
        {
          label: 'Introduction',
          link: '/',
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', link: '/getting-started' },
            { label: 'ClickHouse Requirements', link: '/getting-started/clickhouse-requirements' },
            { label: 'Enable System Tables', link: '/getting-started/clickhouse-enable-system-tables' },
            { label: 'Run Locally', link: '/getting-started/local' },
          ],
        },
        {
          label: 'Deployment',
          items: [
            { label: 'Overview', link: '/deploy' },
            { label: 'Self-Host', link: '/deploy/self-host' },
            { label: 'Docker', link: '/deploy/docker' },
            { label: 'Vercel', link: '/deploy/vercel' },
            { label: 'Cloudflare', link: '/deploy/cloudflare' },
            { label: 'Kubernetes', link: '/deploy/k8s' },
            { label: 'Production Checklist', link: '/deploy/production-checklist' },
          ],
        },
        {
          label: 'Advanced',
          autogenerate: { directory: 'advanced' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'More',
          items: [
            { label: 'Features', link: '/features' },
            { label: 'AI Agent', link: '/ai-agent' },
            { label: 'Settings', link: '/settings' },
            { label: 'FAQ', link: '/faq' },
          ],
        },
      ],
    }),
  ],
})
