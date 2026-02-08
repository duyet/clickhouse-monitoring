'use client'

import type { Key } from 'swr'
import { useSWRConfig } from 'swr'

import { useCallback } from 'react'
import { ErrorLogger } from '@/lib/logger'

/**
 * Cache utilities for SWR
 * Provides functions for selective cache invalidation, warming, and management
 */

/**
 * Pattern match types for cache operations
 */
export type CachePattern = string | RegExp | ((key: Key) => boolean)

/**
 * Check if a cache key matches a pattern
 */
function matchesPattern(key: Key, pattern: CachePattern): boolean {
  if (typeof pattern === 'function') {
    return pattern(key)
  }

  const keyStr = String(key)
  if (pattern instanceof RegExp) {
    return pattern.test(keyStr)
  }

  return keyStr.includes(pattern)
}

/**
 * Hook for SWR cache management operations
 * Provides utilities for selective cache operations
 *
 * @example
 * ```tsx
 * const cache = useCacheUtils()
 *
 * // Invalidate all chart data caches
 * cache.invalidate(/^\/api\/v1\/charts\//)
 *
 * // Warm specific cache
 * cache.warm('/api/v1/charts/query-performance', fetcher)
 *
 * // Clear all caches
 * cache.clearAll()
 * ```
 */
export function useCacheUtils() {
  const { mutate, cache } = useSWRConfig()

  /**
   * Selectively invalidate caches matching a pattern
   * Revalidates matching keys without updating their data
   */
  const invalidate = useCallback(
    (pattern: CachePattern) => {
      let count = 0

      mutate(
        (key) => {
          if (matchesPattern(key, pattern)) {
            count++
            return true
          }
          return false
        },
        undefined,
        { revalidate: true }
      )

      if (count > 0) {
        ErrorLogger.logDebug(`Invalidated ${count} cache entries`, {
          component: 'CacheUtils',
          action: 'invalidate',
          pattern: String(pattern),
          count,
        })
      }

      return count
    },
    [mutate]
  )

  /**
   * Delete caches matching a pattern
   * Removes data from cache without revalidation
   */
  const deleteKeys = useCallback(
    (pattern: CachePattern) => {
      let count = 0

      // SWR cache is a Map-like structure
      if (cache && typeof cache.delete === 'function') {
        // Note: SWR's cache API doesn't expose iteration directly
        // We use mutate with revalidate: false to clear data
        mutate(
          (key) => {
            if (matchesPattern(key, pattern)) {
              count++
              return true
            }
            return false
          },
          undefined,
          { revalidate: false }
        )
      }

      if (count > 0) {
        ErrorLogger.logDebug(`Deleted ${count} cache entries`, {
          component: 'CacheUtils',
          action: 'delete',
          pattern: String(pattern),
          count,
        })
      }

      return count
    },
    [mutate, cache]
  )

  /**
   * Clear all caches
   */
  const clearAll = useCallback(() => {
    let count = 0

    mutate(() => true, undefined, { revalidate: false })

    if (cache && typeof cache.keys === 'function') {
      // Count would be accurate here if we could iterate
      count = -1 // Unknown count
    }

    ErrorLogger.logDebug(`Cleared all caches`, {
      component: 'CacheUtils',
      action: 'clearAll',
    })

    return count
  }, [mutate, cache])

  /**
   * Warm a cache entry by fetching data immediately
   * Useful for preloading data that will be needed soon
   */
  const warm = useCallback(
    async (key: Key, fetcher: () => Promise<unknown>) => {
      try {
        await mutate(key, fetcher, { revalidate: false })
        ErrorLogger.logDebug(`Warmed cache entry`, {
          component: 'CacheUtils',
          action: 'warm',
          key: String(key),
        })
      } catch (error) {
        ErrorLogger.logWarning(`Failed to warm cache entry`, {
          component: 'CacheUtils',
          action: 'warm',
          key: String(key),
          err: error as Error,
        })
      }
    },
    [mutate]
  )

  /**
   * Update cache data optimistically
   * Updates local cache immediately while revalidating in background
   */
  const update = useCallback(
    async (key: Key, data: unknown, shouldRevalidate = true) => {
      try {
        await mutate(key, data, { revalidate: shouldRevalidate })
        ErrorLogger.logDebug(`Updated cache entry`, {
          component: 'CacheUtils',
          action: 'update',
          key: String(key),
        })
      } catch (error) {
        ErrorLogger.logWarning(`Failed to update cache entry`, {
          component: 'CacheUtils',
          action: 'update',
          key: String(key),
          err: error as Error,
        })
      }
    },
    [mutate]
  )

  /**
   * Get current cache size estimate
   */
  const getSize = useCallback((): number => {
    if (cache && typeof cache.keys === 'function') {
      let count = 0
      try {
        for (const _ of cache.keys()) {
          count++
        }
      } catch {
        // Some cache implementations don't support iteration
        return -1
      }
      return count
    }
    return -1
  }, [cache])

  /**
   * Get all cache keys matching a pattern
   * Useful for debugging and monitoring
   */
  const getKeys = useCallback(
    (pattern?: CachePattern): string[] => {
      const keys: string[] = []

      if (cache && typeof cache.keys === 'function') {
        try {
          for (const key of cache.keys()) {
            if (!pattern || matchesPattern(key, pattern)) {
              keys.push(String(key))
            }
          }
        } catch {
          // Cache doesn't support iteration
        }
      }

      return keys
    },
    [cache]
  )

  return {
    invalidate,
    deleteKeys,
    clearAll,
    warm,
    update,
    getSize,
    getKeys,
  }
}

/**
 * Predefined cache patterns for common use cases
 */
export const CachePatterns = {
  /** Match all chart API calls */
  charts: /^\/api\/v1\/charts\//,
  /** Match all table API calls */
  tables: /^\/api\/v1\/tables\//,
  /** Match all data API calls */
  data: /^\/api\/v1\/data\//,
  /** Match all explorer API calls */
  explorer: /^\/api\/v1\/explorer\//,
  /** Match all hosts API calls */
  hosts: /^\/api\/v1\/hosts\//,
  /** Match all SWR cache entries */
  all: () => true,
} as const

/**
 * Optimistic update utilities
 * Helps manage optimistic UI updates with rollback on error
 */
export function createOptimisticUpdate<T, Args extends unknown[]>(
  updateFn: (...args: Args) => Promise<T>,
  optimisticData: T
) {
  return {
    /**
     * Execute update with optimistic data
     * Automatically rolls back on error
     */
    async execute(
      mutate: (
        key: Key,
        data: T | Promise<T> | ((current: T) => T | Promise<T>),
        options?: { revalidate?: boolean; throwOnError?: boolean }
      ) => Promise<unknown>,
      key: Key,
      ...args: Args
    ): Promise<T> {
      try {
        // Set optimistic data immediately
        mutate(key, optimisticData, { revalidate: false })

        // Execute actual update
        const result = await updateFn(...args)

        // Update with real result
        mutate(key, result, { revalidate: false })

        return result
      } catch (error) {
        // Rollback on error - clear optimistic data
        mutate(key, () => undefined as T, { revalidate: true })
        throw error
      }
    },
  }
}
