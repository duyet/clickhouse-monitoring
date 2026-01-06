/**
 * Dropdown menu list item component
 *
 * Displays individual items in the dropdown menu.
 */

'use client'

import type { MenuItem } from '../types'

import { useMenuActiveState } from '../hooks/use-menu-active-state'
import { HostPrefixedLink } from '../link-with-context'
import { ActiveIndicator } from './active-indicator'
import { MenuIcon } from './menu-icon'
import dynamic from 'next/dynamic'
import { memo } from 'react'
import { NavigationMenuLink } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

const NewBadge = dynamic(() =>
  import('./new-badge').then((mod) => mod.NewBadge)
)

interface MenuListItemProps {
  item: MenuItem
}

export const MenuListItem = memo(function MenuListItem({
  item,
}: MenuListItemProps) {
  const isActive = useMenuActiveState(item)

  const title = (
    <span className="flex flex-row items-center gap-1.5">
      <MenuIcon icon={item.icon} isActive={isActive} />
      <span>{item.title}</span>
      {item.countKey ? (
        <CountBadge countKey={item.countKey} variant={item.countVariant} />
      ) : null}
      <NewBadge href={item.href} isNew={item.isNew} />
    </span>
  )

  return (
    <li>
      <NavigationMenuLink asChild>
        <HostPrefixedLink
          href={item.href}
          className="group"
          data-active={isActive ? 'true' : undefined}
          data-testid={
            item.href === '/clusters'
              ? 'nav-clusters'
              : item.href === '/table'
                ? 'nav-databases'
                : undefined
          }
        >
          <div
            className={cn(
              'relative block space-y-0.5 rounded-md px-2.5 py-2 leading-none no-underline outline-hidden transition-colors select-none',
              'hover:bg-accent/60 hover:text-foreground',
              'focus:bg-accent/60 focus:text-foreground',
              'group-data-[active=true]:bg-accent/50 group-data-[active=true]:text-foreground'
            )}
          >
            <ActiveIndicator position="left" />
            <div className="overflow-hidden text-[13px] leading-tight font-medium text-ellipsis">
              {title}
            </div>
            <p className="text-muted-foreground line-clamp-1 text-xs leading-relaxed mt-0.5">
              {item.description}
            </p>
          </div>
        </HostPrefixedLink>
      </NavigationMenuLink>
    </li>
  )
})
