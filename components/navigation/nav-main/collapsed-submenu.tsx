'use client'

import type { MenuItem as MenuItemType } from '@/components/menu/types'

import { memo, useState } from 'react'
import { ClientOnly } from '@/components/client-only'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import { cn } from '@/lib/utils'

interface CollapsedSubmenuProps {
  item: MenuItemType
  pathname: string
  trigger: React.ReactNode
}

/**
 * CollapsedSubmenu - Renders submenu in a Popover for collapsed sidebar mode
 *
 * Features:
 * - Hover to open popover
 * - Click to toggle popover state
 * - Closes on click outside or Escape key
 * - Shows active state for child items
 */
export const CollapsedSubmenu = memo(function CollapsedSubmenu({
  item,
  pathname,
  trigger,
}: CollapsedSubmenuProps) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.items && item.items.length > 0

  if (!hasChildren) {
    return <>{trigger}</>
  }

  // Wrap in ClientOnly to prevent hydration mismatch from Radix Popover IDs
  return (
    <ClientOnly fallback={<div className="cursor-pointer">{trigger}</div>}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}
            className="cursor-pointer"
          >
            {trigger}
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="right"
          sideOffset={4}
          className="w-56 p-1"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex flex-col gap-0.5">
            {item.items?.map((subItem) => {
              const isActive = isMenuItemActive(subItem.href, pathname)

              return (
                <HostPrefixedLink
                  key={subItem.href}
                  href={subItem.href}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={cn(
                      'text-muted-hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors',
                      'focus-visible:bg-accent focus-visible:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {subItem.title}
                  </div>
                </HostPrefixedLink>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </ClientOnly>
  )
})
