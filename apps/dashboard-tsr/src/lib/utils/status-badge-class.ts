/**
 * Shared status-tone → Tailwind className mapping.
 *
 * Use this instead of scattering raw palette literals across chart/table
 * components. The token set matches the rest of the app (see colored-badge-format,
 * mirror-status-badge) so colors are consistent across light and dark mode.
 */

/** Semantic status tones used across charts and tables. */
export type StatusTone =
  | 'ok' // green  — synced, running normally
  | 'warning' // yellow — slight degradation
  | 'caution' // orange — moderate degradation / waiting
  | 'error' // red    — severe problem or stuck
  | 'info' // blue   — neutral informational / in-progress
  | 'muted' // muted  — idle / unknown

/** Tailwind class string per tone (light + dark, matching the app-wide convention). */
export const STATUS_BADGE_CLASS: Record<StatusTone, string> = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  caution:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  muted: 'bg-muted text-muted-foreground',
}

/** Lighter row-background tint per tone (for row-level highlighting). */
export const STATUS_ROW_CLASS: Record<StatusTone, string> = {
  ok: '',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20',
  caution: 'bg-amber-50 dark:bg-amber-950/20',
  error: 'bg-red-50 dark:bg-red-950/20',
  info: '',
  muted: '',
}
