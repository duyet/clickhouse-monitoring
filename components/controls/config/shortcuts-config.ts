/**
 * Keyboard shortcuts configuration
 *
 * Defines all available keyboard shortcuts for the dashboard.
 */

export interface ShortcutDefinition {
  key: string
  description: string
}

/**
 * Keyboard shortcut definitions for help modal
 */
export const SHORTCUTS: readonly ShortcutDefinition[] = [
  { key: '⌘K', description: 'Open command palette' },
  { key: '⌘G', description: 'Go to overview' },
  { key: '⌘Q', description: 'Go to running queries' },
  { key: '⌘D', description: 'Go to database tables' },
  { key: '⌘R', description: 'Refresh data' },
  { key: '⌘/', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close modals' },
] as const
