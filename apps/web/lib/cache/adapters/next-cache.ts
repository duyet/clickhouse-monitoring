import type { CacheOptions, QueryCacheAdapter } from '../types'

import { debug } from '@/lib/logger'

type UnstableCacheFn = <T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keys?: string[],
  options?: { tags?: string[]; revalidate?: number }
) => T

let unstableCache: UnstableCacheFn | null = null
let initPromise: Promise<UnstableCacheFn | null> | null = null

async function tryLoadUnstableCache(): Promise<UnstableCacheFn | null> {
  if (unstableCache) return unstableCache
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const nextCache = await import('next/cache')
      unstableCache = (nextCache.unstable_cache ??
        null) as UnstableCacheFn | null
      if (unstableCache) {
        debug('[query-cache] Using Next.js unstable_cache adapter')
      }
    } catch {
      debug('[query-cache] next/cache unavailable, NextCacheAdapter disabled')
    }
    return unstableCache
  })()

  return initPromise
}

export class NextCacheAdapter implements QueryCacheAdapter {
  async wrap<T>(fn: () => Promise<T>, options: CacheOptions): Promise<T> {
    const cacheFn = await tryLoadUnstableCache()

    if (!cacheFn) {
      return fn()
    }

    const ttl = options.ttlSeconds ?? 3600
    const cached = cacheFn(
      fn as (...args: unknown[]) => Promise<T>,
      options.key,
      { tags: options.tags, revalidate: ttl }
    )
    return cached()
  }
}
