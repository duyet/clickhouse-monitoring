/**
 * Menu item with children (dropdown)
 *
 * Displays a navigation trigger with dropdown content.
 */

'use client'

import type { MenuItem } from '../types'

import { useMenuActiveState } from '../hooks/use-menu-active-state'
import { ActiveIndicator } from './active-indicator'
import { MenuIcon } from './menu-icon'
import { MenuListItem } from './menu-list-item'
import dynamic from 'next/dynamic'
import { memo } from 'react'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

interface MenuHasChildrenProps {
  item: MenuItem
}

export const MenuHasChildren = memo(function MenuHasChildren({
  item,
}: MenuHasChildrenProps) {
  const hasActiveChild = useMenuActiveState(item)

  return (
    <NavigationMenuItem role="none">
      <NavigationMenuTrigger
        className={cn(
          'relative',
          hasActiveChild && 'text-foreground font-semibold'
        )}
        data-active={hasActiveChild ? 'true' : undefined}
        aria-current={hasActiveChild ? 'true' : undefined}
      >
        <div className="flex flex-row items-center gap-1.5">
          <MenuIcon icon={item.icon} isActive={hasActiveChild} />
          <span>{item.title}</span>
          {item.countKey ? (
            <CountBadge countKey={item.countKey} variant={item.countVariant} />
          ) : null}
        </div>
        <ActiveIndicator position="bottom" active={hasActiveChild} />
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[380px] grid-cols-1 content-center items-stretch gap-1 p-1.5 md:min-w-[580px] md:grid-cols-2">
          {item.items
            ?.filter((childItem) => childItem.title && childItem.href)
            .map((childItem) => (
              <MenuListItem key={childItem.href} item={childItem} />
            ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
})
