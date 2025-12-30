'use client'

import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import type { MenuItem } from '@/components/menu/types'

interface NavMainProps {
  items: MenuItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-4">
      {items.map((item) => (
        <NavItem key={item.title} item={item} pathname={pathname} />
      ))}
    </nav>
  )
}

interface NavItemProps {
  item: MenuItem
  pathname: string
}

function NavItem({ item, pathname }: NavItemProps) {
  const hasChildren = item.items && item.items.length > 0
  const isActive = isMenuItemActive(item.href, pathname)

  // Check if any child is active to auto-expand parent
  const hasActiveChild = hasChildren && item.items
    ? item.items.some(
        (child) => child.href && isMenuItemActive(child.href, pathname)
      )
    : false

  if (!hasChildren) {
    // Single item without children
    return (
      <HostPrefixedLink
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          isActive && 'text-foreground bg-accent font-semibold'
        )}
        data-testid={
          item.href === '/clusters'
            ? 'nav-clusters'
            : item.href === '/database'
              ? 'nav-databases'
              : undefined
        }
      >
        {item.icon && (
          <item.icon
            className={cn(
              'h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100',
              isActive && 'opacity-100 text-primary'
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <span className="flex-1 overflow-hidden text-ellipsis">
          {item.title}
        </span>
      </HostPrefixedLink>
    )
  }

  // Item with children - use collapsible
  return (
    <Collapsible defaultOpen={hasActiveChild} className="group">
      <CollapsibleTrigger
        className={cn(
          'relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          hasActiveChild && 'text-foreground bg-accent font-semibold'
        )}
      >
        {item.icon && (
          <item.icon
            className={cn(
              'h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100',
              hasActiveChild && 'opacity-100 text-primary'
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <span className="flex-1 overflow-hidden text-ellipsis">
          {item.title}
        </span>
        <ChevronRight
          className={cn(
            'h-4 w-4 opacity-60 transition-transform duration-200',
            hasActiveChild && 'rotate-90'
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="ml-3 border-l border-border/50 pl-3 py-2">
          {item.items?.map((subItem) => (
            <NavSubItem key={subItem.href} item={subItem} pathname={pathname} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface NavSubItemProps {
  item: MenuItem
  pathname: string
}

function NavSubItem({ item, pathname }: NavSubItemProps) {
  const isActive = isMenuItemActive(item.href, pathname)

  return (
    <HostPrefixedLink
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        isActive && 'text-foreground bg-accent font-semibold'
      )}
      data-testid={
        item.href === '/clusters'
          ? 'nav-clusters'
          : item.href === '/database'
            ? 'nav-databases'
            : undefined
      }
    >
      {item.icon && (
        <item.icon
          className={cn(
            'h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100',
            isActive && 'opacity-100 text-primary'
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      <span className="flex-1 overflow-hidden text-ellipsis">{item.title}</span>
    </HostPrefixedLink>
  )
}
