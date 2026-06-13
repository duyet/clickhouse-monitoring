import { describe, expect, test } from 'bun:test'
import { logsCharts } from '@/lib/api/charts/logs-charts'

describe('logs-charts', () => {
  const entries = Object.entries(logsCharts)

  test('is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(entries)('%s returns a query', (_name, builder) => {
    const result = builder({ lastHours: 24 }) as any
    expect(result).toBeDefined()
    expect(result.query).toContain('SELECT')
    expect(result.optional).toBe(true)
  })

  test('log-level-distribution uses text_log', () => {
    const result = logsCharts['log-level-distribution']!({
      lastHours: 24,
    }) as any
    expect(result.query).toContain('system.text_log')
    expect(result.tableCheck).toBe('system.text_log')
  })

  test('error-rate-over-time uses interval', () => {
    const result = logsCharts['error-rate-over-time']!({
      interval: 'toStartOfHour',
      lastHours: 24,
    }) as any
    expect(result.query).toContain('toStartOfHour')
    expect(result.query).toContain('error_count')
  })

  test('crash-frequency uses crash_log', () => {
    const result = logsCharts['crash-frequency']!({ lastHours: 24 * 30 }) as any
    expect(result.query).toContain('system.crash_log')
    expect(result.tableCheck).toBe('system.crash_log')
  })

  test('log-count-today has no time filter param', () => {
    const result = logsCharts['log-count-today']!({}) as any
    expect(result.query).toContain('today()')
  })
})
