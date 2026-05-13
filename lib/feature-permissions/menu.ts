import type { MenuItem } from '@/components/menu/types'
import type { FeaturePermission, PublicFeaturePermissionConfig } from './types'

import { isFeatureAllowed } from './shared'

export function filterMenuItemsByPermissions(
  items: readonly MenuItem[],
  config: PublicFeaturePermissionConfig,
  inheritedPermission?: FeaturePermission
): MenuItem[] {
  return items.flatMap((item) => {
    const permission = item.permission ?? inheritedPermission
    if (!isFeatureAllowed(permission, config)) return []

    if (!item.items) return [{ ...item }]

    const childItems = filterMenuItemsByPermissions(
      item.items,
      config,
      permission
    )

    if (childItems.length === 0) return []

    return [{ ...item, items: childItems }]
  })
}

export function findMenuPermissionForPath(
  items: readonly MenuItem[],
  pathname: string,
  inheritedPermission?: FeaturePermission
): FeaturePermission | undefined {
  const normalizedPath = pathname.split('?')[0].replace(/\/+$/, '') || '/'

  for (const item of items) {
    const permission = item.permission ?? inheritedPermission
    const href = item.href
      ? item.href.split('?')[0].replace(/\/+$/, '') || '/'
      : ''

    if (href && href === normalizedPath) {
      return permission
    }

    if (item.items) {
      const childPermission = findMenuPermissionForPath(
        item.items,
        normalizedPath,
        permission
      )
      if (childPermission) return childPermission
    }
  }

  return undefined
}

export function findMenuPermissionForCountKey(
  items: readonly MenuItem[],
  countKey: string,
  inheritedPermission?: FeaturePermission
): FeaturePermission | undefined {
  for (const item of items) {
    const permission = item.permission ?? inheritedPermission

    if (item.countKey === countKey) {
      return permission
    }

    if (item.items) {
      const childPermission = findMenuPermissionForCountKey(
        item.items,
        countKey,
        permission
      )
      if (childPermission) return childPermission
    }
  }

  return undefined
}
