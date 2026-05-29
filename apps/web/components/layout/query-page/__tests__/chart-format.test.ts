import { formatChartValue, inferUnit } from '../chart-format'
import { describe, expect, it } from 'bun:test'

describe('inferUnit', () => {
  it('detects byte-like metrics', () => {
    expect(inferUnit('memory_usage')).toBe('bytes')
    expect(inferUnit('used_space')).toBe('bytes')
    expect(inferUnit('result_size')).toBe('bytes')
    expect(inferUnit('total_bytes')).toBe('bytes')
  })

  it('detects millisecond and second durations', () => {
    expect(inferUnit('query_duration_ms')).toBe('ms')
    expect(inferUnit('query_duration_s')).toBe('seconds')
    expect(inferUnit('p95_s')).toBe('seconds')
  })

  it('detects percentages', () => {
    expect(inferUnit('cpu_percent')).toBe('percent')
    expect(inferUnit('pct_used')).toBe('percent')
  })

  it('falls back to count for plain or unknown fields', () => {
    expect(inferUnit('query_count')).toBe('count')
    expect(inferUnit('count')).toBe('count')
    expect(inferUnit(null)).toBe('count')
    expect(inferUnit(undefined)).toBe('count')
  })
})

describe('formatChartValue', () => {
  it('formats bytes as readable sizes', () => {
    expect(formatChartValue(4_400_000, 'bytes')).toBe('4.2 MiB')
    expect(formatChartValue(1024, 'bytes')).toBe('1 KiB')
  })

  it('formats milliseconds with ms / s units', () => {
    expect(formatChartValue(1.2, 'ms')).toBe('1.20 ms')
    expect(formatChartValue(450, 'ms')).toBe('450 ms')
    expect(formatChartValue(1500, 'ms')).toBe('1.50 s')
  })

  it('formats seconds by promoting through duration units', () => {
    expect(formatChartValue(1.2, 'seconds')).toBe('1.20 s')
    expect(formatChartValue(90, 'seconds')).toBe('1m 30s')
  })

  it('formats percentages', () => {
    expect(formatChartValue(3.456, 'percent')).toBe('3.5%')
    expect(formatChartValue(42.6, 'percent')).toBe('43%')
  })

  it('falls back to compact counts', () => {
    expect(formatChartValue(115, 'count')).toBe((115).toLocaleString())
    expect(formatChartValue(2_345_678, 'count')).toBe('2.3M')
    expect(formatChartValue(1500)).toBe('1.5K')
  })
})
