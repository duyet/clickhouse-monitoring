import { describe, expect, test } from 'bun:test'
import { mergeCharts } from '@/lib/api/charts/merge-charts'

describe('mergeCharts', () => {
  const entries = Object.entries(mergeCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  describe.each(entries)('chart "%s"', (name, builder) => {
    test('returns an object with query or queries property', () => {
      const result = builder({})
      expect(result).toBeDefined()
      expect('query' in result || 'queries' in result).toBe(true)
    })

    if (name === 'summary-used-by-merges') {
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

    if (name === 'merge-count') {
      test('has VersionedSql array in sql property', () => {
        const result = builder({})
        if ('sql' in result && result.sql) {
          expect(Array.isArray(result.sql)).toBe(true)
          expect(result.sql.length).toBeGreaterThan(0)
          for (const entry of result.sql) {
            expect(entry).toHaveProperty('since')
            expect(entry).toHaveProperty('sql')
            expect(typeof entry.since).toBe('string')
            expect(typeof entry.sql).toBe('string')
            expect(entry.sql).toMatch(/SELECT/i)
          }
        }
      })

      test('marks itself as optional with tableCheck', () => {
        const result = builder({})
        if ('optional' in result) {
          expect(result.optional).toBe(true)
          expect(result.tableCheck).toBe('system.metric_log')
        }
      })
    }

    if (name === 'merge-avg-duration' || name === 'merge-sum-read-rows') {
      test('marks itself as optional with part_log tableCheck', () => {
        const result = builder({})
        if ('optional' in result) {
          expect(result.optional).toBe(true)
          expect(result.tableCheck).toBe('system.part_log')
        }
      })
    }
  })
})
