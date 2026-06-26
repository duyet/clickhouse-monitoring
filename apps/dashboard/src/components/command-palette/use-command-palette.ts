import { useCallback, useEffect, useState } from 'react'

/**
 * Hook for managing command palette open state and the Cmd/Ctrl+K shortcut.
 *
 * Note: the existing `CommandPalette` in `components/controls/command-palette.tsx`
 * also registers a Cmd+K handler internally. Mount ONLY ONE of these at a time to
 * avoid duplicate key events. This hook is the building block for a standalone
 * palette instance not tied to the header actions.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggle])

  return { open, setOpen, close }
}
