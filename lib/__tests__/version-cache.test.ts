/**
 * Tests for version cache adapters
 */

import type { ClickHouseVersion } from '../clickhouse-version'

import {
  CloudflareKVCache,
  getVersionCache,
  InMemoryCache,
  RedisCache,
  resetCacheInstance,
} from '../version-cache'
import { beforeEach, describe, expect, it } from '@jest/globals'

describe('InMemoryCache', () => {
  let cache: InMemoryCache

  beforeEach(() => {
    cache = new InMemoryCache()
  })

  it('should return null for non-existent keys', async () => {
    const result = await cache.get(1)
    expect(result).toBeNull()
  })

  it('should store and retrieve versions', async () => {
    const version: ClickHouseVersion = {
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    }

    await cache.set(1, version, 3600)
    const result = await cache.get(1)

    expect(result).toEqual(version)
  })

  it('should expire cached versions after TTL', async () => {
    const version: ClickHouseVersion = {
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    }

    // Set with 1 second TTL
    await cache.set(1, version, 1)

    // Should exist immediately
    const result1 = await cache.get(1)
    expect(result1).toEqual(version)

    // Wait 1.1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Should be expired
    const result2 = await cache.get(1)
    expect(result2).toBeNull()
  })

  it('should handle multiple hosts independently', async () => {
    const version1: ClickHouseVersion = {
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    }
    const version2: ClickHouseVersion = {
      major: 23,
      minor: 8,
      patch: 2,
      build: 5,
      raw: '23.8.2.5',
    }

    await cache.set(1, version1, 3600)
    await cache.set(2, version2, 3600)

    const result1 = await cache.get(1)
    const result2 = await cache.get(2)

    expect(result1).toEqual(version1)
    expect(result2).toEqual(version2)
  })
})

describe('CloudflareKVCache', () => {
  let mockKV: {
    get: jest.Mock
    put: jest.Mock
  }

  beforeEach(() => {
    mockKV = {
      get: jest.fn(),
      put: jest.fn(),
    }
  })

  it('should return null for non-existent keys', async () => {
    mockKV.get.mockResolvedValue(null)

    // @ts-expect-error - Mock KV namespace
    const cache = new CloudflareKVCache(mockKV)
    const result = await cache.get(1)

    expect(result).toBeNull()
    expect(mockKV.get).toHaveBeenCalledWith('ch-version:1', { type: 'json' })
  })

  it('should store and retrieve versions', async () => {
    const version: ClickHouseVersion = {
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    }

    mockKV.get.mockResolvedValue(version)
    mockKV.put.mockResolvedValue(undefined)

    // @ts-expect-error - Mock KV namespace
    const cache = new CloudflareKVCache(mockKV)

    await cache.set(1, version, 3600)
    const result = await cache.get(1)

    expect(result).toEqual(version)
    expect(mockKV.put).toHaveBeenCalledWith(
      'ch-version:1',
      JSON.stringify(version),
      { expirationTtl: 3600 }
    )
    expect(mockKV.get).toHaveBeenCalledWith('ch-version:1', { type: 'json' })
  })

  it('should handle errors gracefully on get', async () => {
    mockKV.get.mockRejectedValue(new Error('KV error'))

    // @ts-expect-error - Mock KV namespace
    const cache = new CloudflareKVCache(mockKV)
    const result = await cache.get(1)

    expect(result).toBeNull()
  })

  it('should handle errors gracefully on set', async () => {
    const version: ClickHouseVersion = {
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    }

    mockKV.put.mockRejectedValue(new Error('KV error'))

    // @ts-expect-error - Mock KV namespace
    const cache = new CloudflareKVCache(mockKV)

    // Should not throw
    await expect(cache.set(1, version, 3600)).resolves.toBeUndefined()
  })
})

describe('getVersionCache factory', () => {
  beforeEach(() => {
    resetCacheInstance()
    delete process.env.REDIS_URL
  })

  it('should return singleton instance', () => {
    const cache1 = getVersionCache()
    const cache2 = getVersionCache()

    expect(cache1).toBe(cache2)
  })

  it('should return InMemoryCache by default', () => {
    const cache = getVersionCache()
    expect(cache).toBeInstanceOf(InMemoryCache)
  })

  it('should return RedisCache when REDIS_URL is set', () => {
    process.env.REDIS_URL = 'redis://localhost:6379'

    const cache = getVersionCache()
    // RedisCache is returned even if connection fails (graceful degradation)
    expect(cache).toBeInstanceOf(RedisCache)
  })
})
