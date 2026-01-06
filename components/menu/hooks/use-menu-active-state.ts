/**
 * Hook for detecting active menu item state
 *
 * Provides logic to determine if a menu item or its children are active.
 */

'use client'

import type { MenuItem } from '../types'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'

/**
 * Check if a menu item or any of its children are active
 */
export function useMenuActiveState(item: MenuItem): boolean {
  const pathname = usePathname()

  return useMemo(() => {
    // Check if item itself is active
    if (item.href && isMenuItemActive(item.href, pathname)) {
      return true
    }

    // Check if any child is active
    if (item.items) {
      return item.items.some(
        (child) => child.href && isMenuItemActive(child.href, pathname)
      )
    }

    return false
  }, [item, pathname])
}
