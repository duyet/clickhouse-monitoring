import { describe, expect, test } from 'bun:test'
import { dictionaryCharts } from '@/lib/api/charts/dictionary-charts'

describe('dictionary-charts', () => {
  test('is non-empty', () => {
    expect(Object.keys(dictionaryCharts).length).toBeGreaterThan(0)
  })

  test('dictionary-count queries system.dictionaries', () => {
    const result = dictionaryCharts['dictionary-count']!(
      {}
    ) as any as any as any
    expect(result).toBeDefined()
    expect(result.query).toContain('SELECT')
    expect(result.query).toContain('system.dictionaries')
    expect(result.optional).toBe(true)
    expect(result.tableCheck).toBe('system.dictionaries')
  })

  test('dictionary-count groups by status', () => {
    const result = dictionaryCharts['dictionary-count']!({}) as any
    expect(result.query).toContain('GROUP BY status')
    expect(result.query).toContain('count()')
  })
})
