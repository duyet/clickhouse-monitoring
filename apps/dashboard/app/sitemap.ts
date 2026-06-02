import { menuItemsConfig } from '@/menu'

import type { MetadataRoute } from 'next'

import { docsNav } from './(docs)/docs/_lib/docs'

/** Generate at build time — content is static. */
export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chmonitor.dev'

/** Pages that exist as routes but aren't in the sidebar menu. */
const HIDDEN_PAGES = [
  '/expensive-queries-by-memory',
  '/projections',
  '/top-usage-columns',
  '/top-usage-tables',
  '/query-cache',
  '/common-errors',
  '/view-refreshes',
  '/roles',
  '/users',
  '/detached-parts',
  '/queries/parallelization',
]

/** Paths that are redirect-only — skip them to avoid duplicates. */
const REDIRECT_PATHS = new Set([
  '/ai-chat', // → /agents
  '/zookeeper', // → /keeper
  '/table', // → /explorer
  '/tables', // → /explorer
])

/** Recursively extract all non-empty hrefs from menu items. */
function extractMenuHrefs(items: { href: string; items?: any[] }[]): string[] {
  const hrefs: string[] = []
  for (const item of items) {
    if (item.href && item.href !== '/') {
      // Strip query params for sitemap — detail views are dynamic
      const path = item.href.split('?')[0]
      if (path && !REDIRECT_PATHS.has(path)) {
        hrefs.push(path)
      }
    }
    if (item.items) {
      hrefs.push(...extractMenuHrefs(item.items))
    }
  }
  return hrefs
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Home page
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  })

  // Docs pages (24 pages from docsNav)
  for (const section of docsNav) {
    for (const item of section.items) {
      const slug = item.slug
      const path = slug ? `/docs/${slug}` : '/docs'
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: slug === '' ? 0.9 : 0.8,
      })
    }
  }

  // Dashboard pages from menu.ts
  const menuHrefs = [...new Set(extractMenuHrefs(menuItemsConfig))]
  for (const path of menuHrefs) {
    // Skip /docs — already added from docsNav above
    if (path === '/docs') continue
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  // Hidden utility pages
  for (const path of HIDDEN_PAGES) {
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  return entries
}
