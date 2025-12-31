/**
 * Custom hook for sidebar keyboard shortcut handling
 *
 * Handles Cmd+B / Ctrl+B to toggle sidebar
 */

'use client'

import { useEffect } from 'react'
import { SIDEBAR_KEYBOARD_SHORTCUT } from '../config'

/**
 * Attaches keyboard shortcut listener for sidebar toggle
 * @param toggleSidebar - Function to call when shortcut is pressed
 */
export function useSidebarKeyboard(toggleSidebar: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])
}
