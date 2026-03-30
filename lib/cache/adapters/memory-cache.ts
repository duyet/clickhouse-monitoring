import type { CacheOptions, QueryCacheAdapter } from '../types'

import { debug } from '@/lib/logger'

export class MemoryCacheAdapter implements QueryCacheAdapter {
  private cache = new Map<string, { value: unknown; expires: number }>()

  private makeKey(options: CacheOptions): string {
    const keyParts = options.key?.join(':') ?? ''
    const tags = options.tags?.join(',') ?? ''
    return `mem:${keyParts}:${tags}`
  }

  async wrap<T>(fn: () => Promise<T>, options: CacheOptions): Promise<T> {
    const ttl = options.ttlSeconds ?? 3600
    const key = this.makeKey(options)

    const entry = this.cache.get(key)
    if (entry && Date.now() < entry.expires) {
      debug('[query-cache] Memory cache hit', { key, ttl })
      return entry.value as T
    }

    const value = await fn()
    this.cache.set(key, { value, expires: Date.now() + ttl * 1000 })
    debug('[query-cache] Memory cache set', { key, ttl })
    return value
  }
}
