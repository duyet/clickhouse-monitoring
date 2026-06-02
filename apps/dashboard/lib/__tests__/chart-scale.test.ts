import {
  analyzeDataForLogScale,
  getYAxisDomain,
  resolveYAxisScale,
} from '../chart-scale'
import { describe, expect, it } from 'bun:test'

describe('analyzeDataForLogScale', () => {
  it('returns the no-data result when nothing numeric is present', () => {
    const result = analyzeDataForLogScale([], ['a'])

    expect(result.shouldUseLog).toBe(false)
    expect(result.maxValue).toBe(0)
    expect(result.minValue).toBe(0)
    expect(result.ratio).toBe(1)
  })

  it('does not recommend log when the spread is below 100x', () => {
    const data = [{ v: 1 }, { v: 5 }, { v: 50 }]

    const result = analyzeDataForLogScale(data, ['v'])

    expect(result.shouldUseLog).toBe(false)
    expect(result.minValue).toBe(1)
    expect(result.maxValue).toBe(50)
    expect(result.ratio).toBe(50)
  })

  it('recommends log when the spread is at or above 100x', () => {
    const data = [{ v: 1 }, { v: 100 }, { v: 5000 }]

    const result = analyzeDataForLogScale(data, ['v'])

    expect(result.shouldUseLog).toBe(true)
    expect(result.ratio).toBe(5000)
  })

  it('flags zero/negative presence without breaking minPositive', () => {
    const data = [{ v: 0 }, { v: -3 }, { v: 200 }, { v: 1 }]

    const result = analyzeDataForLogScale(data, ['v'])

    expect(result.hasZeroOrNegative).toBe(true)
    expect(result.minValue).toBe(1)
    expect(result.maxValue).toBe(200)
    expect(result.shouldUseLog).toBe(true)
  })

  it('skips non-numeric and NaN values', () => {
    const data = [
      { v: 1 },
      { v: 'not a number' as unknown as number },
      { v: Number.NaN },
      { v: 500 },
    ]

    const result = analyzeDataForLogScale(data, ['v'])

    expect(result.maxValue).toBe(500)
    expect(result.minValue).toBe(1)
  })
})

describe('resolveYAxisScale', () => {
  it('returns linear when scale is undefined or "linear"', () => {
    expect(resolveYAxisScale(undefined, [], [])).toBe('linear')
    expect(resolveYAxisScale('linear', [], [])).toBe('linear')
  })

  it('returns log when scale is "log"', () => {
    expect(resolveYAxisScale('log', [], [])).toBe('log')
  })

  it('auto-detects log when the data spread is wide enough', () => {
    expect(resolveYAxisScale('auto', [{ v: 1 }, { v: 1000 }], ['v'])).toBe(
      'log'
    )
  })

  it('auto-detects linear for narrow spreads', () => {
    expect(resolveYAxisScale('auto', [{ v: 10 }, { v: 20 }], ['v'])).toBe(
      'linear'
    )
  })
})

describe('getYAxisDomain', () => {
  it('returns ["auto", "auto"] for linear scale', () => {
    expect(getYAxisDomain([], [], false)).toEqual(['auto', 'auto'])
  })

  it('forces the minimum to 1 for log scale', () => {
    expect(getYAxisDomain([], [], true)).toEqual([1, 'auto'])
  })
})
