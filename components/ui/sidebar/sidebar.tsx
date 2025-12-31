/**
 * Main Sidebar Component
 *
 * Responsive sidebar with mobile sheet and desktop variants.
 */

'use client'

import * as React from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar } from './context'
import type { SidebarProps } from './types'
import { cn } from '@/lib/utils'
import { SIDEBAR_WIDTH } from './config'

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      ...props
    },
    ref
  ) => {
    const { isMobile, openMobile, setOpenMobile, state } = useSidebar()

    // Non-collapsible sidebar
    if (collapsible === 'none') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground',
            className
          )}
          {...props}
        />
      )
    }

    // Mobile: use Sheet component
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side={side}
            className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          >
            <div
              ref={ref}
              className={cn(
                'flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground',
                className
              )}
              {...props}
            />
          </SheetContent>
        </Sheet>
      )
    }

    // Desktop: collapsible sidebar
    return (
      <div
        ref={ref}
        data-variant={variant}
        data-state={state}
        className={cn(
          'group/sidebar relative flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out data-[state=collapsed]:w-[calc(var(--sidebar-width)_-_3rem)]',
          variant === 'inset' && 'border-r',
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = 'Sidebar'
