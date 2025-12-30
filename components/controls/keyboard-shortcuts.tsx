'use client'

import { usePathname, useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import { useHostId } from '@/lib/swr'

/**
 * Global keyboard shortcuts for the ClickHouse Monitor dashboard
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Open command palette (handled by CommandPalette component)
 * - Cmd/Ctrl + G: Go to overview
 * - Cmd/Ctrl + Q: Go to running queries
 * - Cmd/Ctrl + D: Go to database tables
 * - Cmd/Ctrl + H: Change host (cycle through available hosts)
 * - Cmd/Ctrl + R: Refresh current page data
 * - Cmd/Ctrl + /: Show keyboard shortcuts help
 * - Escape: Close modals/dialogs
 *
 * @example
 * ```tsx
 * import { KeyboardShortcuts } from '@/components/controls/keyboard-shortcuts'
 *
 * export function Layout({ children }) {
 *   return (
 *     <>
 *       <KeyboardShortcuts />
 *       {children}
 *     </>
 *   )
 * }
 * ```
 */
/** Keyboard shortcut definitions for help modal */
const SHORTCUTS = [
  { key: '⌘K', description: 'Open command palette' },
  { key: '⌘G', description: 'Go to overview' },
  { key: '⌘Q', description: 'Go to running queries' },
  { key: '⌘D', description: 'Go to database tables' },
  { key: '⌘R', description: 'Refresh data' },
  { key: '⌘/', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close modals' },
] as const

export const KeyboardShortcuts = memo(function KeyboardShortcuts() {
  const router = useRouter()
  const _pathname = usePathname()
  const hostId = useHostId()
  const [showHelp, setShowHelp] = useState(false)

  // Navigate to overview
  const goToOverview = useCallback(() => {
    router.push(`/overview?host=${hostId}`)
  }, [router, hostId])

  useKeyboardShortcut({
    key: 'g',
    metaKey: true,
    ctrlKey: true,
    onKeyDown: goToOverview,
  })

  // Navigate to running queries
  const goToQueries = useCallback(() => {
    router.push(`/running-queries?host=${hostId}`)
  }, [router, hostId])

  useKeyboardShortcut({
    key: 'q',
    metaKey: true,
    ctrlKey: true,
    onKeyDown: goToQueries,
  })

  // Navigate to database tables
  const goToTables = useCallback(() => {
    router.push(`/tables?host=${hostId}`)
  }, [router, hostId])

  useKeyboardShortcut({
    key: 'd',
    metaKey: true,
    ctrlKey: true,
    onKeyDown: goToTables,
  })

  // Refresh current page (trigger SWR revalidation)
  const triggerRevalidate = useCallback(() => {
    // Trigger SWR revalidation by dispatching a custom event
    window.dispatchEvent(new CustomEvent('swr:revalidate'))
  }, [])

  useKeyboardShortcut({
    key: 'r',
    metaKey: true,
    ctrlKey: true,
    onKeyDown: triggerRevalidate,
  })

  // Show keyboard shortcuts help
  const showShortcuts = useCallback(() => {
    setShowHelp(true)
  }, [])

  useKeyboardShortcut({
    key: '/',
    metaKey: true,
    ctrlKey: true,
    onKeyDown: showShortcuts,
  })

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent
        className="max-w-sm"
        aria-describedby="shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <p id="shortcuts-description" className="sr-only">
          Available keyboard shortcuts for navigating the dashboard
        </p>
        <div
          className="grid gap-2 py-2"
          role="list"
          aria-label="Shortcuts list"
        >
          {SHORTCUTS.map(({ key, description }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
              role="listitem"
            >
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
              <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          On Windows/Linux, use Ctrl instead of ⌘
        </p>
      </DialogContent>
    </Dialog>
  )
})

/**
 * Hook to use SWR revalidation from keyboard shortcuts
 * Components can listen for the 'swr:revalidate' event to refresh their data
 *
 * @example
 * ```tsx
 * import { useSWRRevalidate } from '@/components/controls/keyboard-shortcuts'
 *
 * export function MyComponent() {
 *   useSWRRevalidate(mutate)
 *   // ...
 * }
 * ```
 */
export function useSWRRevalidate(mutate: () => Promise<unknown> | undefined) {
  useEffect(() => {
    const handleRevalidate = () => {
      void mutate()
    }

    window.addEventListener('swr:revalidate', handleRevalidate)
    return () => {
      window.removeEventListener('swr:revalidate', handleRevalidate)
    }
  }, [mutate])
}
