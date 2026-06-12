import { describe, expect, test } from 'bun:test'
import { replicationCharts } from '@/lib/api/charts/replication-charts'

const defaultParams = { interval: 'toStartOfHour' as const, lastHours: 24 }

describe('replicationCharts', () => {
  const entries = Object.entries(replicationCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(
    entries
  )('"%s" builder returns valid query result', (_name, builder) => {
    const result = builder(defaultParams)

    // Must have a query property
    expect(result).toHaveProperty('query')
    expect(typeof result.query).toBe('string')
    expect(result.query.length).toBeGreaterThan(0)

    // Query must contain SELECT
    expect(result.query).toMatch(/SELECT/i)
  })

  test('known chart names are present', () => {
    const names = Object.keys(replicationCharts)
    expect(names).toContain('replication-queue-count')
    expect(names).toContain('replication-summary-table')
    expect(names).toContain('readonly-replica')
    expect(names).toContain('replication-lag')
  })
})
