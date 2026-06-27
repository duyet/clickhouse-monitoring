// Site-wide constants shared across layouts and routes.

export const appName = 'chmonitor'

// Current documentation version. Surfaced as a badge in the nav and used by the
// version switcher. Bump this when a new docs version is cut.
export const docsVersion = 'v0.3'

// Published documentation versions, newest first. Drives the version-switcher
// dropdown in the nav. Add an entry (and flip `current`) when a new version is
// cut; `href` points at that version's release notes.
export interface DocsVersionEntry {
  label: string
  href: string
  current?: boolean
}

export const docsVersions: DocsVersionEntry[] = [
  { label: 'v0.3', href: '/reference/releases/v0-3', current: true },
]

// Top-level documentation sections (matches ROOT_PAGES in scripts/sync-docs.mjs).
// Drives the sidebar section dropdown. Keep in sync with FOLDER_META root entries.
export interface DocsSectionEntry {
  title: string
  /** Index URL navigated to when the reader switches to this section. */
  url: string
  /** URL prefix used to detect which section is active. */
  prefix: string
}

export const docsSections: DocsSectionEntry[] = [
  { title: 'Guide', url: '/guide', prefix: '/guide' },
  { title: 'Deploy & Operate', url: '/operate', prefix: '/operate' },
  { title: 'Reference', url: '/reference', prefix: '/reference' },
]

// Docs are served at the site root (docs.chmonitor.dev/).
// Empty string means the base URL for doc pages is '/'.
export const docsRoute = ''

// Production dashboard URL (linked from the sidebar footer + home hero).
export const dashboardUrl = 'https://dash.chmonitor.dev'

// GitHub repository info — used for "Edit on GitHub" links.
export const gitConfig = {
  user: 'duyet',
  repo: 'clickhouse-monitoring',
  branch: 'main',
}
