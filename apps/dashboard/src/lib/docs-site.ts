/**
 * External documentation site.
 *
 * The in-dashboard docs reader (the old `/docs` route group) was removed — all
 * documentation now lives on the dedicated Astro site at docs.chmonitor.dev.
 * Edge `_redirects` send `dash.chmonitor.dev/docs*` here; in-app links point
 * straight at it so there is no redirect hop.
 */
export const DOCS_SITE_URL = 'https://docs.chmonitor.dev'

/** Build an absolute docs URL for a slug (e.g. `getting-started`). */
export function docsSiteUrl(slug = ''): string {
  const clean = slug.replace(/^\/+/, '')
  return clean ? `${DOCS_SITE_URL}/${clean}` : DOCS_SITE_URL
}
