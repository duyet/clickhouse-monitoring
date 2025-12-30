import dynamic from 'next/dynamic'
import type React from 'react'

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
import type { MenuItem } from './types'

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
          // Active state styling
          'data-[active=true]:bg-accent/50 data-[active=true]:text-foreground'
        )}
        data-testid={
          item.href === '/clusters'
            ? 'nav-clusters'
            : item.href === '/database'
              ? 'nav-databases'
              : undefined
        }
      >
        <div className="flex flex-row items-center gap-2">
          {item.icon && <item.icon className="size-4" strokeWidth={1} />}
          {item.title}
          {item.countSql ? (
            <CountBadge sql={item.countSql} variant={item.countVariant} />
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
            <CountBadge sql={item.countSql} variant={item.countVariant} />
          ) : null}
        </div>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[400px] grid-cols-1 content-center items-stretch gap-2 p-2 md:min-w-[700px] md:grid-cols-2">
          {item.items
            ?.filter((childItem) => childItem.title && childItem.href)
            .map((childItem) => (
              <ListItem
                key={childItem.href}
                title={
                  <span className="flex flex-row items-center gap-2">
                    {childItem.icon && (
                      <childItem.icon className="size-4" strokeWidth={1} />
                    )}
                    {childItem.title}
                    {childItem.countSql ? (
                      <CountBadge
                        sql={childItem.countSql}
                        variant={childItem.countVariant}
                      />
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
              // Active state for dropdown items
              'data-[active=true]:bg-accent/50 data-[active=true]:text-foreground',
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
