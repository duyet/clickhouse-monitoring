import { describe, expect, test } from 'bun:test'
import { threadCharts } from '@/lib/api/charts/thread-charts'

describe('thread-charts', () => {
  const entries = Object.entries(threadCharts)

  test('is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(entries)('%s returns a query', (_name, builder) => {
    const result = builder({ interval: 'toStartOfHour', lastHours: 24 })
    expect(result).toBeDefined()
    expect(result.query).toContain('SELECT')
    expect(result.optional).toBe(true)
  })

  test('thread-utilization uses query_thread_log', () => {
    const result = threadCharts['thread-utilization']!({
      interval: 'toStartOfHour',
      lastHours: 24,
    })
    expect(result.query).toContain('system.query_thread_log')
    expect(result.tableCheck).toBe('system.query_thread_log')
  })

  test('parallelization-efficiency buckets threads', () => {
    const result = threadCharts['parallelization-efficiency']!({
      lastHours: 168,
    })
    expect(result.query).toContain('thread_bucket')
    expect(result.query).toContain('1 thread')
  })

  test('cpu-time-per-thread uses interval', () => {
    const result = threadCharts['cpu-time-per-thread']!({
      interval: 'toStartOfHour',
      lastHours: 24,
    })
    expect(result.query).toContain('toStartOfHour')
    expect(result.query).toContain('OSCPUVirtualTimeMicroseconds')
  })
})
