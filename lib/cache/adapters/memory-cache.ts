import type { CacheOptions, QueryCacheAdapter } from '../types'

import { debug } from '@/lib/logger'

const DEFAULT_MAX_SIZE = 1000
const CLEANUP_INTERVAL_MS = 60_000 // 1 minute

export class MemoryCacheAdapter implements QueryCacheAdapter {
  private cache = new Map<string, { value: unknown; expires: number }>()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(private maxSize = DEFAULT_MAX_SIZE) {
    // Periodically evict expired entries to prevent unbounded growth
    this.cleanupTimer = setInterval(
      () => this.cleanupExpired(),
      CLEANUP_INTERVAL_MS
    )
    // Don't prevent process exit
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object') {
      this.cleanupTimer.unref?.()
    }
  }

  private makeKey(options: CacheOptions): string {
    const keyParts = options.key?.join(':') ?? ''
    const tags = options.tags?.join(',') ?? ''
    return `mem:${keyParts}:${tags}`
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [k, v] of this.cache) {
      if (now >= v.expires) {
        this.cache.delete(k)
      }
    }
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

    // Evict oldest entries if over max size
    if (this.cache.size > this.maxSize) {
      const iterator = this.cache.keys()
      const excess = this.cache.size - this.maxSize
      for (let i = 0; i < excess; i++) {
        const oldest = iterator.next().value
        if (oldest) this.cache.delete(oldest)
      }
    }

    debug('[query-cache] Memory cache set', { key, ttl })
    return value
  }

  /** Stop the cleanup timer. Call when the adapter is no longer needed. */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}
