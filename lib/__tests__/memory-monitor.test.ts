import {
  getMemoryUsage,
  isMemoryCritical,
  isMemoryWarning,
} from '../memory-monitor'
import { describe, expect, it } from 'bun:test'

describe('getMemoryUsage', () => {
  it('returns positive heap totals when process.memoryUsage is available', () => {
    // The Bun test runtime exposes process.memoryUsage; expect MB-scale ints.
    const metrics = getMemoryUsage()

    expect(metrics.heapTotal).toBeGreaterThan(0)
    expect(metrics.heapUsed).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(metrics.heapTotal)).toBe(true)
    expect(Number.isInteger(metrics.heapUsed)).toBe(true)
  })

  it('computes heapUsedPercent as a percentage in 0..100', () => {
    const metrics = getMemoryUsage()

    expect(metrics.heapUsedPercent).toBeGreaterThanOrEqual(0)
    expect(metrics.heapUsedPercent).toBeLessThanOrEqual(100)
  })

  it('reports a fresh timestamp on every call', () => {
    const a = getMemoryUsage()
    // sleep a single tick — Date.now() resolution is ms.
    const start = Date.now()
    while (Date.now() === start) {
      /* spin a hair */
    }
    const b = getMemoryUsage()

    expect(b.timestamp).toBeGreaterThanOrEqual(a.timestamp)
  })

  it('returns non-negative MB-scale external and rss values', () => {
    const metrics = getMemoryUsage()
    expect(metrics.external).toBeGreaterThanOrEqual(0)
    expect(metrics.rss).toBeGreaterThan(0)
  })
})

describe('isMemoryWarning / isMemoryCritical', () => {
  it('agree on the same monotonic threshold — critical implies warning', () => {
    // Whatever the current process usage is, if memory is critical it must
    // also clear the warning threshold (90% > 80%).
    if (isMemoryCritical()) {
      expect(isMemoryWarning()).toBe(true)
    } else {
      // Otherwise both flags are independently allowed to be true or false;
      // just assert they return booleans without throwing.
      expect(typeof isMemoryWarning()).toBe('boolean')
      expect(typeof isMemoryCritical()).toBe('boolean')
    }
  })
})
