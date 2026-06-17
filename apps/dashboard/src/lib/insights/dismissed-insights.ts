/**
 * Dismissed AI insights storage.
 *
 * Per-user dismissal of insight cards, persisted in localStorage (separate from
 * the `dismissed-notifications` set). Each insight carries a stable `key` from
 * the API (`host:category:metric:title`), so dismissing an insight keeps it
 * hidden even after the cron re-generates the same signal — until the user
 * explicitly resets, or the underlying problem changes enough to mint a new key.
 *
 * Mirrors lib/notifications/dismissed-notifications.ts.
 */

const STORAGE_KEY = 'dismissed-ai-insights'

export interface DismissibleInsight {
  readonly key: string
}

export function getDismissedInsights(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Set()
    return new Set(JSON.parse(stored) as string[])
  } catch {
    return new Set()
  }
}

function persist(keys: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    // Silently fail if localStorage is full or disabled.
  }
}

export function isInsightDismissed(key: string): boolean {
  return getDismissedInsights().has(key)
}

export function dismissInsight(insight: DismissibleInsight): void {
  if (typeof window === 'undefined') return
  const dismissed = getDismissedInsights()
  dismissed.add(insight.key)
  persist(dismissed)
}

export function dismissAllInsights(
  insights: readonly DismissibleInsight[]
): void {
  if (typeof window === 'undefined') return
  const dismissed = getDismissedInsights()
  for (const insight of insights) dismissed.add(insight.key)
  persist(dismissed)
}

export function clearDismissedInsights(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail.
  }
}

export function filterActiveInsights<T extends DismissibleInsight>(
  insights: readonly T[]
): T[] {
  const dismissed = getDismissedInsights()
  return insights.filter((i) => !dismissed.has(i.key))
}
