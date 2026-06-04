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
  })
})
