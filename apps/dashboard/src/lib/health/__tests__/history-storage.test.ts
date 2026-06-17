import { describe, expect, test } from 'bun:test'
import {
  appendPoint,
  historyKey,
  MAX_HISTORY_POINTS,
} from '@/lib/health/history-storage'

describe('historyKey', () => {
  test('namespaces by host and check', () => {
    expect(historyKey(0, 'disk-percent')).toBe('0::disk-percent')
    expect(historyKey(2, 'disk-percent')).toBe('2::disk-percent')
  })
})

describe('appendPoint', () => {
  test('starts a new series from undefined', () => {
    expect(appendPoint(undefined, 5)).toEqual([5])
  })

  test('appends to an existing series without mutating it', () => {
    const series = [1, 2]
    const next = appendPoint(series, 3)
    expect(next).toEqual([1, 2, 3])
    expect(series).toEqual([1, 2])
  })

  test('caps the buffer at MAX_HISTORY_POINTS, dropping the oldest', () => {
    let series: number[] = []
    for (let i = 0; i < MAX_HISTORY_POINTS + 10; i++) {
      series = appendPoint(series, i)
    }
    expect(series).toHaveLength(MAX_HISTORY_POINTS)
    expect(series[0]).toBe(10)
    expect(series[series.length - 1]).toBe(MAX_HISTORY_POINTS + 9)
  })
})
