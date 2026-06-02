import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.chmonitor.dev',
  integrations: [
    starlight({
      title: 'chmonitor docs',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/duyet/clickhouse-monitoring',
        },
      ],
      sidebar: [
        {
          label: 'Documentation',
          autogenerate: { directory: '.' },
        },
      ],
    }),
  ],
})
