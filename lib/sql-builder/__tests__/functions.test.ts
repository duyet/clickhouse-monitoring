/**
 * SQL Functions Tests
 */

import { fn } from '../functions'
import { describe, expect, it } from '@jest/globals'

describe('fn (SQL Functions)', () => {
  describe('formatting functions', () => {
    it('should format readable size', () => {
      expect(fn.readableSize('bytes')).toBe('formatReadableSize(bytes)')
    })

    it('should format readable quantity', () => {
      expect(fn.readableQuantity('rows')).toBe('formatReadableQuantity(rows)')
    })

    it('should format readable time delta', () => {
      expect(fn.readableTimeDelta('elapsed')).toBe(
        'formatReadableTimeDelta(elapsed)'
      )
    })
  })

  describe('aggregate functions', () => {
    it('should create sum', () => {
      expect(fn.sum('bytes')).toBe('sum(bytes)')
    })

    it('should create count without column', () => {
      expect(fn.count()).toBe('count()')
    })

    it('should create count with column', () => {
      expect(fn.count('user_id')).toBe('count(user_id)')
    })

    it('should create avg', () => {
      expect(fn.avg('duration')).toBe('avg(duration)')
    })

    it('should create max', () => {
      expect(fn.max('bytes')).toBe('max(bytes)')
    })

    it('should create min', () => {
      expect(fn.min('bytes')).toBe('min(bytes)')
    })
  })

  describe('window functions', () => {
    it('should create pctOfMax with default precision', () => {
      expect(fn.pctOfMax('elapsed')).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2)'
      )
    })

    it('should create pctOfMax with custom precision', () => {
      expect(fn.pctOfMax('bytes', 1)).toBe(
        'round(100 * bytes / max(bytes) OVER (), 1)'
      )
    })

    it('should create pctOfMax with zero precision', () => {
      expect(fn.pctOfMax('count', 0)).toBe(
        'round(100 * count / max(count) OVER (), 0)'
      )
    })
  })

  describe('ClickHouse specific functions', () => {
    it('should create profile event accessor', () => {
      expect(fn.profileEvent('MemoryUsage')).toBe(
        "ProfileEvents['MemoryUsage']"
      )
    })

    it('should create profile event with special chars', () => {
      expect(fn.profileEvent('Query.SelectQueries')).toBe(
        "ProfileEvents['Query.SelectQueries']"
      )
    })
  })

  describe('date/time functions', () => {
    it('should convert to date', () => {
      expect(fn.toDate('event_time')).toBe('toDate(event_time)')
    })

    it('should convert to datetime', () => {
      expect(fn.toDateTime('event_time')).toBe('toDateTime(event_time)')
    })

    it('should get today', () => {
      expect(fn.today()).toBe('today()')
    })

    it('should get now', () => {
      expect(fn.now()).toBe('now()')
    })
  })
})
