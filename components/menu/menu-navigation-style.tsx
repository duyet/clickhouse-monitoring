import dynamic from 'next/dynamic'
import React from 'react'

import { LoadingIcon } from '@/components/loading-icon'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { menuItemsConfig } from '@/menu'
import { HostPrefixedLink } from './link-with-context'
import { type MenuItem } from './types'

const CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

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
      <HostPrefixedLink
        href={item.href}
        className={cn(
          'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground focus:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          'data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
        )}
      >
        <div className="flex flex-row items-center gap-2">
          {item.icon && <item.icon className="size-4" strokeWidth={1} />}
          {item.title}
          {item.countSql ? (
            <ServerComponentLazy fallback={<LoadingIcon />} onError={''}>
              <CountBadge sql={item.countSql} variant={item.countVariant} />
            </ServerComponentLazy>
          ) : null}
        </div>
      </HostPrefixedLink>
    </NavigationMenuItem>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>
        <div className="flex flex-row items-center gap-2">
          {item.icon && <item.icon className="size-4" strokeWidth={1} />}
          {item.title}
          {item.countSql ? (
            <ServerComponentLazy fallback={<LoadingIcon />} onError={''}>
              <CountBadge sql={item.countSql} variant={item.countVariant} />
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
                  {childItem.icon && (
                    <childItem.icon className="size-4" strokeWidth={1} />
                  )}
                  {childItem.title}
                  {childItem.countSql ? (
                    <ServerComponentLazy
                      fallback={<LoadingIcon />}
                      onError={''}
                    >
                      <CountBadge
                        sql={childItem.countSql}
                        variant={item.countVariant}
                      />
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
        <HostPrefixedLink href={href}>
          <div
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          </div>
        </HostPrefixedLink>
      </NavigationMenuLink>
    </li>
  )
}
