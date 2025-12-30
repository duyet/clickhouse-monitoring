import dynamic from 'next/dynamic'
import { memo } from 'react'
import type React from 'react'
import { usePathname } from 'next/navigation'

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
import { isMenuItemActive } from '@/lib/menu/breadcrumb'

const CountBadge = dynamic(() =>
  import('@/components/menu/count-badge').then((mod) => mod.CountBadge)
)

export interface MenuProps {
  items?: MenuItem[]
  className?: string
}

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

const MenuItemComponent = memo(function MenuItemComponent({ item }: { item: MenuItem }) {
  if (item.items) {
    return <HasChildItems item={item} />
  }

  return <SingleItem item={item} />
})

const SingleItem = memo(function SingleItem({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem role="none">
      <HostPrefixedLink
        href={item.href}
        className={cn(
          'group relative inline-flex h-10 w-max items-center justify-center px-3 text-[13px] font-medium transition-colors',
          'text-muted-foreground hover:text-foreground',
          'focus:text-foreground focus:outline-hidden',
          'disabled:pointer-events-none disabled:opacity-50',
          // Active state styling - stronger visual feedback
          'data-[active=true]:text-foreground data-[active=true]:font-semibold'
        )}
        aria-label={`Navigate to ${item.title}`}
        data-testid={
          item.href === '/clusters'
            ? 'nav-clusters'
            : item.href === '/database'
              ? 'nav-databases'
              : undefined
        }
      >
        <div className="flex flex-row items-center gap-1.5">
          {item.icon && (
            <item.icon
              className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100 group-data-[active=true]:opacity-100 group-data-[active=true]:text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
          <span>{item.title}</span>
          {item.countKey ? (
            <CountBadge countKey={item.countKey} variant={item.countVariant} />
          ) : null}
        </div>
        {/* Active indicator underline - more visible */}
        <span className="absolute bottom-0 left-1/2 h-[2px] w-[calc(100%-1.5rem)] -translate-x-1/2 scale-x-0 rounded-full bg-primary transition-transform duration-200 group-data-[active=true]:scale-x-100" />
      </HostPrefixedLink>
    </NavigationMenuItem>
  )
})

const HasChildItems = memo(function HasChildItems({ item }: { item: MenuItem }) {
  const pathname = usePathname()

  // Check if any child item is active
  const hasActiveChild = item.items?.some(
    (child) => child.href && isMenuItemActive(child.href, pathname)
  )

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
          {item.icon && (
            <item.icon
              className={cn(
                'size-3.5 opacity-70',
                hasActiveChild && 'opacity-100 text-primary'
              )}
              strokeWidth={1.5}
            />
          )}
          <span>{item.title}</span>
          {item.countKey ? (
            <CountBadge countKey={item.countKey} variant={item.countVariant} />
          ) : null}
        </div>
        {/* Active indicator underline for parent */}
        <span
          className={cn(
            'absolute bottom-0 left-1/2 h-[2px] w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-primary transition-transform duration-200',
            hasActiveChild ? 'scale-x-100' : 'scale-x-0'
          )}
        />
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
                      <childItem.icon className="size-3.5 opacity-70 group-data-[active=true]:opacity-100" strokeWidth={1.5} />
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
})

const ListItem = memo(function ListItem({
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
          className="group"
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
              'relative block space-y-0.5 rounded-md px-2.5 py-2 leading-none no-underline outline-hidden transition-colors select-none',
              'hover:bg-accent/60 hover:text-foreground',
              'focus:bg-accent/60 focus:text-foreground',
              // Active state for dropdown items
              'group-data-[active=true]:bg-accent/50 group-data-[active=true]:text-foreground',
              className
            )}
            {...props}
          >
            {/* Active indicator - left border */}
            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 scale-y-0 bg-primary transition-transform duration-200 group-data-[active=true]:scale-y-100 rounded-full" />
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
})
