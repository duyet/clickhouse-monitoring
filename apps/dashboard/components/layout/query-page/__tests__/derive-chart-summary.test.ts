import { deriveChartSummary } from '../derive-chart-summary'
import { describe, expect, it } from 'bun:test'

describe('deriveChartSummary', () => {
  it('returns the empty summary for undefined or empty data', () => {
    expect(deriveChartSummary(undefined)).toEqual({
      latest: null,
      prev: null,
      spark: [],
      deltaPct: null,
      trend: null,
      field: null,
    })
    expect(deriveChartSummary([])).toEqual({
      latest: null,
      prev: null,
      spark: [],
      deltaPct: null,
      trend: null,
      field: null,
    })
  })

  it('auto-detects a numeric value field when none is provided', () => {
    const data = [
      { event_time: '2026-01-01', count: 10 },
      { event_time: '2026-01-02', count: 20 },
    ]

    const result = deriveChartSummary(data)

    expect(result.latest).toBe(20)
    expect(result.prev).toBe(10)
  })

  it('reports the detected value field for unit inference', () => {
    const data = [
      { event_time: '2026-01-01', memory_usage: 100 },
      { event_time: '2026-01-02', memory_usage: 200 },
    ]

    expect(deriveChartSummary(data).field).toBe('memory_usage')
  })

  it('skips hash / id / code identifier columns during auto-detection', () => {
    // top-query-fingerprints shape: the hash is numeric but is not the metric.
    const fingerprints = [
      { event_time: '2026-01-01', hash: 56708661833928, count: 10 },
      { event_time: '2026-01-02', hash: 56708661833928, count: 20 },
    ]
    const fp = deriveChartSummary(fingerprints)
    expect(fp.field).toBe('count')
    expect(fp.latest).toBe(20)

    // cancelled-queries shape: exception_code is numeric but not the metric.
    const cancelled = [
      { event_time: '2026-01-01', exception_code: 394, count: 3 },
      { event_time: '2026-01-02', exception_code: 159, count: 5 },
    ]
    const c = deriveChartSummary(cancelled)
    expect(c.field).toBe('count')
    expect(c.latest).toBe(5)
  })

  it('skips readable_ / percent_ fields during auto-detection', () => {
    const data = [
      { event_time: '2026-01-01', readable_count: '10', count: 10 },
      { event_time: '2026-01-02', readable_count: '20', count: 20 },
    ]

    const result = deriveChartSummary(data)

    // readable_count is ignored; count is picked up.
    expect(result.latest).toBe(20)
  })

  it('respects an explicit valueField', () => {
    const data = [
      { event_time: '2026-01-01', a: 1, b: 100 },
      { event_time: '2026-01-02', a: 2, b: 200 },
    ]

    const result = deriveChartSummary(data, 'b')

    expect(result.latest).toBe(200)
    expect(result.prev).toBe(100)
  })

  it('marks the trend as up when latest > prev by more than 0.5%', () => {
    const data = [
      { event_time: '2026-01-01', count: 100 },
      { event_time: '2026-01-02', count: 110 },
    ]

    const result = deriveChartSummary(data)

    expect(result.trend).toBe('up')
    expect(result.deltaPct).toBe(10)
  })

  it('marks the trend as down when latest < prev', () => {
    const data = [
      { event_time: '2026-01-01', count: 100 },
      { event_time: '2026-01-02', count: 50 },
    ]

    const result = deriveChartSummary(data)

    expect(result.trend).toBe('down')
    expect(result.deltaPct).toBe(-50)
  })

  it('marks the trend as flat when change is < 0.5%', () => {
    const data = [
      { event_time: '2026-01-01', count: 1000 },
      { event_time: '2026-01-02', count: 1002 },
    ]

    const result = deriveChartSummary(data)

    expect(result.trend).toBe('flat')
  })

  it('caps the spark array length at 20', () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      event_time: String(i),
      count: i,
    }))

    const result = deriveChartSummary(data)

    expect(result.spark).toHaveLength(20)
    // The last 20 values should be 10..29 inclusive.
    expect(result.spark[0]).toBe(10)
    expect(result.spark[19]).toBe(29)
  })
})
