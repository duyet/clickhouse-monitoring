/**
 * Custom hook for sidebar state management
 *
 * Handles:
 * - Open/closed state
 * - LocalStorage persistence
 * - Responsive behavior (auto-collapse on tablet)
 */

'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useIsTablet } from '@/hooks/use-tablet'
import { SIDEBAR_COOKIE_NAME } from '../config'

interface UseSidebarStateOptions {
  defaultOpen: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface UseSidebarStateReturn {
  open: boolean
  setOpen: (value: boolean) => void
  openMobile: boolean
  setOpenMobile: (value: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

/**
 * Manages sidebar state with localStorage persistence and responsive behavior
 */
export function useSidebarState({
  defaultOpen,
  open: openProp,
  onOpenChange,
}: UseSidebarStateOptions): UseSidebarStateReturn {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [openMobile, setOpenMobile] = React.useState(false)

  // Initialize state from localStorage or prop/default
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(SIDEBAR_COOKIE_NAME)
    if (stored !== null) {
      setOpen(JSON.parse(stored))
    }
  }, [])

  const handleSetOpen = React.useCallback(
    (value: boolean) => {
      setOpen(value)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COOKIE_NAME, JSON.stringify(value))
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
