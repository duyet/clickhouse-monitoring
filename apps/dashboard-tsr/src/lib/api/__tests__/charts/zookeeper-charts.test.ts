import { describe, expect, test } from 'bun:test'
import { zookeeperCharts } from '@/lib/api/charts/zookeeper-charts'

const defaultParams = { interval: 'toStartOfHour' as const, lastHours: 24 }

describe('zookeeperCharts', () => {
  const entries = Object.entries(zookeeperCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(
    entries
  )('"%s" builder returns valid query result', (name, builder) => {
    const result = builder(defaultParams)

    // Must have a query property
    expect(result).toHaveProperty('query')
    expect(typeof result.query).toBe('string')
    expect(result.query.length).toBeGreaterThan(0)

    // Query must contain SELECT
    expect(result.query).toMatch(/SELECT/i)
  })

  test('known chart names are present', () => {
    const names = Object.keys(zookeeperCharts)
    expect(names).toContain('zookeeper-requests')
    expect(names).toContain('zookeeper-exception')
    expect(names).toContain('zookeeper-uptime')
    expect(names).toContain('zookeeper-wait')
    expect(names).toContain('zookeeper-summary-table')
    expect(names).toContain('keeper-health')
    expect(names).toContain('keeper-info-summary')
    expect(names).toContain('keeper-operation-mix')
    expect(names).toContain('keeper-bytes')
    expect(names).toContain('keeper-connection-events')
  })

  test('optional charts are marked correctly', () => {
    expect(zookeeperCharts['zookeeper-exception'](defaultParams).optional).toBe(
      true
    )
    expect(zookeeperCharts['keeper-info-summary'](defaultParams).optional).toBe(
      true
    )
    expect(
      zookeeperCharts['keeper-connection-events']({
        ...defaultParams,
        lastHours: 24 * 14,
      }).optional
    ).toBe(true)
  })
})
