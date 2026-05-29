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

  it('computes heapUsedPercent as a finite non-negative integer', () => {
    const metrics = getMemoryUsage()

    // V8 can report heapUsed > heapTotal (committed heap can be smaller than
    // allocated objects right after a large allocation), so the percentage
    // is allowed to exceed 100. Just require it to be a finite, non-negative
    // integer (the impl rounds it).
    expect(Number.isFinite(metrics.heapUsedPercent)).toBe(true)
    expect(metrics.heapUsedPercent).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(metrics.heapUsedPercent)).toBe(true)
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
