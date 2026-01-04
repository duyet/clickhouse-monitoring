/**
 * Version Cache Adapters
 *
 * Zero-config cache layer for ClickHouse version caching.
 * Auto-detects environment and uses appropriate caching strategy:
 * 1. Cloudflare Workers KV (if VERSION_CACHE_KV binding exists)
 * 2. Redis (if REDIS_URL is set)
 * 3. In-memory fallback (always works)
 *
 * Usage:
 * ```typescript
 * import { getVersionCache } from './version-cache'
 *
 * const cache = getVersionCache()
 * const version = await cache.get(hostId)
 * await cache.set(hostId, version, 3600)
 * ```
 */

import type { ClickHouseVersion } from './clickhouse-version'

import { debug, warn } from './logger'

/**
 * Cloudflare KV Namespace type (for Workers environments)
 */
interface KVNamespace {
  get(
    key: string,
    options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }
  ): Promise<unknown>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>
}

/**
 * Cache adapter interface
 */
export interface VersionCacheAdapter {
  get(hostId: number): Promise<ClickHouseVersion | null>
  set(
    hostId: number,
    version: ClickHouseVersion,
    ttlSeconds: number
  ): Promise<void>
}

/**
 * In-memory cache implementation (default fallback)
 */
export class InMemoryCache implements VersionCacheAdapter {
  private cache = new Map<
    number,
    { version: ClickHouseVersion; expires: number }
  >()

  async get(hostId: number): Promise<ClickHouseVersion | null> {
    const entry = this.cache.get(hostId)
    if (!entry || Date.now() > entry.expires) {
      return null
    }
    return entry.version
  }

  async set(
    hostId: number,
    version: ClickHouseVersion,
    ttlSeconds: number
  ): Promise<void> {
    this.cache.set(hostId, {
      version,
      expires: Date.now() + ttlSeconds * 1000,
    })
    debug(`[version-cache] In-memory cached version for host ${hostId}`)
  }
}

/**
 * Cloudflare Workers KV cache implementation
 */
export class CloudflareKVCache implements VersionCacheAdapter {
  private kv: KVNamespace

  constructor(binding?: KVNamespace) {
    // Try to get KV binding from globalThis or provided binding
    if (binding) {
      this.kv = binding
    } else if (
      typeof globalThis !== 'undefined' &&
      'VERSION_CACHE_KV' in globalThis
    ) {
      // Cast through unknown to satisfy TypeScript
      this.kv = (
        globalThis as unknown as { VERSION_CACHE_KV: KVNamespace }
      ).VERSION_CACHE_KV
    } else {
      throw new Error('VERSION_CACHE_KV binding not found')
    }
    debug('[version-cache] Using Cloudflare KV cache')
  }

  private getKey(hostId: number): string {
    return `ch-version:${hostId}`
  }

  async get(hostId: number): Promise<ClickHouseVersion | null> {
    try {
      const key = this.getKey(hostId)
      const value = await this.kv.get(key, { type: 'json' })
      if (!value) return null

      debug(`[version-cache] KV cache hit for host ${hostId}`)
      return value as ClickHouseVersion
    } catch (err) {
      warn('[version-cache] KV get error:', err)
      return null
    }
  }

  async set(
    hostId: number,
    version: ClickHouseVersion,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const key = this.getKey(hostId)
      await this.kv.put(key, JSON.stringify(version), {
        expirationTtl: ttlSeconds,
      })
      debug(`[version-cache] KV cached version for host ${hostId}`)
    } catch (err) {
      warn('[version-cache] KV set error:', err)
    }
  }
}

/**
 * Redis cache implementation
 */
export class RedisCache implements VersionCacheAdapter {
  private redis: {
    get: (key: string) => Promise<string | null>
    setex: (key: string, ttl: number, value: string) => Promise<void>
    disconnect: () => Promise<void>
  } | null = null

  private initPromise: Promise<void> | null = null

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL
    if (!url) {
      throw new Error('REDIS_URL not set')
    }

    // Initialize Redis asynchronously
    this.initPromise = this.init(url)
  }

  private async init(url: string): Promise<void> {
    try {
      // Dynamic import to avoid bundling if not used
      // @ts-expect-error - ioredis is optional peer dependency
      const ioredisModule = await import('ioredis').catch(() => null)
      if (!ioredisModule) {
        warn('[version-cache] ioredis not installed, Redis cache unavailable')
        this.redis = null
        return
      }

      const Redis = ioredisModule.default
      const client = new Redis(url, {
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) {
            warn('[version-cache] Redis max retries reached')
            return null // Stop retrying
          }
          return Math.min(times * 100, 2000)
        },
      })

      await client.connect()
      this.redis = client as {
        get: (key: string) => Promise<string | null>
        setex: (key: string, ttl: number, value: string) => Promise<void>
        disconnect: () => Promise<void>
      }

      debug('[version-cache] Using Redis cache')
    } catch (err) {
      warn('[version-cache] Redis initialization error:', err)
      this.redis = null
    }
  }

  private async waitForInit(): Promise<boolean> {
    if (this.initPromise) {
      await this.initPromise
      this.initPromise = null
    }
    return this.redis !== null
  }

  private getKey(hostId: number): string {
    return `ch-version:${hostId}`
  }

  async get(hostId: number): Promise<ClickHouseVersion | null> {
    try {
      const ready = await this.waitForInit()
      if (!ready || !this.redis) return null

      const key = this.getKey(hostId)
      const value = await this.redis.get(key)
      if (!value) return null

      debug(`[version-cache] Redis cache hit for host ${hostId}`)
      return JSON.parse(value) as ClickHouseVersion
    } catch (err) {
      warn('[version-cache] Redis get error:', err)
      return null
    }
  }

  async set(
    hostId: number,
    version: ClickHouseVersion,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const ready = await this.waitForInit()
      if (!ready || !this.redis) return

      const key = this.getKey(hostId)
      await this.redis.setex(key, ttlSeconds, JSON.stringify(version))
      debug(`[version-cache] Redis cached version for host ${hostId}`)
    } catch (err) {
      warn('[version-cache] Redis set error:', err)
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect()
    }
  }
}

/**
 * Singleton cache instance
 */
let cacheInstance: VersionCacheAdapter | null = null

/**
 * Get the appropriate cache adapter for the current environment
 *
 * Priority order:
 * 1. Cloudflare Workers KV (if VERSION_CACHE_KV binding exists)
 * 2. Redis (if REDIS_URL is set)
 * 3. In-memory fallback
 *
 * @returns Cache adapter instance
 */
export function getVersionCache(): VersionCacheAdapter {
  if (cacheInstance) return cacheInstance

  // 1. Check Cloudflare KV
  if (typeof globalThis !== 'undefined' && 'VERSION_CACHE_KV' in globalThis) {
    try {
      cacheInstance = new CloudflareKVCache()
      return cacheInstance
    } catch (err) {
      warn('[version-cache] Failed to initialize KV cache:', err)
    }
  }

  // 2. Check Redis
  if (process.env.REDIS_URL) {
    try {
      cacheInstance = new RedisCache()
      return cacheInstance
    } catch (err) {
      warn('[version-cache] Failed to initialize Redis cache:', err)
    }
  }

  // 3. Fallback to in-memory
  debug('[version-cache] Using in-memory cache (fallback)')
  cacheInstance = new InMemoryCache()
  return cacheInstance
}

/**
 * Reset cache instance (useful for testing)
 */
export function resetCacheInstance(): void {
  cacheInstance = null
}
