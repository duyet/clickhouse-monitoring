/**
 * Sidebar Provider Component
 *
 * Standard shadcn/ui sidebar provider with basic state management.
 * For app-specific features (localStorage, custom shortcuts), use AppSidebarProvider
 * from components/layout/app-sidebar-provider.tsx
 */

'use client'

import * as React from 'react'
import { SidebarContext } from './context'
import type { SidebarProviderProps, SidebarContextValue } from './types'
import { cn } from '@/lib/utils'
import { SIDEBAR_WIDTH } from './config'

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  SidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: onOpenChangeProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Standard shadcn/ui state (no localStorage, no responsive auto-collapse)
    const [open, setOpen] = React.useState(defaultOpen)
    const [openMobile, setOpenMobile] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)

    // Use controlled or uncontrolled state
    const openState = openProp !== undefined ? openProp : open

    const handleSetOpen = React.useCallback(
      (value: boolean) => {
        setOpen(value)
        onOpenChangeProp?.(value)
      },
      [onOpenChangeProp]
    )

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile(!openMobile)
      } else {
        handleSetOpen(!openState)
      }
    }, [isMobile, openMobile, openState, handleSetOpen])

    const contextValue: SidebarContextValue = {
      state: openState ? 'expanded' : 'collapsed',
      open: openState,
      setOpen: handleSetOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'group/sidebar-wrapper flex h-full w-full has-[[data-variant=inset]]:bg-sidebar',
            className
          )}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = 'SidebarProvider'
