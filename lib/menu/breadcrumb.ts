import { menuItemsConfig } from '@/menu'
import type { MenuItem } from '@/components/menu/types'

export interface BreadcrumbItem {
  title: string
  href: string
}

/**
 * Find the breadcrumb path for a given pathname
 * Searches through the menu hierarchy to find matching items
 */
export function getBreadcrumbPath(pathname: string): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = []
  const normalizedPath = pathname.split('?')[0] // Remove query params

  function searchItems(items: MenuItem[], path: BreadcrumbItem[]): boolean {
    for (const item of items) {
      const currentPath = [...path, { title: item.title, href: item.href }]

      // Check if this item matches the current pathname
      if (item.href === normalizedPath) {
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

  searchItems(menuItemsConfig, [])

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

  // Parent path match (e.g., /tables matches /database)
  if (normalizedPath.startsWith(normalizedHref + '/') || normalizedPath.startsWith(normalizedHref + '?')) {
    return true
  }

  return false
}
