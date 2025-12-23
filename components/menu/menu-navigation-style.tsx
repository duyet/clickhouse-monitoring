'use client'

import type React from 'react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { menuItemsConfig } from '@/menu'
import { HostPrefixedLink } from './link-with-context'
import {
  CountBadgeWrapper,
  MenuItemHeader,
  getFilteredMenuItems,
} from './menu-shared'
import type { MenuItem } from './types'

export interface MenuProps {
  items?: MenuItem[]
  className?: string
}

export function MenuNavigationStyle({
  items = menuItemsConfig,
  className,
}: MenuProps) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {items.map((item) => (
          <MenuItem key={item.title} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MenuItem({ item }: { item: MenuItem }) {
  if (item.items) {
    return <HasChildItems item={item} />
  }

  return <SingleItem item={item} />
}

function SingleItem({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem>
      <HostPrefixedLink
        href={item.href}
        className={cn(
          'group bg-background inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground focus:outline-hidden',
          'disabled:pointer-events-none disabled:opacity-50',
          'data-active:bg-accent/50 data-[state=open]:bg-accent/50'
        )}
        data-testid={
          item.href === '/clusters'
            ? 'nav-clusters'
            : item.href === '/database'
              ? 'nav-databases'
              : undefined
        }
      >
        <MenuItemHeader
          icon={item.icon}
          title={item.title}
          countSql={item.countSql}
          countVariant={item.countVariant}
          iconSize="size-4"
        />
      </HostPrefixedLink>
    </NavigationMenuItem>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>
        <MenuItemHeader
          icon={item.icon}
          title={item.title}
          countSql={item.countSql}
          countVariant={item.countVariant}
          iconSize="size-4"
        />
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[400px] grid-cols-1 content-center items-stretch gap-2 p-2 md:min-w-[700px] md:grid-cols-2">
          {getFilteredMenuItems(item.items).map((childItem) => (
            <ListItem
              key={childItem.href}
              title={
                <MenuItemHeader
                  icon={childItem.icon}
                  title={childItem.title}
                  countSql={childItem.countSql}
                  countVariant={childItem.countVariant}
                  iconSize="size-4"
                />
              }
              href={childItem.href}
              description={childItem.description}
            />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function ListItem({
  className,
  title,
  href,
  description,
  ...props
}: {
  className?: string
  title: React.ReactNode
  href: string
  description: React.ReactNode
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <HostPrefixedLink
          href={href}
          data-testid={
            href === '/clusters'
              ? 'nav-clusters'
              : href === '/database'
                ? 'nav-databases'
                : undefined
          }
        >
          <div
            className={cn(
              'block space-y-1 rounded-md p-2 leading-none no-underline outline-hidden transition-colors select-none',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="overflow-hidden text-sm leading-none font-medium text-ellipsis">
              {title}
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug break-words">
              {description}
            </p>
          </div>
        </HostPrefixedLink>
      </NavigationMenuLink>
    </li>
  )
}
