'use client'

import dynamic from 'next/dynamic'
import { LoadingIcon } from '@/components/loading-icon'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import type { MenuItem } from './types'

const CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

/**
 * Filter menu items to only include items with both title and href
 * Used by both dropdown and navigation style menus
 */
export function getFilteredMenuItems(items?: MenuItem[]): MenuItem[] {
  return items?.filter((childItem) => childItem.title && childItem.href) ?? []
}

/**
 * Renders menu item icon with consistent styling
 * Supports different icon sizes for different contexts
 */
export function MenuIcon({
  icon: IconComponent,
  size = 'size-3',
}: {
  icon?: MenuItem['icon']
  size?: string
}) {
  if (!IconComponent) return null
  return <IconComponent className={`${size} strokeWidth-[1]`} strokeWidth={1} />
}

/**
 * Renders count badge with loading state and error handling
 * Used in both menu styles to show dynamic counts
 */
export function CountBadgeWrapper({
  countSql,
  countVariant,
}: {
  countSql?: string
  countVariant?: MenuItem['countVariant']
}) {
  if (!countSql) return null

  return (
    <ServerComponentLazy fallback={<LoadingIcon />} onError={''}>
      <CountBadge sql={countSql} variant={countVariant} />
    </ServerComponentLazy>
  )
}

/**
 * Renders menu item title with icon and optional count badge
 * Used by both menu styles to display item header
 */
export function MenuItemHeader({
  icon,
  title,
  countSql,
  countVariant,
  iconSize = 'size-3',
  className,
}: {
  icon?: MenuItem['icon']
  title: string
  countSql?: string
  countVariant?: MenuItem['countVariant']
  iconSize?: string
  className?: string
}) {
  return (
    <div className={`flex flex-row items-center gap-2 ${className ?? ''}`}>
      <MenuIcon icon={icon} size={iconSize} />
      {title}
      <CountBadgeWrapper countSql={countSql} countVariant={countVariant} />
    </div>
  )
}
