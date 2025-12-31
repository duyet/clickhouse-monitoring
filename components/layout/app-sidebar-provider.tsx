/**
 * App-specific Sidebar Provider
 *
 * Wraps the shadcn/ui SidebarProvider with app-specific logic:
 * - localStorage persistence with app-specific key
 * - Responsive behavior customization
 * - Keyboard shortcut configuration
 *
 * This wrapper keeps the shadcn/ui sidebar components pristine while
 * providing app-specific functionality.
 */

'use client'

import * as React from 'react'
import { SidebarContext } from '@/components/ui/sidebar/context'
import type { SidebarProviderProps, SidebarContextValue } from '@/components/ui/sidebar/types'
import { cn } from '@/lib/utils'
import { SIDEBAR_WIDTH } from '@/components/ui/sidebar/config'
import { useAppSidebarState } from './hooks/use-app-sidebar-state'
import { useAppSidebarKeyboard } from './hooks/use-app-sidebar-keyboard'

interface AppSidebarProviderProps extends Omit<SidebarProviderProps, 'defaultOpen' | 'open' | 'onOpenChange'> {
  /**
   * Initial open state on first load (default: true)
   */
  defaultOpen?: boolean
  /**
   * Controlled open state (optional)
   */
  open?: boolean
  /**
   * Callback when open state changes (optional)
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Keyboard shortcut key (default: 'b')
   */
  keyboardShortcut?: string
}

/**
 * App-specific sidebar provider that extends shadcn/ui SidebarProvider
 * with custom app logic for state management and keyboard shortcuts.
 *
 * This provider creates its own context instead of wrapping the shadcn provider
 * to ensure mobile detection and localStorage persistence work correctly.
 */
export const AppSidebarProvider = React.forwardRef<
  HTMLDivElement,
  AppSidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: onOpenChangeProp,
      keyboardShortcut,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } =
      useAppSidebarState({
        defaultOpen,
        open: openProp,
        onOpenChange: onOpenChangeProp,
      })

    // Attach keyboard shortcut
    useAppSidebarKeyboard(toggleSidebar, keyboardShortcut)

    // Create context value with app-specific state
    const contextValue: SidebarContextValue = {
      state: open ? 'expanded' : 'collapsed',
      open,
      setOpen,
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
AppSidebarProvider.displayName = 'AppSidebarProvider'
