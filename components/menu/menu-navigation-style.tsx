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
          'group inline-flex h-8 w-max items-center justify-center rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          'focus:text-foreground focus:bg-accent/50 focus:outline-hidden',
          'disabled:pointer-events-none disabled:opacity-50',
          // Active state styling with subtle indicator
          'data-[active=true]:text-foreground data-[active=true]:bg-accent/50'
        )}
        data-testid={
          item.href === '/clusters'
            ? 'nav-clusters'
            : item.href === '/database'
              ? 'nav-databases'
              : undefined
        }
      >
        <div className="flex flex-row items-center gap-1.5">
          {item.icon && <item.icon className="size-3.5 opacity-70" strokeWidth={1.5} />}
          <span>{item.title}</span>
          {item.countKey ? (
            <CountBadge countKey={item.countKey} variant={item.countVariant} />
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
        <div className="flex flex-row items-center gap-1.5">
          {item.icon && <item.icon className="size-3.5 opacity-70" strokeWidth={1.5} />}
          <span>{item.title}</span>
          {item.countKey ? (
            <CountBadge countKey={item.countKey} variant={item.countVariant} />
          ) : null}
        </div>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[380px] grid-cols-1 content-center items-stretch gap-1 p-1.5 md:min-w-[580px] md:grid-cols-2">
          {item.items
            ?.filter((childItem) => childItem.title && childItem.href)
            .map((childItem) => (
              <ListItem
                key={childItem.href}
                title={
                  <span className="flex flex-row items-center gap-1.5">
                    {childItem.icon && (
                      <childItem.icon className="size-3.5 opacity-70" strokeWidth={1.5} />
                    )}
                    <span>{childItem.title}</span>
                    {childItem.countKey ? (
                      <CountBadge
                        countKey={childItem.countKey}
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
              'block space-y-0.5 rounded-md px-2.5 py-2 leading-none no-underline outline-hidden transition-colors select-none',
              'hover:bg-accent/60 hover:text-foreground',
              'focus:bg-accent/60 focus:text-foreground',
              // Active state for dropdown items
              'data-[active=true]:bg-accent/50 data-[active=true]:text-foreground',
              className
            )}
            {...props}
          >
            <div className="overflow-hidden text-[13px] leading-tight font-medium text-ellipsis">
              {title}
            </div>
            <p className="text-muted-foreground line-clamp-1 text-xs leading-relaxed mt-0.5">
              {description}
            </p>
          </div>
        </HostPrefixedLink>
      </NavigationMenuLink>
    </li>
  )
}
