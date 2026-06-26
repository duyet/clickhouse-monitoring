// Site-wide constants shared across layouts and routes.

export const appName = 'chmonitor'

// Current documentation version. Surfaced as a badge in the nav and used by the
// version switcher. Bump this when a new docs version is cut.
export const docsVersion = 'v0.3'

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
