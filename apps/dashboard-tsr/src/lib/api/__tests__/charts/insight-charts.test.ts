import { describe, expect, test } from 'bun:test'
import { insightCharts } from '@/lib/api/charts/insight-charts'

describe('insightCharts', () => {
  const entries = Object.entries(insightCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  describe.each(entries)('chart "%s"', (name, builder) => {
    test('returns an object with a query property', () => {
      const result = builder({})
      expect(result).toBeDefined()
      expect(result).toHaveProperty('query')
    })

    test('query is a non-empty string containing SELECT', () => {
      const result = builder({})
      if ('query' in result) {
        expect(typeof result.query).toBe('string')
        expect(result.query.length).toBeGreaterThan(0)
        expect(result.query).toMatch(/SELECT/i)
      }
    })

    if (name === 'insight-detached-parts') {
      test('marks itself as optional with tableCheck', () => {
        const result = builder({})
        if ('optional' in result) {
          expect(result.optional).toBe(true)
          expect(result.tableCheck).toBe('system.detached_parts')
        }
      })
    }
  })

  test('time-filtered charts accept lastHours parameter', () => {
    const timeFilteredCharts = [
      'insight-largest-scan',
      'insight-fastest-scan',
      'insight-longest-query',
      'insight-query-summary',
    ] as const

    for (const chartName of timeFilteredCharts) {
      const builder = insightCharts[chartName]
      const result = builder({ lastHours: 48 })
      if ('query' in result) {
        expect(result.query).toContain('48')
      }
    }
  })
})
