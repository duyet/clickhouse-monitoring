/**
 * App-specific sidebar state management
 *
 * Handles:
 * - Open/closed state
 * - localStorage persistence with app-specific key
 * - Responsive behavior (auto-collapse on tablet)
 */

'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useIsTablet } from '@/hooks/use-tablet'

// App-specific configuration (separate from shadcn/ui defaults)
const APP_SIDEBAR_STORAGE_KEY = 'clickhouse-monitor:sidebar:state'

interface UseAppSidebarStateOptions {
  defaultOpen: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface UseAppSidebarStateReturn {
  open: boolean
  setOpen: (value: boolean) => void
  openMobile: boolean
  setOpenMobile: (value: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

/**
 * Manages sidebar state with localStorage persistence and responsive behavior
 * Extracted from ui/sidebar to keep shadcn component pristine
 */
export function useAppSidebarState({
  defaultOpen,
  open: openProp,
  onOpenChange,
}: UseAppSidebarStateOptions): UseAppSidebarStateReturn {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [openMobile, setOpenMobile] = React.useState(false)

  // Initialize state from localStorage or prop/default
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(APP_SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setOpen(JSON.parse(stored))
    }
  }, [])

  const handleSetOpen = React.useCallback(
    (value: boolean) => {
      setOpen(value)
      if (typeof window !== 'undefined') {
        localStorage.setItem(APP_SIDEBAR_STORAGE_KEY, JSON.stringify(value))
      }
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  // Auto-collapse on tablet screens
  React.useEffect(() => {
    if (isTablet && open) {
      handleSetOpen(false)
    }
  }, [isTablet, open, handleSetOpen])

  // Use controlled or uncontrolled state
  const openState = openProp !== undefined ? openProp : open

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(!openMobile)
    } else {
      handleSetOpen(!openState)
    }
  }, [isMobile, openMobile, openState, handleSetOpen])

  return {
    open: openState,
    setOpen: handleSetOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  }
}
