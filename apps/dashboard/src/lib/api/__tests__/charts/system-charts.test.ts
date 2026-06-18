import { describe, expect, test } from 'bun:test'
import { systemCharts } from '@/lib/api/charts/system-charts'

describe('systemCharts', () => {
  const entries = Object.entries(systemCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  describe.each(entries)('chart "%s"', (name, builder) => {
    test('returns an object with query or queries property', () => {
      const result = builder({})
      expect(result).toBeDefined()
      expect('query' in result || 'queries' in result).toBe(true)
    })

    if (name === 'summary-used-by-running-queries') {
      test('returns MultiChartQueryResult with queries array', () => {
        const result = builder({})
        if ('queries' in result) {
          expect(Array.isArray(result.queries)).toBe(true)
          expect(result.queries.length).toBeGreaterThan(0)
          for (const q of result.queries) {
            expect(q).toHaveProperty('key')
            expect(q).toHaveProperty('query')
            expect(typeof q.query).toBe('string')
            expect(q.query).toMatch(/SELECT/i)
          }
        }
      })
    } else {
      test('query is a non-empty string containing SELECT', () => {
        const result = builder({})
        if ('query' in result) {
          expect(typeof result.query).toBe('string')
          expect(result.query.length).toBeGreaterThan(0)
          expect(result.query).toMatch(/SELECT/i)
        }
      })
    }

    if (name === 'disk-size') {
      test('accepts params.name for disk filtering', () => {
        const result = builder({ params: { name: 'default' } })
        if ('query' in result) {
          expect(result.query).toContain("name = 'default'")
        }
      })
    }

    if (name === 'top-table-size') {
      test('respects params.limit for row limiting', () => {
        const result = builder({ params: { limit: 5 } })
        if ('query' in result) {
          expect(result.query).toContain('LIMIT 5')
        }
      })
    }

    if (name === 'disks-usage') {
      // Regression: the chart used to sumMap() over every async metric for
      // 30 days, materializing a hundreds-of-keys map per group and OOMing
      // small instances (MEMORY_LIMIT_EXCEEDED). The query must pre-filter to
      // only the two disk metrics it actually reads, before aggregation.
      test('pre-filters to the two disk metrics before aggregating', () => {
        const result = builder({ interval: 'toStartOfDay', lastHours: 720 })
        if ('query' in result) {
          expect(result.query).toContain('metric IN (')
          expect(result.query).toContain('DiskAvailable_default')
          expect(result.query).toContain('DiskUsed_default')
          // The metric filter must precede GROUP BY (cuts rows + map width).
          const whereIdx = result.query.indexOf('metric IN (')
          const groupIdx = result.query.indexOf('GROUP BY')
          expect(whereIdx).toBeGreaterThan(0)
          expect(whereIdx).toBeLessThan(groupIdx)
        }
      })
    }
  })
})
