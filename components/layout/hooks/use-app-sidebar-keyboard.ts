/**
 * App-specific sidebar keyboard shortcut handling
 *
 * Handles Cmd+B / Ctrl+B to toggle sidebar
 */

'use client'

import { useEffect } from 'react'

// App-specific keyboard shortcut
const APP_SIDEBAR_SHORTCUT = 'b'

/**
 * Attaches keyboard shortcut listener for sidebar toggle
 * Extracted from ui/sidebar to keep shadcn component pristine
 *
 * @param toggleSidebar - Function to call when shortcut is pressed
 * @param shortcut - Keyboard key to use as shortcut (default: 'b')
 */
export function useAppSidebarKeyboard(
  toggleSidebar: () => void,
  shortcut: string = APP_SIDEBAR_SHORTCUT
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === shortcut.toLowerCase() &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, shortcut])
}
