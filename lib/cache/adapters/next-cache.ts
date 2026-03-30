import type { CacheOptions, QueryCacheAdapter } from '../types'

import { debug, warn } from '@/lib/logger'

type UnstableCacheFn = <T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keys?: string[],
  options?: { tags?: string[]; revalidate?: number }
) => T

let unstableCache: UnstableCacheFn | null = null
let initAttempted = false

async function tryLoadUnstableCache(): Promise<UnstableCacheFn | null> {
  if (unstableCache) return unstableCache
  if (initAttempted) return null

  initAttempted = true
  try {
    const nextCache = await import('next/cache')
    unstableCache = (nextCache.unstable_cache ?? null) as UnstableCacheFn | null
    if (unstableCache) {
      debug('[query-cache] Using Next.js unstable_cache adapter')
    }
  } catch {
    debug('[query-cache] next/cache unavailable, NextCacheAdapter disabled')
  }

  return unstableCache
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
      undefined,
      { tags: options.tags, revalidate: ttl }
    )
    return cached()
  }
}
