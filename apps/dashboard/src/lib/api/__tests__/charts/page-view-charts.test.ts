import { describe, expect, test } from 'bun:test'
import { pageViewCharts } from '@/lib/api/charts/page-view-charts'

const defaultParams = { interval: 'toStartOfDay' as const, lastHours: 24 * 14 }

describe('pageViewCharts', () => {
  const entries = Object.entries(pageViewCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(
    entries
  )('"%s" builder returns valid query result', (_name, builder) => {
    const result = builder(defaultParams) as any

    // Must have a query property
    expect(result).toHaveProperty('query')
    expect(typeof result.query).toBe('string')
    expect(result.query.length).toBeGreaterThan(0)

    // Query must contain SELECT
    expect(result.query).toMatch(/SELECT/i)
  })

  test('known chart names are present', () => {
    const names = Object.keys(pageViewCharts)
    expect(names).toContain('page-view')
    expect(names).toContain('top-pages')
    expect(names).toContain('human-vs-bot-pageviews')
    expect(names).toContain('pageviews-by-device')
    expect(names).toContain('pageviews-by-country')
  })

  test('all charts are optional (require events table)', () => {
    for (const [name, builder] of entries) {
      const result = builder(defaultParams) as any
      expect(result.optional, `${name} should be optional`).toBe(true)
      expect(result.tableCheck, `${name} should have tableCheck`).toBeDefined()
    }
  })
})
