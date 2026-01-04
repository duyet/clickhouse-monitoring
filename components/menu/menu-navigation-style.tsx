/**
 * Menu Navigation Style Component
 *
 * Main navigation menu with dropdown support and active state detection.
 */

'use client'

import { menuItemsConfig } from '@/menu'

import type { MenuItem } from './types'

import { MenuHasChildren } from './components/menu-has-children'
import { MenuSingleItem } from './components/menu-single-item'
import dynamic from 'next/dynamic'
import { memo } from 'react'
import {
  NavigationMenu,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'

const _CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

export interface MenuProps {
  items?: MenuItem[]
  className?: string
}

/**
 * Main navigation menu component
 *
 * Renders menu items as either single links or dropdowns with children.
 */
export const MenuNavigationStyle = memo(function MenuNavigationStyle({
  items = menuItemsConfig,
  className,
}: MenuProps) {
  return (
    <NavigationMenu className={className} aria-label="Main navigation">
      <NavigationMenuList role="menubar">
        {items.map((item) => (
          <MenuItemComponent key={item.title} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
})

/**
 * Menu item component router
 *
 * Delegates to appropriate component based on whether item has children.
 */
const MenuItemComponent = memo(function MenuItemComponent({
  item,
}: {
  item: MenuItem
}) {
  if (item.items) {
    return <MenuHasChildren item={item} />
  }

  return <MenuSingleItem item={item} />
})
