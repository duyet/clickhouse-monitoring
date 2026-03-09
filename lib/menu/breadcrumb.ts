import { menuItemsConfig } from '@/menu'

import type { MenuItem } from '@/components/menu/types'

export interface BreadcrumbItem {
  title: string
  /** Empty string means this item is a non-navigable section label */
  href: string
}

/**
 * Convert a URL path segment to a human-readable title.
 * Used as a fallback when a page is not registered in the menu.
 */
function segmentToTitle(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Build a breadcrumb path from raw URL segments when no menu match is found.
 * Each segment becomes a breadcrumb item with its cumulative href.
 */
function buildFallbackPath(normalizedPath: string): BreadcrumbItem[] {
  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) return []

  return segments.map((segment, index) => ({
    title: segmentToTitle(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
  }))
}

/**
 * Find the breadcrumb path for a given pathname.
 * Searches through the menu hierarchy first; falls back to URL segment parsing
 * when the page is not registered in the menu.
 *
 * Parent menu items with href: '' are included as non-navigable section labels.
 */
export function getBreadcrumbPath(pathname: string): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = []
  const normalizedPath = pathname.split('?')[0] // Remove query params

  function searchItems(items: MenuItem[], path: BreadcrumbItem[]): boolean {
    for (const item of items) {
      const currentPath: BreadcrumbItem[] = [
        ...path,
        { title: item.title, href: item.href },
      ]

      // Check if this item matches the current pathname (skip empty-href group headers)
      if (item.href && item.href === normalizedPath) {
        result.push(...currentPath)
        return true
      }

      // Check if any children match
      if (item.items) {
        if (searchItems(item.items, currentPath)) {
          return true
        }
      }
    }
    return false
  }

  const found = searchItems(menuItemsConfig, [])

  if (!found) {
    // Fallback: derive breadcrumbs from URL path segments
    return buildFallbackPath(normalizedPath)
  }

  return result
}

/**
 * Check if a menu item is active for the current pathname
 */
export function isMenuItemActive(itemHref: string, pathname: string): boolean {
  const normalizedPath = pathname.split('?')[0]
  const normalizedHref = itemHref.split('?')[0]

  // Exact match
  if (normalizedHref === normalizedPath) {
    return true
  }

  // Parent path match (e.g., /tables matches /table)
  if (
    normalizedPath.startsWith(`${normalizedHref}/`) ||
    normalizedPath.startsWith(`${normalizedHref}?`)
  ) {
    return true
  }

  return false
}
