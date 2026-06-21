/**
 * Client-side localStorage cache for generated AI insights.
 *
 * Acts as a "last-known-good" fallback when the server-side findings store is
 * unavailable or returns nothing (e.g. a read-only ClickHouse monitoring
 * connection). Written on every successful generate(); read only when the
 * server returns an empty set so the panel never shows "no insights" after a
 * successful generation.
 *
 * Cache entries are keyed per hostId and carry a timestamp so stale entries
 * can be aged out client-side.
 */

import type { InsightCard } from './types'

const STORAGE_PREFIX = 'ai-insights-cache'
/** Insights older than this are considered stale and ignored. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  readonly insights: InsightCard[]
  readonly savedAt: number
}

function storageKey(hostId: number): string {
  return `${STORAGE_PREFIX}:${hostId}`
}

/** Persist a generated batch for a host. Best-effort: silently ignores errors. */
export function saveCachedInsights(
  hostId: number,
  insights: readonly InsightCard[]
): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry = { insights: [...insights], savedAt: Date.now() }
    localStorage.setItem(storageKey(hostId), JSON.stringify(entry))
  } catch {
    // localStorage may be full or disabled — not worth surfacing.
  }
}

/**
 * Load the cached insights for a host. Returns an empty array when:
 * - localStorage is unavailable
 * - no entry exists
 * - the entry is older than MAX_AGE_MS
 */
export function loadCachedInsights(hostId: number): InsightCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(hostId))
    if (!raw) return []
    const entry = JSON.parse(raw) as CacheEntry
    if (
      !entry ||
      !Array.isArray(entry.insights) ||
      typeof entry.savedAt !== 'number'
    )
      return []
    if (Date.now() - entry.savedAt > MAX_AGE_MS) return []
    return entry.insights
  } catch {
    return []
  }
}

/** Clear the cache for a host (e.g. after dismiss-all). */
export function clearCachedInsights(hostId: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(storageKey(hostId))
  } catch {
    // Silently ignore.
  }
}
