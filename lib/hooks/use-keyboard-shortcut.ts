'use client'

import { useEffect } from 'react'

export interface KeyboardShortcutOptions {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
  preventDefault?: boolean
}

/**
 * Hook to register keyboard shortcuts
 * @param options - Shortcut configuration
 * @param dependencies - Dependencies for the callback
 */
export function useKeyboardShortcut(
  options: KeyboardShortcutOptions,
  dependencies: unknown[] = []
) {
  const {
    key,
    metaKey = false,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    onKeyDown,
    preventDefault = true,
  } = options

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches the shortcut
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      const metaMatches = !metaKey || event.metaKey
      const ctrlMatches = !ctrlKey || event.ctrlKey
      const shiftMatches = !shiftKey || event.shiftKey
      const altMatches = !altKey || event.altKey

      // For meta/ctrl: allow either (OR logic) for cross-platform shortcuts
      // If both are specified, trigger on Cmd (Mac) OR Ctrl (Windows/Linux)
      const modifierMatches =
        shiftMatches &&
        altMatches &&
        (metaKey || ctrlKey ? metaMatches || ctrlMatches : true)

      if (keyMatches && modifierMatches) {
        if (preventDefault) {
          event.preventDefault()
        }
        onKeyDown?.(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    altKey,
    onKeyDown,
    preventDefault,
    ...dependencies,
  ])
}
