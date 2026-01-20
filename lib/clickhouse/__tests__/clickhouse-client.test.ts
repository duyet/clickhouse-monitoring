/**
 * Tests for lib/clickhouse/clickhouse-client.ts
 */

import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test'

// Mock dependencies
const mockDebug = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
}))

import {
  isCloudflareWorkers,
  getConnectionPoolStats,
} from '@/lib/clickhouse/clickhouse-client'

describe('clickhouse-client', () => {
  beforeEach(() => {
    mockDebug.mockReset()
  })

  describe('isCloudflareWorkers', () => {
    afterEach(() => {
      delete process.env.CF_PAGES
      delete process.env.CLOUDFLARE_WORKERS
    })

    it('should return true when CF_PAGES env is set', () => {
      process.env.CF_PAGES = '1'

      const result = isCloudflareWorkers()

      expect(result).toBe(true)
    })

    it('should return true when CLOUDFLARE_WORKERS env is 1', () => {
      process.env.CLOUDFLARE_WORKERS = '1'

      const result = isCloudflareWorkers()

      expect(result).toBe(true)
    })

    it('should return false when neither env is set', () => {
      const result = isCloudflareWorkers()

      expect(result).toBe(false)
    })
  })

  describe('getConnectionPoolStats', () => {
    it('should return connection pool stats', () => {
      const stats = getConnectionPoolStats()

      expect(stats).toEqual({
        poolSize: 0,
        totalConnections: 0,
      })
      expect(stats.poolSize).toBe(0)
      expect(stats.totalConnections).toBe(0)
    })
  })
})
