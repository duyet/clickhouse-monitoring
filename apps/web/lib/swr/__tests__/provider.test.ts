/**
 * Tests for provider.tsx — SWRProvider and global fetch logic.
 *
 * Tests the exported utility functions and verifies module exports.
 */

import { getRecentFetchMetrics } from '../provider'
import { describe, expect, it, mock } from 'bun:test'

describe('SWRProvider', () => {
  it('exports SWRProvider as a function', async () => {
    const mod = await import('../provider')
    expect(typeof mod.SWRProvider).toBe('function')
  })

  it('exports REFRESH_INTERVAL from config', async () => {
    const mod = await import('../provider')
    expect(mod.REFRESH_INTERVAL).toBeDefined()
    expect(mod.REFRESH_INTERVAL.DEFAULT_60S).toBe(60_000)
  })

  it('exports swrConfig from config', async () => {
    const mod = await import('../provider')
    expect(mod.swrConfig).toBeDefined()
    expect(mod.swrConfig.polling30s).toBeDefined()
  })
})

describe('getRecentFetchMetrics', () => {
  it('returns an array', () => {
    const metrics = getRecentFetchMetrics()
    expect(Array.isArray(metrics)).toBe(true)
  })

  it('returns a copy (not the internal array)', () => {
    const a = getRecentFetchMetrics()
    const b = getRecentFetchMetrics()
    expect(a).not.toBe(b) // Different reference
    expect(a).toEqual(b) // Same content
  })
})
