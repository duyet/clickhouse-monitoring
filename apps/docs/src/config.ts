// Site-wide configuration for the chmonitor docs.

export const SITE = {
  title: 'chmonitor',
  tagline: 'ClickHouse monitoring dashboard',
  description:
    'Documentation for chmonitor — a real-time ClickHouse monitoring dashboard.',
  github: 'https://github.com/duyet/clickhouse-monitoring',
  home: 'https://chmonitor.dev/?ref=docs',
  dashboard: 'https://dash.chmonitor.dev/?ref=docs',
}

// External quick links shown as a compact topbar above the sidebar nav.
export const QUICK_LINKS = [
  { label: 'Home', href: SITE.home, external: true },
  { label: 'Dashboard', href: SITE.dashboard, external: true },
]
