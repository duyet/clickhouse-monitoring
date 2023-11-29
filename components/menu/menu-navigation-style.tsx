import React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { CountBadge } from '@/components/menu/count-badge'
import { ServerComponentLazy } from '@/components/server-component-lazy'

import { menuItemsConfig } from './menu-items-config'
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
          <MenuItem key={item.href} item={item} />
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
      <Link href={item.href} legacyBehavior passHref>
        <NavigationMenuLink
          className={cn(
            'bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <span className="flex flex-row items-center gap-2">
            {item.title}
            {item.countSql ? (
              <ServerComponentLazy>
                <CountBadge sql={item.countSql} />
              </ServerComponentLazy>
            ) : null}
          </span>
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>
        <div className="flex flex-row items-center gap-2">
          {item.title}
          {item.countSql ? (
            <ServerComponentLazy>
              <CountBadge sql={item.countSql} />
            </ServerComponentLazy>
          ) : null}
        </div>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[400px] grid-cols-1 content-center items-stretch gap-2 p-4 md:min-w-[700px] md:grid-cols-2">
          {item.items?.map((childItem) => (
            <ListItem
              key={childItem.href}
              title={
                <span className="flex flex-row items-center gap-2">
                  {childItem.title}
                  {childItem.countSql ? (
                    <ServerComponentLazy>
                      <CountBadge sql={childItem.countSql} />
                    </ServerComponentLazy>
                  ) : null}
                </span>
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
        <a
          className={cn(
            'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
            className
          )}
          href={href}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {description}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}
